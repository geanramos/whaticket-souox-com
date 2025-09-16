import { Injectable } from '@nestjs/common';
import { CreateSendMessageWhatsappDto } from './dto/create-send-message-whatsapp.dto';
import { BaseService } from 'src/@core/base/base.service';
import { SendMessageWhatsApp } from 'src/@core/domain/entities/sendMessageWhatsApp.entity';
import { AppError } from 'src/@core/infra/errors/app.error';
import { checkPasteFiles, savedFile } from 'src/@core/common/utils/files.utils';
import { MetaService } from 'src/@core/infra/meta/meta.service';
import {
  IBodyReadMessage,
  IMetaMessage,
  IMetaMessageAudio,
  IMetaMessageContacts,
  IMetaMessageDocument,
  IMetaMessageImage,
  IMetaMessageLocation,
  IMetaMessageReaction,
  IMetaMessageSticker,
  IMetaMessageTemplate,
  IMetaMessageText,
  IMetaMessageVideo,
  IMetaMessageinteractive,
} from 'src/@core/infra/meta/interfaces/IMeta.interfaces';
import { WhatsappOficialService } from '../whatsapp-oficial/whatsapp-oficial.service';

@Injectable()
export class SendMessageWhatsappService extends BaseService<SendMessageWhatsApp> {
  constructor(
    private metaService: MetaService,
    private whatsAppService: WhatsappOficialService,
  ) {
    super('sendMessageWhatsApp', SendMessageWhatsappService.name);
  }

  private async createFile(
    file: Express.Multer.File,
    fileName: string,
    empresaId: number,
    conexaoId: number,
  ) {
    try {
      const data = new Date();

      const year = data.getFullYear();
      let month = String(data.getMonth() + 1);
      month = month.length == 1 ? `0${month}` : month;
      const day = data.getDate();
      let path = `${year}-${month}-${day}`;

      checkPasteFiles(path);
      path += `/${empresaId}`;
      checkPasteFiles(path);
      path += `/${conexaoId}`;
      checkPasteFiles(path);

      return await savedFile(file, path, fileName);
    } catch (error: any) {
      this.logger.error(`createMessage - ${error.message}`);
      throw new Error(`Falha ao salvar o arquivo`);
    }
  }

  private async getIdMetaMedia(
    whatsId: number,
    phone_number_id: string,
    token: string,
    idCompany: number,
    file: Express.Multer.File,
    fileName: string,
  ) {
    try {
      if (!file) throw new Error('Necessário informar um arquivo');

      const pathFile = await this.createFile(
        file,
        fileName,
        idCompany,
        whatsId,
      );

      const metaFile = await this.metaService.sendFileToMeta(
        phone_number_id,
        token,
        pathFile,
      );

      return { pathFile, mediaMetaId: metaFile.id };
    } catch (error: any) {
      this.logger.error(`getIdMetaMedia - ${error.message}`);
      throw new Error(error.message);
    }
  }

