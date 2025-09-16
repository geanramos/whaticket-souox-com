import { Mutex } from "async-mutex";
import { Op } from "sequelize";
import Contact from "../../models/Contact";
import CreateOrUpdateContactService, {
  updateContact
} from "../ContactServices/CreateOrUpdateContactService";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import { proto, WASocket } from "@whiskeysockets/baileys";
import WhatsappLidMap from "../../models/WhatsapplidMap";
import GetProfilePicUrl from "./GetProfilePicUrl";

const lidUpdateMutex = new Mutex();

export type Session = WASocket & {
  id?: number;
  myJid?: string;
  myLid?: string;
  cacheMessage?: (msg: proto.IWebMessageInfo) => void;
  isRefreshing?: boolean;
};

interface IMe {
  name: string;
  id: string;
}

export async function checkAndDedup(
  contact: Contact,
  lid: string
): Promise<void> {
  const lidContact = await Contact.findOne({
    where: {
      companyId: contact.companyId,
      number: {
        [Op.or]: [lid, lid.substring(0, lid.indexOf("@"))]
      }
    }
  });

  if (!lidContact) {
    return;
  }

  await Message.update(
    { contactId: contact.id },
    {
      where: {
        contactId: lidContact.id,
        companyId: contact.companyId
      }
    }
  );

  const notClosedTickets = await Ticket.findAll({
    where: {
      contactId: lidContact.id,
      status: {
        [Op.not]: "closed"
      }
    }
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const ticket of notClosedTickets) {
    // eslint-disable-next-line no-await-in-loop
    await UpdateTicketService({
      ticketData: { status: "closed" },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
  }

  await Ticket.update(
    { contactId: contact.id },
    {
      where: {
        contactId: lidContact.id,
        companyId: contact.companyId
      }
    }
  );

  await lidContact.destroy();
}

export async function verifyContact(
  msgContact: IMe,
  wbot: Session,
  companyId: number
): Promise<Contact> {
  let profilePicUrl: string;
  
  // try {
  //   profilePicUrl = await wbot.profilePictureUrl(msgContact.id);
  // } catch (e) {
  //   profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
  // }

  const isLid = msgContact.id.includes("@lid");
  const isGroup = msgContact.id.includes("@g.us");

  const number = isLid
    ? msgContact.id
    : msgContact.id.substring(0, msgContact.id.indexOf("@"));

  const contactData = {
    name: msgContact?.name || msgContact.id.replace(/\D/g, ""),
    number,
    profilePicUrl,
    isGroup: msgContact.id.includes("g.us"),
    companyId
  };

  if (isGroup) {
    return CreateOrUpdateContactService(contactData);
  }

  return lidUpdateMutex.runExclusive(async () => {
    const foundContact = await Contact.findOne({
      where: {
        companyId,
        number
      },
      include: ["tags", "extraInfo", "whatsappLidMap"]
    });

    if (isLid) {
      if (foundContact) {
        return updateContact(foundContact, {
          profilePicUrl: contactData.profilePicUrl
        });
      }

      const foundMappedContact = await WhatsappLidMap.findOne({
        where: {
          companyId,
          lid: number
        },
        include: [
          {
            model: Contact,
            as: "contact",
            include: ["tags", "extraInfo"]
          }
        ]
      });

      if (foundMappedContact) {
        return updateContact(foundMappedContact.contact, {
          profilePicUrl: contactData.profilePicUrl
        });
      }

      const partialLidContact = await Contact.findOne({
        where: {
          companyId,
          number: number.substring(0, number.indexOf("@"))
        },
        include: ["tags", "extraInfo"]
      });

      if (partialLidContact) {
        return updateContact(partialLidContact, {
          number: contactData.number,
          profilePicUrl: contactData.profilePicUrl
        });
      }
    } else if (foundContact) {
      if (!foundContact.whatsappLidMap) {
        const ow = await wbot.onWhatsApp(msgContact.id);
        if (!ow?.[0]?.exists) {
          throw new Error("ERR_WAPP_CONTACT_NOT_FOUND");
        }
        const lid = ow?.[0]?.lid as string;
        if (lid) {
          await checkAndDedup(foundContact, lid);
          await WhatsappLidMap.create({
            companyId,
            lid,
            contactId: foundContact.id
          });
        }
      }
      return updateContact(foundContact, {
        profilePicUrl: contactData.profilePicUrl
      });
    } else if (!isGroup && !foundContact) {
      const ow = await wbot.onWhatsApp(msgContact.id);
      if (!ow?.[0]?.exists) {
        throw new Error("ERR_WAPP_CONTACT_NOT_FOUND");
      }
      const lid = ow?.[0]?.lid as string;

      if (lid) {
        const lidContact = await Contact.findOne({
          where: {
            companyId,
            number: {
              [Op.or]: [lid, lid.substring(0, lid.indexOf("@"))]
            }
          },
          include: ["tags", "extraInfo"]
        });

        if (lidContact) {
          await WhatsappLidMap.create({
            companyId,
            lid,
            contactId: lidContact.id
          });
          return updateContact(lidContact, {
            number: contactData.number,
            profilePicUrl: contactData.profilePicUrl
          });
        }
      }
    }

    return CreateOrUpdateContactService(contactData);
  });
}
