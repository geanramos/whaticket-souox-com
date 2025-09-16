export interface IWebhookWhatsApp {
  object: string;
  entry: Array<IWebhookWhatsAppEntry>;
}

export interface IWebhookWhatsAppEntry {
  id: string;
  changes: Array<IWebhookWhatsAppEntryChanges>;
}

export interface IWebhookWhatsAppEntryChanges {
  value: IWebhookWhatsAppEntryChangesValue;
  field: string;
}

export interface IWebhookWhatsAppEntryChangesValue {
  messaging_product: string;
  metadata?: IWebhookWhatsAppEntryChangesValueMetaData;
  contacts?: Array<IWebhookWhatsAppEntryChangesValueContacts>;
  messages?: Array<IWebhookWhatsAppEntryChangesValueMessages>;
  statuses?: Array<IWebhookWhatsAppEntryChangesValueStatuses>;
}

export interface IWebhookWhatsAppEntryChangesValueStatuses {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

export interface IWebhookWhatsAppEntryChangesValueMetaData {
  display_phone_number: string;
  phone_number_id: string;
}

export class IWebhookWhatsAppEntryChangesValueContacts {
  profile: IWebhookWhatsAppEntryChangesValueContactsProfile;
  wa_id: string;
}

export interface IWebhookWhatsAppEntryChangesValueContactsProfile {
  name: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessages {
  from: string;
  id: string;
  timestamp: string;
  type:
    | 'text'
    | 'image'
    | 'audio'
    | 'document'
    | 'video'
    | 'location'
    | 'contacts'
    | 'order'
    | 'interactive'
    | 'referral'
    | 'sticker';
  text?: IWebhookWhatsAppEntryChangesValueMessagesText;
  image?: IWebhookWhatsAppEntryChangesValueMessagesImage;
  audio?: IWebhookWhatsAppEntryChangesValueMessagesAudio;
  document?: IWebhookWhatsAppEntryChangesValueMessagesDocument;
  video?: IWebhookWhatsAppEntryChangesValueMessagesVideo;
  location?: IWebhookWhatsAppEntryChangesValueMessagesLocation;
  contacts?: IWebhookWhatsAppEntryChangesValueMessagesContacts;
  context?: IWebhookWhatsAppEntryChangesValueMessagesContext;
  sticker?: IWebhookWhatsAppEntryChangesValueMessagesSticker;
  order?: IWebhookWhatsAppEntryChangesValueMessagesOrder;
  interactive?: IWebhookWhatsAppEntryChangesValueMessagesInteractive;
  referral?: IWebhookWhatsAppEntryChangesValueMessagesReferral;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesReferral {
  source_url: string;
  source_type: string;
  source_id: string;
  headline: string;
  body: string;
  media_type: string;
  image_url: string;
  video_url: string;
  thumbnail_url: string;
  ctwa_clid: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesSticker {
  mime_type: string;
  sha256: string;
  id: string;
  animated: boolean;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesInteractive {
  type: IWebhookWhatsAppEntryChangesValueMessagesInteractive;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesInteractive {
  button_reply?: IWebhookWhatsAppEntryChangesValueMessagesInteractiveButtonReply;
  list_reply?: IWebhookWhatsAppEntryChangesValueMessagesInteractiveListReply;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesInteractiveButtonReply {
  id: string;
  title: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesInteractiveListReply {
  id: string;
  title: string;
  description: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesOrder {
  catalog_id: string;
  text: string;
  product_items: IWebhookWhatsAppEntryChangesValueMessagesOrderProductItem;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesOrderProductItem {
  product_retailer_id: string;
  quantity: string;
  item_price: string;
  currency: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesContext {
  from: string;
  id: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesText {
  body: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesImage {
  mime_type: string;
  sha256: string;
  id: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesAudio {
  mime_type: string;
  sha256: string;
  id: string;
  voice: boolean;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesDocument {
  filename: string;
  mime_type: string;
  sha256: string;
  id: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesVideo {
  mime_type: string;
  sha256: string;
  id: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesLocation {
  latitude: number;
  longitude: number;
  name: string;
  url: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesContacts {
  emails: Array<IWebhookWhatsAppEntryChangesValueMessagesContactsEmails>;
  name: IWebhookWhatsAppEntryChangesValueMessagesContactsName;
  org: IWebhookWhatsAppEntryChangesValueMessagesContactsOrg;
  phones: IWebhookWhatsAppEntryChangesValueMessagesContactsPhones;
  urls: IWebhookWhatsAppEntryChangesValueMessagesContactsUrls;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesContactsEmails {
  email: string;
  type: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesContactsName {
  first_name: string;
  middle_name: string;
  last_name: string;
  formatted_name: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesContactsOrg {
  company: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesContactsPhones {
  phone: string;
  wa_id: string;
  type: string;
}

export interface IWebhookWhatsAppEntryChangesValueMessagesContactsUrls {
  url: string;
  type: string;
}
