import { fn, where, Op, col } from "sequelize";
import Files from "../../models/Files";

interface Request {
  companyId: number;
  searchParam?: string;
  pageNumber?: string | number;
}

interface Response {
  files: Files[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  searchParam,
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  let whereCondition = {};
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  if (searchParam) {
    const sanitizedSearchParam = searchParam.replace(/[^\w\s]/g, '').toLowerCase();
    whereCondition = {
      [Op.or]: [{
        body: where(
          fn("LOWER", fn('unaccent', col("name"))),
          "LIKE",
          `%${sanitizedSearchParam}%`
        ),
      }]
    };
  }
  const { count, rows: files } = await Files.findAndCountAll({
    where: { companyId, ...whereCondition },
    limit,
    offset,
    order: [["name", "ASC"]]
  });

  const hasMore = count > offset + files.length;

  return {
    files,
    count,
    hasMore
  };
};

export default ListService;
