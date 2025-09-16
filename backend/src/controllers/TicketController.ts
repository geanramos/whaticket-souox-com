import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import Ticket from "../models/Ticket";
import { FlowBuilderModel } from "../models/FlowBuilder";
import Contact from "../models/Contact";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";
import CreateTicketService from "../services/TicketServices/CreateTicketService";
import DeleteTicketService from "../services/TicketServices/DeleteTicketService";
import ListTicketsService from "../services/TicketServices/ListTicketsService";
import ShowTicketUUIDService from "../services/TicketServices/ShowTicketFromUUIDService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import ListTicketsServiceKanban from "../services/TicketServices/ListTicketsServiceKanban";
import TriggerFlowService from "../services/TicketServices/TriggerFlowService";
import CreateLogTicketService from "../services/TicketServices/CreateLogTicketService";
import ShowLogTicketService from "../services/TicketServices/ShowLogTicketService";
import FindOrCreateATicketTrakingService from "../services/TicketServices/FindOrCreateATicketTrakingService";
import ListTicketsServiceReport from "../services/TicketServices/ListTicketsServiceReport";
import RelatorioVendasService from "../services/ReportService/RelatorioVendasService";
import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { Mutex } from "async-mutex";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  status: string;
  date?: string;
  dateStart?: string;
  dateEnd?: string;
  updatedAt?: string;
  showAll: string;
  withUnreadMessages?: string;
  queueIds?: string;
  tags?: string;
  users?: string;
  whatsapps: string;
  statusFilter: string;
  isGroup?: string;
  sortTickets?: string;
  searchOnMessages?: string;
};

type IndexQueryReport = {
  searchParam: string;
  contactId: string;
  whatsappId: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  queueIds: string;
  tags: string;
  users: string;
  page: string;
  pageSize: string;
  onlyRated: string;
};

interface TicketData {
  contactId: number;
  status: string;
  queueId: number;
  userId: number;
  sendFarewellMessage?: boolean;
  whatsappId?: string;
  valorVenda?: number;
  motivoNaoVenda?: string;
  motivoFinalizacao?: string;
  finalizadoComVenda?: boolean;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const {
    pageNumber,
    status,
    date,
    dateStart,
    dateEnd,
    updatedAt,
    searchParam,
    showAll,
    queueIds: queueIdsStringified,
    tags: tagIdsStringified,
    users: userIdsStringified,
    withUnreadMessages,
    whatsapps: whatsappIdsStringified,
    statusFilter: statusStringfied,
    sortTickets,
    searchOnMessages
  } = req.query as IndexQuery;

  const userId = Number(req.user.id);
  const { companyId } = req.user;

  let queueIds: number[] = [];
  let tagsIds: number[] = [];
  let usersIds: number[] = [];
  let whatsappIds: number[] = [];
  let statusFilters: string[] = [];

  if (queueIdsStringified) {
    queueIds = JSON.parse(queueIdsStringified);
  }

  if (tagIdsStringified) {
    tagsIds = JSON.parse(tagIdsStringified);
  }

  if (userIdsStringified) {
    usersIds = JSON.parse(userIdsStringified);
  }

  if (whatsappIdsStringified) {
    whatsappIds = JSON.parse(whatsappIdsStringified);
  }

  if (statusStringfied) {
    statusFilters = JSON.parse(statusStringfied);
  }

  const { tickets, count, hasMore } = await ListTicketsService({
    searchParam,
    tags: tagsIds,
    users: usersIds,
    pageNumber,
    status,
    date,
    dateStart,
    dateEnd,
    updatedAt,
    showAll,
    userId,
    queueIds,
    withUnreadMessages,
    whatsappIds,
    statusFilters,
    companyId,
    sortTickets,
    searchOnMessages
  });

  return res.status(200).json({ tickets, count, hasMore });
};

export const report = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    searchParam,
    contactId,
    whatsappId: whatsappIdsStringified,
    dateFrom,
    dateTo,
    status: statusStringified,
    queueIds: queueIdsStringified,
    tags: tagIdsStringified,
    users: userIdsStringified,
    page: pageNumber,
    pageSize,
    onlyRated
  } = req.query as IndexQueryReport;

  const userId = req.user.id;
  const { companyId } = req.user;

  let queueIds: number[] = [];
  let whatsappIds: string[] = [];
  let tagsIds: number[] = [];
  let usersIds: number[] = [];
  let statusIds: string[] = [];

  if (statusStringified) {
    statusIds = JSON.parse(statusStringified);
  }

  if (whatsappIdsStringified) {
    whatsappIds = JSON.parse(whatsappIdsStringified);
  }

  if (queueIdsStringified) {
    queueIds = JSON.parse(queueIdsStringified);
  }

  if (tagIdsStringified) {
    tagsIds = JSON.parse(tagIdsStringified);
  }

  if (userIdsStringified) {
    usersIds = JSON.parse(userIdsStringified);
  }

  const { tickets, totalTickets } = await ListTicketsServiceReport(
    companyId,
    {
      searchParam,
      queueIds,
      tags: tagsIds,
      users: usersIds,
      status: statusIds,
      dateFrom,
      dateTo,
      userId,
      contactId,
      whatsappId: whatsappIds,
      onlyRated: onlyRated
    },
    +pageNumber,

    +pageSize
  );

  return res.status(200).json({ tickets, totalTickets });
};

