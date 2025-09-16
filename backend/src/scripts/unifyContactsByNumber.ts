import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import Message from "../models/Message";
import logger from "../utils/logger";

const unifyContactsByNumber = async (companyId?: number) => {
  try {
    logger.info("Iniciando unificação de contatos duplicados...");

    const whereCondition = companyId ? { companyId } : {};

    const contacts = await Contact.findAll({
      where: whereCondition,
      order: [
        ["number", "ASC"],
        ["createdAt", "ASC"]
      ]
    });

    const contactsByNumber = new Map<string, Contact[]>();

    contacts.forEach(contact => {
      if (!contactsByNumber.has(contact.number)) {
        contactsByNumber.set(contact.number, []);
      }
      contactsByNumber.get(contact.number)!.push(contact);
    });

    let unifiedCount = 0;
    let deletedCount = 0;

    for (const [number, contactList] of contactsByNumber) {
      if (contactList.length > 1) {
        logger.info(
          `Unificando ${contactList.length} contatos para o número ${number}`
        );

        let mainContact = contactList.find(c => !!c.lid) || contactList[0];
        const duplicateContacts = contactList.filter(
          c => c.id !== mainContact.id
        );

        if (!mainContact.lid) {
          const lidContact = contactList.find(c => !!c.lid);
          if (lidContact) {
            mainContact.lid = lidContact.lid;
            await mainContact.save();
            logger.info(
              `Atualizado LID do contato principal ${mainContact.id} para ${lidContact.lid}`
            );
          }
        }

        for (const duplicateContact of duplicateContacts) {
          const ticketsToUpdate = await Ticket.findAll({
            where: { contactId: duplicateContact.id }
          });

          for (const ticket of ticketsToUpdate) {
            await ticket.update({ contactId: mainContact.id });
            logger.info(
              `Ticket ${ticket.id} movido do contato ${duplicateContact.id} para ${mainContact.id}`
            );
          }

          const messagesToUpdate = await Message.findAll({
            where: { contactId: duplicateContact.id }
          });

          for (const message of messagesToUpdate) {
            await message.update({ contactId: mainContact.id });
          }

          await duplicateContact.destroy();
          deletedCount++;
        }

        unifiedCount++;
        logger.info(`Unificação concluída para o número ${number}`);
      }
    }

    logger.info(
      `Unificação concluída! ${unifiedCount} grupos unificados, ${deletedCount} contatos removidos`
    );
  } catch (error) {
    logger.error("Erro durante a unificação de contatos:", error);
    throw error;
  }
};

if (require.main === module) {
  const companyId = process.argv[2] ? parseInt(process.argv[2]) : undefined;

  unifyContactsByNumber(companyId)
    .then(() => {
      logger.info("Script de unificação executado com sucesso!");
      process.exit(0);
    })
    .catch(error => {
      logger.error("Erro ao executar script de unificação:", error);
      process.exit(1);
    });
}

export default unifyContactsByNumber;
