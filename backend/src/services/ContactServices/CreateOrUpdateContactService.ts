// src/services/ContactServices/CreateOrUpdateContactService.ts - CORRIGIDO
import { getIO } from "../../libs/socket";
import CompaniesSettings from "../../models/CompaniesSettings";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import fs from "fs";
import path, { join } from "path";
import logger from "../../utils/logger";
import { isNil } from "lodash";
import Whatsapp from "../../models/Whatsapp";
import * as Sentry from "@sentry/node";
import { ENABLE_LID_DEBUG } from "../../config/debug";
import { normalizeJid } from "../../utils";
const axios = require("axios");

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  birthDate?: Date | string; // 🎂 NOVO CAMPO ADICIONADO
  profilePicUrl?: string;
  companyId: number;
  channel?: string;
  extraInfo?: ExtraInfo[];
  remoteJid?: string;
  lid?: string;
  whatsappId?: number;
  wbot?: any;
  fromMe?: boolean;
}

interface ContactData {
  name?: string;
  number?: string;
  isGroup?: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId?: number;
  extraInfo?: ExtraInfo[];
  channel?: string;
  disableBot?: boolean;
  language?: string;
}

export const updateContact = async (
  contact: Contact,
  contactData: ContactData
) => {
  await contact.update(contactData);

  const io = getIO();
  io.to(`company-${contact.companyId}-mainchannel`).emit(
    `company-${contact.companyId}-contact`,
    {
      action: "update",
      contact
    }
  );
  return contact;
};

