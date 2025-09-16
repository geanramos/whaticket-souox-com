import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import { isNil } from "lodash";
import { sendMessageWhatsAppOficial } from "../../libs/whatsAppOficial/whatsAppOficial.service";
import { IMetaMessageTemplate, IMetaMessageinteractive, IReturnMessageMeta, ISendMessageOficial } from "../../libs/whatsAppOficial/IWhatsAppOficial.interfaces";
import CreateMessageService from "../MessageServices/CreateMessageService";
import formatBody from "../../helpers/Mustache";

interface Request {
  body: string;
  ticket: Ticket;
  type: 'text' | 'reaction' | 'audio' | 'document' | 'image' | 'sticker' | 'video' | 'location' | 'contacts' | 'interactive' | 'template',
  quotedMsg?: Message;
  msdelay?: number;
  media?: Express.Multer.File,
  vCard?: Contact;
  template?: IMetaMessageTemplate,
  interative?: IMetaMessageinteractive,
  bodyToSave?: string
}

const getTypeMessage = (type: string): 'text' | 'reaction' | 'audio' | 'document' | 'image' | 'sticker' | 'video' | 'location' | 'contacts' | 'interactive' | 'template' => {
  console.log("type", type);
  switch (type) {
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'image':
      return 'image'
    case 'application':
      return 'document'
    case 'document':
      return 'document'
    case 'text':
      return 'document'
    case 'interactive':
      return 'interactive'
    case 'contacts':
      return 'contacts'
    case 'location':
      return 'location'
    case 'template':
      return 'template'
    case 'reaction':
      return 'reaction'
    default:
      return null
  }
}

const SendWhatsAppOficialMessage = async ({
  body,
  ticket,
  media,
  type,
  vCard,
  template,
  interative,
  quotedMsg,
  bodyToSave
}: Request): Promise<IReturnMessageMeta> => {

  const pathMedia = !!media ? media.path : null;
  let options: ISendMessageOficial = {} as ISendMessageOficial;
  const typeMessage = !!media ? media.mimetype.split("/")[0] : null;
  let bodyTicket = "";
  let mediaType: string;

  const bodyMsg = body ? formatBody(body, ticket) : null;

  type = !type ? getTypeMessage(typeMessage) : type;

  switch (type) {
    case 'video':
      options.body_video = { caption: bodyMsg };
      options.type = 'video';
      options.fileName = media.originalname.replace('/', '-');
      bodyTicket = "🎥 Arquivo de vídeo";
      mediaType = 'video';
      break;
    case 'audio':
      options.type = 'audio';
      options.fileName = media.originalname.replace('/', '-');
      bodyTicket = "🎵 Arquivo de áudio";
      mediaType = 'audio';
      break;
    case 'document':
      options.type = 'document';
      options.body_document = { caption: bodyMsg }; 
      options.fileName = media.originalname.replace('/', '-');
      bodyTicket = "📂 Arquivo de Documento";
      mediaType = 'document';
      break;
    case 'image':
      options.body_image = { caption: bodyMsg };
      options.fileName = media.originalname.replace('/', '-');
      bodyTicket = "📷 Arquivo de Imagem";
      mediaType = 'image';
      break;
    case 'text':
      options.body_text = { body: bodyMsg };
      mediaType = 'conversation';
      break;
    case 'interactive':
      mediaType = interative.type == 'button' ? 'interative' : 'listMessage';
      options.body_interactive = interative;
      break;
    case 'contacts':
      mediaType = 'contactMessage';
      const first_name = vCard?.name?.split(' ')[0];
      const last_name = String(vCard?.name).replace(vCard?.name?.split(' ')[0], '');
      options.body_contacts = {
        name: { first_name: first_name, last_name: last_name, formatted_name: `${first_name} ${last_name}`.trim() },
        phones: [{ phone: `+${vCard?.number}`, wa_id: +vCard?.number, type: 'CELL' }],
        emails: [{ email: vCard?.email }]
      }
      break;
    case 'location':
      throw new Error(`Tipo ${type} não configurado para enviar mensagem a Meta`);
    case 'template':
      options.body_template = template;
      mediaType = 'template';
      break;
    case 'reaction':
      throw new Error(`Tipo ${type} não configurado para enviar mensagem a Meta`)
    default:
      throw new Error(`Tipo ${type} não configurado para enviar mensagem a Meta`);
  }

  const contact = await Contact.findByPk(ticket.contactId)

  let vcard;

  if (!isNil(vCard)) {
    console.log(vCard)
    const numberContact = vCard.number;
    const firstName = vCard.name.split(' ')[0];
    const lastName = String(vCard.name).replace(vCard.name.split(' ')[0], '')
    vcard = `BEGIN:VCARD\n`
      + `VERSION:3.0\n`
      + `N:${lastName};${firstName};;;\n`
      + `FN:${vCard.name}\n`
      + `TEL;type=CELL;waid=${numberContact}:+${numberContact}\n`
      + `END:VCARD`;
    console.log(vcard)
  }

  options.to = `+${contact.number}`;
  options.type = type;
  options.quotedId = quotedMsg?.wid;

  try {
    const sendMessage = await sendMessageWhatsAppOficial(
      pathMedia,
      ticket.whatsapp.token,
      options
    )
    await ticket.update({ lastMessage: !bodyMsg && !!media ? bodyTicket : bodyMsg, imported: null, unreadMessages: 0 });

    const wid: any = sendMessage

    const bodyMessage = !isNil(vCard) ? vcard : !bodyMsg ? '' : bodyMsg;
    const messageData = {
      wid: wid?.idMessageWhatsApp[0],
      ticketId: ticket.id,
      contactId: contact.id,
      body: type === 'interactive' ? bodyToSave : bodyMessage,
      fromMe: true,
      mediaType: mediaType,
      mediaUrl: !!media ? media.filename : null,
      read: true,
      quotedMsgId: quotedMsg?.id || null,
      ack: 2,
      channel: 'whatsapp_oficial',
      remoteJid: `${contact.number}@s.whatsapp.net`,
      participant: null,
      dataJson: JSON.stringify(body),
      ticketTrakingId: null,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      ticketImported: ticket.imported,
      isForwarded: false,
      originalName: !!media ? media.filename : null
    };

    await CreateMessageService({ messageData, companyId: ticket.companyId });

    // const io = getIO();

    // io.of(String(ticket.companyId))
    //   .emit(`company-${ticket.companyId}-appMessage`, {
    //     action: "create",
    //     message: messageData,
    //     ticket: ticket,
    //     contact: ticket.contact
    //   });

    return sendMessage;
  } catch (err) {
    console.log(`erro ao enviar mensagem na company ${ticket.companyId} - `, body)
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }

}

export default SendWhatsAppOficialMessage;