export const kanban = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    pageNumber,
    status,
    date,
    dateStart,
    dateEnd,
    updatedAt,
    searchParam,
    showAll,
    queueIds: queueIdsStringified,
    tags: tagIdsStringified,
    users: userIdsStringified,
    withUnreadMessages
  } = req.query as IndexQuery;

  const userId = req.user.id;
  const { companyId } = req.user;

  let queueIds: number[] = [];
  let tagsIds: number[] = [];
  let usersIds: number[] = [];

  if (queueIdsStringified) {
    queueIds = JSON.parse(queueIdsStringified);
  }

  if (tagIdsStringified) {
    tagsIds = JSON.parse(tagIdsStringified);
  }

  if (userIdsStringified) {
    usersIds = JSON.parse(userIdsStringified);
  }

  const { tickets, count, hasMore } = await ListTicketsServiceKanban({
    searchParam,
    tags: tagsIds,
    users: usersIds,
    pageNumber,
    status,
    date,
    dateStart,
    dateEnd,
    updatedAt,
    showAll,
    userId,
    queueIds,
    withUnreadMessages,
    companyId
  });

  return res.status(200).json({ tickets, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { contactId, status, userId, queueId, whatsappId }: TicketData =
    req.body;
  const { companyId } = req.user;

  const ticket = await CreateTicketService({
    contactId,
    status,
    userId,
    companyId,
    queueId,
    whatsappId
  });

  const io = getIO();
  io.of(String(companyId))
    // .to(ticket.status)
    .emit(`company-${companyId}-ticket`, {
      action: "update",
      ticket
    });

  return res.status(200).json(ticket);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { id: userId, companyId } = req.user;

  const contact = await ShowTicketService(ticketId, companyId);

  await CreateLogTicketService({
    userId,
    ticketId,
    type: "access"
  });

  return res.status(200).json(contact);
};

export const showLog = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { id: userId, companyId } = req.user;

  const log = await ShowLogTicketService({ ticketId, companyId });

  return res.status(200).json(log);
};

export const showFromUUID = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { uuid } = req.params;
  const { id: userId, companyId } = req.user;

  const ticket: Ticket = await ShowTicketUUIDService(uuid, companyId);

  if (
    ["whatsapp", "whatsapp_oficial"].includes(ticket.channel) &&
    ticket.whatsappId &&
    ticket.unreadMessages > 0
  ) {
    SetTicketMessagesAsRead(ticket);
  }

  await CreateLogTicketService({
    userId,
    ticketId: ticket.id,
    type: "access"
  });

  return res.status(200).json(ticket);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const ticketData: TicketData = req.body;
  const { companyId } = req.user;

  const mutex = new Mutex();
  const { ticket } = await mutex.runExclusive(async () => {
    const result = await UpdateTicketService({
      ticketData,
      ticketId,
      companyId
    });
    return result;
  });

  return res.status(200).json(ticket);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { id: userId, companyId } = req.user;

  // await ShowTicketService(ticketId, companyId);

  const ticket = await DeleteTicketService(ticketId, userId, companyId);

  const io = getIO();

  io.of(String(companyId))
    // .to(ticket.status)
    // .to(ticketId)
    // .to("notification")
    .emit(`company-${companyId}-ticket`, {
      action: "delete",
      ticketId: +ticketId
    });

  return res.status(200).json({ message: "ticket deleted" });
};

export const closeAll = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { status }: TicketData = req.body;
  const io = getIO();

  const { rows: tickets } = await Ticket.findAndCountAll({
    where: { companyId: companyId, status: status },
    order: [["updatedAt", "DESC"]]
  });

  tickets.forEach(async ticket => {
    const ticketData = {
      status: "closed",
      userId: ticket.userId || null,
      queueId: ticket.queueId || null,
      unreadMessages: 0,
      amountUsedBotQueues: 0,
      sendFarewellMessage: false
    };

    await UpdateTicketService({ ticketData, ticketId: ticket.id, companyId });
  });

  return res.status(200).json();
};

