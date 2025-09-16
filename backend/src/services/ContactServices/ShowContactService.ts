import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import ContactWallet from "../../models/ContactWallet";
import Queue from "../../models/Queue";
import User from "../../models/User";

const ShowContactService = async (
  id: string | number,
  companyId: number
): Promise<Contact> => {
  const contact = await Contact.findByPk(id, {
    include: ["extraInfo", "tags",
      {
        association: "wallets",
        attributes: ["id", "name"]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name", "expiresTicket", "groupAsTicket", "color"]
      },
      {
        model: ContactWallet,
        include: [
          {
            model: User,
            attributes: ["id", "name"]
          },
          {
            model: Queue,
            attributes: ["id", "name"]
          }
        ]
      },
    ]
  });

  if (contact?.companyId !== companyId) {
    throw new AppError("Não é possível excluir registro de outra empresa");
  }

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  return contact;
};

export default ShowContactService;
