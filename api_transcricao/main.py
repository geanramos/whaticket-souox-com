from flask import Flask, request
import speech_recognition as sr
from pydub import AudioSegment
import io
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import ffmpeg
import subprocess
import os
import requests
import urllib.parse
import tempfile
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

app = Flask(__name__)

# Configuração do logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Obtém o token e a porta das variáveis de ambiente
# API_TOKEN = os.environ.get('API_TOKEN')
# PORT = int(os.environ.get('PORT', 4003))  # Converte para int, com valor padrão 4003

# Verifica se o token está definido
# if not API_TOKEN:
#     logging.warning("API_TOKEN não encontrado no arquivo .env ou nas variáveis de ambiente!")
#     API_TOKEN = "token_padrao_para_desenvolvimento"  # Fallback para desenvolvimento
#     logging.warning(f"Usando token padrão: {API_TOKEN}")

# Função para verificar a autenticação
# def verify_token(request):
#     """Verifica se o token de autorização é válido"""
#     # Verifica o header de autorização
#     auth_header = request.headers.get('Authorization')
#     if not auth_header:
#         return False
#     
#     # Verifica se o header tem o formato correto (Bearer <token>)
#     parts = auth_header.split()
#     if len(parts) != 2 or parts[0].lower() != 'bearer':
#         return False
#     
#     # Verifica se o token é válido
#     token = parts[1]
#     return token == API_TOKEN

@app.route('/', methods=['GET'])
def home():
    return '<center><h1>[POST] /transcrever with "audio" form file (wav, ogg, mp3) or "url" parameter - Authorization: Bearer TOKEN required</h1></center>'

def download_audio_from_url(url):
    """Função para baixar áudio de uma URL com tratamento robusto de erros"""
    try:
        logging.info(f"Iniciando download do áudio da URL: {url}")
        
        # Faz o download do arquivo com streaming para lidar com arquivos grandes
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()  # Lança exceção para respostas HTTP não-2xx
        
        # Detecta o content-type do arquivo
        content_type = response.headers.get('Content-Type', '')
        logging.info(f"Content-Type recebido: {content_type}")
        
        # Verifica o tipo de arquivo pela extensão da URL
        file_extension = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower()
        logging.info(f"Extensão detectada na URL: {file_extension}")
        
        # Mapeamento de extensões para content_type
        extension_to_content_type = {
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.mp3': 'audio/mp3',
            '.mp4': 'audio/mp4',
            '.m4a': 'audio/m4a',
            '.aac': 'audio/aac',
            '.flac': 'audio/flac',
        }
        
        # Se o content-type não for de áudio, tentar determinar pelo nome do arquivo
        if not any(audio_type in content_type for audio_type in 
                  ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/mp3', 
                   'audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/flac']):
            
            if file_extension in extension_to_content_type:
                content_type = extension_to_content_type.get(file_extension, '')
                logging.info(f"Content-Type determinado pela extensão: {content_type}")
            else:
                # Se não for possível determinar o tipo, tentar baixar o arquivo e analisar
                logging.warning(f"Não foi possível determinar o tipo de áudio pela URL ou Content-Type. Tentando baixar e analisar.")
                
                # Vamos salvar temporariamente o arquivo e usar ffprobe para determinar o formato
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension or '.tmp')
                try:
                    # Baixa o conteúdo para o arquivo temporário
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            temp_file.write(chunk)
                    temp_file.close()
                    
                    # Usa ffprobe para detectar o formato
                    try:
                        probe = ffmpeg.probe(temp_file.name)
                        if 'streams' in probe and len(probe['streams']) > 0:
                            stream = probe['streams'][0]
                            if stream.get('codec_type') == 'audio':
                                codec_name = stream.get('codec_name', '')
                                if codec_name == 'mp3':
                                    content_type = 'audio/mp3'
                                elif codec_name == 'aac':
                                    content_type = 'audio/aac'
                                elif codec_name == 'wav' or codec_name == 'pcm_s16le':
                                    content_type = 'audio/wav'
                                elif codec_name == 'ogg' or codec_name == 'vorbis':
                                    content_type = 'audio/ogg'
                                elif codec_name == 'flac':
                                    content_type = 'audio/flac'
                                else:
                                    content_type = f'audio/{codec_name}'
                                
                                logging.info(f"Formato de áudio detectado por ffprobe: {content_type}")
                            else:
                                raise ValueError("O arquivo não contém uma stream de áudio")
                        else:
                            raise ValueError("Não foi possível detectar streams no arquivo")
                    except Exception as e:
                        logging.error(f"Erro ao analisar o arquivo com ffprobe: {e}")
                        raise ValueError(f"Não foi possível determinar o formato do áudio: {str(e)}")
                    
                    # Lê o arquivo temporário para um buffer de memória
                    with open(temp_file.name, 'rb') as f:
                        data = f.read()
                    
                    return io.BytesIO(data), content_type
                
                finally:
                    # Remove o arquivo temporário
                    try:
                        os.unlink(temp_file.name)
                    except:
                        pass
        
        # Se chegou até aqui sem determinar o content_type, retorna erro
        if not content_type:
            raise ValueError(f"Tipo de arquivo não suportado ou não detectado na URL: {url}")
        
        # Retorna o conteúdo do arquivo e o content_type
        return io.BytesIO(response.content), content_type
        
    except requests.RequestException as e:
        logging.error(f"Erro na requisição HTTP ao baixar áudio da URL {url}: {e}")
        raise
    except ValueError as e:
        logging.error(f"Erro ao processar o formato do áudio da URL {url}: {e}")
        raise
    except Exception as e:
        logging.error(f"Erro inesperado ao baixar áudio da URL {url}: {e}")
        raise

