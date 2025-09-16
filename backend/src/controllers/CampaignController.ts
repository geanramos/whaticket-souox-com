import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";
import fs from "fs";
import path from "path";

import ListService from "../services/CampaignService/ListService";
import CreateService from "../services/CampaignService/CreateService";
import ShowService from "../services/CampaignService/ShowService";
import UpdateService from "../services/CampaignService/UpdateService";
import DeleteService from "../services/CampaignService/DeleteService";
import FindService from "../services/CampaignService/FindService";

import Campaign from "../models/Campaign";

import ContactTag from "../models/ContactTag";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import ContactList from "../models/ContactList";
import ContactListItem from "../models/ContactListItem";

import AppError from "../errors/AppError";
import { CancelService } from "../services/CampaignService/CancelService";
import { RestartService } from "../services/CampaignService/RestartService";
import RecurrenceService from "../services/CampaignService/RecurrenceService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  companyId: string | number;
};

// src/controllers/CampaignController.ts - Type StoreData completo

type StoreData = {
  name: string;
  message1?: string;
  message2?: string;
  message3?: string;
  message4?: string;
  message5?: string;
  confirmationMessage1?: string;
  confirmationMessage2?: string;
  confirmationMessage3?: string;
  confirmationMessage4?: string;
  confirmationMessage5?: string;
  status?: string;
  confirmation: boolean;
  scheduledAt: string;
  companyId: number;
  contactListId?: number | null;
  tagListId?: number | string | null;
  userId?: number | string | null;
  queueId?: number | string | null;
  whatsappId: number;
  statusTicket: string;
  openTicket: string;
  // Novos campos de recorrência
  isRecurring?: boolean;
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  recurrenceDaysOfWeek?: number[] | string | null; // Aceita array do frontend ou string do banco
  recurrenceDayOfMonth?: number | null;
  recurrenceEndDate?: string | null;
  maxExecutions?: number | null;
  executionCount?: number;
  nextScheduledAt?: Date | null;
  lastExecutedAt?: Date | null;
};

type FindParams = {
  companyId: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { records, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId
  });

  return res.json({ records, count, hasMore });
};

