import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { sendText } from "./graphAPI";
import formatBody from "../../helpers/Mustache";
import Whatsapp from "../../models/Whatsapp";
import { Op } from "sequelize";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
}

interface RequestWithoutTicket {
  body: string;
  number: string;
  whatsapp: Whatsapp;
}

const sendFacebookMessage = async ({ body, ticket, quotedMsg }: Request): Promise<any> => {
  const { number } = ticket.contact;
  try {
    const lastMessage = await Message.findOne({
      where: {
        ticketId: { [Op.lte]: ticket.id },
        companyId: ticket.companyId,
        contactId: ticket.contactId,
        fromMe: false
      },
      order: [["createdAt", "DESC"]],
      limit: 1
    });
    // console.log("lastMessage", lastMessage)
    // console.log("channel", ticket.channel)
    // console.log("lastMessage?.createdAt", lastMessage?.createdAt)
    // console.log("new Date(Date.now() - 1000 * 60 * 5)", new Date(Date.now() - 1000 * 60 * 5))
    const twentyFourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
    let tag = null;

    if (!lastMessage || lastMessage.createdAt < twentyFourHoursAgo) {
      if (ticket.channel !== "instagram") {
        tag = "ACCOUNT_UPDATE";
      }
    }

    console.log("tag", tag)
    const send = await sendText(
      number,
      formatBody(body, ticket),
      ticket.whatsapp.facebookUserToken,
      tag
    );

    await ticket.update({ lastMessage: body, fromMe: true });

    return send;

  } catch (err) {
    console.log(err)
    throw new AppError("ERR_SENDING_FACEBOOK_MSG");
  }
};

const sendFacebookMessageWithoutTicket = async ({ body, number, whatsapp }: RequestWithoutTicket): Promise<any> => {
  const { facebookUserToken } = whatsapp;
  try {

    const send = await sendText(
      number,
      body,
      facebookUserToken,
      null
    );

    return send;

  } catch (err) {
    console.log(err)
    throw new AppError("ERR_SENDING_FACEBOOK_MSG");
  }
};

export { sendFacebookMessage, sendFacebookMessageWithoutTicket };
