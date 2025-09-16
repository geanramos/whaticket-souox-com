import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { isEmpty, isNil } from "lodash";
import CheckSettingsHelper from "../helpers/CheckSettings";
import AppError from "../errors/AppError";

import CreateUserService from "../services/UserServices/CreateUserService";
import ListUsersService from "../services/UserServices/ListUsersService";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import ShowUserService from "../services/UserServices/ShowUserService";
import DeleteUserService from "../services/UserServices/DeleteUserService";
import SimpleListService from "../services/UserServices/SimpleListService";
import CreateCompanyService from "../services/CompanyService/CreateCompanyService";
import { SendMail } from "../helpers/SendMail";
import { useDate } from "../utils/useDate";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import { getWbot } from "../libs/wbot";
import FindCompaniesWhatsappService from "../services/CompanyService/FindCompaniesWhatsappService";
import User from "../models/User";

import { head } from "lodash";
import ToggleChangeWidthService from "../services/UserServices/ToggleChangeWidthService";
import APIShowEmailUserService from "../services/UserServices/APIShowEmailUserService";
import UpdateUserOnlineStatusService from "../services/UserServices/UpdateUserOnlineStatusService";
import GetOnlineUsersService from "../services/UserServices/GetOnlineUsersService";
import Chat from "../models/Chat";
import ChatUser from "../models/ChatUser";
import Plan from "../models/Plan";
import axios from "axios";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;

  const { users, count, hasMore } = await ListUsersService({
    searchParam,
    pageNumber,
    companyId,
    profile
  });

  return res.json({ users, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    email,
    password,
    name,
    phone,
    profile,
    companyId: bodyCompanyId,
    queueIds,
    companyName,
    planId,
    startWork,
    endWork,
    whatsappId,
    allTicket,
    defaultTheme,
    defaultMenu,
    allowGroup,
    allHistoric,
    allUserChat,
    userClosePendingTicket,
    showDashboard,
    defaultTicketsManagerWidth = 550,
    allowRealTime,
    allowConnections,
    showContacts,
    showCampaign,
    showFlow,
    birthDate,
    allowSeeMessagesInPendingTickets = "enabled",
    document // CNPJ da empresa

  } = req.body;
  let userCompanyId: number | null = null;

  const { dateToClient } = useDate();

  if (req.user !== undefined) {
    const { companyId: cId } = req.user;
    userCompanyId = cId;
  }

  if (
    req.url === "/signup" &&
    (await CheckSettingsHelper("userCreation")) === "disabled"
  ) {
    throw new AppError("ERR_USER_CREATION_DISABLED", 403);
  } else if (req.url !== "/signup" && req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (process.env.DEMO === "ON") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  // Validar se CNPJ foi fornecido no signup
  if (req.url === "/signup" && (!document || document.trim() === "")) {
    throw new AppError("CNPJ é obrigatório para o cadastro", 400);
  }

  const companyUser = bodyCompanyId || userCompanyId;

  let plan = null;
  if (planId) {
    plan = await Plan.findByPk(planId, {
      attributes: ["id", "name", "trial", "trialDays"]
    });
  }

  if (!companyUser) {
    let date = "";
    if (plan.trial === true) {
      const dataNowMoreTwoDays = new Date();
      dataNowMoreTwoDays.setDate(dataNowMoreTwoDays.getDate() + Number(plan?.trialDays || 3));

      date = dataNowMoreTwoDays.toISOString().split("T")[0];
    } else {
      const dataNowMoreTwoDays = new Date();
      dataNowMoreTwoDays.setDate(dataNowMoreTwoDays.getDate() + 3);

      date = dataNowMoreTwoDays.toISOString().split("T")[0];
    }

    const companyData = {
      name: companyName,
      email: email,
      phone: phone,
      planId: planId,
      status: true,
      dueDate: date,
      recurrence: "",
      document: document ? document.replace(/\D/g, '') : "",
      paymentMethod: "",
      password: password,
      companyUserName: name,
      startWork: startWork,
      endWork: endWork,
      defaultTheme: "light",
      defaultMenu: "closed",
      allowGroup: false,
      allHistoric: false,
      userClosePendingTicket: "enabled",
      allowSeeMessagesInPendingTickets: "enabled",
      showDashboard: "disabled",
      defaultTicketsManagerWidth: 550,
      allowRealTime: "disabled",
      allowConnections: "disabled"
    };

    const user = await CreateCompanyService(companyData);

    try {
      const _email = {
        to: email,
        subject: `Login e senha da Empresa ${companyName}`,
        text: `Olá ${name}, este é um email sobre o cadastro da ${companyName}!<br><br>
        Segue os dados da sua empresa:<br><br>Nome: ${companyName}<br>Email: ${email}<br>Senha: ${password}<br>Data Vencimento Trial: ${dateToClient(
          date
        )}`
      };

      await SendMail(_email);
    } catch (error) {
      console.log("Não consegui enviar o email");
    }

    try {
      const company = await ShowCompanyService(1);
      const whatsappCompany = await FindCompaniesWhatsappService(company.id);

      if (
        whatsappCompany.whatsapps[0].status === "CONNECTED" &&
        (phone !== undefined || !isNil(phone) || !isEmpty(phone))
      ) {
        const whatsappId = whatsappCompany.whatsapps[0].id;
        const wbot = getWbot(whatsappId);

        const body = `Olá ${name}, este é uma mensagem sobre o cadastro da ${companyName}!\n\nSegue os dados da sua empresa:\n\nNome: ${companyName}\nEmail: ${email}\nSenha: ${password}\nData Vencimento Trial: ${dateToClient(
          date
        )}`;

        await wbot.sendMessage(`55${phone}@s.whatsapp.net`, { text: body });
      }
    } catch (error) {
      console.log("Não consegui enviar a mensagem");
    }

    return res.status(200).json(user);
  }

  if (companyUser) {
    const user = await CreateUserService({
      email,
      password,
      name,
      profile,
      companyId: companyUser,
      queueIds,
      startWork,
      endWork,
      whatsappId,
      allTicket,
      defaultTheme,
      defaultMenu,
      allowGroup,
      allHistoric,
      allUserChat,
      userClosePendingTicket,
      showDashboard,
      defaultTicketsManagerWidth,
      allowRealTime,
      allowConnections,
      showContacts,
      showCampaign,
      showFlow,
      birthDate,
      allowSeeMessagesInPendingTickets
    });

    const userData = await User.findByPk(user.id);

    await User.createInitialChat(userData);

    const chats = await Chat.findAll({
      include: [
        {
          model: ChatUser,
          where: { userId: user.id }
        }
      ]
    });

    const io = getIO();
    io.of(userCompanyId.toString()).emit(`company-${userCompanyId}-user`, {
      action: "create",
      user
    });

    return res.status(200).json({ user, chats });
  }
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;

  const user = await ShowUserService(userId, companyId);

  return res.status(200).json(user);
};

export const showEmail = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { email } = req.params;

  const user = await APIShowEmailUserService(email);

  return res.status(200).json(user);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // if (req.user.profile !== "admin") {
  //   throw new AppError("ERR_NO_PERMISSION", 403);
  // }

  if (process.env.DEMO === "ON") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { id: requestUserId, companyId } = req.user;
  const { userId } = req.params;
  const userData = req.body;

  const user = await UpdateUserService({
    userData,
    userId,
    companyId,
    requestUserId: +requestUserId
  });

  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-user`, {
    action: "update",
    user
  });

  return res.status(200).json(user);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;
  const { companyId, id, profile } = req.user;

  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (process.env.DEMO === "ON") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const user = await User.findOne({
    where: { id: userId }
  });

  if (companyId !== user.companyId) {
    return res
      .status(400)
      .json({ error: "Você não possui permissão para acessar este recurso!" });
  } else {
    await DeleteUserService(userId, companyId);

    const io = getIO();
    io.of(String(companyId)).emit(`company-${companyId}-user`, {
      action: "delete",
      userId
    });

    return res.status(200).json({ message: "User deleted" });
  }
};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.query;
  const { companyId: userCompanyId } = req.user;

  const users = await SimpleListService({
    companyId: companyId ? +companyId : userCompanyId
  });

  return res.status(200).json(users);
};

export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;
  const files = req.files as Express.Multer.File[];
  const file = head(files);

  if (!file) {
    throw new AppError("Nenhum arquivo foi enviado", 400);
  }

  try {
    let user = await User.findByPk(userId);
    
    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    if (user.companyId !== companyId) {
      throw new AppError("Usuário não pertence a esta empresa", 403);
    }

    // Salvar apenas o nome do arquivo (sem caminho)
    user.profileImage = file.filename;
    await user.save();

    // Buscar usuário atualizado com todas as relações
    user = await ShowUserService(userId, companyId);

    // Emitir evento socket para atualizar em tempo real
    const io = getIO();
    io.of(String(companyId)).emit(`company-${companyId}-user`, {
      action: "update",
      user
    });

    return res.status(200).json({ 
      user, 
      message: "Imagem atualizada com sucesso"
    });
  } catch (err: any) {
    console.error("Erro no upload da imagem:", err);
    throw new AppError(err.message || "Erro interno do servidor");
  }
};

export const toggleChangeWidht = async (
  req: Request,
  res: Response
): Promise<Response> => {
  var { userId } = req.params;
  const { defaultTicketsManagerWidth } = req.body;

  const { companyId } = req.user;
  const user = await ToggleChangeWidthService({
    userId,
    defaultTicketsManagerWidth
  });

  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-user`, {
    action: "update",
    user
  });

  return res.status(200).json(user);
};

