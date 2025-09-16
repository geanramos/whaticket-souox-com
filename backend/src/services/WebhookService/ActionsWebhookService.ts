import AppError from "../../errors/AppError";
import { WebhookModel } from "../../models/Webhook";
import { obterNomeEExtensaoDoArquivo, sendMessageFlow } from "../../controllers/MessageController";
import { IConnections, INodes } from "./DispatchWebHookService";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import CreateContactService from "../ContactServices/CreateContactService";
import Contact from "../../models/Contact";
import CreateTicketService from "../TicketServices/CreateTicketService";
// import CreateTicketServiceWebhook from "../TicketServices/CreateTicketServiceWebhook";
import { SendMessage } from "../../helpers/SendMessage";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import fs from "fs";
import GetWhatsappWbot from "../../helpers/GetWhatsappWbot";
import path from "path";
import SendWhatsAppMedia from "../WbotServices/SendWhatsAppMedia";
import SendWhatsAppMediaFlow, { typeSimulation } from "../WbotServices/SendWhatsAppMediaFlow";
import { randomizarCaminho } from "../../utils/randomizador";
// import { SendMessageFlow } from "../../helpers/SendMessageFlow";
import formatBody from "../../helpers/Mustache";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import ShowTicketService from "../TicketServices/ShowTicketService";
import CreateMessageService, {
  MessageData
} from "../MessageServices/CreateMessageService";
import { randomString } from "../../utils/randomCode";
import ShowQueueService from "../QueueService/ShowQueueService";
import { getIO } from "../../libs/socket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import ShowTicketUUIDService from "../TicketServices/ShowTicketFromUUIDService";
import logger from "../../utils/logger";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";
import CompaniesSettings from "../../models/CompaniesSettings";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SyncTags from "../TagServices/SyncTagsService";
import Tag from "../../models/Tag";
import ContactTag from "../../models/ContactTag";
import flowBuilderQueue from "./flowBuilderQueue";
import { proto } from "@whiskeysockets/baileys";
import { getWbot } from "../../libs/wbot";
import SendWhatsAppOficialMessage from "../WhatsAppOficial/SendWhatsAppOficialMessage";
import Whatsapp from "../../models/Whatsapp";
import axios from "axios";
import https from "https";
import { flowbuilderIntegration } from "../WbotServices/wbotMessageListener";
import { handleOpenAiFlow } from "../IntegrationsServices/OpenAiService";
import { IOpenAi } from "../../@types/openai";


declare global {
  namespace NodeJS {
    interface Global {
      flowVariables: Record<string, any>;
    }
  }
}

if (!global.flowVariables) {
  global.flowVariables = {};
}
interface IAddContact {
  companyId: number;
  name: string;
  phoneNumber: string;
  email?: string;
  dataMore?: any;
}

interface DataNoWebhook {
  nome: string;
  numero: string;
  email: string;
}

const processVariableValue = (text: string, dataWebhook: any, ticketId?: number): string => {
  if (!text) return "";


  if (text.includes("${")) {
    const regex = /\${([^}]+)}/g;
    let match;
    let processedText = text;

    while ((match = regex.exec(text)) !== null) {
      const variableName = match[1];


      let variableValue = null;

      if (ticketId) {
        const ticketSpecificVar = `${ticketId}_${variableName}`;
        variableValue = global.flowVariables[ticketSpecificVar];
      }


      if (variableValue === null || variableValue === undefined) {
        variableValue = global.flowVariables[variableName];
      }


      if (variableValue !== null && variableValue !== undefined) {
        processedText = processedText.replace(
          match[0],
          variableValue.toString()
        );
      }
    }

    return processedText;
  }

  return text;
};

const compareValues = (value1: string, value2: string, operator: string): boolean => {
  if (!value1 && operator !== "isEmpty" && operator !== "isNotEmpty") {
    value1 = "";
  }

  if (!value2 && operator !== "isEmpty" && operator !== "isNotEmpty") {
    value2 = "";
  }


  const strValue1 = String(value1 || "").toLowerCase();
  const strValue2 = String(value2 || "").toLowerCase();


  const numValue1 = parseFloat(value1);
  const numValue2 = parseFloat(value2);

  logger.info(`Comparing values: "${value1}" ${operator} "${value2}" (lowercase: "${strValue1}" ${operator} "${strValue2}")`);

  switch (operator) {
    case "contains":
      return strValue1.includes(strValue2);
    case "equals":
      return strValue1 === strValue2;
    case "notEquals":
      return strValue1 !== strValue2;
    case "greaterThan":
      return !isNaN(numValue1) && !isNaN(numValue2) && numValue1 > numValue2;
    case "lessThan":
      return !isNaN(numValue1) && !isNaN(numValue2) && numValue1 < numValue2;
    case "greaterOrEqual":
      return !isNaN(numValue1) && !isNaN(numValue2) && numValue1 >= numValue2;
    case "lessOrEqual":
      return !isNaN(numValue1) && !isNaN(numValue2) && numValue1 <= numValue2;
    case "startsWith":
      return strValue1.startsWith(strValue2);
    case "endsWith":
      return strValue1.endsWith(strValue2);
    case "isEmpty":
      return !strValue1 || strValue1.trim() === "";
    case "isNotEmpty":
      return strValue1 && strValue1.trim() !== "";
    default:
      logger.error(`Unknown operator: ${operator}`);
      return false;
  }
};

const finalizeTriggeredFlow = async (
  ticket: Ticket,
  nodeSelected: any,
  companyId: number,
  finalStatus: string = "open"
) => {
  try {
    // Verificar se o ticket está com status "open" (fluxo disparado manualmente)
    if (ticket.status === "open") {
      logger.info(`[TICKET UPDATE] Finalizando fluxo disparado manualmente para ticket ${ticket.id}`);

      // Determinar status final baseado no nó ou usar "pending" como padrão
      let targetStatus = finalStatus;

      // Se o nó tem configuração de status final, usar essa configuração
      if (nodeSelected?.data?.finalStatus) {
        targetStatus = nodeSelected.data.finalStatus;
        logger.info(`[TICKET UPDATE] Status final definido pelo nó: ${targetStatus}`);
      }

      logger.info(`[TICKET UPDATE] Ticket ${ticket.id} será alterado para status: ${targetStatus}`);

      // Atualizar ticket para o status final
      await UpdateTicketService({
        ticketData: {
          status: targetStatus,
          userId: ticket.userId,
          flowWebhook: false,
          lastFlowId: null,
          hashFlowId: null,
          flowStopped: null,
          dataWebhook: null,
          isBot: false,
          isTransfered: false
        },
        ticketId: ticket.id,
        companyId
      });

      logger.info(`[TICKET UPDATE] Ticket ${ticket.id} atualizado com sucesso - Status: ${targetStatus}, FlowWebhook: false, LastFlowId: null`);

      // Criar log da finalização
      await CreateLogTicketService({
        userId: ticket.userId,
        ticketId: ticket.id,
        type: "open",
        queueId: ticket.queueId
      });

      logger.info(`[TICKET UPDATE] Log criado para finalização do fluxo - Ticket ${ticket.id}`);
    }
    logger.info(`[TICKET UPDATE] Log criado para finalização do fluxo - Ticket ${ticket.id}`);

  } catch (error) {
    logger.error(`[TICKET UPDATE ERROR] Erro ao finalizar fluxo disparado manualmente para ticket ${ticket.id}:`, error);
  }
};

