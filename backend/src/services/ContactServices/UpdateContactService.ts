// src/services/ContactServices/UpdateContactService.ts - CORRIGIDO
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import DeleteContactWalletService from "./DeleteContactWalletService";
import UpdateContactWalletsService from "./UpdateContactWalletsService";

interface ExtraInfo {
  id?: number;
  name: string;
  value: string;
}

interface ContactData {
  email?: string;
  number?: string;
  name?: string;
  acceptAudioMessage?: boolean;
  active?: boolean;
  extraInfo?: ExtraInfo[];
  disableBot?: boolean;
  remoteJid?: string;
  contactWallets?: null | number[] | string[];
  birthDate?: Date | string; // 🎂 NOVO CAMPO ADICIONADO
}

interface Request {
  contactData: ContactData;
  contactId: string;
  companyId: number;
}

const updateCustomFields = async (
  contactId: number,
  extraInfo: ExtraInfo[]
) => {
  const currentFields = await ContactCustomField.findAll({
    where: { contactId }
  });

  await Promise.all(
    extraInfo.map(async (info: ExtraInfo) => {
      const existingField = currentFields.find(
        field => field.name === info.name
      );
      if (existingField) {
        await existingField.update({ value: info.value });
      } else {
        await ContactCustomField.create({ ...info, contactId });
      }
    })
  );

  await Promise.all(
    currentFields.map(async oldInfo => {
      const stillExists = extraInfo.find(info => info.name === oldInfo.name);
      if (!stillExists) {
        await ContactCustomField.destroy({ where: { id: oldInfo.id } });
      }
    })
  );
};

const UpdateContactService = async ({
  contactData,
  contactId,
  companyId
}: Request): Promise<Contact> => {
  const {
    email,
    name,
    number,
    extraInfo,
    acceptAudioMessage,
    active,
    disableBot,
    remoteJid,
    contactWallets,
    birthDate // 🎂 INCLUIR NO DESTRUCTURING
  } = contactData;

  const contact = await Contact.findOne({
    where: { id: contactId },
    include: ["extraInfo"]
  });

  if (!contact) {
    throw new AppError("Contato não encontrado", 404);
  }

  if (contact.companyId !== companyId) {
    throw new AppError("Não é possível alterar registros de outra empresa");
  }

  if (extraInfo) {
    await updateCustomFields(contact.id, extraInfo);
  }

  if (contactWallets) {
    await DeleteContactWalletService({
      contactId,
      companyId
    });

    contactWallets.forEach(async (wallet: any) => {
      await UpdateContactWalletsService({
        userId: wallet.walletId,
        queueId: wallet.queueId,
        contactId,
        companyId
      });
    });
  }

  // 🎂 PROCESSAR DATA DE NASCIMENTO
  let processedBirthDate: Date | null = contact.birthDate;
  if (birthDate !== undefined) {
    if (birthDate === null || birthDate === '') {
      processedBirthDate = null;
    } else if (typeof birthDate === 'string') {
      const dateOnly = birthDate.split('T')[0];
      processedBirthDate = new Date(dateOnly + 'T12:00:00');
    } else if (birthDate instanceof Date) {
      const year = birthDate.getFullYear();
      const month = birthDate.getMonth();
      const day = birthDate.getDate();
      processedBirthDate = new Date(year, month, day, 12, 0, 0);
    }
  }

  await contact.update({
    name,
    number,
    email,
    acceptAudioMessage,
    active,
    disableBot,
    remoteJid,
    birthDate: processedBirthDate // 🎂 INCLUIR NO UPDATE
  });

  await contact.reload({
    include: ["extraInfo"]
  });

  return contact;
};

export default UpdateContactService;