// src/controllers/CampaignController.ts - Store method completo

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    confirmation: Yup.boolean().required(),
    scheduledAt: Yup.string().required(),
    contactListId: Yup.number().nullable(),
    tagListId: Yup.string().nullable(),
    whatsappId: Yup.number().required(),
    userId: Yup.number().nullable(),
    queueId: Yup.number().nullable(),
    statusTicket: Yup.string().required(),
    openTicket: Yup.string().required(),
    // Validação de recorrência
    isRecurring: Yup.boolean().default(false),
    recurrenceType: Yup.string().when('isRecurring', {
      is: true,
      then: Yup.string().oneOf(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']).required(),
      otherwise: Yup.string().nullable()
    }),
    recurrenceInterval: Yup.number().when('isRecurring', {
      is: true,
      then: Yup.number().min(1).required(),
      otherwise: Yup.number().nullable()
    }),
    recurrenceDaysOfWeek: Yup.mixed().nullable(), // Mixed para aceitar array ou string
    recurrenceDayOfMonth: Yup.number().when(['isRecurring', 'recurrenceType'], {
      is: (isRecurring, recurrenceType) => isRecurring && recurrenceType === 'monthly',
      then: Yup.number().min(1).max(31).required(),
      otherwise: Yup.number().nullable()
    }),
    recurrenceEndDate: Yup.date().when('isRecurring', {
      is: true,
      then: Yup.date().min(new Date(), 'Data final deve ser futura').nullable(),
      otherwise: Yup.date().nullable()
    }),
    maxExecutions: Yup.number().when('isRecurring', {
      is: true,
      then: Yup.number().min(1).nullable(),
      otherwise: Yup.number().nullable()
    })
  });

  try {
    const {
      name,
      message1,
      message2,
      message3,
      message4,
      message5,
      confirmationMessage1,
      confirmationMessage2,
      confirmationMessage3,
      confirmationMessage4,
      confirmationMessage5,
      confirmation,
      scheduledAt,
      contactListId,
      tagListId,
      whatsappId,
      userId,
      queueId,
      statusTicket,
      openTicket,
      // Novos campos de recorrência
      isRecurring,
      recurrenceType,
      recurrenceInterval,
      recurrenceDaysOfWeek,
      recurrenceDayOfMonth,
      recurrenceEndDate,
      maxExecutions
    }: StoreData = req.body;

    console.log('[Campaign Store] Dados recebidos:', {
      isRecurring,
      recurrenceType,
      recurrenceDaysOfWeek,
      recurrenceDaysOfWeekType: typeof recurrenceDaysOfWeek,
      recurrenceDaysOfWeekIsArray: Array.isArray(recurrenceDaysOfWeek)
    });

    // Processar dados de recorrência com logs
    const processedRecurrenceData = {
      isRecurring: isRecurring || false,
      recurrenceType: isRecurring ? recurrenceType : null,
      recurrenceInterval: isRecurring ? (recurrenceInterval || 1) : null,
      recurrenceDaysOfWeek: (() => {
        if (!isRecurring) return null;
        if (!recurrenceDaysOfWeek) return null;
        if (Array.isArray(recurrenceDaysOfWeek)) {
          return recurrenceDaysOfWeek.length > 0 ? JSON.stringify(recurrenceDaysOfWeek) : null;
        }
        if (typeof recurrenceDaysOfWeek === 'string') {
          return recurrenceDaysOfWeek;
        }
        return null;
      })(),
      recurrenceDayOfMonth: (isRecurring && recurrenceType === 'monthly') ? recurrenceDayOfMonth : null,
      recurrenceEndDate: (isRecurring && recurrenceEndDate) ? new Date(recurrenceEndDate) : null,
      maxExecutions: (isRecurring && maxExecutions) ? maxExecutions : null,
      executionCount: 0,
      nextScheduledAt: null,
      lastExecutedAt: null
    };

    console.log('[Campaign Store] Dados processados:', processedRecurrenceData);

    const processedData = {
      name,
      message1: message1 || null,
      message2: message2 || null,
      message3: message3 || null,
      message4: message4 || null,
      message5: message5 || null,
      confirmationMessage1: confirmationMessage1 || null,
      confirmationMessage2: confirmationMessage2 || null,
      confirmationMessage3: confirmationMessage3 || null,
      confirmationMessage4: confirmationMessage4 || null,
      confirmationMessage5: confirmationMessage5 || null,
      confirmation,
      scheduledAt,
      contactListId: contactListId || null,
      tagListId: tagListId === "Nenhuma" ? null : tagListId,
      whatsappId,
      userId: userId || null,
      queueId: queueId || null,
      statusTicket,
      openTicket,
      companyId,
      status: "PROGRAMADA",
      // Adicionar campos de recorrência processados
      ...processedRecurrenceData
    };

    await schema.validate(processedData);

    const campaign = await Campaign.create(processedData);

    console.log('[Campaign Store] Campanha criada:', campaign.id);

    // Se for recorrente, calcular próxima execução
    if (campaign.isRecurring) {
      console.log('[Campaign Store] Configurando próxima execução para campanha recorrente');
      await RecurrenceService.scheduleNextExecution(campaign.id);
    }

    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-campaign`, {
        action: "create",
        record: campaign
      });

    return res.status(200).json(campaign);
  } catch (err: any) {
    console.error('[Campaign Store] Erro:', err.message);
    throw new AppError(err.message);
  }
};

// Update method também precisa ser atualizado
export const update = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { campaignId } = req.params;

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    confirmation: Yup.boolean().required(),
    scheduledAt: Yup.string().required(),
    contactListId: Yup.number().nullable(),
    tagListId: Yup.string().nullable(),
    whatsappId: Yup.number().required(),
    userId: Yup.number().nullable(),
    queueId: Yup.number().nullable(),
    statusTicket: Yup.string().required(),
    openTicket: Yup.string().required(),
    // Validação de recorrência
    isRecurring: Yup.boolean().default(false),
    recurrenceType: Yup.string().when('isRecurring', {
      is: true,
      then: Yup.string().oneOf(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']).required(),
      otherwise: Yup.string().nullable()
    }),
    recurrenceInterval: Yup.number().when('isRecurring', {
      is: true,
      then: Yup.number().min(1).required(),
      otherwise: Yup.number().nullable()
    }),
    recurrenceDaysOfWeek: Yup.mixed().nullable(),
    recurrenceDayOfMonth: Yup.number().when(['isRecurring', 'recurrenceType'], {
      is: (isRecurring, recurrenceType) => isRecurring && recurrenceType === 'monthly',
      then: Yup.number().min(1).max(31).required(),
      otherwise: Yup.number().nullable()
    }),
    recurrenceEndDate: Yup.date().when('isRecurring', {
      is: true,
      then: Yup.date().min(new Date(), 'Data final deve ser futura').nullable(),
      otherwise: Yup.date().nullable()
    }),
    maxExecutions: Yup.number().when('isRecurring', {
      is: true,
      then: Yup.number().min(1).nullable(),
      otherwise: Yup.number().nullable()
    })
  });

  try {
    const {
      name,
      message1,
      message2,
      message3,
      message4,
      message5,
      confirmationMessage1,
      confirmationMessage2,
      confirmationMessage3,
      confirmationMessage4,
      confirmationMessage5,
      confirmation,
      scheduledAt,
      contactListId,
      tagListId,
      whatsappId,
      userId,
      queueId,
      statusTicket,
      openTicket,
      // Novos campos de recorrência
      isRecurring,
      recurrenceType,
      recurrenceInterval,
      recurrenceDaysOfWeek,
      recurrenceDayOfMonth,
      recurrenceEndDate,
      maxExecutions
    }: StoreData = req.body;

    console.log('[Campaign Update] Dados recebidos:', {
      campaignId,
      isRecurring,
      recurrenceType,
      recurrenceDaysOfWeek,
      recurrenceDaysOfWeekType: typeof recurrenceDaysOfWeek,
      recurrenceDaysOfWeekIsArray: Array.isArray(recurrenceDaysOfWeek)
    });

    // Processar dados de recorrência
    const processedRecurrenceData = {
      isRecurring: isRecurring || false,
      recurrenceType: isRecurring ? recurrenceType : null,
      recurrenceInterval: isRecurring ? (recurrenceInterval || 1) : null,
      recurrenceDaysOfWeek: (() => {
        if (!isRecurring) return null;
        if (!recurrenceDaysOfWeek) return null;
        if (Array.isArray(recurrenceDaysOfWeek)) {
          return recurrenceDaysOfWeek.length > 0 ? JSON.stringify(recurrenceDaysOfWeek) : null;
        }
        if (typeof recurrenceDaysOfWeek === 'string') {
          return recurrenceDaysOfWeek;
        }
        return null;
      })(),
      recurrenceDayOfMonth: (isRecurring && recurrenceType === 'monthly') ? recurrenceDayOfMonth : null,
      recurrenceEndDate: (isRecurring && recurrenceEndDate) ? new Date(recurrenceEndDate) : null,
      maxExecutions: (isRecurring && maxExecutions) ? maxExecutions : null
    };

    const processedData = {
      name,
      message1: message1 || null,
      message2: message2 || null,
      message3: message3 || null,
      message4: message4 || null,
      message5: message5 || null,
      confirmationMessage1: confirmationMessage1 || null,
      confirmationMessage2: confirmationMessage2 || null,
      confirmationMessage3: confirmationMessage3 || null,
      confirmationMessage4: confirmationMessage4 || null,
      confirmationMessage5: confirmationMessage5 || null,
      confirmation,
      scheduledAt,
      contactListId: contactListId || null,
      tagListId: tagListId === "Nenhuma" ? null : tagListId,
      whatsappId,
      userId: userId || null,
      queueId: queueId || null,
      statusTicket,
      openTicket,
      companyId,
      // Adicionar campos de recorrência processados
      ...processedRecurrenceData
    };

    await schema.validate(processedData);

    const campaign = await Campaign.findOne({
      where: { id: campaignId, companyId },
      attributes: { exclude: ["createdAt", "updatedAt"] }
    });

    if (!campaign) {
      throw new AppError("ERR_NO_CAMPAIGN_FOUND", 404);
    }

    await campaign.update(processedData);

    console.log('[Campaign Update] Campanha atualizada:', campaign.id);

    // Se for recorrente, recalcular próxima execução
    if (campaign.isRecurring) {
      console.log('[Campaign Update] Reconfigurando próxima execução para campanha recorrente');
      await RecurrenceService.scheduleNextExecution(campaign.id);
    }

    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-campaign`, {
        action: "update",
        record: campaign
      });

    return res.status(200).json(campaign);
  } catch (err: any) {
    console.error('[Campaign Update] Erro:', err.message);
    throw new AppError(err.message);
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const record = await ShowService(id);

  return res.status(200).json(record);
};