export const relatorioVendas = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { dateFrom, dateTo, userId } = req.query;
  const { companyId } = req.user;

  if (!dateFrom || !dateTo) {
    return res.status(400).json({
      error: "Data inicial e final são obrigatórias"
    });
  }

  try {
    const relatorio = await RelatorioVendasService({
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      userId: userId ? Number(userId) : undefined,
      companyId
    });

    return res.status(200).json(relatorio);
  } catch (error) {
    console.error("Erro ao gerar relatório de vendas:", error);
    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
};

export const transferTickets = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { sourceConnectionId, targetConnectionId } = req.body;
  const { companyId } = req.user;

  try {
    // Contar tickets para transferir
    const ticketCount = await Ticket.count({
      where: {
        whatsappId: sourceConnectionId,
        companyId,
        status: ["open", "pending"]
      }
    });

    if (ticketCount === 0) {
      return res.status(200).json({
        requiresProgress: false,
        transferred: 0,
        message: "Nenhum ticket encontrado para transferir"
      });
    }

    const PROGRESS_THRESHOLD = 50;
    const io = getIO();

    if (ticketCount <= PROGRESS_THRESHOLD) {
      // Transferência imediata
      const tickets = await Ticket.findAll({
        where: {
          whatsappId: sourceConnectionId,
          companyId,
          status: ["open", "pending"]
        }
      });

      let transferred = 0;
      for (const ticket of tickets) {
        try {
          await ticket.update({ whatsappId: targetConnectionId });
          transferred++;
        } catch (error) {
          console.error(`Error transferring ticket ${ticket.id}:`, error);
        }
      }

      return res.status(200).json({
        requiresProgress: false,
        transferred,
        message: "Tickets transferidos com sucesso"
      });
    } else {
      // Transferência em background
      const jobId = `transfer-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}`;

      // Processar em background
      setTimeout(async () => {
        const BATCH_SIZE = 50;
        let processed = 0;

        try {
          while (processed < ticketCount) {
            const tickets = await Ticket.findAll({
              where: {
                whatsappId: sourceConnectionId,
                companyId,
                status: ["open", "pending"]
              },
              limit: BATCH_SIZE,
              offset: processed
            });

            if (tickets.length === 0) break;

            for (const ticket of tickets) {
              try {
                await ticket.update({ whatsappId: targetConnectionId });
                processed++;
              } catch (error) {
                console.error(`Error transferring ticket ${ticket.id}:`, error);
              }
            }

            // Enviar progresso via WebSocket
            io.to(`company-${companyId}`).emit(`transferTickets-${companyId}`, {
              action: "progress",
              current: processed,
              total: ticketCount,
              jobId
            });

            // Pequena pausa para não sobrecarregar o banco
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Enviar conclusão
          io.to(`company-${companyId}`).emit(`transferTickets-${companyId}`, {
            action: "completed",
            transferred: processed,
            jobId
          });
        } catch (error) {
          console.error(`Error in transfer job ${jobId}:`, error);

          // Enviar erro via WebSocket
          io.to(`company-${companyId}`).emit(`transferTickets-${companyId}`, {
            action: "error",
            message: "Erro na transferência",
            jobId
          });
        }
      }, 0);

      return res.status(200).json({
        requiresProgress: true,
        totalTickets: ticketCount,
        jobId,
        message: "Transferência iniciada em background"
      });
    }
  } catch (error) {
    console.error("Error in transferTickets:", error);
    return res.status(500).json({
      message: "Erro interno do servidor"
    });
  }
};

export const triggerFlow = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { flowId } = req.body;
  const { companyId } = req.user;

  try {
    // Verificar se o ticket existe e está com status "open"
    const ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        companyId,
        status: "open"
      },
      include: [
        { model: Contact, as: "contact" },
        { model: User, as: "user" },
        { model: Whatsapp, as: "whatsapp" }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket não encontrado ou não está em atendimento"
      });
    }

    // Verificar se o usuário tem permissão para disparar fluxo no ticket
    if (ticket.userId !== parseInt(req.user.id)) {
      return res.status(403).json({
        error: "Você não tem permissão para disparar fluxo neste ticket"
      });
    }

    // Verificar se o fluxo existe
    const flow = await FlowBuilderModel.findOne({
      where: {
        id: flowId,
        company_id: companyId
      }
    });

    if (!flow) {
      return res.status(404).json({
        error: "Fluxo não encontrado"
      });
    }

    // Chamar o serviço para disparar o fluxo
    const result = await TriggerFlowService({
      ticketId: ticket.id,
      flowId: flow.id,
      companyId,
      userId: parseInt(req.user.id)
    });

    return res.status(200).json({
      success: true,
      message: "Fluxo disparado com sucesso",
      data: result
    });

  } catch (error) {
    console.error("Erro ao disparar fluxo no ticket:", error);
    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
};