const CreateOrUpdateContactService = async ({
  name,
  number,
  // number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  birthDate = null, // 🎂 INCLUIR NO DESTRUCTURING
  channel = "whatsapp",
  companyId,
  extraInfo = [],
  remoteJid = "",
  lid = "",
  whatsappId,
  wbot,
  fromMe = false
}: Request): Promise<Contact> => {

  // console.log('number', number)
  // console.log('remoteJid', remoteJid)
  // console.log('isGroup', isGroup)
  // console.log('number', number)
  
  try {
    // Monta um remoteJid padrão quando não for informado
    const fallbackRemoteJid = normalizeJid(
      remoteJid || (isGroup ? `${number}@g.us` : `${number}@s.whatsapp.net`)
    );
    let createContact = false;
    const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
    // const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");
    if (!isGroup && !/^\d{10,15}$/.test(number)) {
      null;
    }
    const io = getIO();
    let contact: Contact | null;

    if (ENABLE_LID_DEBUG) {
      logger.info(
        `[LID-DEBUG] Buscando contato: number=${number}, companyId=${companyId}, lid=${lid}`
      );
    }
    if (lid) {
      contact = await Contact.findOne({ where: { lid, companyId } });
    }
    if (!contact) {
      contact = await Contact.findOne({ where: { number, companyId } });
    }

    let updateImage =
      ((!contact ||
        (contact?.profilePicUrl !== profilePicUrl && profilePicUrl !== "")) &&
        (wbot || ["instagram", "facebook"].includes(channel))) ||
      false;

    if (contact) {
      // if (ENABLE_LID_DEBUG) {
      //   logger.info(
      //     `[LID-DEBUG] Contato encontrado: id=${contact.id}, number=${contact.number}, jid=${contact.remoteJid}, lid=${contact.lid}`
      //   );
      // }
      contact.remoteJid = fallbackRemoteJid;
      if (ENABLE_LID_DEBUG) {
        logger.info(`[LID-DEBUG] fromMe recebido: ${fromMe}`);
      }
      if (fromMe === false && (!lid || lid === "")) {
        if (contact.lid) {
          if (ENABLE_LID_DEBUG) {
            logger.info(
              `[LID-DEBUG] Removendo LID do contato pois mensagem recebida não tem LID`
            );
          }
          contact.lid = null;
        }
      }
      if (lid && lid !== "" && contact.lid !== lid && fromMe === false) {
        if (ENABLE_LID_DEBUG) {
          logger.info(
            `[LID-DEBUG] Atualizando lid do contato: de='${contact.lid}' para='${lid}'`
          );
        }
        contact.lid = lid;
      }
      contact.profilePicUrl = profilePicUrl || null;
      contact.isGroup = isGroup;

      // 🎂 ATUALIZAR DATA DE NASCIMENTO SE FORNECIDA
      if (birthDate !== null && birthDate !== undefined) {
        let processedBirthDate: Date | null = null;
        if (typeof birthDate === "string") {
          processedBirthDate = new Date(birthDate);
          // Validar se a data é válida
          if (!isNaN(processedBirthDate.getTime())) {
            contact.birthDate = processedBirthDate;
          }
        } else {
          contact.birthDate = birthDate;
        }
      }

      if (isNil(contact.whatsappId) && !isNil(whatsappId)) {
        const whatsapp = await Whatsapp.findOne({
          where: { id: whatsappId, companyId }
        });

        if (whatsapp) {
          contact.whatsappId = whatsappId;
        }
      }

      const folder = path.resolve(
        publicFolder,
        `company${companyId}`,
        "contacts"
      );

      let fileName,
        oldPath = "";
      if (contact.urlPicture) {
        oldPath = path.resolve(contact.urlPicture.replace(/\\/g, "/"));
        fileName = path.join(folder, oldPath.split("\\").pop());
      }
      if (
        !fs.existsSync(fileName) ||
        (contact.profilePicUrl === "" && channel === "whatsapp")
      ) {
        try {
          const targetJid = contact.remoteJid || fallbackRemoteJid;
          profilePicUrl = await wbot.profilePictureUrl(targetJid, "image");
        } catch (e) {
          profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
        }
        contact.profilePicUrl = profilePicUrl;
        updateImage = true;
      }

      if (contact.name === number) {
        contact.name = name;
      }

      await contact.save(); // Ensure save() is called to trigger updatedAt
      await contact.reload();
      // if (ENABLE_LID_DEBUG) {
      //   logger.info(
      //     `[LID-DEBUG] Contato atualizado: id=${contact.id}, number=${contact.number}, jid=${contact.remoteJid}, lid=${contact.lid}`
      //   );
      // }
    } else if (["whatsapp"].includes(channel)) {
      const settings = await CompaniesSettings.findOne({
        where: { companyId }
      });
      const acceptAudioMessageContact = settings?.acceptAudioMessageContact;
      const newRemoteJid = fallbackRemoteJid;

      // if (!remoteJid && remoteJid !== "") {
      //   newRemoteJid = isGroup
      //     ? `${rawNumber}@g.us`
      //     : `${rawNumber}@s.whatsapp.net`;
      // }

      if (ENABLE_LID_DEBUG) {
        logger.info(
          `[LID-DEBUG] Criando novo contato: number=${number}, jid=${newRemoteJid}, lid=${lid}`
        );
      }
      if (wbot) {
        try {
          profilePicUrl = await wbot.profilePictureUrl(newRemoteJid, "image");
        } catch (e) {
          profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
        }
      } else {
        profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
      }

      // 🎂 PROCESSAR DATA DE NASCIMENTO PARA NOVO CONTATO
      let processedBirthDate: Date | null = null;
      if (birthDate) {
        if (typeof birthDate === "string") {
          processedBirthDate = new Date(birthDate);
          // Validar se a data é válida
          if (isNaN(processedBirthDate.getTime())) {
            processedBirthDate = null;
          }
        } else {
          processedBirthDate = birthDate;
        }
      }

      contact = await Contact.create({
        name,
        number,
        email,
        birthDate: processedBirthDate, // 🎂 INCLUIR NO CREATE
        isGroup,
        companyId,
        channel,
        acceptAudioMessage:
          acceptAudioMessageContact === "enabled" ? true : false,
        remoteJid: normalizeJid(newRemoteJid),
        lid: lid || null, // Inclui o lid na criação
        profilePicUrl,
        urlPicture: "",
        whatsappId
      });
      if (ENABLE_LID_DEBUG) {
        logger.info(
          `[LID-DEBUG] Novo contato criado: id=${contact.id}, number=${contact.number}, jid=${contact.remoteJid}, lid=${contact.lid}`
        );
      }
      createContact = true;
    } else if (["facebook", "instagram"].includes(channel)) {
      // 🎂 PROCESSAR DATA DE NASCIMENTO PARA REDES SOCIAIS
      let processedBirthDate: Date | null = null;
      if (birthDate) {
        if (typeof birthDate === "string") {
          processedBirthDate = new Date(birthDate);
          // Validar se a data é válida
          if (isNaN(processedBirthDate.getTime())) {
            processedBirthDate = null;
          }
        } else {
          processedBirthDate = birthDate;
        }
      }

      contact = await Contact.create({
        name,
        number,
        email,
        birthDate: processedBirthDate, // 🎂 INCLUIR NO CREATE
        isGroup,
        companyId,
        channel,
        profilePicUrl,
        urlPicture: "",
        whatsappId
      });
    }

    // Se ainda não temos contato aqui, não prossiga para evitar null reference
    if (!contact) {
      throw new Error(
        "Não foi possível criar ou localizar o contato. Informe o número/canal corretamente."
      );
    }

    if (updateImage) {
      const folder = path.resolve(
        publicFolder,
        `company${companyId}`,
        "contacts"
      );

      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        fs.chmodSync(folder, 0o777);
      }

      let filename;
      if (isNil(profilePicUrl) || profilePicUrl.includes("nopicture")) {
        filename = "nopicture.png";
      } else {
        filename = `${contact.id}.jpeg`;
        const filePath = join(folder, filename);

        // Verifica se o arquivo já existe e se o profilePicUrl não mudou
        if (fs.existsSync(filePath) && contact.urlPicture === filename) {
          // Arquivo já existe e é o mesmo, não precisa baixar novamente
          updateImage = false;
        } else {
          // Remove arquivo antigo se existir
          if (!isNil(contact.urlPicture) && contact.urlPicture !== filename) {
            const oldPath = path.resolve(
              contact.urlPicture.replace(/\\/g, "/")
            );
            const oldFileName = path.join(folder, oldPath.split("\\").pop());

            if (fs.existsSync(oldFileName)) {
              fs.unlinkSync(oldFileName);
            }
          }

          const response = await axios.get(profilePicUrl, {
            responseType: "arraybuffer"
          });

          // Save the image to the directory
          fs.writeFileSync(filePath, response.data);
        }
      }

      // Atualiza o contato apenas se a imagem mudou ou se não tinha urlPicture
      if (updateImage || isNil(contact.urlPicture)) {
        await contact.update({
          urlPicture: filename,
          pictureUpdated: true
        });

        await contact.reload();
      }
    }

    if (createContact) {
      io.of(String(companyId)).emit(`company-${companyId}-contact`, {
        action: "create",
        contact
      });
    } else {
      io.of(String(companyId)).emit(`company-${companyId}-contact`, {
        action: "update",
        contact
      });
    }

    if (ENABLE_LID_DEBUG) {
      logger.info(
        `[LID-DEBUG] Retornando contato: { jid: '${contact.remoteJid}', exists: true, lid: '${contact.lid}' }`
      );
    }
    return contact;
  } catch (err) {
    logger.error("Error to find or create a contact:", err);
    throw err;
  }
};

export default CreateOrUpdateContactService;
