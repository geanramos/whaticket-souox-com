import CompaniesSettings from "../../models/CompaniesSettings";
import Ticket from "../../models/Ticket";
import TicketTraking from "../../models/TicketTraking";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { IMessageReceived } from "./ReceivedWhatsApp";

import formatBody from "../../helpers/Mustache";
import path from "path";
import fs from "fs";

import { isNil } from "lodash";
import SendWhatsAppOficialMessage from "./SendWhatsAppOficialMessage";
import { getMessageOptions } from "../WbotServices/SendWhatsAppMedia";
import ShowFileService from "../FileServices/ShowService";
import logger from "../../utils/logger";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import ListUserQueueServices from "../UserQueueServices/ListUserQueueServices";
import Queue from "../../models/Queue";
import VerifyCurrentSchedule from "../CompanyService/VerifyCurrentSchedule";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";
import { IMetaMessageinteractive, IMetaMessageinteractiveActionSections, IMetaMessageinteractiveActionSectionsRows } from "../../libs/whatsAppOficial/IWhatsAppOficial.interfaces";


const verifyQueueOficial = async (
    msg: IMessageReceived,
    ticket: Ticket,
    settings?: CompaniesSettings,
    ticketTraking?: TicketTraking
) => {
    const companyId = ticket.companyId;
    // console.log("GETTING WHATSAPP VERIFY QUEUE", ticket.whatsappId, wbot.id)
    const { queues, greetingMessage, maxUseBotQueues, timeUseBotQueues } = await ShowWhatsAppService(ticket.whatsappId!, companyId);

    let chatbot = false;

    if (queues.length === 1) {

        chatbot = queues[0]?.chatbots.length > 1;
    }

    const enableQueuePosition = settings.sendQueuePosition === "enabled";

    if (queues.length === 1 && !chatbot) {
        const sendGreetingMessageOneQueues = settings.sendGreetingMessageOneQueues === "enabled" || false;

        if (greetingMessage.length > 1 && sendGreetingMessageOneQueues) {

            const body = formatBody(`${greetingMessage}`, ticket);

            if (ticket.whatsapp.greetingMediaAttachment !== null) {
                const filePath = path.resolve("public", `company${companyId}`, ticket.whatsapp.greetingMediaAttachment);

                const fileExists = fs.existsSync(filePath);

                if (fileExists) {

                    const messagePath = ticket.whatsapp.greetingMediaAttachment

                    const media = await getMessageOptions(messagePath, filePath, String(companyId), body);

                    await SendWhatsAppOficialMessage({
                        media, body, ticket, type: null
                    })
                } else {
                    await SendWhatsAppOficialMessage({
                        body, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                    })
                }
            } else {
                await SendWhatsAppOficialMessage({
                    body, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                })
            }
        }

        if (!isNil(queues[0].fileListId)) {
            try {
                const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

                const files = await ShowFileService(queues[0].fileListId, ticket.companyId)

                const folder = path.resolve(publicFolder, `company${ticket.companyId}`, "fileList", String(files.id))

                for (const [index, file] of files.options.entries()) {
                    const mediaSrc = {
                        fieldname: 'medias',
                        originalname: file.path,
                        encoding: '7bit',
                        mimetype: file.mediaType,
                        filename: file.path,
                        path: path.resolve(folder, file.path),
                    } as Express.Multer.File

                    await SendWhatsAppOficialMessage({
                        media: mediaSrc, body: file.name, ticket, type: null
                    })
                };

            } catch (error) {
                logger.info(error);
            }
        }

        if (queues[0].closeTicket) {
            await UpdateTicketService({
                ticketData: {
                    status: "closed",
                    queueId: queues[0].id,
                    sendFarewellMessage: false
                },
                ticketId: ticket.id,
                companyId
            });

            return;
        } else {
            await UpdateTicketService({
                ticketData: { queueId: queues[0].id, status: ticket.status === "lgpd" ? "pending" : ticket.status },
                ticketId: ticket.id,
                companyId
            });
        }

        const count = await Ticket.findAndCountAll({
            where: {
                userId: null,
                status: "pending",
                companyId,
                queueId: queues[0].id,
                isGroup: false
            }
        });

        if (enableQueuePosition) {
            // Lógica para enviar posição da fila de atendimento
            const qtd = count.count === 0 ? 1 : count.count
            const msgFila = `${settings.sendQueuePositionMessage} *${qtd}*`;
            // const msgFila = `*Assistente Virtual:*\n{{ms}} *{{name}}*, sua posição na fila de atendimento é: *${qtd}*`;
            const bodyFila = formatBody(`${msgFila}`, ticket);
            await SendWhatsAppOficialMessage({
                body: bodyFila, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
            })
        }

        return;
    }


    // REGRA PARA DESABILITAR O BOT PARA ALGUM CONTATO
    if (ticket.contact.disableBot) {
        return;
    }

    let selectedOption = "";

    if (ticket.status !== "lgpd") {
        selectedOption = msg.text
    } else {
        if (!isNil(ticket.lgpdAcceptedAt))
            await ticket.update({
                status: "pending"
            });

        await ticket.reload();
    }

    if (String(selectedOption).toLocaleLowerCase() == "sair") {
        // Encerra atendimento

        const ticketData = {
            isBot: false,
            status: "closed",
            sendFarewellMessage: true,
            maxUseBotQueues: 0
        };

        await UpdateTicketService({ ticketData, ticketId: ticket.id, companyId })

        return;
    }

    let choosenQueue = (chatbot && queues.length === 1) ? queues[+selectedOption] : queues[+selectedOption - 1];

    const typeBot = settings?.chatBotType || "text";

    // Serviço p/ escolher consultor aleatório para o ticket, ao selecionar fila.


    const botText = async () => {
        if (choosenQueue || (queues.length === 1 && chatbot)) {
            // console.log("entrou no choose", ticket.isOutOfHour, ticketTraking.chatbotAt)
            if (queues.length === 1) choosenQueue = queues[0]
            const queue = await Queue.findByPk(choosenQueue.id);

            if (ticket.isOutOfHour === false && ticketTraking.chatbotAt !== null) {
                await ticketTraking.update({
                    chatbotAt: null
                });
                await ticket.update({
                    amountUsedBotQueues: 0
                });
            }

            let currentSchedule;

            if (settings?.scheduleType === "queue") {
                currentSchedule = await VerifyCurrentSchedule(companyId, queue.id, 0);
            }

            if (
                settings?.scheduleType === "queue" && ticket.status !== "open" &&
                !isNil(currentSchedule) && (ticket.amountUsedBotQueues < maxUseBotQueues || maxUseBotQueues === 0)
                && (!currentSchedule || currentSchedule.inActivity === false)
                && (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled")
            ) {
                if (timeUseBotQueues !== "0") {
                    //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
                    //const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
                    let dataLimite = new Date();
                    let Agora = new Date();


                    if (ticketTraking.chatbotAt !== null) {
                        dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));

                        if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
                            return
                        }
                    }
                    await ticketTraking.update({
                        chatbotAt: null
                    })
                }

                const outOfHoursMessage = queue.outOfHoursMessage;

                if (outOfHoursMessage !== "") {
                    // console.log("entrei3");
                    const body = formatBody(`${outOfHoursMessage}`, ticket);

                    await SendWhatsAppOficialMessage({
                        body, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                    })
                }
                //atualiza o contador de vezes que enviou o bot e que foi enviado fora de hora
                await ticket.update({
                    queueId: queue.id,
                    isOutOfHour: true,
                    amountUsedBotQueues: ticket.amountUsedBotQueues + 1
                });
                return;
            }

            await UpdateTicketService({
                ticketData: { amountUsedBotQueues: 0, queueId: choosenQueue.id },
                ticketId: ticket.id,
                companyId
            });
            // }

            if (choosenQueue.chatbots.length > 0 && !ticket.isGroup) {
                let buttonsData: IMetaMessageinteractive;

                if (choosenQueue.chatbots.length > 3) {
                    let options = "";
                    choosenQueue.chatbots.forEach((chatbot, index) => {
                        options += `*[ ${index + 1} ]* - ${chatbot.name}\n`;
                    });

                    const body = formatBody(
                        `${choosenQueue.greetingMessage}\n\n${options}\n*[ # ]* Voltar para o menu principal\n*[ Sair ]* Encerrar atendimento`,
                        ticket
                    );

                    await SendWhatsAppOficialMessage({
                        body, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                    })
                } else {
                    const body = formatBody(choosenQueue.greetingMessage, ticket);
                    buttonsData = {
                        type: 'button',
                        body: {
                            text: body
                        },
                        action: {
                            buttons: queues.map((queue, index) => ({
                                type: 'reply',
                                reply: {
                                    id: `${index + 1}`,
                                    title: queue.name
                                }
                            }))
                        }
                    } as IMetaMessageinteractive
                    // const bodyToSave = `${body}\n\n||||${buttonsData.action.buttons.map(button => button.reply.title).join('\n')}`
                    await SendWhatsAppOficialMessage({
                        body, ticket, quotedMsg: null, type: 'interactive', media: null, vCard: null, interative: buttonsData
                    })
                }

                if (settings?.userRandom === "enabled") {
                    let randomUserId;

                    if (choosenQueue) {
                        try {
                            const userQueue = await ListUserQueueServices(choosenQueue.id);

                            if (userQueue.userId > -1) {
                                randomUserId = userQueue.userId;
                            }

                        } catch (error) {
                            console.error(error);
                        }
                    }

                    if (randomUserId) {
                        await UpdateTicketService({
                            ticketData: { userId: randomUserId },
                            ticketId: ticket.id,
                            companyId
                        });
                    }
                }
            }

            if (!choosenQueue.chatbots.length && choosenQueue.greetingMessage.length !== 0) {
                const body = formatBody(
                    choosenQueue.greetingMessage,
                    ticket
                );
                await SendWhatsAppOficialMessage({
                    body, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                })
            }

            if (!isNil(choosenQueue.fileListId)) {
                try {

                    const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

                    const files = await ShowFileService(choosenQueue.fileListId, ticket.companyId)

                    const folder = path.resolve(publicFolder, `company${ticket.companyId}`, "fileList", String(files.id))

                    for (const [index, file] of files.options.entries()) {
                        const mediaSrc = {
                            fieldname: 'medias',
                            originalname: file.path,
                            encoding: '7bit',
                            mimetype: file.mediaType,
                            filename: file.path,
                            path: path.resolve(folder, file.path),
                        } as Express.Multer.File

                        await SendWhatsAppOficialMessage({
                            media: mediaSrc, body: file.name, ticket, type: null
                        })
                    };


                } catch (error) {
                    logger.info(error);
                }
            }

            //se fila está parametrizada para encerrar ticket automaticamente
            if (choosenQueue.closeTicket) {
                try {

                    await UpdateTicketService({
                        ticketData: {
                            status: "closed",
                            queueId: choosenQueue.id,
                            sendFarewellMessage: false,
                        },
                        ticketId: ticket.id,
                        companyId,
                    });
                } catch (error) {
                    logger.info(error);
                }

                return;
            }

            const count = await Ticket.findAndCountAll({
                where: {
                    userId: null,
                    status: "pending",
                    companyId,
                    queueId: choosenQueue.id,
                    whatsappId: ticket.whatsappId,
                    isGroup: false
                }
            });

            await CreateLogTicketService({
                ticketId: ticket.id,
                type: "queue",
                queueId: choosenQueue.id,
            });

            if (enableQueuePosition && !choosenQueue.chatbots.length) {
                // Lógica para enviar posição da fila de atendimento
                const qtd = count.count === 0 ? 1 : count.count
                const msgFila = `${settings.sendQueuePositionMessage} *${qtd}*`;
                // const msgFila = `*Assistente Virtual:*\n{{ms}} *{{name}}*, sua posição na fila de atendimento é: *${qtd}*`;
                const bodyFila = formatBody(`${msgFila}`, ticket);

                await SendWhatsAppOficialMessage({
                    body: bodyFila, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                })
            }


        } else {

            if (ticket.isGroup) return;

            if (maxUseBotQueues && maxUseBotQueues !== 0 && ticket.amountUsedBotQueues >= maxUseBotQueues) {
                // await UpdateTicketService({
                //   ticketData: { queueId: queues[0].id },
                //   ticketId: ticket.id
                // });

                return;
            }

            if (timeUseBotQueues !== "0") {
                //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
                //const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
                let dataLimite = new Date();
                let Agora = new Date();


                if (ticketTraking.chatbotAt !== null) {
                    dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));

                    if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
                        return
                    }
                }
                await ticketTraking.update({
                    chatbotAt: null
                })
            }

            let options = "";
            let body;
            let buttonsData: IMetaMessageinteractive;
            if (queues.length > 3) {
                const rows: IMetaMessageinteractiveActionSectionsRows[] = queues.map((queue, index) => ({
                    id: `${index + 1}`,  // Certifique-se de que 'id' está definido como string
                    title: queue.name    // Certifique-se de que 'title' está definido
                }));

                rows.push({
                    id: "Sair",          // Certifique-se de que 'id' está definido como string
                    title: "Encerrar atendimento" // Certifique-se de que 'title' está definido
                });

                const sections: IMetaMessageinteractiveActionSections[] = [{
                    title: "Escolha uma opção",
                    rows
                }];

                buttonsData = {
                    type: 'list',
                    body: {
                        text: formatBody(greetingMessage, ticket)
                    },
                    action: {
                        sections,
                        button: "Clique aqui para escolher uma opção"
                    }
                } as IMetaMessageinteractive
                console.log(JSON.stringify(buttonsData, null, 2))
            } else {
                buttonsData = {
                    type: 'button',
                    body: {
                        text: formatBody(greetingMessage, ticket)
                    },
                    action: {
                        buttons: queues.map((queue, index) => ({
                            type: 'reply',
                            reply: {
                                id: `${index + 1}`,
                                title: queue.name
                            }
                        }))
                    }
                } as IMetaMessageinteractive
            }
           
            let bodyToSave = '';
            queues.forEach((queue, index) => {
                options += `*[ ${index + 1} ]* - ${queue.name}\n`;
            });
            options += `\n*[ Sair ]* - Encerrar atendimento`;

            bodyToSave = formatBody(
                `${greetingMessage}\n\n${options}`,
                ticket
            );

            await CreateLogTicketService({
                ticketId: ticket.id,
                type: "chatBot",
            });

            if (ticket.whatsapp.greetingMediaAttachment !== null) {
                const filePath = path.resolve("public", `company${companyId}`, ticket.whatsapp.greetingMediaAttachment);

                const fileExists = fs.existsSync(filePath);
                // console.log(fileExists);
                if (fileExists) {
                    const messagePath = ticket.whatsapp.greetingMediaAttachment
                    const mediaSrc = await getMessageOptions(messagePath, filePath, String(companyId), body);

                    await SendWhatsAppOficialMessage({
                        media: mediaSrc, body, ticket, type: null
                    })
                } else {
                    await SendWhatsAppOficialMessage({
                        body, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                    })

                }
                await UpdateTicketService({
                    ticketData: { amountUsedBotQueues: ticket.amountUsedBotQueues + 1 },
                    ticketId: ticket.id,
                    companyId
                });

                return
            } else {
                await SendWhatsAppOficialMessage({
                    body, ticket, quotedMsg: null, type: 'interactive', media: null, vCard: null, interative: buttonsData, bodyToSave
                })

                await UpdateTicketService({
                    ticketData: { amountUsedBotQueues: ticket.amountUsedBotQueues + 1 },
                    ticketId: ticket.id,
                    companyId
                });
            }
        }
    };

    const botButton = async () => {
        if (choosenQueue || (queues.length === 1 && chatbot)) {
            // console.log("entrou no choose", ticket.isOutOfHour, ticketTraking.chatbotAt)
            if (queues.length === 1) choosenQueue = queues[0]
            const queue = await Queue.findByPk(choosenQueue.id);

            if (ticket.isOutOfHour === false && ticketTraking.chatbotAt !== null) {
                await ticketTraking.update({
                    chatbotAt: null
                });
                await ticket.update({
                    amountUsedBotQueues: 0
                });
            }

            let currentSchedule;

            if (settings?.scheduleType === "queue") {
                currentSchedule = await VerifyCurrentSchedule(companyId, queue.id, 0);
            }

            if (
                settings?.scheduleType === "queue" && ticket.status !== "open" &&
                !isNil(currentSchedule) && (ticket.amountUsedBotQueues < maxUseBotQueues || maxUseBotQueues === 0)
                && (!currentSchedule || currentSchedule.inActivity === false)
                && (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled")
            ) {
                if (timeUseBotQueues !== "0") {
                    //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
                    //const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
                    let dataLimite = new Date();
                    let Agora = new Date();


                    if (ticketTraking.chatbotAt !== null) {
                        dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));

                        if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
                            return
                        }
                    }
                    await ticketTraking.update({
                        chatbotAt: null
                    })
                }

                const outOfHoursMessage = queue.outOfHoursMessage;

                if (outOfHoursMessage !== "") {
                    // console.log("entrei3");
                    const body = formatBody(`${outOfHoursMessage}`, ticket);

                    await SendWhatsAppOficialMessage({
                        body, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                    })
                }
                //atualiza o contador de vezes que enviou o bot e que foi enviado fora de hora
                await ticket.update({
                    queueId: queue.id,
                    isOutOfHour: true,
                    amountUsedBotQueues: ticket.amountUsedBotQueues + 1
                });
                return;
            }

            await UpdateTicketService({
                ticketData: { amountUsedBotQueues: 0, queueId: choosenQueue.id },
                ticketId: ticket.id,
                companyId
            });
            // }

            if (choosenQueue.chatbots.length > 0 && !ticket.isGroup) {
                let buttonsData: IMetaMessageinteractive;

                if (choosenQueue.chatbots.length > 3) {
                    let options = "";
                    choosenQueue.chatbots.forEach((chatbot, index) => {
                        options += `*[ ${index + 1} ]* - ${chatbot.name}\n`;
                    });

                    const body = formatBody(
                        `${choosenQueue.greetingMessage}\n\n${options}\n*[ # ]* Voltar para o menu principal\n*[ Sair ]* Encerrar atendimento`,
                        ticket
                    );

                    await SendWhatsAppOficialMessage({
                        body, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                    })
                } else {
                    const body = formatBody(choosenQueue.greetingMessage, ticket);
                    buttonsData = {
                        type: 'button',
                        body: {
                            text: body
                        },
                        action: {
                            buttons: queues.map((queue, index) => ({
                                type: 'reply',
                                reply: {
                                    id: `${index + 1}`,
                                    title: queue.name
                                }
                            }))
                        }
                    } as IMetaMessageinteractive
                    // const bodyToSave = `${body}\n\n||||${buttonsData.action.buttons.map(button => button.reply.title).join('\n')}`
                    await SendWhatsAppOficialMessage({
                        body, ticket, quotedMsg: null, type: 'interactive', media: null, vCard: null, interative: buttonsData
                    })
                }

                if (settings?.userRandom === "enabled") {
                    let randomUserId;

                    if (choosenQueue) {
                        try {
                            const userQueue = await ListUserQueueServices(choosenQueue.id);

                            if (userQueue.userId > -1) {
                                randomUserId = userQueue.userId;
                            }

                        } catch (error) {
                            console.error(error);
                        }
                    }

                    if (randomUserId) {
                        await UpdateTicketService({
                            ticketData: { userId: randomUserId },
                            ticketId: ticket.id,
                            companyId
                        });
                    }
                }
            }

            if (!choosenQueue.chatbots.length && choosenQueue.greetingMessage.length !== 0) {
                const body = formatBody(
                    choosenQueue.greetingMessage,
                    ticket
                );
                await SendWhatsAppOficialMessage({
                    body, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                })
            }

            if (!isNil(choosenQueue.fileListId)) {
                try {

                    const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

                    const files = await ShowFileService(choosenQueue.fileListId, ticket.companyId)

                    const folder = path.resolve(publicFolder, `company${ticket.companyId}`, "fileList", String(files.id))

                    for (const [index, file] of files.options.entries()) {
                        const mediaSrc = {
                            fieldname: 'medias',
                            originalname: file.path,
                            encoding: '7bit',
                            mimetype: file.mediaType,
                            filename: file.path,
                            path: path.resolve(folder, file.path),
                        } as Express.Multer.File

                        await SendWhatsAppOficialMessage({
                            media: mediaSrc, body: file.name, ticket, type: null
                        })
                    };


                } catch (error) {
                    logger.info(error);
                }
            }

            //se fila está parametrizada para encerrar ticket automaticamente
            if (choosenQueue.closeTicket) {
                try {

                    await UpdateTicketService({
                        ticketData: {
                            status: "closed",
                            queueId: choosenQueue.id,
                            sendFarewellMessage: false,
                        },
                        ticketId: ticket.id,
                        companyId,
                    });
                } catch (error) {
                    logger.info(error);
                }

                return;
            }

            const count = await Ticket.findAndCountAll({
                where: {
                    userId: null,
                    status: "pending",
                    companyId,
                    queueId: choosenQueue.id,
                    whatsappId: ticket.whatsappId,
                    isGroup: false
                }
            });

            await CreateLogTicketService({
                ticketId: ticket.id,
                type: "queue",
                queueId: choosenQueue.id,
            });

            if (enableQueuePosition && !choosenQueue.chatbots.length) {
                // Lógica para enviar posição da fila de atendimento
                const qtd = count.count === 0 ? 1 : count.count
                const msgFila = `${settings.sendQueuePositionMessage} *${qtd}*`;
                // const msgFila = `*Assistente Virtual:*\n{{ms}} *{{name}}*, sua posição na fila de atendimento é: *${qtd}*`;
                const bodyFila = formatBody(`${msgFila}`, ticket);

                await SendWhatsAppOficialMessage({
                    body: bodyFila, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                })
            }


        } else {

            if (ticket.isGroup) return;

            if (maxUseBotQueues && maxUseBotQueues !== 0 && ticket.amountUsedBotQueues >= maxUseBotQueues) {
                // await UpdateTicketService({
                //   ticketData: { queueId: queues[0].id },
                //   ticketId: ticket.id
                // });

                return;
            }

            if (timeUseBotQueues !== "0") {
                //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
                //const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
                let dataLimite = new Date();
                let Agora = new Date();


                if (ticketTraking.chatbotAt !== null) {
                    dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));

                    if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
                        return
                    }
                }
                await ticketTraking.update({
                    chatbotAt: null
                })
            }

            let options = "";
            let body;
            let buttonsData: IMetaMessageinteractive;



            if (queues.length > 3) {
                const rows: IMetaMessageinteractiveActionSectionsRows[] = queues.map((queue, index) => ({
                    id: `${index + 1}`,  // Certifique-se de que 'id' está definido como string
                    title: queue.name    // Certifique-se de que 'title' está definido
                }));

                rows.push({
                    id: "Sair",          // Certifique-se de que 'id' está definido como string
                    title: "Encerrar atendimento" // Certifique-se de que 'title' está definido
                });

                const sections: IMetaMessageinteractiveActionSections[] = [{
                    title: "Escolha uma opção",
                    rows
                }];

                buttonsData = {
                    type: 'list',
                    body: {
                        text: formatBody(greetingMessage, ticket)
                    },
                    action: {
                        sections
                    }
                } as IMetaMessageinteractive
                console.log(JSON.stringify(buttonsData, null, 2))
            } else {
                buttonsData = {
                    type: 'button',
                    body: {
                        text: formatBody(greetingMessage, ticket)
                    },
                    action: {
                        buttons: queues.map((queue, index) => ({
                            type: 'reply',
                            reply: {
                                id: `${index + 1}`,
                                title: queue.name
                            }
                        }))
                    }
                } as IMetaMessageinteractive
            }

            let bodyToSave = '';
            queues.forEach((queue, index) => {
                options += `*[ ${index + 1} ]* - ${queue.name}\n`;
            });
            options += `\n*[ Sair ]* - Encerrar atendimento`;

            bodyToSave = formatBody(
                `${greetingMessage}\n\n${options}`,
                ticket
            );

            await CreateLogTicketService({
                ticketId: ticket.id,
                type: "chatBot",
            });

            if (ticket.whatsapp.greetingMediaAttachment !== null && queues.length > 3) {
                const filePath = path.resolve("public", `company${companyId}`, ticket.whatsapp.greetingMediaAttachment);

                const fileExists = fs.existsSync(filePath);
                // console.log(fileExists);
                if (fileExists) {
                    const messagePath = ticket.whatsapp.greetingMediaAttachment
                    const mediaSrc = await getMessageOptions(messagePath, filePath, String(companyId), body);

                    await SendWhatsAppOficialMessage({
                        media: mediaSrc, body, ticket, type: null, bodyToSave
                    })
                } else {
                    await SendWhatsAppOficialMessage({
                        body, ticket, quotedMsg: null, type: 'text', media: null, vCard: null
                    })

                }
                await UpdateTicketService({
                    ticketData: { amountUsedBotQueues: ticket.amountUsedBotQueues + 1 },
                    ticketId: ticket.id,
                    companyId
                });

                return
            } else {
                await SendWhatsAppOficialMessage({
                    body: bodyToSave, ticket, quotedMsg: null, type: 'interactive', media: null, vCard: null, interative: buttonsData
                })

                await UpdateTicketService({
                    ticketData: { amountUsedBotQueues: ticket.amountUsedBotQueues + 1 },
                    ticketId: ticket.id,
                    companyId
                });
            }
        }
    }

    const botList = async () => {

    }
    if (typeBot === "button" && queues.length <= 3) {
        return botButton();
    }

    if (typeBot === "text") {
        return botText();
    }

    if (typeBot === "button" && queues.length > 3) {
        return botList();
    }

};

export default verifyQueueOficial;