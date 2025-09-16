import { GroupMetadata, GroupParticipant } from "@whiskeysockets/baileys";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";

interface GroupParticipantResponse {
  id: string;
  name: string;
  number: string;
  profilePicUrl: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

interface GetGroupParticipantsRequest {
  contactId: number;
  companyId: number;
}

const GetGroupParticipantsService = async ({
  contactId,
  companyId
}: GetGroupParticipantsRequest): Promise<GroupParticipantResponse[]> => {
  console.log(`[GetGroupParticipantsService] Starting service for contactId: ${contactId}, companyId: ${companyId}`);

  // Buscar o contato do grupo incluindo o whatsapp
  console.log(`[GetGroupParticipantsService] Looking for contact with ID: ${contactId} and companyId: ${companyId}`);
  const contact = await Contact.findOne({
    where: {
      id: contactId,
      companyId,
      isGroup: true
    },
    include: [
      {
        model: Whatsapp,
        as: "whatsapp"
      }
    ]
  });

  if (!contact) {
    console.error(`[GetGroupParticipantsService] ERROR: Group contact not found for contactId: ${contactId}`);
    throw new AppError("Grupo não encontrado", 404);
  }

  if (!contact.isGroup) {
    console.error(`[GetGroupParticipantsService] ERROR: Contact is not a group. contactId: ${contactId}, isGroup: ${contact.isGroup}`);
    throw new AppError("Este contato não é um grupo", 400);
  }
 let remoteJid = contact.remoteJid;
  if (!remoteJid && contact.number) {
    console.log(`[GetGroupParticipantsService] Generating remoteJid from contact.number: ${contact.number}`);
    remoteJid = contact.number.includes('@g.us') ? contact.number : `${contact.number}@g.us`;
    console.log(`[GetGroupParticipantsService] Generated remoteJid: ${remoteJid}`);
  }

  if (!remoteJid) {
    console.error(`[GetGroupParticipantsService] ERROR: No remoteJid or valid number found for group contact`);
    throw new AppError("Identificador do grupo não encontrado", 400);
  }

  // Obter o wbot - usar o whatsapp do contato ou o padrão da empresa
  let wbot;
  try {
    if (contact.whatsappId) {
      console.log(`[GetGroupParticipantsService] Getting wbot for whatsappId: ${contact.whatsappId}`);
      wbot = getWbot(contact.whatsappId);
    } else {
      console.log(`[GetGroupParticipantsService] No whatsappId on contact, getting default whatsapp for companyId: ${companyId}`);
      const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
      console.log(`[GetGroupParticipantsService] Got default whatsapp: ${defaultWhatsapp.id}`);
      wbot = getWbot(defaultWhatsapp.id);
    }
    console.log(`[GetGroupParticipantsService] Successfully obtained wbot instance`);
  } catch (error) {
    console.error(`[GetGroupParticipantsService] ERROR getting wbot: ${error.message}`, error.stack);
    throw new AppError("WhatsApp não encontrado ou desconectado", 500);
  }

  try {
    console.log(`[GetGroupParticipantsService] Fetching group metadata for remoteJid: ${contact.remoteJid}`);
    
    // Buscar metadados do grupo
    const groupMetadata: GroupMetadata = await wbot.groupMetadata(remoteJid);
    
    if (!groupMetadata) {
      console.error(`[GetGroupParticipantsService] ERROR: GroupMetadata not found for remoteJid: ${contact.remoteJid}`);
      return [];
    }

    if (!groupMetadata.participants || groupMetadata.participants.length === 0) {
      console.log(`[GetGroupParticipantsService] No participants found in group metadata for remoteJid: ${contact.remoteJid}`);
      return [];
    }

    console.log(`[GetGroupParticipantsService] Found ${groupMetadata.participants.length} participants in group`);

    // Processar cada participante
    const participantsPromises = groupMetadata.participants.map(async (participant: GroupParticipant) => {
      console.log(`[GetGroupParticipantsService] Processing participant: ${participant.id}`);
      
      let participantName = participant.id;
      let profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
      
      try {
        console.log(`[GetGroupParticipantsService] Trying to get profile picture for participant: ${participant.id}`);
        // Buscar foto de perfil do participante (comentado para debug)
        // profilePicUrl = await wbot.profilePictureUrl(participant.id, "image");
        console.log(`[GetGroupParticipantsService] Got profile picture URL: ${profilePicUrl}`);
      } catch (error) {
        // Usar imagem padrão se não conseguir obter a foto
        console.log(`[GetGroupParticipantsService] Error getting profile picture for ${participant.id}: ${error.message}`);
        profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
      }

      // Extrair número do participante
      const number = participant.id.replace(/\D/g, "");
      console.log(`[GetGroupParticipantsService] Extracted number: ${number} from participant ID: ${participant.id}`);

      try {
        console.log(`[GetGroupParticipantsService] Checking if participant ${number} exists as contact in company ${companyId}`);
        // Verificar se o participante já existe como contato na empresa
        const existingContact = await Contact.findOne({
          where: {
            number,
            companyId
          }
        });

        // Usar nome do contato existente ou número como nome
        if (existingContact && existingContact.name && existingContact.name !== number) {
          participantName = existingContact.name;
          console.log(`[GetGroupParticipantsService] Using existing contact name: ${participantName} for number: ${number}`);
        } else {
          participantName = number;
          console.log(`[GetGroupParticipantsService] Using number as name for participant: ${number}`);
        }
      } catch (error) {
        console.error(`[GetGroupParticipantsService] Error checking existing contact for ${number}: ${error.message}`);
        participantName = number;
      }

      const participantData = {
        id: participant.id,
        name: participantName,
        number,
        profilePicUrl,
        isAdmin: participant.admin === "admin",
        isSuperAdmin: participant.admin === "superadmin"
      };

      console.log(`[GetGroupParticipantsService] Processed participant data: ${JSON.stringify(participantData)}`);
      return participantData;
    });

    console.log(`[GetGroupParticipantsService] Awaiting all participant promises`);
    const participants = await Promise.all(participantsPromises);

    // Ordenar participantes: super admins primeiro, depois admins, depois membros normais
    console.log(`[GetGroupParticipantsService] Sorting participants`);
    participants.sort((a, b) => {
      if (a.isSuperAdmin && !b.isSuperAdmin) return -1;
      if (!a.isSuperAdmin && b.isSuperAdmin) return 1;
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return a.name.localeCompare(b.name);
    });

    console.log(`[GetGroupParticipantsService] Successfully processed ${participants.length} participants`);
    return participants;

  } catch (error) {
    console.error(`[GetGroupParticipantsService] ERROR in main try-catch: ${error.message}`, error.stack);
    
    // Verificar se o erro é relacionado ao grupo não existir mais
    if (error.message?.includes("not_found") || error.message?.includes("item-not-found")) {
      console.error(`[GetGroupParticipantsService] Group not found on WhatsApp: ${contact.remoteJid}`);
      throw new AppError("Grupo não encontrado no WhatsApp", 404);
    }
    
    // Verificar se o erro é de conexão
    if (error.message?.includes("Connection Closed") || error.message?.includes("not_connected")) {
      console.error(`[GetGroupParticipantsService] WhatsApp connection error: ${error.message}`);
      throw new AppError("WhatsApp desconectado", 503);
    }
    
    console.error(`[GetGroupParticipantsService] Unexpected error: ${error.message}`);
    throw new AppError(`Erro ao buscar participantes do grupo: ${error.message}`, 500);
  }
};

export default GetGroupParticipantsService;