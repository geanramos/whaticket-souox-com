#!/bin/bash

echo "==============================="
echo "    Instalador do App Python    "
echo "==============================="

# Caminho do arquivo de variáveis
ARQUIVO_VARIAVEIS="/root/instalador_single_oficial/VARIAVEIS_INSTALACAO"

# Carrega variáveis da empresa
carregar_variaveis() {
  if [ -f "$ARQUIVO_VARIAVEIS" ]; then
    source "$ARQUIVO_VARIAVEIS"
  else
    empresa="multiflow"
  fi
}
carregar_variaveis

CAMINHO_API="/home/deploy/${empresa}/api_transcricao/main.py"

# Solicitar o nome do app ao usuário
read -p "Digite o nome do seu app (para o PM2): " APP_NAME

# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar dependências do sistema
sudo apt install -y python3-pip python3 python3-venv flac

# Instalar dependências do Python
pip3 install flask
pip3 install SpeechRecognition
pip3 install pydub
pip3 install ffmpeg-python
pip3 install python-dotenv

# Instalar PM2 (se não tiver)
sudo npm install -g pm2

# Iniciar o app Python com PM2 usando o nome definido
#pm2 start /home/deploy/${empresa}/api_transcricao/main.py --name "$APP_NAME" --interpreter python3

# Inicia com PM2
pm2 start "$CAMINHO_API" --interpreter python3 --name "$APP_NAME"

# Salvar configuração do PM2
pm2 save

# Ativar PM2 para iniciar junto com o servidor
pm2 startup

echo "=============================================="
echo " Instalação concluída com sucesso! ✅"
echo " App rodando no PM2 com o nome: $APP_NAME"
echo "=============================================="
