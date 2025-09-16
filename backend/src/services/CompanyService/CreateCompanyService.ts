import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Company from "../../models/Company";
import User from "../../models/User";
import sequelize from "../../database";
import CompaniesSettings from "../../models/CompaniesSettings";
import axios from "axios";

interface CompanyData {
  name: string;
  phone?: string;
  email?: string;
  status?: boolean;
  planId?: number;
  dueDate?: string;
  recurrence?: string;
  document?: string;
  paymentMethod?: string;
  password?: string;
  companyUserName?: string;
  generateInvoice?: boolean;
}

const validateCnpjWithReceita = async (cnpj: string): Promise<boolean> => {
  try {
    // Remover formatação do CNPJ
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    const response = await axios.get(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`);
    const data = response.data;
    
    if (data.status === "ERROR") {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao validar CNPJ:", error);
    return false;
  }
};

const CreateCompanyService = async (
  companyData: CompanyData
): Promise<Company> => {
  const {
    name,
    phone,
    password,
    email,
    status,
    planId,
    dueDate,
    recurrence,
    document,
    paymentMethod,
    companyUserName,
    generateInvoice
  } = companyData;

  const companySchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "ERR_COMPANY_INVALID_NAME")
      .required("ERR_COMPANY_INVALID_NAME")
  });

  try {
    await companySchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

// Validar CNPJ se fornecido e for um CNPJ (14 dígitos)
if (document && document.trim() !== "") {
  // Remove todos os caracteres não numéricos
  const cleanDoc = document.replace(/\D/g, '');
  
  // Verifica se é um CNPJ (14 dígitos)
  if (cleanDoc.length === 14) {
    const isCnpjValid = await validateCnpjWithReceita(document);
    if (!isCnpjValid) {
      throw new AppError("CNPJ inválido ou não encontrado na Receita Federal", 400);
    }
  }
  // Opcional: Você pode adicionar validação de CPF aqui se quiser
  // else if (cleanDoc.length === 11) {
  //   const isCpfValid = await validateCpfWithReceita(document);
  //   if (!isCpfValid) {
  //     throw new AppError("CPF inválido ou não encontrado na Receita Federal", 400);
  //   }
  // }
}

  const t = await sequelize.transaction();

  try {
    const company = await Company.create({
      name,
      phone,
      email,
      status,
      planId,
      dueDate,
      recurrence,
      document: document ? document.replace(/\D/g, '') : "",
      paymentMethod,
      generateInvoice
    },
      { transaction: t }
    );

    const user = await User.create({
      name: companyUserName ? companyUserName : name,
      email: company.email,
      password: password ? password : "mudar123",
      profile: "admin",
      companyId: company.id
    },
      { transaction: t }
    );

    const settings = await CompaniesSettings.create({
          companyId: company.id,
          hoursCloseTicketsAuto: "9999999999",
          chatBotType: "text",
          acceptCallWhatsapp: "enabled",
          userRandom: "enabled",
          sendGreetingMessageOneQueues: "enabled",
          sendSignMessage: "enabled",
          sendFarewellWaitingTicket: "disabled",
          userRating: "disabled",
          sendGreetingAccepted: "enabled",
          CheckMsgIsGroup: "enabled",
          sendQueuePosition: "disabled",
          scheduleType: "disabled",
          acceptAudioMessageContact: "enabled",
          sendMsgTransfTicket:"disabled",
          enableLGPD: "disabled",
          requiredTag: "disabled",
          lgpdDeleteMessage: "disabled",
          lgpdHideNumber: "disabled",
          lgpdConsent: "disabled",
          lgpdLink:"",
          lgpdMessage:"",
          createdAt: new Date(),
          updatedAt: new Date(),
          closeTicketOnTransfer: false,
          DirectTicketsToWallets: false
    },{ transaction: t })
    
    await t.commit();

    return company;
  } catch (error) {
    await t.rollback();
    throw new AppError("Não foi possível criar a empresa!", error);
  }
};

export default CreateCompanyService;