import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";

export interface MessageData {
  wid: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  queueId?: number;
  channel?: string;
  ticketTrakingId?: number;
  isPrivate?: boolean;
  ticketImported?: any;
  isForwarded?: boolean;
}
interface Request {
  messageData: MessageData;
  companyId: number;
}

const CreateMessageService = async ({
  messageData,
  companyId
}: Request): Promise<Message> => {
  
  const correctMediaType = (data: MessageData): MessageData => {
    // Se já tem mediaType definido como audio, manter
    if (data.mediaType === 'audio') {
      return data;
    }

    // Verificar se deveria ser áudio baseado na URL ou outros indicadores
    const shouldBeAudio = (data: MessageData): boolean => {
      // Verificar pela URL
      if (data.mediaUrl) {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.aac'];
        const url = data.mediaUrl.toLowerCase();
        if (audioExtensions.some(ext => url.includes(ext))) {
          return true;
        }
        
        // Verificar se tem padrão de nome de áudio
        if (url.includes('audio_')) {
          return true;
        }
      }

      // Verificar pelo body
      if (data.body && typeof data.body === 'string') {
        const body = data.body.toLowerCase();
        if (body.includes('áudio gravado') || body.includes('🎵 arquivo de áudio')) {
          return true;
        }
      }

      return false;
    };

    // Se deveria ser áudio, corrigir o tipo
    if (shouldBeAudio(data)) {
      console.log(`🎵 Corrigindo tipo de mídia de '${data.mediaType}' para 'audio'`);
      return {
        ...data,
        mediaType: 'audio'
      };
    }

    return data;
  };

  const correctedMessageData = correctMediaType(messageData);
  
  await Message.upsert({ ...correctedMessageData, companyId });

  const message = await Message.findOne({
    where: {
      wid: correctedMessageData.wid,
      companyId
    },
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: [
          {
            model: Contact,
            attributes: ["id", "name", "number", "email", "profilePicUrl", "acceptAudioMessage", "active", "urlPicture", "companyId"],
            include: ["extraInfo", "tags"]
          },
          {
            model: Queue,
            attributes: ["id", "name", "color"]
          },
          {
            model: Whatsapp,
            attributes: ["id", "name", "groupAsTicket", "color"]
          },
          {
            model: User,
            attributes: ["id", "name"]
          },
          {
            model: Tag,
            as: "tags",
            attributes: ["id", "name", "color"]
          }
        ]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      }
    ]
  });

  if (message.ticket.queueId !== null && message.queueId === null) {
    await message.update({ queueId: message.ticket.queueId });
  }

  if (message.isPrivate) {
    await message.update({ wid: `PVT${message.id}` });
  }

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  const io = getIO();

  if (!messageData?.ticketImported) {
    io.of(String(companyId))
      .emit(`company-${companyId}-appMessage`, {
        action: "create",
        message,
        ticket: message.ticket,
        contact: message.ticket.contact
      });
  }

  return message;
};

export default CreateMessageService;
