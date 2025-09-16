import { Op } from "sequelize";
import ContactWallet from "../../models/ContactWallet";
import Contact from "../../models/Contact";
import User from "../../models/User";
import Queue from "../../models/Queue";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  userId?: string;
  companyId: number;
}

interface Response {
  wallets: any[];
  count: number;
  hasMore: boolean;
}

const ListWalletsService = async ({
  searchParam = "",
  pageNumber = "1",
  userId,
  companyId
}: Request): Promise<Response> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const whereCondition: any = {
    companyId
  };

  if (userId) {
    whereCondition.walletId = userId;
  }

  const { count, rows: wallets } = await ContactWallet.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: Contact,
        as: "contact",
        where: searchParam ? {
          [Op.or]: [
            { name: { [Op.like]: `%${searchParam}%` } },
            { number: { [Op.like]: `%${searchParam}%` } },
            { email: { [Op.like]: `%${searchParam}%` } }
          ]
        } : undefined,
        attributes: ["id", "name", "number", "email"]
      },
      {
        model: User,
        as: "wallet",
        attributes: ["id", "name"]
      },
      {
        model: Queue,
        as: "queue",
        attributes: ["id", "name"]
      }
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });

  const hasMore = count > offset + wallets.length;

  const formattedWallets = wallets.map(wallet => ({
    id: wallet.id,
    contactId: wallet.contactId,
    contactName: wallet.contact?.name,
    contactNumber: wallet.contact?.number,
    contactEmail: wallet.contact?.email,
    userId: wallet.walletId,
    userName: wallet.wallet?.name,
    queueId: wallet.queueId,
    queueName: wallet.queue?.name,
    createdAt: wallet.createdAt
  }));

  return {
    wallets: formattedWallets,
    count,
    hasMore
  };
};

export default ListWalletsService; 