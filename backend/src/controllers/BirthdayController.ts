import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import BirthdayService from "../services/BirthdayService/BirthdayService";
import BirthdaySettings from "../models/BirthdaySettings";
import { emitBirthdayEvents } from "../libs/socket"; // 🎂 NOVO IMPORT
import { triggerBirthdayCheck } from "../jobs/BirthdayJob"; // 🎂 NOVO IMPORT
import logger from "../utils/logger";

// Schema de validação para configurações de aniversário
const BirthdaySettingsSchema = Yup.object().shape({
  userBirthdayEnabled: Yup.boolean(),
  contactBirthdayEnabled: Yup.boolean(),
  userBirthdayMessage: Yup.string().max(1000, "Mensagem muito longa"),
  contactBirthdayMessage: Yup.string().max(1000, "Mensagem muito longa"),
  sendBirthdayTime: Yup.string().matches(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
    "Formato de horário inválido (HH:MM:SS)"
  ),
  createAnnouncementForUsers: Yup.boolean()
});

// Schema para envio manual de mensagem
const SendBirthdayMessageSchema = Yup.object().shape({
  contactId: Yup.number().required("ID do contato é obrigatório"),
  customMessage: Yup.string().optional().max(1000, "Mensagem muito longa")
});

export const getTodayBirthdays = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { companyId } = req.user;
    
    logger.info(`🎂 [API] Buscando aniversariantes para empresa ${companyId}`);

    const birthdayData = await BirthdayService.getTodayBirthdaysForCompany(companyId);
    
    logger.info(`🎂 [API] Encontrados: ${birthdayData.users.length} usuários, ${birthdayData.contacts.length} contatos`);

    return res.json({
      status: "success",
      data: birthdayData
    });
  } catch (err) {
    logger.error("🎂 [ERROR] Erro ao buscar aniversariantes:", err);
    throw new AppError("Erro ao buscar aniversariantes de hoje", 500);
  }
};

export const getBirthdaySettings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { companyId } = req.user;

    const settings = await BirthdayService.getBirthdaySettings(companyId);

    return res.json({
      status: "success",
      data: settings
    });
  } catch (err) {
    console.error("Error fetching birthday settings:", err);
    throw new AppError("Erro ao buscar configurações de aniversário", 500);
  }
};

export const updateBirthdaySettings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { companyId } = req.user;
    const settingsData = req.body;

    // Validar dados de entrada
    try {
      await BirthdaySettingsSchema.validate(settingsData);
    } catch (err: any) {
      throw new AppError(err.message, 400);
    }

    const settings = await BirthdayService.updateBirthdaySettings(
      companyId,
      settingsData
    );

    return res.json({
      status: "success",
      message: "Configurações de aniversário atualizadas com sucesso",
      data: settings
    });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    console.error("Error updating birthday settings:", err);
    throw new AppError("Erro ao atualizar configurações de aniversário", 500);
  }
};

export const sendBirthdayMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { companyId } = req.user;
    const { contactId, customMessage } = req.body;

    // Validar dados de entrada
    try {
      await SendBirthdayMessageSchema.validate(req.body);
    } catch (err: any) {
      throw new AppError(err.message, 400);
    }

    const success = await BirthdayService.sendBirthdayMessageToContact(
      contactId,
      companyId,
      customMessage
    );

    if (!success) {
      throw new AppError("Erro ao enviar mensagem de aniversário", 400);
    }

    return res.json({
      status: "success",
      message: "Mensagem de aniversário enviada com sucesso"
    });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    console.error("Error sending birthday message:", err);
    throw new AppError("Erro ao enviar mensagem de aniversário", 500);
  }
};

// Endpoint para processar aniversários manualmente (admin)
export const processTodayBirthdays = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { profile } = req.user;

    // Só admin pode executar processamento manual
    if (profile !== 'admin') {
      throw new AppError("Acesso negado", 403);
    }

    await BirthdayService.processTodayBirthdays();

    return res.json({
      status: "success",
      message: "Processamento de aniversários executado com sucesso"
    });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    console.error("Error processing birthdays:", err);
    throw new AppError("Erro ao processar aniversários", 500);
  }
};