def convert_audio_to_wav(audio_data, content_type):
    """Função para converter o áudio para WAV com tratamento robusto de erros"""
    try:
        logging.info(f"Iniciando conversão de áudio do tipo {content_type} para WAV")
        
        # Determina o formato de áudio a partir do content_type
        audio_format = content_type.split('/')[1]
        if audio_format == 'mpeg':
            audio_format = 'mp3'
        elif audio_format == 'wave' or audio_format == 'x-wav':
            audio_format = 'wav'
        
        # Para formatos que podem causar problemas, salva em um arquivo temporário e usa ffmpeg diretamente
        if content_type in ['audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/mp3']:
            # Cria um arquivo temporário para o áudio de entrada
            temp_input = tempfile.NamedTemporaryFile(delete=False, suffix=f'.{audio_format}')
            temp_output = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            
            try:
                # Salva o áudio no arquivo temporário
                audio_data.seek(0)
                temp_input.write(audio_data.read())
                temp_input.close()
                
                # Configura o ffmpeg com mais parâmetros para tolerância a erros
                cmd = [
                    'ffmpeg',
                    '-i', temp_input.name,
                    '-ar', '16000',  # Taxa de amostragem
                    '-ac', '1',      # Mono
                    '-acodec', 'pcm_s16le',  # Formato WAV padrão
                    '-y',            # Sobrescrever sem perguntar
                    '-analyzeduration', '10000000',  # Aumenta o tempo de análise
                    '-probesize', '10000000',        # Aumenta o tamanho do probe
                    temp_output.name
                ]
                
                logging.info(f"Executando comando ffmpeg: {' '.join(cmd)}")
                
                # Executa o ffmpeg diretamente
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                stdout, stderr = process.communicate()
                
                if process.returncode != 0:
                    logging.error(f"Erro ao converter áudio com ffmpeg: {stderr.decode()}")
                    raise Exception(f"Erro na conversão do áudio: {stderr.decode()}")
                
                # Carrega o arquivo WAV convertido
                with open(temp_output.name, 'rb') as f:
                    wav_data = f.read()
                
                # Carrega o áudio WAV com pydub
                audio = AudioSegment.from_file(io.BytesIO(wav_data), format='wav')
                return audio
            
            finally:
                # Remove os arquivos temporários
                try:
                    os.unlink(temp_input.name)
                    os.unlink(temp_output.name)
                except:
                    pass
        else:
            # Para outros formatos, tenta usar o pydub diretamente
            audio_data.seek(0)
            audio = AudioSegment.from_file(audio_data, format=audio_format)
            audio = audio.set_frame_rate(16000).set_channels(1)
            return audio
    
    except Exception as e:
        logging.error(f"Erro ao converter áudio: {e}")
        raise

