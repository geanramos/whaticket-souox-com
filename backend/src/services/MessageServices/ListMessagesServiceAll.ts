import { FindOptions } from "sequelize/types";
import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import ShowTicketService from "../TicketServices/ShowTicketService";
import Queue from "../../models/Queue";

import { Sequelize } from "sequelize-typescript";
import { QueryTypes } from "sequelize";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dbConfig = require("../../config/database");
const sequelize = new Sequelize(dbConfig);

interface Request {
  companyId: number;
  fromMe: boolean;
  dateStart: string;
  dateEnd: string;
}

interface Response {
  count: number;
}

const ListMessagesServiceAll = async ({
  companyId,
  fromMe,
  dateStart,
  dateEnd
}: Request): Promise<Response> => {

  let ticketsCounter: any;
  const queryParams: any = { companyId };

  let query = `SELECT COUNT(1) FROM "Messages" m WHERE "companyId" = :companyId`;

  if (fromMe) {
    query += ` AND "fromMe" = :fromMe`;
    queryParams.fromMe = fromMe;
  }

  if (dateStart && dateEnd) {
    query += ` AND "createdAt" BETWEEN :dateStart AND :dateEnd`;
    queryParams.dateStart = `${dateStart} 00:00:00`;
    queryParams.dateEnd = `${dateEnd} 23:59:59`;
  }

  ticketsCounter = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: queryParams
  });

  return {
    count: ticketsCounter,
  };
};

export default ListMessagesServiceAll;