export const updateOnlineStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;
  const { online } = req.body;

  await UpdateUserOnlineStatusService({
    userId: +userId,
    online
  });

  return res.status(200).json({ message: "Status updated" });
};

export const getOnlineUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;

  const users = await GetOnlineUsersService({
    companyId
  });

  return res.status(200).json(users);
};

export const validateCnpj = async (req: Request, res: Response): Promise<Response> => {
  const { cnpj } = req.body;

  if (!cnpj) {
    throw new AppError("CPF ou CNPJ é obrigatório", 400);
  }

  // Limpar o documento (remover formatação)
  const cleanDocument = cnpj.replace(/\D/g, '');

  // Detectar se é CPF ou CNPJ
  const isCpf = cleanDocument.length === 11;
  const isCnpj = cleanDocument.length === 14;

  if (!isCpf && !isCnpj) {
    throw new AppError("CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos", 400);
  }

  if (isCpf) {
    // Validação local do CPF
    if (!validateCpf(cleanDocument)) {
      throw new AppError("CPF inválido", 400);
    }

    return res.status(200).json({
      valid: true,
      data: {
        nome: "Pessoa Física",
        cpf: cleanDocument,
        tipo: "cpf"
      }
    });
  }

  // Validação do CNPJ na Receita Federal
  try {
    const response = await axios.get(`https://receitaws.com.br/v1/cnpj/${cleanDocument}`);
    const data = response.data;

    if (data.status === "ERROR") {
      throw new AppError("CNPJ inválido ou não encontrado na Receita Federal", 400);
    }

    return res.status(200).json({
      valid: true,
      data: {
        nome: data.nome,
        cnpj: cleanDocument,
        email: data.email,
        telefone: data.telefone,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
        situacao: data.situacao,
        tipo: "cnpj"
      }
    });

  } catch (error: any) {
    console.error("Erro ao validar CNPJ:", error);
    
    if (error.response?.status === 404) {
      throw new AppError("CNPJ não encontrado na Receita Federal", 404);
    }
    
    throw new AppError("Erro ao validar CNPJ. Tente novamente.", 500);
  }
};

// Função para validar CPF
const validateCpf = (cpf: string): boolean => {
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

export default {
  index,
  store,
  show,
  showEmail,
  update,
  remove,
  list,
  mediaUpload,
  toggleChangeWidht,
  updateOnlineStatus,
  getOnlineUsers,
  validateCnpj
};