export const ActionsWebhookService = async (
  whatsappId: number,
  idFlowDb: number,
  companyId: number,
  nodes: INodes[],
  connects: IConnections[],
  nextStage: string,
  dataWebhook: any,
  details: any,
  hashWebhookId: string,
  pressKey?: string,
  idTicket?: number,
  numberPhrase: "" | { number: string; name: string; email: string } = "",
  inputResponded: boolean = false,
  msg?: proto.IWebMessageInfo
): Promise<string> => {
  try {
    const io = getIO()
    let next = nextStage;

    let createFieldJsonName = "";

    const connectStatic = connects;
    if (numberPhrase === "") {
      const nameInput = details.inputs.find(item => item.keyValue === "nome");
      nameInput.data.split(",").map(dataN => {
        const lineToData = details.keysFull.find(item => item === dataN);
        let sumRes = "";
        if (!lineToData) {
          sumRes = dataN;
        } else {
          sumRes = constructJsonLine(lineToData, dataWebhook);
        }
        createFieldJsonName = createFieldJsonName + sumRes
      });
    } else {
      createFieldJsonName = numberPhrase.name;
    }


    let numberClient = "";

    if (numberPhrase === "") {
      const numberInput = details.inputs.find(
        item => item.keyValue === "celular"
      );

      numberInput.data.split(",").map(dataN => {
        const lineToDataNumber = details.keysFull.find(item => item === dataN);
        let createFieldJsonNumber = "";
        if (!lineToDataNumber) {
          createFieldJsonNumber = dataN;
        } else {
          createFieldJsonNumber = constructJsonLine(
            lineToDataNumber,
            dataWebhook
          );
        }

        numberClient = numberClient + createFieldJsonNumber;
      });
    } else {
      numberClient = numberPhrase.number;
    }

    numberClient = removerNaoLetrasNumeros(numberClient);

    if (numberClient.substring(0, 2) === "55") {
      if (parseInt(numberClient.substring(2, 4)) >= 31) {
        if (numberClient.length === 13) {
          numberClient =
            numberClient.substring(0, 4) + numberClient.substring(5, 13);
        }
      }
    }

    let createFieldJsonEmail = "";

    if (numberPhrase === "") {
      const emailInput = details.inputs.find(item => item.keyValue === "email");
      emailInput.data.split(",").map(dataN => {

        const lineToDataEmail = details.keysFull.find(item =>
          item.endsWith("email")
        );

        let sumRes = "";
        if (!lineToDataEmail) {
          sumRes = dataN;
        } else {
          sumRes = constructJsonLine(lineToDataEmail, dataWebhook);
        }

        createFieldJsonEmail = createFieldJsonEmail + sumRes;
      });
    } else {
      createFieldJsonEmail = numberPhrase.email;
    }

    const lengthLoop = nodes.length;

    const whatsapp = await Whatsapp.findByPk(whatsappId);

    if (whatsapp.status !== "CONNECTED") {
      return;
    }

    let execCount = 0;

    let execFn = "";

    let ticket = null;

    let noAlterNext = false;

    for (var i = 0; i < lengthLoop; i++) {
      let nodeSelected: any;
      let ticketInit: Ticket;
      if (idTicket) {
        ticketInit = await Ticket.findOne({
          where: { id: idTicket, whatsappId }
        });

        if (ticketInit.status === "closed") {
          if (numberPhrase === "") {
            break;
          }
        }

      }

      if (pressKey) {
        if (pressKey === "parar") {
          if (idTicket) {
            ticketInit = await Ticket.findOne({
              where: { id: idTicket, whatsappId }
            });

            logger.info(`[TICKET UPDATE] Parando fluxo para ticket ${ticketInit.id} - Status alterado para closed`);

            await ticket.update({
              status: "closed"
            });

            logger.info(`[TICKET UPDATE] Ticket ${ticketInit.id} fechado com sucesso`);
          }
          break;
        }

        if (execFn === "") {
          console.log("UPDATE5...");
          nodeSelected = {
            type: "menu"
          };
        } else {
          console.log("UPDATE6...");
          nodeSelected = nodes.filter(node => node.id === execFn)[0];
        }
      } else {
        console.log("UPDATE7...");
        const otherNode = nodes.filter((node) => node.id === next)[0]
        if (otherNode) {
          nodeSelected = otherNode;
        }
      }

      console.log(`[FLOW LOOP] Nó selecionado: ${nodeSelected?.id} (${nodeSelected?.type})`);

      let msg;

      // Função auxiliar para garantir que o ticket esteja disponível
      const ensureTicket = async () => {
        if (!ticket && idTicket) {
          console.log(`Recuperando ticket ${idTicket} para o nó tipo ${nodeSelected.type}`);
          ticket = await Ticket.findOne({
            where: { id: idTicket, whatsappId }
          });

          if (!ticket) {
            console.error(`Não foi possível encontrar o ticket ${idTicket} para o nó ${nodeSelected.type}`);
            return false;
          }
        }
        return true;
      };

      // console.log("nodeSelected.type", nodeSelected.type);

      if (nodeSelected.type === "tag") {
        const tagFind = await Tag.findByPk(nodeSelected.data.tag.id);

        const teste = { contactId: ticket.contactId, tags: [tagFind], companyId: companyId }

        const tags = await SyncTags(teste);

        logger.info(`[TICKET TAG] Tag ${tagFind.name} adicionada ao contato ${ticket.contactId} do ticket ${ticket.id}`);
      }

      if (nodeSelected.type === "removeTag") {
        await ensureTicket();

        if (!ticket) {
          logger.error(`[REMOVE TAG NODE] Ticket não encontrado para processar remoção de tag`);
          return;
        }

        try {
          const tagFind = await Tag.findByPk(nodeSelected.data.tag.id);

          if (!tagFind) {
            logger.error(`[REMOVE TAG NODE] Tag com ID ${nodeSelected.data.tag.id} não encontrada`);
            return;
          }

          // Importar o serviço de remoção de tags
          const { RemoveTagsService } = await import("../TagServices/RemoveTagsService");

          // Remover a tag do contato
          await RemoveTagsService({
            contactId: ticket.contactId,
            tags: [tagFind],
            companyId: companyId
          });

          logger.info(`[REMOVE TAG NODE] Tag ${tagFind.name} removida do contato ${ticket.contactId} do ticket ${ticket.id}`);

        } catch (error) {
          logger.error(`[REMOVE TAG NODE] Erro ao remover tag do contato:`, error);
        }
      }

      if (nodeSelected.type === "message") {
        if (dataWebhook === "") {
          msg = {
            body: nodeSelected.data.label,
            number: numberClient,
            companyId: companyId
          };
        } else {
          const dataLocal = {
            nome: createFieldJsonName,
            numero: numberClient,
            email: createFieldJsonEmail
          };
          msg = {
            body: replaceMessages(
              nodeSelected.data.label,
              details,
              dataWebhook,
              dataLocal,
              idTicket
            ),
            number: numberClient,
            companyId: companyId
          };
        }

        if (whatsapp.channel === "whatsapp") {
          await SendWhatsAppMessage({
            body: msg.body,
            ticket: ticket,
            quotedMsg: null
          });
        }

        if (whatsapp.channel === "whatsapp_oficial") {
          await SendWhatsAppOficialMessage({
            body: msg.body,
            ticket: ticket,
            quotedMsg: null,
            type: 'text',
            media: null,
            vCard: null
          });
        }

        await intervalWhats("1");
      }

      if (nodeSelected.type === "openai" || nodeSelected.type === "gemini") {
        try {
          const {
            name = "",
            prompt = "",
            voice = "texto",
            voiceKey = "",
            voiceRegion = "",
            maxTokens = 1000,
            temperature = 0.7,
            apiKey = "",
            queueId = 0,
            maxMessages = 10,
            model = "",
            provider = nodeSelected.type,
            flowMode = "permanent",
            maxInteractions = 0,
            continueKeywords = ["continuar", "próximo", "avançar", "prosseguir"],
            completionTimeout = 0,
            objective = "",
            autoCompleteOnObjective = false
          } = nodeSelected.data.typebotIntegration as IOpenAi;

          if (!apiKey || !model) {
            logger.error(`[${provider.toUpperCase()} NODE] Configurações obrigatórias não encontradas`);
            continue;
          }

          const finalVoice = provider === "gemini" ? "texto" : voice;

          const aiSettings: IOpenAi = {
            name,
            prompt,
            voice: finalVoice,
            voiceKey: provider === "openai" ? voiceKey : "",
            voiceRegion: provider === "openai" ? voiceRegion : "",
            maxTokens: Number(maxTokens) || 1000,
            temperature: Number(temperature) || 0.7,
            apiKey,
            queueId: Number(queueId) || 0,
            maxMessages: Number(maxMessages) || 10,
            model,
            provider,
            flowMode,
            maxInteractions: Number(maxInteractions) || 0,
            continueKeywords,
            completionTimeout: Number(completionTimeout) || 0,
            objective,
            autoCompleteOnObjective
          };

          logger.info(`[${provider.toUpperCase()} NODE] Ativando modo ${provider.toUpperCase()} para ticket ${ticket.id} (${flowMode})`);

          if (flowMode === "permanent") {
            // MODO PERMANENTE: Para o fluxo e fica em IA
            await ticket.update({
              flowWebhook: false,
              lastFlowId: null,
              hashFlowId: null,
              flowStopped: null,
              useIntegration: true,
              isBot: true,
              status: "pending",
              dataWebhook: {
                type: provider,
                settings: aiSettings,
                mode: "permanent",
                awaitingUserResponse: true // ✅ AGUARDA PRIMEIRA RESPOSTA DO USUÁRIO
              }
            });

            logger.info(`[${provider.toUpperCase()} NODE] Modo permanente ativado`);

          } else {
            // MODO TEMPORÁRIO: Mantém informações do fluxo
            const nextConnection = connects.filter(
              connect => connect.source === nodeSelected.id && connect.sourceHandle === "a"
            )[0];

            await ticket.update({
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString(),
              useIntegration: true,
              isBot: true,
              dataWebhook: {
                type: provider,
                settings: aiSettings,
                mode: "temporary",
                awaitingUserResponse: true, // ✅ AGUARDA PRIMEIRA RESPOSTA DO USUÁRIO
                flowContinuation: {
                  nextNodeId: nextConnection?.target,
                  interactionCount: 0,
                  startTime: new Date().toISOString(),
                  originalDataWebhook: dataWebhook
                }
              }
            });

            logger.info(`[${provider.toUpperCase()} NODE] Modo temporário ativado`);
          }

          // ✅ ENVIAR MENSAGEM DE BOAS-VINDAS IMEDIATAMENTE
          if (name) {
            const welcomeMessage = objective
              ? `Olá! Sou ${name}. ${objective}`
              : flowMode === "temporary" && continueKeywords?.length > 0
                ? `Olá! Sou ${name}. Como posso ajudá-lo? (Digite "${continueKeywords[0]}" quando quiser prosseguir)`
                : `Olá! Sou ${name}. Como posso ajudá-lo?`;

            logger.info(`[${provider.toUpperCase()} NODE] Enviando boas-vindas para ticket ${ticket.id}`);

            if (whatsapp.channel === "whatsapp") {
              await SendWhatsAppMessage({ body: welcomeMessage, ticket, quotedMsg: null });
            }

            if (whatsapp.channel === "whatsapp_oficial") {
              await SendWhatsAppOficialMessage({
                body: welcomeMessage,
                ticket: ticket,
                quotedMsg: null,
                type: 'text',
                media: null,
                vCard: null
              });
            }
          }

          // ✅ PARAR FLUXO E AGUARDAR RESPOSTA DO USUÁRIO
          break;

        } catch (error) {
          logger.error(`[AI NODE] Erro ao processar nó ${nodeSelected.type}:`, error);
          continue;
        }
      }

      if (nodeSelected.type === "input") {
        try {
          // Garantir que o ticket esteja disponível
          if (!ticket && idTicket) {
            ticket = await Ticket.findOne({
              where: { id: idTicket, whatsappId }
            });

            if (!ticket) {
              continue;
            }
          }

          let question = nodeSelected.data.question || "";
          const variableName = nodeSelected.data.variableName || "";

          if (!variableName) {
            continue;
          }

          if (question.includes("${")) {
            const dataLocal = {
              nome: createFieldJsonName,
              numero: numberClient,
              email: createFieldJsonEmail
            };

            question = replaceMessages(
              question,
              details,
              dataWebhook,
              dataLocal,
              idTicket
            );
          }

          // Verifica se este input específico já foi respondido
          const inputIdentifier = `${ticket.id}_${variableName}`;
          const thisInputResponded = global.flowVariables[inputIdentifier];

          // Se inputResponded é true, significa que estamos retomando o fluxo após uma resposta
          // Neste caso, devemos continuar para o próximo nó sem processar este input novamente
          if (inputResponded && thisInputResponded) {

            // Recuperar o valor do próximo nó salvo anteriormente
            const savedNext = global.flowVariables[`${inputIdentifier}_next`];
            if (savedNext) {
              next = savedNext;
              // Limpar a variável após uso
              delete global.flowVariables[`${inputIdentifier}_next`];
            }

            await ticket.update({
              dataWebhook: {
                ...ticket.dataWebhook,
                waitingInput: false
              }
            });

            // Pular para o próximo nó sem processar mais este nó
            continue;
          } else if (!inputResponded && thisInputResponded) {
            // Se não estamos retomando o fluxo mas o input já foi respondido, pular
            continue;
          } else {

            // Enviar a pergunta e aguardar resposta
            await intervalWhats("1");
            typeSimulation(ticket, "composing");

            if (whatsapp.channel === "whatsapp_oficial") {
              await SendWhatsAppOficialMessage({
                body: question,
                ticket: ticket,
                quotedMsg: null,
                type: 'text',
                media: null,
                vCard: null
              });
            }

            if (whatsapp.channel === "whatsapp") {
              await SendWhatsAppMessage({
                body: question,
                ticket: ticket,
                quotedMsg: null
              });
            } else {
              await SendMessage(whatsapp, {
                number: numberClient,
                body: question
              });
            }


            if (ticket) {
              // Salvar a conexão de saída para ser usada quando o fluxo for retomado
              const outputConnection = connects.filter(
                connect => connect.source === nodeSelected.id && connect.sourceHandle === "a"
              )[0];

              const nextNodeId = outputConnection ? outputConnection.target : next;

              logger.info(`[TICKET UPDATE] Preparando ticket ${ticket.id} para aguardar input - Status: pending, LastFlowId: ${nodeSelected.id}, WaitingInput: true`);

              await ticket.update({
                status: "pending",
                lastFlowId: nodeSelected.id,
                flowWebhook: true,
                hashFlowId: hashWebhookId,
                flowStopped: idFlowDb.toString(),
                dataWebhook: {
                  ...ticket.dataWebhook,
                  waitingInput: true,
                  inputVariableName: variableName,
                  inputIdentifier: inputIdentifier,
                  nextNodeId: nextNodeId // Salvar no dataWebhook também como backup
                }
              });

              logger.info(`[TICKET UPDATE] Ticket ${ticket.id} configurado para aguardar input - Variable: ${variableName}, NextNodeId: ${nextNodeId}`);

              global.flowVariables = global.flowVariables || {};
              global.flowVariables[`${inputIdentifier}_next`] = nextNodeId;

              break; // Parar o fluxo para aguardar a resposta
            }
          }
        } catch (error) {
        }
      }

      if (nodeSelected.type === "conditionCompare") {
        try {
          const leftValue = processVariableValue(
            nodeSelected.data.leftValue || "",
            dataWebhook,
            idTicket
          );

          const rightValue = nodeSelected.data.operator !== "isEmpty" &&
            nodeSelected.data.operator !== "isNotEmpty"
            ? processVariableValue(
              nodeSelected.data.rightValue || "",
              dataWebhook,
              idTicket
            )
            : "";

          const comparisonResult = compareValues(
            leftValue,
            rightValue,
            nodeSelected.data.operator
          );

          const condition = comparisonResult ? "true" : "false";

          const connectionSelect = connectStatic.filter(
            item => item.source === nodeSelected.id && item.sourceHandle === condition
          );

          if (connectionSelect && connectionSelect.length > 0) {
            next = connectionSelect[0].target;
            noAlterNext = true;

            continue;
          } else {
            logger.warn(`[FlowBuilder] No connection found for condition ${condition} on node ${nodeSelected.id}`);

            const allConnections = connectStatic.filter(
              item => item.source === nodeSelected.id
            );

          }
        } catch (error) {

          const connectionFalse = connectStatic.filter(
            item => item.source === nodeSelected.id && item.sourceHandle === "false"
          );

          if (connectionFalse && connectionFalse.length > 0) {
            next = connectionFalse[0].target;
            noAlterNext = true;
          }
        }
      }

      if (nodeSelected.type === "variable") {
        try {
          const variableName = nodeSelected.data.variableName;
          let variableValue = nodeSelected.data.variableValue;

          if (variableName) {
            // Processar o valor da variável usando replaceMessages se contiver variáveis
            if (typeof variableValue === "string" && variableValue.includes("${")) {
              const dataLocal = {
                nome: createFieldJsonName,
                numero: numberClient,
                email: createFieldJsonEmail
              };

              variableValue = replaceMessages(
                variableValue,
                details,
                dataWebhook,
                dataLocal,
                idTicket
              );
            }

            global.flowVariables = global.flowVariables || {};

            // Salvar a variável globalmente
            global.flowVariables[variableName] = variableValue;

            // Se temos um ticketId, salvar também como variável específica do ticket
            if (idTicket) {
              const ticketSpecificVar = `${idTicket}_${variableName}`;
              global.flowVariables[ticketSpecificVar] = variableValue;
            }
          }
        } catch (error) {
        }
      }

      if (nodeSelected.type === "httpRequest") {
        try {
          const {
            url,
            method,
            requestBody,
            headersString,
            queryParams,
            saveVariables,
            responseVariables,
            timeout
          } = nodeSelected.data;

          if (!url) {
            continue;
          }

          let headers = {};
          try {
            if (headersString && typeof headersString === "string") {
              headers = JSON.parse(headersString);
            } else if (typeof headersString === "object") {
              headers = headersString;
            }
          } catch (err) {
            console.error(
              "[httpRequestNode] Erro ao parsear headers JSON:",
              err
            );
          }

          let body = null;
          if (
            ["POST", "PUT", "PATCH", "DELETE"].includes(
              method?.toUpperCase() || "GET"
            )
          ) {
            try {
              body =
                requestBody && typeof requestBody === "string"
                  ? requestBody.trim().startsWith("{")
                    ? JSON.parse(requestBody)
                    : requestBody
                  : null;
            } catch (err) {
              console.error(
                "[httpRequestNode] Erro ao parsear body JSON, usando como string:",
                err
              );
              body = requestBody;
            }
          }

          const requestTimeout = timeout || 10000;

          const response = await makeHttpRequest(
            url,
            method || "GET",
            headers,
            body,
            queryParams,
            requestTimeout
          );

          global.flowVariables = global.flowVariables || {};
          global.flowVariables["apiResponse"] = response.data;

          if (response.data) {
            let variablesToProcess = [];

            if (
              responseVariables &&
              Array.isArray(responseVariables) &&
              responseVariables.length > 0
            ) {
              variablesToProcess = responseVariables;
            } else if (
              saveVariables &&
              Array.isArray(saveVariables) &&
              saveVariables.length > 0
            ) {
              variablesToProcess = saveVariables.map(item => ({
                path: item.path,
                variableName: item.variable
              }));
            } else if (
              nodeSelected.data.responseVariables &&
              Array.isArray(nodeSelected.data.responseVariables)
            ) {
              variablesToProcess = nodeSelected.data.responseVariables;
            } else if (
              nodeSelected.data.saveVariables &&
              Array.isArray(nodeSelected.data.saveVariables)
            ) {
              variablesToProcess = nodeSelected.data.saveVariables.map(
                item => ({
                  path: item.path,
                  variableName: item.variable || item.variableName
                })
              );
            }

            if (variablesToProcess && variablesToProcess.length > 0) {
              for (let i = 0; i < variablesToProcess.length; i++) {
                const extractor = variablesToProcess[i];

                if (extractor && extractor.path && extractor.variableName) {
                  const parts = extractor.path.split(".");
                  let value = response.data;
                  let pathValid = true;

                  for (const part of parts) {
                    if (value && typeof value === "object" && part in value) {
                      value = value[part];
                    } else {
                      pathValid = false;
                      break;
                    }
                  }

                  if (pathValid && value !== undefined && value !== null) {
                    if (typeof setFlowVariable === "function") {
                      setFlowVariable(extractor.variableName, value);
                    } else {
                      global.flowVariables[extractor.variableName] = value;
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(
            "[httpRequestNode] Erro ao processar nó HTTP Request:",
            error
          );
        }
      }

      if (nodeSelected.type === "ticket") {
        if (!(await ensureTicket())) continue;

        console.log('ticket.id', ticket?.id)
        console.log('queue.id', nodeSelected?.data?.queue?.id)
        console.log('companyId', companyId)
        console.log('nodeSelected.id', nodeSelected.id)
        console.log('hashWebhookId', hashWebhookId)
        console.log('idFlowDb', idFlowDb)
        console.log('ticket.userId', ticket?.userId)

        const queue = await ShowQueueService(nodeSelected?.data?.queue?.id, companyId)

        logger.info(`[TICKET UPDATE] Atualizando ticket ${ticket.id} para fila ${queue.id} (${queue.name}) - Status: pending, FlowWebhook: true`);

        await ticket.update({
          status: 'pending',
          queueId: queue.id,
          userId: ticket.userId,
          companyId: companyId,
          flowWebhook: true,
          lastFlowId: nodeSelected.id,
          hashFlowId: hashWebhookId,
          flowStopped: idFlowDb.toString()
        });

        logger.info(`[TICKET UPDATE] Ticket ${ticket.id} atualizado para fila ${queue.name} - LastFlowId: ${nodeSelected.id}, HashFlowId: ${hashWebhookId}`);

        await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          whatsappId: ticket.whatsappId,
          userId: ticket.userId
        })

        await UpdateTicketService({
          ticketData: {
            status: "pending",
            queueId: queue.id
          },
          ticketId: ticket.id,
          companyId
        })

        logger.info(`[TICKET UPDATE] UpdateTicketService chamado para ticket ${ticket.id} - QueueId: ${queue.id}`);

        await CreateLogTicketService({
          ticketId: ticket.id,
          type: "queue",
          queueId: queue.id
        });

        logger.info(`[TICKET LOG] Log de fila criado para ticket ${ticket.id} - QueueId: ${queue.id}`);

        let settings = await CompaniesSettings.findOne({
          where: {
            companyId: companyId
          }
        })

        const { queues, greetingMessage, maxUseBotQueues, timeUseBotQueues } = await ShowWhatsAppService(whatsappId, companyId);

        if (greetingMessage.length > 1) {
          const body = formatBody(`${greetingMessage}`, ticket);

          const ticketDetails = await ShowTicketService(ticket.id, companyId);

          logger.info(`[TICKET UPDATE] Atualizando lastMessage do ticket ${ticket.id} com mensagem de saudação da fila`);

          await ticketDetails.update({
            lastMessage: formatBody(queue.greetingMessage, ticket.contact)
          });

          logger.info(`[TICKET UPDATE] LastMessage atualizada para ticket ${ticket.id}`);

          if (whatsapp.channel === "whatsapp") {
            await SendWhatsAppMessage({
              body,
              ticket: ticketDetails,
              quotedMsg: null
            });
          }

          if (whatsapp.channel === "whatsapp_oficial") {
            await SendWhatsAppOficialMessage({
              body: body,
              ticket: ticketDetails,
              quotedMsg: null,
              type: 'text',
              media: null,
              vCard: null
            });
          }

          SetTicketMessagesAsRead(ticketDetails);
        }


      }

      if (nodeSelected.type === "singleBlock") {
        if (!(await ensureTicket())) continue;

        const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

        for (var iLoc = 0; iLoc < nodeSelected.data.seq.length; iLoc++) {
          const elementNowSelected = nodeSelected.data.seq[iLoc];

          if (elementNowSelected.includes("message")) {
            const bodyFor = nodeSelected.data.elements.filter(
              item => item.number === elementNowSelected
            )[0].value;

            const ticketDetails = await ShowTicketService(ticket.id, companyId);

            if (dataWebhook === "") {
              msg = bodyFor;
            } else {
              const dataLocal = {
                nome: createFieldJsonName,
                numero: numberClient,
                email: createFieldJsonEmail
              };
              msg = replaceMessages(bodyFor, details, dataWebhook, dataLocal, idTicket);
            }

            if (whatsapp.channel === "whatsapp") {
              await SendMessage(whatsapp, {
                number: numberClient,
                body: msg,
                mediaPath: null
              });
            }

            if (whatsapp.channel === "whatsapp_oficial") {
              await SendWhatsAppOficialMessage({
                body: msg,
                ticket: ticketDetails,
                quotedMsg: null,
                type: 'text',
                media: null,
                vCard: null
              });
            }

            SetTicketMessagesAsRead(ticketDetails);

            logger.info(`[TICKET UPDATE] Atualizando lastMessage do ticket ${ticket.id} no singleBlock - Message enviada`);

            await ticketDetails.update({
              lastMessage: formatBody(bodyFor, ticket.contact)
            });

            logger.info(`[TICKET UPDATE] LastMessage atualizada para ticket ${ticket.id} no singleBlock`);

            await intervalWhats("1");
          }

          if (elementNowSelected.includes("interval")) {
            await intervalWhats(
              nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].value
            );
          }

          if (elementNowSelected.includes("img")) {

            const filePath = path.join(publicFolder, `company${companyId}/flow`, nodeSelected.data.elements.filter(item => item.number === elementNowSelected)[0].value);

            const ticketInt = await Ticket.findOne({ where: { id: ticket.id } });

            if (whatsapp.channel === "whatsapp") {
              await SendWhatsAppMediaFlow({
                media: filePath,
                ticket: ticketInt,
                whatsappId: whatsapp.id,
                isRecord: nodeSelected.data.elements.filter(item => item.number === elementNowSelected)[0].record
              });
            }

            if (whatsapp.channel === "whatsapp_oficial") {

              const fileName = obterNomeEExtensaoDoArquivo(filePath);

              const mediaSrc = {
                fieldname: 'medias',
                originalname: fileName,
                encoding: '7bit',
                mimetype: 'image/jpeg',
                filename: fileName,
                path: filePath
              } as Express.Multer.File

              await SendWhatsAppOficialMessage({
                body: "",
                ticket: ticketInt,
                type: 'image',
                media: mediaSrc
              });
            }

            await intervalWhats("1");
          }

          if (elementNowSelected.includes("audio")) {
            const filePath = path.join(publicFolder, `company${companyId}/flow`, nodeSelected.data.elements.filter(item => item.number === elementNowSelected)[0].value);

            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });

            if (whatsapp.channel === "whatsapp") {
              await SendWhatsAppMediaFlow({
                media: filePath,
                ticket: ticketInt,
                whatsappId: whatsapp.id,
                isRecord: nodeSelected.data.elements.filter(item => item.number === elementNowSelected)[0].record
              });
            }

            if (whatsapp.channel === "whatsapp_oficial") {

              // const mediaUrl = message.mediaUrl.replace(`:${process.env.PORT}`, '');
              const fileName = obterNomeEExtensaoDoArquivo(filePath);

              const mediaSrc = {
                fieldname: 'medias',
                originalname: fileName,
                encoding: '7bit',
                mimetype: 'audio/mpeg',
                filename: fileName,
                path: filePath
              } as Express.Multer.File

              await SendWhatsAppOficialMessage({
                body: "",
                ticket: ticket,
                type: 'audio',
                media: mediaSrc
              });
            }

            await intervalWhats("1");
          }

          if (elementNowSelected.includes("video")) {
            const filePath = path.join(publicFolder, `company${companyId}/flow`, nodeSelected.data.elements.filter(item => item.number === elementNowSelected)[0].value);

            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });

            if (whatsapp.channel === "whatsapp") {
              await SendWhatsAppMediaFlow({
                media: filePath,
                ticket: ticketInt,
                whatsappId: whatsapp.id,
              });
            }

            if (whatsapp.channel === "whatsapp_oficial") {

              const fileName = obterNomeEExtensaoDoArquivo(filePath);

              const mediaSrc = {
                fieldname: 'medias',
                originalname: fileName,
                encoding: '7bit',
                mimetype: 'video/mp4',
                filename: fileName,
                path: filePath
              } as Express.Multer.File

              await SendWhatsAppOficialMessage({
                body: "",
                ticket: ticketInt,
                type: 'video',
                media: mediaSrc
              });
            }

            //fs.unlinkSync(mediaDirectory.split('.')[0] + 'A.mp3');
            await intervalWhats("1");
          }

          if (elementNowSelected.includes("document")) {
            const filePath = path.join(publicFolder, `company${companyId}/flow`, nodeSelected.data.elements.filter(item => item.number === elementNowSelected)[0].value);

            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });

            if (whatsapp.channel === "whatsapp") {
              await SendWhatsAppMediaFlow({
                media: filePath,
                ticket: ticketInt,
                whatsappId: whatsapp.id,
              });
            }

            if (whatsapp.channel === "whatsapp_oficial") {

              // const mediaUrl = message.mediaUrl.replace(`:${process.env.PORT}`, '');
              const fileName = obterNomeEExtensaoDoArquivo(filePath);

              const mediaSrc = {
                fieldname: 'medias',
                originalname: fileName,
                encoding: '7bit',
                mimetype: 'application/pdf',
                filename: fileName,
                path: filePath
              } as Express.Multer.File

              await SendWhatsAppOficialMessage({
                body: "",
                ticket: ticketInt,
                type: 'document',
                media: mediaSrc
              });
            }

            await intervalWhats("1");
          }

          if (elementNowSelected.includes("application")) {
            const filePath = path.join(publicFolder, `company${companyId}/flow`, nodeSelected.data.elements.filter(item => item.number === elementNowSelected)[0].value);

            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });

            if (whatsapp.channel === "whatsapp") {
              await SendWhatsAppMediaFlow({
                media: filePath,
                ticket: ticketInt,
                whatsappId: whatsapp.id,
              });
            }

            if (whatsapp.channel === "whatsapp_oficial") {

              // const mediaUrl = message.mediaUrl.replace(`:${process.env.PORT}`, '');
              const fileName = obterNomeEExtensaoDoArquivo(filePath);

              const mediaSrc = {
                fieldname: 'medias',
                originalname: fileName,
                encoding: '7bit',
                mimetype: 'application/pdf',
                filename: fileName,
                path: filePath
              } as Express.Multer.File

              await SendWhatsAppOficialMessage({
                body: "",
                ticket: ticketInt,
                type: 'document',
                media: mediaSrc
              });
            }

            await intervalWhats("1");
          }
        }
      }

      let isRandomizer: boolean;
      if (nodeSelected.type === "randomizer") {
        const selectedRandom = randomizarCaminho(nodeSelected.data.percent / 100);

        const resultConnect = connects.filter(
          connect => connect.source === nodeSelected.id
        );
        if (selectedRandom === "A") {
          next = resultConnect.filter(item => item.sourceHandle === "a")[0]
            .target;
          noAlterNext = true;
        } else {
          next = resultConnect.filter(item => item.sourceHandle === "b")[0]
            .target;
          noAlterNext = true;
        }
        isRandomizer = true;
      }

      let isMenu: boolean;
      if (nodeSelected.type === "menu") {

        if (pressKey) {
          console.log(`[MENU NODE] Processando pressKey: ${pressKey}`);

          const filterOne = connectStatic.filter(confil => confil.source === next)
          const filterTwo = filterOne.filter(filt2 => filt2.sourceHandle === "a" + pressKey)
          if (filterTwo.length > 0) {
            execFn = filterTwo[0].target
          } else {
            execFn = undefined
          }

          if (execFn === undefined) {
            break;
          }

          pressKey = "999";

          const isNodeExist = nodes.filter(item => item.id === execFn);

          if (isNodeExist.length > 0) {
            isMenu = isNodeExist[0].type === "menu" ? true : false;
          } else {
            isMenu = false;
          }
        } else {
          // console.log(`[MENU NODE] Criando menu sem pressKey`);

          let optionsMenu = "";
          nodeSelected.data.arrayOption.map(item => {
            optionsMenu += `[${item.number}] ${item.value}\n`;
          });

          const menuCreate = `${nodeSelected.data.message}\n\n${optionsMenu}`;
          // console.log(`[MENU NODE] Menu criado: ${menuCreate}`);

          let msg;
          if (dataWebhook === "") {
            msg = {
              body: menuCreate,
              number: numberClient,
              companyId: companyId
            };
          } else {
            const dataLocal = {
              nome: createFieldJsonName,
              numero: numberClient,
              email: createFieldJsonEmail
            };
            msg = {
              body: replaceMessages(menuCreate, details, dataWebhook, dataLocal, idTicket),
              number: numberClient,
              companyId: companyId
            };
          }

          // console.log(`[MENU NODE] Mensagem processada: ${msg.body}`);

          const ticketDetails = await ShowTicketService(ticket.id, companyId);

          const messageData: MessageData = {
            wid: randomString(50),
            ticketId: ticket.id,
            body: msg.body,
            fromMe: true,
            read: true
          };

          if (whatsapp.channel === "whatsapp") {
            await SendWhatsAppMessage({
              body: msg.body,
              ticket: ticketDetails,
              quotedMsg: null
            });
          }

          if (whatsapp.channel === "whatsapp_oficial") {
            await SendWhatsAppOficialMessage({
              body: msg.body,
              ticket: ticketDetails,
              quotedMsg: null,
              type: 'text',
              media: null,
              vCard: null
            });
          }
          // console.log(`[MENU NODE] Mensagem enviada com sucesso`);

          SetTicketMessagesAsRead(ticketDetails);

          logger.info(`[TICKET UPDATE] Atualizando lastMessage do ticket ${ticket.id} no menu`);

          await ticketDetails.update({
            lastMessage: formatBody(msg.body, ticket.contact)
          });

          logger.info(`[TICKET UPDATE] LastMessage atualizada para ticket ${ticket.id} no menu`);

          await intervalWhats("1");

          if (ticket) {
            ticket = await Ticket.findOne({
              where: { id: ticket.id, whatsappId: whatsappId, companyId: companyId }
            });
          } else {
            ticket = await Ticket.findOne({
              where: { id: idTicket, whatsappId: whatsappId, companyId: companyId }
            });
          }

          if (ticket) {
            logger.info(`[TICKET UPDATE] Configurando ticket ${ticket.id} para aguardar resposta do menu - Status: pending, LastFlowId: ${nodeSelected.id}`);

            await ticket.update({
              status: "pending",
              queueId: ticket.queueId ? ticket.queueId : null,
              userId: null,
              companyId: companyId,
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              dataWebhook: dataWebhook,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString()
            });

            logger.info(`[TICKET UPDATE] Ticket ${ticket.id} configurado para menu - FlowWebhook: true, HashFlowId: ${hashWebhookId}, FlowStopped: ${idFlowDb}`);
          }

          // console.log(`[MENU NODE] Fluxo pausado aguardando resposta do usuário`);
          break;
        }
      }

      let isSwitchFlow: boolean;
      if (nodeSelected.type === "switchFlow") {

        const data = nodeSelected.data?.flowSelected;

        if (ticket) {
          ticket = await Ticket.findOne({
            where: {
              id: ticket.id
            },
            include: [
              { model: Contact, as: "contact", attributes: ["id", "name"] }
            ]
          });
        } else {
          ticket = await Ticket.findOne({
            where: {
              id: idTicket
            },
            include: [
              { model: Contact, as: "contact", attributes: ["id", "name"] }
            ]
          });
        }

        logger.info(`[TICKET FLOW] Executando switchFlow para ticket ${ticket.id} - Novo fluxo: ${data?.name || 'N/A'}`);

        isSwitchFlow = true;
        switchFlow(data, companyId, ticket);
        break;
      };

      if (nodeSelected.type === "attendant") {

        const data = nodeSelected.data?.user?.id;

        if (ticket) {
          ticket = await Ticket.findOne({
            where: {
              id: ticket.id
            },
            include: [
              { model: Contact, as: "contact", attributes: ["id", "name"] }
            ]
          });
        } else {
          ticket = await Ticket.findOne({
            where: {
              id: idTicket
            },
            include: [
              { model: Contact, as: "contact", attributes: ["id", "name"] }
            ]
          });
        }

        logger.info(`[TICKET UPDATE] Atribuindo ticket ${ticket.id} ao atendente ${data}`);

        await ticket.update({
          userId: data
        });

        logger.info(`[TICKET UPDATE] Ticket ${ticket.id} atribuído ao usuário ${data} com sucesso`);

        break;
      };

      let isContinue = false;

      if (pressKey === "999" && execCount > 0) {
        console.log("UPDATE8...");
        pressKey = undefined;
        let result = connects.filter(connect => connect.source === execFn)[0];
        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
      } else {
        let result;

        if (isMenu) {
          result = { target: execFn };
          isContinue = true;
          pressKey = undefined;
        } else if (isSwitchFlow) {
          const wbot = await getWbot(whatsapp.id);
          const contact = await Contact.findOne({
            where: {
              id: ticket?.contactId,
              companyId: companyId
            }
          })
          flowBuilderQueue(ticket, msg, wbot, whatsapp, companyId, contact, null);
          break;
        } else if (isRandomizer) {
          isRandomizer = false;
          result = next;
        } else {
          result = connects.filter(connect => connect.source === next)[0];
        }

        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
      }

      let finalStatus;
      if (nodeSelected?.data?.finalStatus) {
        console.log("[FINAL STATUS] O status fina será:", nodeSelected.data.finalStatus);
        finalStatus = nodeSelected.data.finalStatus;
      }

      if (!pressKey && !isContinue) {
        const nextNode = connects.filter(connect => connect.source === nodeSelected.id).length;

        if (nextNode === 0) {
          if (ticket) {
            ticket = await Ticket.findOne({
              where: { id: ticket.id, whatsappId, companyId: companyId }
            });

            logger.info(`[TICKET UPDATE] Finalizando fluxo - Ticket ${ticket.id} será resetado (LastFlowId: null, FlowWebhook: false)`);

            await ticket.update({
              lastFlowId: null,
              dataWebhook: null,
              hashFlowId: null,
              flowWebhook: false,
              flowStopped: idFlowDb.toString(),
              useIntegration: null,
              integrationId: null
            });

            logger.info(`[TICKET UPDATE] NO IF - Fluxo finalizado - Ticket ${ticket.id} resetado com sucesso`);

          } else {
            ticket = await Ticket.findOne({
              where: { id: idTicket, whatsappId, companyId: companyId }
            });

            await ticket.update({
              lastFlowId: null,
              dataWebhook: null,
              hashFlowId: null,
              flowWebhook: false,
              flowStopped: idFlowDb.toString(),
              useIntegration: null,
              integrationId: null
            });

            logger.info(`[TICKET UPDATE] NO ELSE - Fluxo finalizado - Ticket ${idTicket} resetado com sucesso`);
          }
          break;
        }
      }

      isContinue = false;

      if (next === "" || !next) {
        if (ticket) {
          ticket = await Ticket.findOne({
            where: { id: ticket.id, whatsappId, companyId: companyId }
          });
        } else if (idTicket) {
          ticket = await Ticket.findOne({
            where: { id: idTicket, whatsappId, companyId: companyId }
          });
        }

        if (ticket) {
          logger.info(`[TICKET UPDATE] Finalizando fluxo disparado - Ticket ${ticket.id} com status final: ${finalStatus}`);
          await finalizeTriggeredFlow(ticket, nodeSelected, companyId, finalStatus);
        }

        break;
      }

      console.log("UPDATE9...");
      if (idTicket) {
        console.log("UPDATE10...");
        ticket = await Ticket.findOne({
          where: { id: idTicket, whatsappId, companyId: companyId }
        });
      }

      console.log("UPDATE12...");

      logger.info(`[TICKET UPDATE] Continuando fluxo - Ticket ${ticket.id} - LastFlowId: ${nodeSelected.id}, HashFlowId: ${hashWebhookId}`);

      await ticket.update({
        whatsappId: whatsappId,
        queueId: ticket?.queueId,
        userId: ticket?.userId,
        companyId: companyId,
        flowWebhook: true,
        lastFlowId: nodeSelected.id,
        dataWebhook: dataWebhook,
        hashFlowId: hashWebhookId,
        flowStopped: idFlowDb.toString()
      });

      logger.info(`[TICKET UPDATE] Ticket ${ticket.id} atualizado para continuar fluxo - FlowStopped: ${idFlowDb}`);

      noAlterNext = false;
      execCount++;
    }

    return "ds";
  } catch (error) {
    logger.error("[ActionsWebhookService] Erro geral no serviço:", error)
  }
};