export const cancel = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  await CancelService(+id);

  return res.status(204).json({ message: "Cancelamento realizado" });
};

export const restart = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;

  await RestartService(+id);

  return res.status(204).json({ message: "Reinício dos disparos" });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteService(id);

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-campaign`, {
      action: "delete",
      id
    });

  return res.status(200).json({ message: "Campaign deleted" });
};

export const findList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const params = req.query as FindParams;
  const records: Campaign[] = await FindService(params);

  return res.status(200).json(records);
};

export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const files = req.files as Express.Multer.File[];
  const file = head(files);

  try {
    const campaign = await Campaign.findByPk(id);
    campaign.mediaPath = file.filename;
    campaign.mediaName = file.originalname;
    await campaign.save();
    return res.send({ mensagem: "Mensagem enviada" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const deleteMedia = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { id } = req.params;

  try {
    const campaign = await Campaign.findByPk(id);
    const filePath = path.resolve("public", `company${companyId}`, campaign.mediaPath);
    const fileExists = fs.existsSync(filePath);
    if (fileExists) {
      fs.unlinkSync(filePath);
    }

    campaign.mediaPath = null;
    campaign.mediaName = null;
    await campaign.save();
    return res.send({ mensagem: "Arquivo excluído" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const previewRecurrence = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { recurrenceType, recurrenceInterval, recurrenceDaysOfWeek, recurrenceDayOfMonth } = req.query;

  try {
    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      throw new AppError("Campanha não encontrada", 404);
    }

    const config = {
      type: recurrenceType as string,
      interval: parseInt(recurrenceInterval as string),
      daysOfWeek: recurrenceDaysOfWeek ? JSON.parse(recurrenceDaysOfWeek as string) : undefined,
      dayOfMonth: recurrenceDayOfMonth ? parseInt(recurrenceDayOfMonth as string) : undefined
    };

    const executions = [];
    let currentDate = new Date(campaign.scheduledAt);
    
    for (let i = 0; i < 10; i++) { // Preview das próximas 10 execuções
      executions.push(new Date(currentDate));
      currentDate = RecurrenceService.calculateNextExecution(currentDate, config);
    }

    return res.json({ executions });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const stopRecurrence = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  try {
    const campaign = await Campaign.findByPk(id);
    if (!campaign) {
      throw new AppError("Campanha não encontrada", 404);
    }

    await campaign.update({
      isRecurring: false,
      nextScheduledAt: null,
      status: campaign.status === 'PROGRAMADA' ? 'FINALIZADA' : campaign.status
    });

    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-campaign`, {
        action: "update",
        record: campaign
      });

    return res.status(200).json({ message: "Recorrência interrompida com sucesso" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};