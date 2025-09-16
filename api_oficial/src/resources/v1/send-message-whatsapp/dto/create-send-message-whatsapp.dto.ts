import { $Enums } from '@prisma/client';
import {
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

export class CreateSendMessageWhatsappDto {
  type: $Enums.typeMessage;
  to: string;
  fileName?: string;
  quotedId?: string;

  body_text?: IMetaMessageText;
  body_video?: IMetaMessageVideo;
  body_document?: IMetaMessageDocument;
  body_image?: IMetaMessageImage;
  body_location?: IMetaMessageLocation;
  body_reaction?: IMetaMessageReaction;
  body_contacts?: IMetaMessageContacts;
  body_interactive?: IMetaMessageinteractive;
  body_sticket?: IMetaMessageSticker;
  body_template?: IMetaMessageTemplate;
}