const switchFlow = async (data: any, companyId: number, ticket: Ticket) => {
  const wbot = await getWbot(ticket?.whatsappId);
  const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
  const contact = await Contact.findOne({
    where: {
      id: ticket?.contactId,
      companyId: companyId
    }
  })

  logger.info(`[TICKET FLOW] Executando switchFlow para ticket ${ticket.id} - WhatsappId: ${wbot.id}, CompanyId: ${companyId}`);

  await flowBuilderQueue(ticket, data, wbot, whatsapp, companyId, contact, null);
};

const constructJsonLine = (line: string, json: any) => {
  let valor = json
  const chaves = line.split(".")

  if (chaves.length === 1) {
    return valor[chaves[0]]
  }

  for (const chave of chaves) {
    valor = valor[chave]
  }
  return valor
};

function removerNaoLetrasNumeros(texto: string) {
  // Substitui todos os caracteres que não são letras ou números por vazio
  return texto.replace(/[^a-zA-Z0-9]/g, "");
}

const sendMessageWhats = async (
  whatsId: number,
  msg: any,
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
) => {
  sendMessageFlow(whatsId, msg, req);
  return Promise.resolve();
};

const makeHttpRequest = async (
  url: string,
  method: string,
  headers: Record<string, string> = {},
  body: any = null,
  queryParams: Array<{ key: string; value: string }> = [],
  timeout: number = 10000
): Promise<any> => {
  try {
    let processedUrl = url;
    if (global.flowVariables && url.includes("${")) {
      const regex = /\${([^}]+)}/g;
      processedUrl = url.replace(regex, (match, varName) => {
        return global.flowVariables[varName] !== undefined
          ? global.flowVariables[varName]
          : match;
      });
    }

    if (queryParams) {
      try {
        const paramsArray = Array.isArray(queryParams) ? queryParams : [];

        if (paramsArray.length > 0) {
          // Processar variáveis nos parâmetros de query
          const processedParams = paramsArray.map(param => {
            if (!param || typeof param !== "object") {
              return { key: "", value: "" };
            }

            const key = param.key || "";
            let value = param.value || "";

            if (
              global.flowVariables &&
              typeof value === "string" &&
              value.includes("${")
            ) {
              const regex = /\${([^}]+)}/g;
              value = value.replace(regex, (match, varName) => {
                const replacement = global.flowVariables[varName];

                return replacement !== undefined ? String(replacement) : match;
              });
            }

            return { key, value };
          });

          const queryString = processedParams
            .filter(param => param.key && param.value)
            .map(
              param =>
                `${encodeURIComponent(param.key)}=${encodeURIComponent(
                  param.value
                )}`
            )
            .join("&");

          if (queryString) {
            console.log(
              `[httpRequestNode] Query string gerada: ${queryString}`
            );
            processedUrl = processedUrl.includes("?")
              ? `${processedUrl}&${queryString}`
              : `${processedUrl}?${queryString}`;
          }
        }
      } catch (error) {
        logger.error(error);
      }
    }

    const processedHeaders: Record<string, string> = { ...headers };
    if (global.flowVariables) {
      Object.keys(processedHeaders).forEach(key => {
        if (processedHeaders[key] && processedHeaders[key].includes("${")) {
          const regex = /\${([^}]+)}/g;
          processedHeaders[key] = processedHeaders[key].replace(
            regex,
            (match, varName) => {
              return global.flowVariables[varName] !== undefined
                ? global.flowVariables[varName]
                : match;
            }
          );
        }
      });
    }

    let processedBody = body;
    try {
      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(
          method?.toUpperCase() || ""
        ) &&
        body
      ) {
        if (typeof body === "string") {
          if (global.flowVariables && body.includes("${")) {
            const regex = /\${([^}]+)}/g;
            processedBody = body.replace(regex, (match, varName) => {
              const value = global.flowVariables[varName];

              if (value !== undefined) {
                if (typeof value === "string") {
                  return value;
                } else {
                  return JSON.stringify(value);
                }
              }
              return match;
            });
          }

          if (
            processedBody &&
            typeof processedBody === "string" &&
            (processedBody.trim().startsWith("{") ||
              processedBody.trim().startsWith("["))
          ) {
            try {
              processedBody = JSON.parse(processedBody);
            } catch (e) { }
          }
        } else if (
          typeof body === "object" &&
          body !== null &&
          global.flowVariables
        ) {
          const processObject = (obj: any): any => {
            if (obj === null || typeof obj !== "object") {
              return obj;
            }

            if (Array.isArray(obj)) {
              return obj.map(item => processObject(item));
            }

            const result: any = {};
            Object.keys(obj).forEach(key => {
              if (typeof obj[key] === "string" && obj[key].includes("${")) {
                const regex = /\${([^}]+)}/g;
                result[key] = obj[key].replace(regex, (match, varName) => {
                  const value = global.flowVariables[varName];

                  return value !== undefined
                    ? typeof value === "object"
                      ? JSON.stringify(value)
                      : value
                    : match;
                });
              } else if (typeof obj[key] === "object") {
                result[key] = processObject(obj[key]);
              } else {
                result[key] = obj[key];
              }
            });
            return result;
          };

          processedBody = processObject(body);
        }
      }
    } catch (error) {
      logger.error(error);

      processedBody = body;
    }

    const httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === "production"
    });

    const limitedTimeout = Math.min(Math.max(1000, timeout), 45000);

    const config: any = {
      url: processedUrl,
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        ...processedHeaders
      },
      httpsAgent,
      timeout: limitedTimeout
    };

    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase()) &&
      processedBody
    ) {
      config.data =
        typeof processedBody === "string"
          ? processedBody
          : JSON.stringify(processedBody);
    }

    const response = await axios(config);

    return {
      data: response.data,
      status: response.status,
      headers: response.headers
    };
  } catch (error) {
    logger.error(
      `Erro na requisição HTTP (${method} ${url}): ${error.message}`
    );

    if (error.response) {
      logger.error(`Resposta de erro com status ${error.response.status}`);
      return {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
        error: true
      };
    }

    logger.error(`Erro sem resposta do servidor: ${error}`);
    return {
      error: true,
      message: error.message,
      status: 500
    };
  }
};

