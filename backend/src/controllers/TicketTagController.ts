import { Request, Response } from "express";
import AppError from "../errors/AppError";
import TicketTag from '../models/TicketTag';
import Tag from '../models/Tag'
import { getIO } from "../libs/socket";
import Ticket from "../models/Ticket";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import { isNil } from "lodash";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import { sendFacebookMessage } from "../services/FacebookServices/sendFacebookMessage";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId, tagId } = req.params;
  const { companyId } = req.user;

  try {
    const ticketTag = await TicketTag.create({ ticketId, tagId });

    if (ticketTag) {
      const nextTag = await Tag.findOne({ where: { id: tagId } });
      if (!isNil(nextTag.greetingMessageLane) && nextTag.greetingMessageLane !== "") {
        const ticketUpdate = await ShowTicketService(ticketId, companyId);
        const bodyMessage = ticketUpdate.user ? `*${ticketUpdate.user.name}:*\n${nextTag.greetingMessageLane}` : nextTag.greetingMessageLane;

        if (ticketUpdate.channel === "whatsapp") {
          await SendWhatsAppMessage({ body: bodyMessage, ticket: ticketUpdate });
        }

        if (["facebook", "instagram"].includes(ticketUpdate.channel)) {
          try {
            await sendFacebookMessage({ body: `\u200e ${bodyMessage}`, ticket: ticketUpdate});
          } catch (error) {
            console.log("error", error);
          }
        }
      }
    }

    const ticket = await ShowTicketService(ticketId, companyId);

    const io = getIO();
    io.of(String(companyId))
      // .to(ticket.status)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });

    return res.status(201).json(ticketTag);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to store ticket tag.' });
  }
};

/*
export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;

  console.log("remove");
  console.log(req.params);

  try {
    await TicketTag.destroy({ where: { ticketId } });
    return res.status(200).json({ message: 'Ticket tags removed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove ticket tags.' });
  }
};
*/
export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  //console.log("remove");
  //console.log(req.params);

  try {
    // Retrieve tagIds associated with the provided ticketId from TicketTags
    const ticketTags = await TicketTag.findAll({ where: { ticketId } });
    const tagIds = ticketTags.map((ticketTag) => ticketTag.tagId);

    // Find the tagIds with kanban = 1 in the Tags table
    const tagsWithKanbanOne = await Tag.findAll({
      where: {
        id: tagIds,
        kanban: 1,
      },
    });

    // Remove the tagIds with kanban = 1 from TicketTags
    const tagIdsWithKanbanOne = tagsWithKanbanOne.map((tag) => tag.id);
    if (tagIdsWithKanbanOne)
      await TicketTag.destroy({ where: { ticketId, tagId: tagIdsWithKanbanOne } });


    const ticket = await ShowTicketService(ticketId, companyId);

    const io = getIO();
    io.of(String(companyId))
      // .to(ticket.status)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });
    return res.status(200).json({ message: 'Ticket tags removed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove ticket tags.' });
  }
};