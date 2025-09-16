import path from "path";
import fs from "fs";
import Message from "../../models/Message";

import axios from "axios";
import FormData from "form-data";
import { Transcription } from "openai/resources/audio/transcriptions";

type Response = Transcription | string;

const TranscribeAudioMessageToText = async (wid: string, companyId: string): Promise<Response> => {
  try {
    // Busca a mensagem com os detalhes do arquivo de áudio
    const msg = await Message.findOne({
      where: {
        wid: wid,
        companyId: companyId,
      },
    });

    if (!msg) {
      throw new Error("Mensagem não encontrada");
    }

    const data = new FormData();
    let config;

    // Verifica se a mediaUrl é uma URL válida
    if (msg.mediaUrl.startsWith('http')) {
      // Se for uma URL, usa diretamente
      data.append('url', msg.mediaUrl);
      config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.TRANSCRIBE_URL}/transcrever`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TRANSCRIBE_API_KEY}`,
          ...data.getHeaders(),
        },
        data: data,
      };
    } else {
      // Se não for URL, mantém o comportamento atual
      const urlParts = new URL(msg.mediaUrl);
      const pathParts = urlParts.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];

      const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
      const filePath = path.join(publicFolder, `company${companyId}`, fileName);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }

      data.append('audio', fs.createReadStream(filePath));
      config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.TRANSCRIBE_URL}/transcrever`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TRANSCRIBE_API_KEY}`,
          ...data.getHeaders(),
        },
        data: data,
      };
    }

    // Faz a requisição para o endpoint
    const res = await axios.request(config);

    await msg.update({
      body: res.data,
      transcrito: true,
    });

    return res.data;
  } catch (error) {
    console.error("Erro durante a transcrição:", error);
    return "Conversão pra texto falhou";
  }
};

export default TranscribeAudioMessageToText;
