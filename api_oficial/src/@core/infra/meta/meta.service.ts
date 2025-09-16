import { Logger } from '@nestjs/common';
import {
  IBodyReadMessage,
  IMetaMessage,
  IResultTemplates,
  IReturnAuthMeta,
  IReturnMessageFile,
  IReturnMessageMeta,
} from './interfaces/IMeta.interfaces';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { convertMimeTypeToExtension } from 'src/@core/common/utils/convertMimeTypeToExtension';
import axios from 'axios';
import { lookup } from 'mime-types';
import { deleteFile } from 'src/@core/common/utils/files.utils';

export class MetaService {
  private readonly logger: Logger = new Logger(`${MetaService.name}`);
  urlMeta = `https://graph.facebook.com/v20.0`;

  path = `./public`;

  constructor() {}

  async send<T>(
    url: string,
    token: string,
    existFile: boolean = false,
  ): Promise<T | any> {
    const headers = {
      'Content-Type': !!existFile ? 'arraybuffer' : 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'curl/7.64.1',
    };

    const res = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (!!existFile) {
      // return await res.arrayBuffer();
      return await res.json();
    } else {
      return (await res.json()) as T;
    }
  }

  async authFileMeta(
    idMessage: string,
    phone_number_id: string,
    token: string,
  ): Promise<IReturnAuthMeta> {
    try {
      const url = `https://graph.facebook.com/v20.0/${idMessage}?phone_number_id=${phone_number_id}`;

      return await this.send<IReturnAuthMeta>(url, token);
    } catch (error: any) {
      this.logger.error(`authDownloadFile - ${error.message}`);
      throw Error('Erro ao converter o arquivo');
    }
  }

  async downloadFileMeta(
    idMessage: string,
    phone_number_id: string,
    token: string,
    companyId: number,
    conexao: number,
  ): Promise<{ base64: string; mimeType: string }> {
    try {
      const auth = await this.authFileMeta(idMessage, phone_number_id, token);

      if (!existsSync(this.path)) mkdirSync(this.path);
      if (!existsSync(`${this.path}/${companyId}`))
        mkdirSync(`${this.path}/${companyId}`);
      if (!existsSync(`${this.path}/${companyId}/${conexao}`))
        mkdirSync(`${this.path}/${companyId}/${conexao}`);

      const pathFile = `${this.path}/${companyId}/${conexao}`;

      const mimeType = convertMimeTypeToExtension(auth.mime_type);

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'curl/7.64.1',
      };

      const result = await axios.get(auth.url, {
        headers,
        responseType: 'arraybuffer',
      });

      if (result.status != 200)
        throw new Error('Falha em baixar o arquivo da meta');

      const base64 = result.data.toString('base64');

      writeFileSync(`${pathFile}/${idMessage}.${mimeType}`, result.data);

      return {
        base64,
        mimeType: auth.mime_type,
      };
    } catch (error: any) {
      console.log(error);
      this.logger.error(`authDownloadFile - ${error.message}`);
      throw Error('Erro ao converter o arquivo');
    }
  }

  async sendFileToMeta(
    numberId: string,
    token: string,
    pathFile: string,
  ): Promise<IReturnMessageFile | null> {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const formData = new FormData();

      const file = readFileSync(pathFile);

      const mimeType = lookup(pathFile);
      if (!mimeType) {
        throw new Error('Could not determine the MIME type of the file.');
      }

      const blob = new Blob([file], { type: mimeType });

      formData.append('messaging_product', 'whatsapp');
      formData.append('type', mimeType);
      formData.append('file', blob);

      const result = await fetch(`${this.urlMeta}/${numberId}/media`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (result.status != 200)
        throw new Error('Falha em baixar o arquivo da meta');

      return (await result.json()) as IReturnMessageFile;
    } catch (error: any) {
      deleteFile(pathFile);
      this.logger.error(`sendMessage - ${error.message}`);
      throw Error('Erro ao enviar o arquivo para a meta');
    }
  }

  async sendMessage(numberId: string, token: string, message: IMetaMessage) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const result = await fetch(`${this.urlMeta}/${numberId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(message),
      });

      if (result.status != 200) {
        const resultError = await result.json();
        throw new Error(
          resultError.error.message || 'Falha ao enviar mensagem para a meta',
        );
      }

      return (await result.json()) as IReturnMessageMeta;
    } catch (error: any) {
      this.logger.error(`sendMessage - ${error.message}`);
      throw Error('Erro ao enviar a mensagem');
    }
  }

  async getListTemplates(businessId: string, token: string) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const result = await fetch(
        `${this.urlMeta}/${businessId}/message_templates`,
        {
          method: 'GET',
          headers,
        },
      );

      if (result.status != 200) {
        const resultError = await result.json();
        throw new Error(
          resultError.error.message || 'Falha ao enviar mensagem para a meta',
        );
      }

      return (await result.json()) as IResultTemplates;
    } catch (error: any) {
      this.logger.error(`getListTemplates - ${error.message}`);
      throw Error('Erro ao enviar a mensagem');
    }
  }

  async sendReadMessage(
    numberId: string,
    token: string,
    data: IBodyReadMessage,
  ) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      console.log(data);

      const result = await fetch(`${this.urlMeta}/${numberId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (result.status != 200) {
        const resultError = await result.json();
        throw new Error(
          resultError.error.message || 'Falha ao enviar mensagem para a meta',
        );
      }

      return (await result.json()) as IResultTemplates;
    } catch (error: any) {
      this.logger.error(`sendReadMessage - ${error.message}`);
      throw Error('Erro ao marcar a mensagem como lida');
    }
  }
}