@app.route('/transcrever', methods=['POST'])
def transcrever():
    request_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Verifica a autenticação
    # if not verify_token(request):
    #     logging.warning(f"{request_time} - Tentativa de acesso não autorizado.")
    #     return {'erro': 'Não autorizado. Forneça um token válido no header Authorization.'}, 401
    
    try:
        # Verifica se foi enviado um arquivo ou uma URL
        if 'audio' in request.files and request.files['audio']:
            # Processa arquivo enviado diretamente
            audio_file = request.files['audio']
            content_type = audio_file.content_type
            audio_data = io.BytesIO(audio_file.read())
            logging.info(f"{request_time} - Processando arquivo de áudio enviado. Tipo: {content_type}")
        elif 'url' in request.form and request.form['url']:
            # Processa áudio a partir da URL
            url = request.form['url']
            logging.info(f"{request_time} - Processando áudio da URL: {url}")
            try:
                audio_data, content_type = download_audio_from_url(url)
                logging.info(f"{request_time} - Áudio baixado da URL. Tipo detectado: {content_type}")
            except Exception as e:
                logging.error(f"{request_time} - Erro ao baixar áudio da URL: {e}")
                return {'erro': f'Não foi possível baixar ou processar o áudio da URL: {str(e)}'}, 400
        else:
            logging.error(f"{request_time} - Nenhum arquivo de áudio ou URL enviado.")
            return {'erro': 'Nenhum arquivo de áudio ou URL enviado. Use "audio" para enviar um arquivo ou "url" para informar uma URL de áudio.'}, 400
        
        # Verifica se o tipo de conteúdo é suportado
        if not any(audio_type in content_type for audio_type in 
                  ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/mp3', 'audio/mpeg', 
                   'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/flac']):
            logging.error(f"{request_time} - Tipo de arquivo não suportado: {content_type}")
            return {'erro': 'Tipo de arquivo não suportado. Apenas formatos de áudio WAV, OGG, MP3, MP4, M4A, AAC e FLAC são permitidos.'}, 400

        # Converte o arquivo para WAV
        try:
            audio = convert_audio_to_wav(audio_data, content_type)
        except Exception as e:
            logging.error(f"{request_time} - Erro ao converter áudio: {e}")
            return {'erro': f'Erro ao converter o arquivo de áudio: {str(e)}'}, 500

        # Divide o áudio em pedaços menores
        chunk_length_ms = 12 * 1000  # 12 segundos
        audio_chunks = [audio[i:i + chunk_length_ms] for i in range(0, len(audio), chunk_length_ms)]

        def process_chunk(i, chunk):
            logging.info(f"{request_time} - Processando segmento {i + 1} de {len(audio_chunks)}")
            
            # Salva o segmento como um arquivo temporário
            chunk_io = io.BytesIO()
            chunk.export(chunk_io, format='wav')
            chunk_io.seek(0)

            recognizer = sr.Recognizer()
            with sr.AudioFile(chunk_io) as source:
                audio_data = recognizer.record(source)
            
            # Transcreve o segmento
            try:
                return recognizer.recognize_google(audio_data, language='pt-BR')
            except sr.UnknownValueError:
                logging.warning(f"{request_time} - Segmento {i + 1}: Não foi possível reconhecer o áudio.")
                return ""
            except sr.RequestError as e:
                logging.error(f"{request_time} - Segmento {i + 1}: Erro ao se comunicar com o serviço de reconhecimento de fala: {e}")
                raise

        # Processa os chunks em paralelo
        with ThreadPoolExecutor() as executor:
            transcriptions = list(executor.map(lambda idx_chunk: process_chunk(*idx_chunk), enumerate(audio_chunks)))

        transcribed_text = " ".join(transcriptions).strip()
        logging.info(f"{request_time} - Transcrição concluída com sucesso. Tamanho: {len(transcribed_text)} caracteres")
        
        if not transcribed_text:
            return {'mensagem': 'Áudio processado, mas nenhum texto foi reconhecido.'}, 200
            
        return transcribed_text, 200

    except Exception as e:
        logging.error(f"{request_time} - Erro inesperado: {e}")
        return {'erro': f'Erro interno no servidor: {str(e)}'}, 500

if __name__ == '__main__':
    logging.info(f"Servidor iniciado na porta 4002")
    app.run(host='0.0.0.0', port=4002, debug=True)