  async createMessage(
    token: string,
    dados_mensagem: string,
    file: Express.Multer.File,
  ) {
    try {
      const data: CreateSendMessageWhatsappDto = JSON.parse(dados_mensagem);
      const regex = /^\+55\d{2}\d{8,9}$/;

      if (!data.to)
        throw new Error('Necessário informar o número do destinatario');
      if (!regex.test(data.to))
        throw new Error('o número não está no padrão do whatsapp');

      const whats = await this.prisma.whatsappOficial.findFirst({
        where: { token_mult100: token },
      });

      if (!whats) throw new Error('Conexão não encontrada');

      const company = await this.prisma.company.findFirst({
        where: { id: whats.companyId },
      });

      if (!company)
        throw new Error('Nenhuma empresa cadastrada para este usuário');

      const entity: SendMessageWhatsApp = {
        type: data.type,
        whatsappOficialId: whats.id,
        to: data.to,
      };

      const {
        body_text,
        body_video,
        body_document,
        body_image,
        body_location,
        body_reaction,
        body_contacts,
        body_interactive,
        body_sticket,
        body_template,
      } = data;

      let resMedia: { pathFile: string; mediaMetaId: string };
      let dataMessage: any;

      switch (data.type) {
        case 'text':
          if (!body_text.body)
            throw new Error(
              'Necessário informar um texto para enviar a mensagem',
            );

          entity.text = {
            body: body_text.body,
            preview_url: body_text?.preview_url,
          };
          dataMessage = body_text;
          break;
        case 'audio':
          resMedia = await this.getIdMetaMedia(
            whats.id,
            whats.phone_number_id,
            whats.send_token,
            company.id,
            file,
            data.fileName,
          );
          if (!resMedia) throw new Error('Erro ao gravar a mensagem');

          entity.idFileMeta = resMedia.mediaMetaId;
          entity.pathFile = resMedia.pathFile;

          entity.audio = { id: resMedia.mediaMetaId };
          dataMessage = { id: resMedia.mediaMetaId } as IMetaMessageAudio;
          break;
        case 'video':
          resMedia = await this.getIdMetaMedia(
            whats.id,
            whats.phone_number_id,
            whats.send_token,
            company.id,
            file,
            data.fileName,
          );
          if (!resMedia) throw new Error('Erro ao gravar a mensagem');

          entity.idFileMeta = resMedia.mediaMetaId;
          entity.pathFile = resMedia.pathFile;

          entity.video = {
            id: resMedia.mediaMetaId,
            caption: !!body_video?.caption ? body_video.caption : null,
          };

          dataMessage = {
            id: resMedia.mediaMetaId,
            caption: !!body_video?.caption ? body_video.caption : null,
          } as IMetaMessageVideo;
          break;
        case 'document':
          resMedia = await this.getIdMetaMedia(
            whats.id,
            whats.phone_number_id,
            whats.send_token,
            company.id,
            file,
            data.fileName,
          );
          if (!resMedia) throw new Error('Erro ao gravar a mensagem');

          entity.idFileMeta = resMedia.mediaMetaId;
          entity.pathFile = resMedia.pathFile;

          entity.document = {
            filename: resMedia.pathFile,
            id: resMedia.mediaMetaId,
            caption: !!body_document.caption ? body_document.caption : null,
          };

          dataMessage = {
            filename: resMedia.pathFile,
            id: resMedia.mediaMetaId,
            caption: !!body_document.caption ? body_document.caption : null,
          } as IMetaMessageDocument;
          break;
        case 'image':
          resMedia = await this.getIdMetaMedia(
            whats.id,
            whats.phone_number_id,
            whats.send_token,
            company.id,
            file,
            data.fileName,
          );
          if (!resMedia) throw new Error('Erro ao gravar a mensagem');

          entity.idFileMeta = resMedia.mediaMetaId;
          entity.pathFile = resMedia.pathFile;

          entity.image = {
            id: resMedia.mediaMetaId,
            caption: !!body_image?.caption ? body_image.caption : null,
          };

          dataMessage = {
            id: resMedia.mediaMetaId,
            caption: !!body_image?.caption ? body_image.caption : null,
          } as IMetaMessageImage;
          break;
        case 'location':
          if (!body_location.latitude && !body_location.longitude)
            throw new Error('Necessário informar a latitude e longitude');

          entity.location = {
            latitude: body_location.latitude,
            longitude: body_location.longitude,
            name: !!body_location?.name ? body_location.name : null,
            address: !!body_location?.address ? body_location.address : null,
          };

          dataMessage = {
            latitude: body_location.latitude,
            longitude: body_location.longitude,
            name: !!body_location?.name ? body_location.name : null,
            address: !!body_location?.address ? body_location.address : null,
          } as IMetaMessageLocation;
          break;
        case 'reaction':
          if (!body_reaction.message_id || !body_reaction.emoji)
            throw new Error('Necessário informar o id da mensagem e o emoji');

          entity.reaction = {
            message_id: body_reaction.message_id,
            emoji: body_reaction.emoji,
          };

          dataMessage = {
            message_id: body_reaction.message_id,
            emoji: body_reaction.emoji,
          };
          break;
        case 'contacts':
          entity.contacts = [body_contacts] as any;

          dataMessage = [body_contacts];
          break;
        case 'interactive':
          console.log(JSON.stringify(body_interactive, null, 2));
          if (
            body_interactive.type == 'button' ||
            body_interactive.type == 'list'
          ) {
            entity.interactive = body_interactive as any;

            dataMessage = body_interactive;
          } else {
            throw new Error('O tipo de mensagem esta incorreto');
          }
          break;
        case 'sticker':
          if (!body_sticket.id)
            throw new Error('Necessário informar o id do sticker');

          entity.sticker = { id: body_sticket.id };

          dataMessage = { id: body_sticket.id } as IMetaMessageSticker;
          break;
        case 'template':
          entity.template = body_template as any;

          dataMessage = body_template;
          break;
        default:
          throw new Error('Este tipo não é suportado pela meta');
      }

      const message: IMetaMessage = {
        to: data.to,
        type: data.type,
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        ...(data.quotedId && { context: { message_id: data.quotedId } }),
      };

      message[data.type] = dataMessage;

      const res = await this.metaService.sendMessage(
        whats.phone_number_id,
        whats.send_token,
        message,
      );

      entity.idMessageWhatsApp = res.messages.map((m) => m.id);

      return await this.prisma.sendMessageWhatsApp.create({ data: entity });
    } catch (error: any) {
      this.logger.error(`createMessage - ${error.message}`);
      throw new AppError(error.message);
    }
  }

  async readMessage(token: string, messageId: string) {
    try {
      const body = {
        message_id: messageId,
        messaging_product: 'whatsapp',
        status: 'read',
      } as IBodyReadMessage;

      const whats =
        await this.whatsAppService.prisma.whatsappOficial.findUnique({
          where: { token_mult100: token },
        });

      if (!whats) throw new Error('Nenhum número configurado para este token');

      return await this.metaService.sendReadMessage(
        whats.phone_number_id,
        whats.send_token,
        body,
      );
    } catch (error: any) {
      this.logger.error(`readMessage - ${error.message}`);
      throw new AppError(error.message);
    }
  }
}
