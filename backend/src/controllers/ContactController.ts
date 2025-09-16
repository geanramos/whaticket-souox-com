import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";
import ListContactsService from "../services/ContactServices/ListContactsService";
import CreateContactService from "../services/ContactServices/CreateContactService";
import ShowContactService from "../services/ContactServices/ShowContactService";
import UpdateContactService from "../services/ContactServices/UpdateContactService";
import DeleteContactService from "../services/ContactServices/DeleteContactService";
import GetContactService from "../services/ContactServices/GetContactService";
import CheckContactNumber from "../services/WbotServices/CheckNumber";
import GetProfilePicUrl from "../services/WbotServices/GetProfilePicUrl";
import AppError from "../errors/AppError";
import {
  emailSchema,
  phoneSchema,
  nameSchema,
  birthDateSchema,
  searchParamSchema,
  paginationSchema,
  idSchema, // Esta importação já deve existir
  booleanStringSchema,
  createTextSchema
} from "../validators/commonSchemas";
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeText,
  sanitizeNumber // Esta importação já deve existir
} from "../utils/sanitizers";
import SimpleListService, {
  SearchContactParams
} from "../services/ContactServices/SimpleListService";
import ToggleAcceptAudioContactService from "../services/ContactServices/ToggleAcceptAudioContactService";
import BlockUnblockContactService from "../services/ContactServices/BlockUnblockContactService";
import { ImportContactsService } from "../services/ContactServices/ImportContactsService";
import NumberSimpleListService from "../services/ContactServices/NumberSimpleListService";
import CreateOrUpdateContactServiceForImport from "../services/ContactServices/CreateOrUpdateContactServiceForImport";
import UpdateContactWalletsService from "../services/ContactServices/UpdateContactWalletsService";
import DeleteContactWalletService from "../services/ContactServices/DeleteContactWalletService";
import ListWalletsService from "../services/ContactServices/ListWalletsService";
import FindContactTags from "../services/ContactServices/FindContactTags";
import ToggleDisableBotContactService from "../services/ContactServices/ToggleDisableBotContactService";
import GetGroupParticipantsService from "../services/ContactServices/GetGroupParticipantsService";
import SearchContactMessagesService from "../services/ContactServices/SearchContactMessagesService";
import BulkDeleteContactsService from "../services/ContactServices/BulkDeleteContactsService";
import DeleteAllContactsService from "../services/ContactServices/DeleteAllContactsService";
import GetDefaultWhatsApp from "../helpers/GetDefaultWhatsApp";
import Contact from "../models/Contact";
import Tag from "../models/Tag";
import ContactTag from "../models/ContactTag";
import logger from "../utils/logger";
import { createWalletContactUser } from "../services/ContactServices/CreateWalletContactUser";
import User from "../models/User";
import GetContactMediaService from "../services/ContactServices/GetContactMediaService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  contactTag: string;
  isGroup?: string;
};

type IndexGetContactQuery = {
  name: string;
  number: string;
};

interface ExtraInfo {
  name: string;
  value: string;
}

interface ContactData {
  name: string;
  number: string;
  email?: string;
  extraInfo?: ExtraInfo[];
  disableBot?: boolean;
  remoteJid?: string;
  wallets?: null | number[] | string[];
  contactWallets?: null | number[] | string[];
  birthDate?: Date | string; // 🎂 ADICIONAR birthDate,
  isGroup?: boolean;
}

