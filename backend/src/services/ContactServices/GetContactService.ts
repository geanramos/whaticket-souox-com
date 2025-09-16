import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import CreateContactService from "./CreateContactService";
import logger from "../../utils/logger";
import { ENABLE_LID_DEBUG } from "../../config/debug";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  companyId: number;
  email?: string;
  acceptAudioMessage?: boolean;
  active?: boolean;
  profilePicUrl?: string;
  extraInfo?: ExtraInfo[];
}

const GetContactService = async ({
  name,
  number,
  companyId
}: Request): Promise<Contact> => {
  // if (ENABLE_LID_DEBUG) {
  //   logger.info(
  //     `[LID-DEBUG] Buscando contato: number=${number}, companyId=${companyId}`
  //   );
  // }
  const numberExists = await Contact.findOne({
    where: { number, companyId }
  });

  if (!numberExists) {
    // logger.info(
    //   `[LID-DEBUG] Contato não encontrado, criando novo: number=${number}`
    // );
    const contact = await CreateContactService({
      name,
      number,
      companyId
    });

    if (contact == null) throw new AppError("CONTACT_NOT_FIND");
    else {
      if (ENABLE_LID_DEBUG) {
        logger.info(
          `[LID-DEBUG] Novo contato criado: id=${contact.id}, number=${contact.number}, jid=${contact.remoteJid}, lid=${contact.lid}`
        );
      }
      return contact;
    }
  }
  // if (ENABLE_LID_DEBUG) {
  //   logger.info(
  //     `[LID-DEBUG] Contato encontrado: id=${numberExists.id}, number=${numberExists.number}, jid=${numberExists.remoteJid}, lid=${numberExists.lid}`
  //   );
  // }
  return numberExists;
};

export default GetContactService;
