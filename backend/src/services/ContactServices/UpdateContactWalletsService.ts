import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactWallet from "../../models/ContactWallet";

interface Request {
  userId: number | string;
  queueId: number | string;
  contactId: string;
  companyId: string | number;
}

interface Wallet {
  walletId: number | string;
  queueId: number | string;
  contactId: number | string;
  companyId: number | string;
}

const UpdateContactWalletsService = async ({
  userId,
  queueId,
  contactId,
  companyId
}: Request): Promise<Contact> => {

  await ContactWallet.destroy({
    where: {
      companyId,
      contactId
    }
  });

  const contactWallets: Wallet[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactWallets.push({
    walletId: userId,
    queueId,
    contactId,
    companyId
  });

  await ContactWallet.bulkCreate(contactWallets);

  const contact = await Contact.findOne({
    where: { id: contactId, companyId },
    attributes: ["id", "name", "number", "email", "profilePicUrl", "urlPicture", "companyId"],
    include: [
      "extraInfo",
      "tags",
      {
        association: "wallets",
        attributes: ["id", "name"]
      }
    ]
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  return contact;
};

export default UpdateContactWalletsService;
