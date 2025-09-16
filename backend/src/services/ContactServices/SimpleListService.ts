import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { FindOptions, Op, Sequelize } from "sequelize";
import User from "../../models/User";
import FindCompanySettingsService from "../CompaniesSettings/FindCompanySettingsService";

export interface SearchContactParams {
  companyId: string | number;
  name?: string;
  userId?: number;
}

const SimpleListService = async ({ name, companyId, userId }: SearchContactParams): Promise<Contact[]> => {

  console.log("userId", userId);
  console.log("companyId", companyId);

  let options: FindOptions = {
    order: [
      ['name', 'ASC']
    ]
  }

  // Verificar configurações da empresa e perfil do usuário para regra de carteira
  const userProfile = userId ? await User.findOne({ where: { id: userId }, attributes: ["profile"] }) : null;
  const settings = await FindCompanySettingsService({ companyId: Number(companyId) });
  const DirectTicketsToWallets = settings.DirectTicketsToWallets;

  let whereCondition: any = { companyId };

  if (name) {
    whereCondition.name = {
      [Op.like]: `%${name}%`
    }
  }

  // Aplicar regra de carteira se o usuário tem perfil "user" e a configuração está ativa
  if (DirectTicketsToWallets && userProfile && userProfile.profile === "user" && userId) {
    whereCondition = {
      ...whereCondition,
      [Op.and]: [
        whereCondition,
        {
          id: {
            [Op.in]: Sequelize.literal(`(SELECT "contactId" FROM "ContactWallets" WHERE "walletId" = ${userId} AND "companyId" = ${companyId})`)
          }
        }
      ]
    };
  }

  options.where = whereCondition;

  const contacts = await Contact.findAll(options);

  if (!contacts) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  return contacts;
};

export default SimpleListService;
