import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import {
  IReceivedWhatsppOficial,
  IReceivedWhatsppOficialRead,
} from 'src/@core/interfaces/IWebsocket.interface';

@Injectable()
export class SocketService {
  private socket: Socket;
  private url: string;
  id: number;

  private logger: Logger = new Logger(`${SocketService.name}`);

  constructor() {}

  connect(id: number) {
    try {
      this.url = process.env.URL_BACKEND_MULT100;

      if (!this.url) throw new Error('Nenhuma configuração do url do backend');

      this.id = id;

      this.socket = io(`${this.url}/${id}`, {
        query: {
          token: `Bearer ${process.env.TOKEN_ADMIN || ''}`,
        },
      });

      this.setupSocketEvents();
    } catch (error: any) {
      this.logger.error(
        `Erro ao conectar com o websocket da API Mult100 - ${error.message}`,
      );
    }
  }

  sendMessage(data: IReceivedWhatsppOficial) {
    this.logger.warn(`Conectando ao websocket da empresa ${data.companyId}`);

    this.connect(data.companyId);

    this.logger.warn(
      `Enviando mensagem para o websocket para a empresa ${data.companyId}`,
    );

    this.socket.emit('receivedMessageWhatsAppOficial', data);

    setTimeout(() => {
      this.logger.warn(
        `Fechando conexão do websocket para a empresa ${data.companyId}`,
      );

      this.socket.close();
    }, 1500);
  }

  readMessage(data: IReceivedWhatsppOficialRead) {
    this.logger.warn(`Conectando ao websocket da empresa ${data.companyId}`);

    this.connect(data.companyId);

    this.logger.warn(
      `Enviando mensagem para o websocket para a empresa ${data.companyId}`,
    );

    this.socket.emit('readMessageWhatsAppOficial', data);

    setTimeout(() => {
      this.logger.warn(
        `Fechando conexão do websocket para a empresa ${data.companyId}`,
      );

      this.socket.close();
    }, 1500);
  }

  private setupSocketEvents(): void {
    this.socket.on('connect', () => {
      this.logger.log(
        `Conectado ao websocket do servidor ${this.url}/${this.id}`,
      );
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error(`Erro de conexão: ${error}`);
    });

    this.socket.on('disconnect', () => {
      this.logger.error(
        `Desconectado do websocket do servidor ${this.url}/${this.id}`,
      );
    });
  }
}