export const importXls = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { number, name, email, validateContact, tags, carteira } = req.body;
  const simpleNumber = String(number).replace(/[^\d.-]+/g, "");
  let validNumber: any = simpleNumber;

  if (validateContact === "true") {
    validNumber = await CheckContactNumber(simpleNumber, companyId);
  }

  const profilePicPromise = GetProfilePicUrl(validNumber.jid, companyId);
  const whatsappPromise = GetDefaultWhatsApp(companyId);

  let profilePicUrl = "";
  let whatsappId = null;

  try {
    // Executa as promessas em paralelo
    const [profilePicUrlResult, defaultWhatsapp] = await Promise.all([
      profilePicPromise,
      whatsappPromise
    ]);
    profilePicUrl = profilePicUrlResult;
    whatsappId = defaultWhatsapp.id;
  } catch (error) {
    console.error("Erro ao obter a foto do perfil ou WhatsApp padrão:", error);
  }

  const contactData = {
    name: `${name}`,
    number: validNumber,
    profilePicUrl,
    isGroup: false,
    email,
    companyId,
    whatsappId
  };

  const contact = await CreateOrUpdateContactServiceForImport(contactData);

  if (tags) {
    const tagList = tags.split(",").map(tag => tag.trim());

    for (const tagName of tagList) {
      try {
        let [tag, created] = await Tag.findOrCreate({
          where: { name: tagName, companyId, color: "#A4CCCC", kanban: 0 }
        });

        // Associate the tag with the contact
        await ContactTag.findOrCreate({
          where: {
            contactId: contact.id,
            tagId: tag.id
          }
        });
      } catch (error) {
        logger.info("Erro ao criar Tags", error);
      }
    }
  }

  if (carteira) {
    const user = await User.findOne({
      where: {
        email: carteira,
        companyId
      }
    });

    await createWalletContactUser(contact.id, user.id, null, companyId);
  }

  const io = getIO();

  io.of(String(companyId)).emit(`company-${companyId}-contact`, {
    action: "create",
    contact
  });

  return res.status(200).json(contact);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const {
    searchParam,
    pageNumber,
    contactTag: tagIdsStringified,
    isGroup
  } = req.query as IndexQuery;
  const { id: userId, companyId } = req.user;

  let tagsIds: number[] = [];

  if (tagIdsStringified) {
    tagsIds = JSON.parse(tagIdsStringified);
  }

  const { contacts, count, hasMore } = await ListContactsService({
    searchParam,
    pageNumber,
    companyId,
    tagsIds,
    isGroup,
    userId: Number(userId)
  });

  return res.json({ contacts, count, hasMore });
};

export const getContact = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name, number } = req.body as IndexGetContactQuery;
  const { companyId } = req.user;

  const contact = await GetContactService({
    name,
    number,
    companyId
  });

  return res.status(200).json(contact);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const newContact: ContactData = req.body;
  newContact.number = newContact.number.replace("-", "").replace(" ", "");

  // const findContact = await Contact.findOne({
  //   where: {
  //     number: newContact.number.replace("-", "").replace(" ", ""),
  //     companyId
  //   }
  // });
  // if (findContact) {
  //   throw new AppError("Contact already exists");
  // }

  // newContact.number = newContact.number.replace("-", "").replace(" ", "");

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    number: Yup.string()
      .required()
      .matches(/^\d+$/, "Invalid number format. Only numbers are allowed."),
    email: Yup.string().email("Invalid email"),
    birthDate: Yup.date()
      .nullable()
      .max(new Date(), "Data de nascimento não pode ser no futuro"), // 🎂 VALIDAÇÃO BIRTHDATE
    extraInfo: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required(),
        value: Yup.string().required()
      })
    )
  });

  try {
    await schema.validate(newContact);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (!newContact.isGroup) {
    const validNumber = await CheckContactNumber(newContact.number, companyId);
    const number = validNumber.jid.replace(/\D/g, "");
    newContact.number = number;
  }

  const validNumber: any = await CheckContactNumber(
    newContact.number,
    companyId
  );

  const contact = await CreateContactService({
    ...newContact,
    number: validNumber.jid.split("@")[0],
    remoteJid: validNumber.jid,
    companyId
  });

  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-contact`, {
    action: "create",
    contact
  });

  return res.status(200).json(contact);
};

// No método update, o schema também precisa incluir birthDate:
export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const contactData: ContactData = req.body;
  const { companyId } = req.user;
  const { contactId } = req.params;

  const schema = Yup.object().shape({
    name: Yup.string(),
    number: Yup.string().matches(/^\d+(@lid)?$/, "ERR_CHECK_NUMBER"),
    email: Yup.string().email("Invalid email"),
    birthDate: Yup.date()
      .nullable()
      .max(new Date(), "Data de nascimento não pode ser no futuro"), // 🎂 VALIDAÇÃO BIRTHDATE
    extraInfo: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required(),
        value: Yup.string().required()
      })
    )
  });

  try {
    await schema.validate(contactData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (!contactData.isGroup && contactData.number.match(/^\d+$/)) {
    const validNumber = await CheckContactNumber(contactData.number, companyId);
    const number = validNumber.jid.replace(/\D/g, "");
    contactData.number = number;
  }

  const oldContact = await ShowContactService(contactId, companyId);

  if (
    contactData.number &&
    oldContact.number != contactData.number &&
    oldContact.channel == "whatsapp"
  ) {
    const isGroup =
      oldContact && oldContact.remoteJid
        ? oldContact.remoteJid.endsWith("@g.us")
        : oldContact.isGroup;
    const validNumber: any = await CheckContactNumber(
      contactData.number,
      companyId,
      isGroup
    );
    const number = validNumber.jid.split("@")[0];
    contactData.number = number;
    contactData.remoteJid = validNumber.jid;
  }

  const contact = await UpdateContactService({
    contactData,
    contactId,
    companyId
  });

  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-contact`, {
    action: "update",
    contact
  });

  return res.status(200).json(contact);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const contact = await ShowContactService(contactId, companyId);

  return res.status(200).json(contact);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  await ShowContactService(contactId, companyId);

  await DeleteContactService(contactId);

  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-contact`, {
    action: "delete",
    contactId
  });

  return res.status(200).json({ message: "Contact deleted" });
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { name } = req.query as unknown as SearchContactParams;
  const { companyId, id: userId } = req.user;

  const contacts = await SimpleListService({
    name,
    companyId,
    userId: Number(userId)
  });

  return res.json(contacts);
};

export const toggleAcceptAudio = async (
  req: Request,
  res: Response
): Promise<Response> => {
  var { contactId } = req.params;
  const { companyId } = req.user;
  const contact = await ToggleAcceptAudioContactService({ contactId });

  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-contact`, {
    action: "update",
    contact
  });

  return res.status(200).json(contact);
};

