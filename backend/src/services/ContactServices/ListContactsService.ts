import { Sequelize, fn, col, where, Op, Filterable } from "sequelize";
import Contact from "../../models/Contact";
import ContactTag from "../../models/ContactTag";
import Tag from "../../models/Tag";
import ContactCustomField from "../../models/ContactCustomField";
import removeAccents from "remove-accents";
import { intersection } from "lodash";
import ContactWallet from "../../models/ContactWallet";
import User from "../../models/User";
import Queue from "../../models/Queue";
import FindCompanySettingsService from "../CompaniesSettings/FindCompanySettingsService";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
  tagsIds?: number[];
  isGroup?: string;
  userId?: number;
}

interface Response {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
}

const buildWhereCondition = async ({
  searchParam,
  companyId,
  tagsIds,
  isGroup,
  userId
}: Request): Promise<Filterable["where"]> => {

  const userProfile = await User.findOne({ where: { id: userId }, attributes: ["profile"] });

  const settings = await FindCompanySettingsService({
    companyId
  });

  const DirectTicketsToWallets = settings.DirectTicketsToWallets;

  let whereCondition: Filterable["where"] = { companyId };

  if (searchParam) {
    const sanitizedSearchParam = removeAccents(searchParam.toLocaleLowerCase().trim());
    whereCondition = {
      ...whereCondition,
      [Op.or]: [
        {
          name: where(
            fn("LOWER", fn("unaccent", col("Contact.name"))),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        { number: { [Op.like]: `%${sanitizedSearchParam}%` } }
      ]
    };
  }

  if (Array.isArray(tagsIds) && tagsIds.length > 0) {
    const contactTags = await ContactTag.findAll({
      where: { tagId: { [Op.in]: tagsIds } },
      attributes: ["contactId"]
    });

    const contactTagsIntersection = intersection(contactTags.map(t => t.contactId));
    
    whereCondition = {
      ...whereCondition,
      id: {
        [Op.in]: contactTagsIntersection
      }
    };
  }

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

  if (isGroup === "false") {
    whereCondition = {
      ...whereCondition,
      isGroup: false
    };
  }

  return whereCondition;
};

const ListContactsService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
  tagsIds,
  isGroup,
  userId
}: Request): Promise<Response> => {

  const whereCondition = await buildWhereCondition({
    searchParam,
    companyId,
    tagsIds,
    isGroup,
    userId
  });

  const limit = 100;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: contacts } = await Contact.findAndCountAll({
    where: whereCondition,
    attributes: [
      "id",
      "name",
      "number",
      "email",
      "birthDate",
      "isGroup",
      "urlPicture",
      "active",
      "companyId",
      "channel"
    ],
    limit,
    offset,
    include: [
      {
        model: Tag,
        as: "tags",
        attributes: ["id", "name"]
      },
      {
        model: ContactCustomField,
        as: "extraInfo"
      },
      {
        model: ContactWallet,
        as: "contactWallets",
        include: [
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
        ]
      }
    ],
    order: [["name", "ASC"]]
  });

  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count,
    hasMore
  };
};

export default ListContactsService;
