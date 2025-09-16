import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { WhatsappOficialService } from '../whatsapp-oficial/whatsapp-oficial.service';
import { WhatsAppOficial } from 'src/@core/domain/entities/whatsappOficial.model';
import { AppError } from 'src/@core/infra/errors/app.error';
import { RedisService } from 'src/@core/infra/redis/RedisService.service';
import { RabbitMQService } from 'src/@core/infra/rabbitmq/RabbitMq.service';
import {
  IWebhookWhatsApp,
  IWebhookWhatsAppEntryChangesValueMessages,
} from './interfaces/IWebhookWhatsApp.inteface';
import { SocketService } from 'src/@core/infra/socket/socket.service';
import {
  IMessageReceived,
  IReceivedWhatsppOficial,
} from 'src/@core/interfaces/IWebsocket.interface';
import { MetaService } from 'src/@core/infra/meta/meta.service';

@Injectable()
export class WebhookService {
  private logger: Logger = new Logger(`${WebhookService.name}`);
  private messagesPermitidas = [
    'text',
    'image',
    'audio',
    'document',
    'video',
    'location',
    'contacts',
    'order',
    'interactive',
    'referral',
    'sticker',
  ];

  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly whatsAppService: WhatsappOficialService,
    private readonly redis: RedisService,
    private readonly socket: SocketService,
    private readonly meta: MetaService,
  ) {}

  async forwardToWebhook(whats: WhatsAppOficial, body: any) {
    try {
      const {
        n8n_webhook_url,
        auth_token_n8n,
        chatwoot_webhook_url,
        auth_token_chatwoot,
        typebot_webhook_url,
        auth_token_typebot,
        crm_webhook_url,
        auth_token_crm,
      } = whats;

      try {
        if (!!n8n_webhook_url) {
          this.sendToWebhook(n8n_webhook_url, auth_token_n8n, body);
        }

        if (!!chatwoot_webhook_url) {
          this.sendToWebhook(chatwoot_webhook_url, auth_token_chatwoot, body);
        }

        if (!!typebot_webhook_url) {
          this.sendToWebhook(typebot_webhook_url, auth_token_typebot, body);
        }

        if (!!crm_webhook_url) {
          this.sendToWebhook(crm_webhook_url, auth_token_crm, body);
        }
      } catch (error: any) {
        this.logger.error(
          `forwardToWebhook - Erro ao enviar webhook - ${error.message}`,
        );
        throw new AppError(error.message, HttpStatus.BAD_REQUEST);
      }
    } catch (error: any) {
      this.logger.error(
        `forwardToWebhook - Erro nos webhook - ${error.message}`,
      );
      throw new AppError(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async sendToWebhook(webhook_url: string, token: string, body: any) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      this.logger.log('Resposta do encaminhamento do webhook', {
        webhook_url,
        responseData,
      });
    } catch (error: any) {
      this.logger.error('Erro ao encaminhar para o webhook', {
        erro: error.message,
        webhook_url,
      });
      return null;
    }
  }

  async webhookCompanyConexao(companyId: number, conexaoId: number, data: any) {
    try {
      const company = await this.whatsAppService.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) throw new Error('Empresa não encontrada');

      const whats = await this.whatsAppService.prisma.whatsappOficial.findFirst(
        {
          where: { id: conexaoId, companyId, deleted_at: null },
          include: { company: true },
        },
      );

      if (!whats) throw new Error('Configuração não encontrada');

      const body: IWebhookWhatsApp = data?.body || data;

      if (body.object == 'whatsapp_business_account') {
        const { entry } = body;

        for (const e of entry) {
          for (const change of e.changes) {
            if (change.field == 'messages') {
              const { value } = change;

              if (value?.statuses != null) {
                this.logger.log('Webhook recebido:', { body, companyId });
                for (const status of value.statuses) {
                  this.socket.readMessage({
                    companyId: company.idEmpresaMult100,
                    messageId: status.id,
                    token: whats.token_mult100,
                  });
                }
              } else {
                const contact = value.contacts[0];

                for (const message of value.messages) {
                  if (this.messagesPermitidas.some((m) => m == message.type)) {
                    this.logger.log('Webhook recebido:', { body, companyId });

                    if (!!whats.use_rabbitmq) {
                      const exchange = companyId;
                      const queue = `${whats.phone_number}`.replace('+', '');
                      const routingKey = whats.rabbitmq_routing_key;

                      await this.rabbit.sendToRabbitMQ(whats, body);
                      this.logger.log(
                        `Enviado para o RabbitMQ com sucesso. Vinculando fila '${queue}' à exchange '${exchange}' ${!!routingKey ? `com routing key '${routingKey}` : ''} '...`,
                      );
                    }

                    const messages = await this.redis.get(
                      `messages:${companyId}:${conexaoId}`,
                    );

                    if (!!messages) {
                      const messagesStored: Array<any> = JSON.parse(
                        messages,
                      ) as Array<any>;

                      messagesStored.push(body);

                      await this.redis.set(
                        `messages:${companyId}:${conexaoId}`,
                        JSON.stringify([messagesStored]),
                      );
                    } else {
                      await this.redis.set(
                        `messages:${companyId}:${conexaoId}`,
                        JSON.stringify([body]),
                      );
                    }

                    this.logger.log(
                      'Enviando mensagem para o servidor do websocket',
                    );

                    let file;
                    let idFile;
                    let bodyMessage;
                    let quoteMessageId;
                    switch (message.type) {
                      case 'video':
                        idFile = message.video.id;
                        file = await this.meta.downloadFileMeta(
                          idFile,
                          change.value.metadata.phone_number_id,
                          whats.send_token,
                          company.id,
                          whats.id,
                        );
                        break;
                      case 'document':
                        idFile = message.document.id;
                        file = await this.meta.downloadFileMeta(
                          idFile,
                          change.value.metadata.phone_number_id,
                          whats.send_token,
                          company.id,
                          whats.id,
                        );
                        break;
                      case 'image':
                        idFile = message.image.id;
                        file = await this.meta.downloadFileMeta(
                          idFile,
                          change.value.metadata.phone_number_id,
                          whats.send_token,
                          company.id,
                          whats.id,
                        );
                        break;
                      case 'audio':
                        idFile = message.audio.id;
                        file = await this.meta.downloadFileMeta(
                          idFile,
                          change.value.metadata.phone_number_id,
                          whats.send_token,
                          company.id,
                          whats.id,
                        );
                        break;
                      case 'interactive':
                        file = null;
                        bodyMessage =
                          message.interactive.button_reply?.id ||
                          message.interactive.list_reply?.id;
                        break;
                      case 'location':
                        bodyMessage = JSON.stringify(message.location);
                        break;
                      case 'contacts':
                        bodyMessage = {
                          contacts: message.contacts,
                        };
                        break;
                      case 'sticker':
                        idFile = message.sticker.id;
                        file = await this.meta.downloadFileMeta(
                          idFile,
                          change.value.metadata.phone_number_id,
                          whats.send_token,
                          company.id,
                          whats.id,
                        );
                        break;
                      case 'order':
                        bodyMessage = JSON.stringify(message.order);
                        break;
                      default:
                        file = null;
                        bodyMessage = message.text.body;
                        quoteMessageId = message.context?.id;
                        break;
                    }

                    const msg: IMessageReceived = {
                      timestamp: +message.timestamp,
                      type: message.type,
                      text: bodyMessage,
                      file: !!file ? file.base64 : null,
                      mimeType: !!file ? file.mimeType : null,
                      idFile,
                      idMessage: message.id,
                      quoteMessageId,
                    };

                    const data: IReceivedWhatsppOficial = {
                      companyId: company.idEmpresaMult100,
                      nameContact: contact.profile.name,
                      message: msg,
                      token: whats.token_mult100,
                      fromNumber: message.from,
                    };

                    this.socket.sendMessage(data);

                    await this.forwardToWebhook(whats, body);
                    this.logger.log('Enviado para o Webhook com sucesso.');
                  }
                }
              }
            }
          }
        }

        return true;
      } else {
        this.logger.error(`Evento não tratado: ${JSON.stringify(body)}`);
      }

      return true;
    } catch (error: any) {
      this.logger.error(
        `Erro no POST /webhook/:companyId/:conexaoId - ${error.message}`,
      );
      throw new AppError(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async webhookCompany(
    companyId: number,
    conexaoId: number,
    mode: string,
    verify_token: string,
    challenge: string,
  ) {
    try {
      const whats = await this.whatsAppService.prisma.whatsappOficial.findFirst(
        { where: { id: conexaoId, companyId, deleted_at: null } },
      );

      if (!whats) throw new Error('Configuração não encontrada');

      if (mode === 'subscribe' && verify_token === whats.token_mult100) {
        this.logger.log('WEBHOOK VERIFICADO para a empresa:', companyId);

        return challenge;
      } else {
        this.logger.error(
          'Falha na verificação do webhook para a empresa:',
          companyId,
        );
        throw new Error(
          `Falha na verificação do webhook para a empresa: ${companyId}`,
        );
      }
    } catch (error: any) {
      this.logger.error(`webhookCompany - ${error.message}`);
      throw new AppError(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