export const blockUnblock = async (
  req: Request,
  res: Response
): Promise<Response> => {
  var { contactId } = req.params;
  const { companyId } = req.user;
  const { active } = req.body;

  const contact = await BlockUnblockContactService({
    contactId,
    companyId,
    active
  });

  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-contact`, {
    action: "update",
    contact
  });

  return res.status(200).json(contact);
};

export const upload = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const file: Express.Multer.File = head(files) as Express.Multer.File;
  const { companyId } = req.user;

  const response = await ImportContactsService(companyId, file);

  const io = getIO();

  io.of(String(companyId)).emit(`company-${companyId}-contact`, {
    action: "reload",
    records: response
  });

  return res.status(200).json(response);
};

export const getContactProfileURL = async (req: Request, res: Response) => {
  const { number } = req.params;
  const { companyId } = req.user;

  if (number) {
    const validNumber: any = await CheckContactNumber(number, companyId);
    let profilePicUrl = "";
    try {
      profilePicUrl = await GetProfilePicUrl(validNumber.jid, companyId);
    } catch (error) {
      profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
    }

    const contact = await NumberSimpleListService({
      number: validNumber.jid.split("@")[0],
      companyId: companyId
    });

    let obj: any;
    if (contact.length > 0) {
      obj = {
        contactId: contact[0].id,
        profilePicUrl: profilePicUrl
      };
    } else {
      obj = {
        contactId: 0,
        profilePicUrl: profilePicUrl
      };
    }
    return res.status(200).json(obj);
  }
};

export const getContactVcard = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name, number } = req.query as IndexGetContactQuery;
  const { companyId } = req.user;

  let vNumber = number;
  const numberDDI = vNumber.toString().substr(0, 2);
  const numberDDD = vNumber.toString().substr(2, 2);
  const numberUser = vNumber.toString().substr(-8, 8);

  if (numberDDD <= "30" && numberDDI === "55") {
    console.log("menor 30");
    vNumber = `${numberDDI + numberDDD + 9 + numberUser}@s.whatsapp.net`;
  } else if (numberDDD > "30" && numberDDI === "55") {
    console.log("maior 30");
    vNumber = `${numberDDI + numberDDD + numberUser}@s.whatsapp.net`;
  } else {
    vNumber = `${number}@s.whatsapp.net`;
  }

  const contact = await GetContactService({
    name,
    number,
    companyId
  });

  return res.status(200).json(contact);
};

export const getContactTags = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;

  const contactTags = await FindContactTags({ contactId });

  let tags = false;

  if (contactTags.length > 0) {
    tags = true;
  }

  return res.status(200).json({ tags: tags });
};

export const toggleDisableBot = async (
  req: Request,
  res: Response
): Promise<Response> => {
  var { contactId } = req.params;
  const { companyId } = req.user;
  const contact = await ToggleDisableBotContactService({ contactId });

  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-contact`, {
    action: "update",
    contact
  });

  return res.status(200).json(contact);
};

export const updateContactWallet = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { wallets } = req.body;
  const { contactId } = req.params;
  const { companyId } = req.user;

  const userId = wallets.userId;
  const queueId = wallets.queueId;

  const contact = await UpdateContactWalletsService({
    userId,
    queueId,
    contactId,
    companyId
  });

  return res.status(200).json(contact);
};