export const getFlowVariable = (name: string): any => {
  if (!global.flowVariables) {
    global.flowVariables = {};
    return undefined;
  }

  const value = global.flowVariables[name];

  return value;
};

export const setFlowVariable = (name: string, value: any): any => {
  if (!global.flowVariables) {
    global.flowVariables = {};
  }

  global.flowVariables[name] = value;

  const savedValue = global.flowVariables[name];
  if (savedValue !== value && typeof value !== "object") {
  }

  return value;
};

const intervalWhats = (time: string) => {
  const seconds = parseInt(time) * 1000;
  return new Promise(resolve => setTimeout(resolve, seconds));
};

const replaceMessages = (
  message: string,
  details: any,
  dataWebhook: any,
  dataNoWebhook?: DataNoWebhook,
  ticketId?: number
) => {
  if (!message) return "";

  try {
    global.flowVariables = global.flowVariables || {};

    const regexNewFormat = /\$\{([^}]+)\}/g;
    let processedMessage = message.replace(regexNewFormat, (match, varName) => {
      let varValue = global.flowVariables[varName];

      // Se temos um ticketId, verificar primeiro a variável específica do ticket
      if (ticketId) {
        const ticketSpecificVar = `${ticketId}_${varName}`;
        const ticketSpecificValue = global.flowVariables[ticketSpecificVar];
        if (ticketSpecificValue !== undefined && ticketSpecificValue !== null) {
          varValue = ticketSpecificValue;
        }
      }

      if (varValue !== undefined) {
        return typeof varValue === "object"
          ? JSON.stringify(varValue)
          : String(varValue);
      }

      return match;
    });

    const matches = processedMessage.match(/\{([^}]+)\}/g);

    if (dataWebhook && dataNoWebhook) {
      let newTxt = processedMessage;
      if (dataNoWebhook.nome) {
        newTxt = newTxt.replace(/{+nome}+/g, dataNoWebhook.nome);
      }
      if (dataNoWebhook.numero) {
        newTxt = newTxt.replace(/{+numero}+/g, dataNoWebhook.numero);
      }
      if (dataNoWebhook.email) {
        newTxt = newTxt.replace(/{+email}+/g, dataNoWebhook.email);
      }

      return newTxt;
    }

    if (matches && matches.includes("inputs")) {
      const placeholders = matches.map(match => match.replace(/\{|\}/g, ""));
      let newText = processedMessage;
      placeholders.map(item => {
        const value = details["inputs"].find(
          itemLocal => itemLocal.keyValue === item
        );
        if (value) {
          const lineToData = details["keysFull"].find(itemLocal =>
            itemLocal.endsWith(`.${value.data}`)
          );
          if (lineToData) {
            const createFieldJson = constructJsonLine(lineToData, dataWebhook);
            newText = newText.replace(`{${item}}`, createFieldJson);
          }
        }
      });
      return newText;
    } else {
      return processedMessage;
    }
  } catch (error) {
    logger.error(`Erro ao processar variáveis: ${error}`);
    return message;
  }
};

export { finalizeTriggeredFlow };