// 🎂 NOVO: Endpoint para emitir eventos de aniversário via socket
export const emitBirthdaySocketEvents = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { companyId } = req.user;

    logger.info(`🎂 [SOCKET] Emitindo eventos de aniversário para empresa ${companyId}`);

    // Emitir eventos via socket para a empresa
    await emitBirthdayEvents(companyId);

    return res.json({
      status: "success",
      message: "Eventos de aniversário emitidos via socket com sucesso"
    });
  } catch (err) {
    logger.error("🎂 [ERROR] Erro ao emitir eventos via socket:", err);
    throw new AppError("Erro ao emitir eventos de aniversário", 500);
  }
};

// 🎂 NOVO: Endpoint para trigger manual do sistema completo de aniversários
export const triggerBirthdaySystem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { profile, companyId } = req.user;

    // Só admin pode executar trigger manual
    if (profile !== 'admin') {
      throw new AppError("Acesso negado", 403);
    }

    logger.info(`🎂 [TRIGGER] Executando trigger manual do sistema de aniversários para empresa ${companyId}`);

    // Executar verificação manual via job
    await triggerBirthdayCheck(companyId);

    return res.json({
      status: "success",
      message: "Sistema de aniversários executado com sucesso via socket"
    });
  } catch (err) {
    logger.error("🎂 [ERROR] Erro no trigger do sistema:", err);
    throw new AppError("Erro ao executar sistema de aniversários", 500);
  }
};

// Endpoint para testar configurações de aniversário
export const testBirthdayMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { companyId } = req.user;
    const { contactId, messageType } = req.body;

    if (!contactId || !messageType) {
      throw new AppError("ID do contato e tipo de mensagem são obrigatórios", 400);
    }

    const settings = await BirthdayService.getBirthdaySettings(companyId);
    
    let testMessage = "";
    if (messageType === 'contact') {
      testMessage = `[TESTE] ${settings.contactBirthdayMessage}`;
    } else {
      testMessage = `[TESTE] ${settings.userBirthdayMessage}`;
    }

    const success = await BirthdayService.sendBirthdayMessageToContact(
      contactId,
      companyId,
      testMessage
    );

    if (!success) {
      throw new AppError("Erro ao enviar mensagem de teste", 400);
    }

    return res.json({
      status: "success",
      message: "Mensagem de teste enviada com sucesso"
    });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    console.error("Error sending test message:", err);
    throw new AppError("Erro ao enviar mensagem de teste", 500);
  }
};

// 🎂 ENDPOINT DE DEBUG: Para facilitar desenvolvimento e troubleshooting
export const debugBirthdaySystem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { companyId } = req.user;
    const today = new Date();
    
    logger.info(`🎂 [DEBUG] Executando debug do sistema de aniversários`);
    
    // Buscar dados completos para debug
    const birthdayData = await BirthdayService.getTodayBirthdaysForCompany(companyId);
    
    // Buscar TODOS os usuários e contatos com data de nascimento
    const { Op } = require('sequelize');
    const User = require('../models/User').default;
    const Contact = require('../models/Contact').default;
    
    const allUsers = await User.findAll({
      where: { 
        companyId,
        birthDate: { [Op.ne]: null } 
      },
      attributes: ['id', 'name', 'birthDate']
    });
    
    const allContacts = await Contact.findAll({
      where: { 
        companyId,
        birthDate: { [Op.ne]: null } 
      },
      attributes: ['id', 'name', 'birthDate']
    });

    // Executar emit de teste
    try {
      await emitBirthdayEvents(companyId);
    } catch (socketError) {
      logger.warn("🎂 [DEBUG] Socket emission failed:", socketError);
    }

    return res.json({
      status: "success",
      debug: {
        serverTime: today.toISOString(),
        serverDate: today.toDateString(),
        month: today.getMonth() + 1,
        day: today.getDate(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        companyId,
        totalUsersWithBirthDate: allUsers.length,
        totalContactsWithBirthDate: allContacts.length,
        usersWithBirthDate: allUsers.map(u => ({
          id: u.id,
          name: u.name,
          birthDate: u.birthDate,
          parsedDate: new Date(u.birthDate).toDateString()
        })),
        contactsWithBirthDate: allContacts.map(c => ({
          id: c.id,
          name: c.name,
          birthDate: c.birthDate,
          parsedDate: new Date(c.birthDate).toDateString()
        })),
        socketEmissionAttempted: true
      },
      data: birthdayData
    });
  } catch (err) {
    logger.error("🎂 [ERROR] Erro no debug:", err);
    throw new AppError("Erro no debug do sistema de aniversários", 500);
  }
};