export const deleteContactWallet = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const contact = await DeleteContactWalletService({
    contactId,
    companyId
  });

  return res.status(200).json(contact);
};

export const listWhatsapp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { name } = req.query as unknown as SearchContactParams;
  const { companyId } = req.user;

  const contactsAll = await SimpleListService({ name, companyId });

  const contacts = contactsAll.filter(contact => contact.channel == "whatsapp");

  return res.json(contacts);
};

export const listWallets = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { searchParam, pageNumber, userId } = req.query as any;
  const { companyId } = req.user;

  const wallets = await ListWalletsService({
    searchParam,
    pageNumber,
    userId,
    companyId
  });

  return res.json(wallets);
};

export const getContactMedia = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  const media = await GetContactMediaService({
    contactId: Number(contactId),
    companyId
  });

  return res.status(200).json(media);
};

export const getGroupParticipants = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { companyId } = req.user;

  try {
    const participants = await GetGroupParticipantsService({
      contactId: Number(contactId),
      companyId
    });

    return res.status(200).json(participants);
  } catch (error) {
    logger.error("Erro ao buscar participantes do grupo:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message
    });
  }
};

export const searchMessages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId } = req.params;
  const { searchParam, pageNumber } = req.query as {
    searchParam: string;
    pageNumber?: string;
  };
  const { companyId } = req.user;

  if (!searchParam || searchParam.trim().length < 2) {
    return res.status(400).json({
      error: "Parâmetro de busca deve ter pelo menos 2 caracteres"
    });
  }

  try {
    const { messages, count, hasMore } = await SearchContactMessagesService({
      contactId: Number(contactId),
      companyId,
      searchParam: searchParam.trim(),
      pageNumber
    });

    return res.status(200).json({
      messages,
      count,
      hasMore
    });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
};

export const bulkDelete = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Schema de validação para exclusão múltipla
  const bulkDeleteSchema = Yup.object().shape({
    contactIds: Yup.array()
      .of(idSchema.required("Contact ID is required"))
      .min(1, "At least one contact ID is required")
      .max(100, "Maximum 100 contacts can be deleted at once")
      .required("Contact IDs array is required")
  });

  try {
    const { contactIds } = await bulkDeleteSchema.validate(req.body);
    const { companyId } = req.user;

    // Sanitizar e validar IDs
    const sanitizedIds = contactIds.map(id => sanitizeNumber(id)).filter(id => id > 0);

    if (sanitizedIds.length === 0) {
      throw new AppError("No valid contact IDs provided", 400);
    }

    const deletedCount = await BulkDeleteContactsService({
      contactIds: sanitizedIds,
      companyId
    });

    const io = getIO();
    io.of(String(companyId)).emit(`company-${companyId}-contact`, {
      action: "bulk-delete",
      contactIds: sanitizedIds,
      deletedCount
    });

    return res.status(200).json({
      message: `${deletedCount} contacts deleted successfully`,
      deletedCount,
      contactIds: sanitizedIds
    });
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      throw new AppError(`Validation error: ${err.message}`, 400);
    }
    throw err;
  }
};

export const deleteAll = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Schema de validação para confirmação
  const deleteAllSchema = Yup.object().shape({
    confirmation: Yup.string()
      .required("Confirmation is required")
      .matches(/^DELETE_ALL_CONTACTS$/, "Invalid confirmation string"),
    excludeIds: Yup.array()
      .of(idSchema)
      .nullable()
  });

  try {
    const validatedData = await deleteAllSchema.validate(req.body);
    const { companyId } = req.user;
    const { excludeIds = [] } = validatedData;

    // Sanitizar IDs de exclusão
    const sanitizedExcludeIds = excludeIds.map(id => sanitizeNumber(id)).filter(id => id > 0);

    const deletedCount = await DeleteAllContactsService({
      companyId,
      excludeIds: sanitizedExcludeIds
    });

    const io = getIO();
    io.of(String(companyId)).emit(`company-${companyId}-contact`, {
      action: "delete-all",
      deletedCount,
      excludeIds: sanitizedExcludeIds
    });

    return res.status(200).json({
      message: `${deletedCount} contacts deleted successfully`,
      deletedCount
    });
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      throw new AppError(`Validation error: ${err.message}`, 400);
    }
    throw err;
  }
};
