import { Op } from "sequelize";
import QuickMessage from "../../models/QuickMessage";
import Company from "../../models/Company";
import QuickMessageComponent from "../../models/QuickMessageComponent";
import ShowCompanyService from "../CompanyService/ShowCompanyService";

type Params = {
  companyId: string;
  userId: string;
  isOficial: string;
  whatsappId?: string;
};

const FindService = async ({ companyId, userId, isOficial, whatsappId }: Params): Promise<QuickMessage[]> => {
  const company = await ShowCompanyService(companyId);

  const useOficial = company.plan.useWhatsappOfficial;

  const notes: QuickMessage[] = await QuickMessage.findAll({
    where: {
      companyId,
      [Op.or]: [
        {
          visao: true // Se "visao" é verdadeiro, todas as mensagens são visíveis
        },
        {
          userId // Se "visao" é falso, apenas as mensagens do usuário atual são visíveis
        }
      ],
      // ...(useOficial && isOficial === "true" && whatsappId ? { whatsappId } : {}),
      isOficial: useOficial ?
        isOficial === "true" ? true : { [Op.or]: [true, false] }
        : false
    },
    include: [
      {
        model: Company,
        as: "company",
        attributes: ["id", "name"]
      },
      {
        model: QuickMessageComponent,
        as: "components",
        attributes: ["id", "type", "text", "quickMessageId", "buttons", "format", "example"],
        order: [["quickMessageId", "ASC"], ["id", "ASC"]]
      }
    ],
    // order: [["shortcode", "ASC"]]
  });

  return notes as QuickMessage[];
};

export default FindService;
