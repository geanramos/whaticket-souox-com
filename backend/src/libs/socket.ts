import { Server as SocketIO } from "socket.io";
import { Server } from "http";
import AppError from "../errors/AppError";
import logger from "../utils/logger";
import { instrument } from "@socket.io/admin-ui";
import User from "../models/User";
import { ReceibedWhatsAppService } from "../services/WhatsAppOficial/ReceivedWhatsApp";
import { JwtPayload, verify } from "jsonwebtoken";
import authConfig from "../config/auth";
import BirthdayService from "../services/BirthdayService/BirthdayService";

let io: SocketIO;

export const initIO = (httpServer: Server): SocketIO => {
  io = new SocketIO(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL
    }
  });

  if (process.env.SOCKET_ADMIN && JSON.parse(process.env.SOCKET_ADMIN)) {
    User.findByPk(1).then(
      (adminUser) => {
        instrument(io, {
          auth: {
            type: "basic",
            username: adminUser.email,
            password: adminUser.passwordHash
          },
          mode: "development",
        });
      }
    );
  }

  const workspaces = io.of(/^\/\w+$/);
  workspaces.on("connection", socket => {

    const token_api_oficial = process.env.TOKEN_API_OFICIAL || "";
    const token = Array.isArray(socket?.handshake?.query?.token) ? socket.handshake.query.token[1] : socket?.handshake?.query?.token?.split(" ")[1];

    if (!token) {
      return socket.disconnect();
    }

    if (token !== token_api_oficial) {
      try {
        const decoded = verify(token, authConfig.secret);
        const companyId = socket.nsp.name.split("/")[1]

        const decodedPayload = decoded as JwtPayload;
        const companyIdToken = decodedPayload.companyId;

        if (+companyIdToken !== +companyId) {
          logger.error(`CompanyId do token ${companyIdToken} diferente da companyId do socket ${companyId}`)
          return socket.disconnect();
        }
      } catch (error) {
        logger.error(JSON.stringify(error), "Error decoding token");
        if (error.message !== "jwt expired") {
          return socket.disconnect();
        }
      }
    } else {
      logger.info(`Client connected namespace ${socket.nsp.name}`);
      logger.info(`Conectado com sucesso na API OFICIAL`);
    }

    // 🎂 ADICIONAR: Eventos de heartbeat e gerenciamento de usuários
    const handleHeartbeat = async (socket: any) => {
      try {
        const companyId = socket.nsp.name.split("/")[1];
        const decoded = verify(token !== token_api_oficial ? token : "", authConfig.secret);
        const decodedPayload = decoded as JwtPayload;
        const userId = decodedPayload.id;

        await User.update(
          {
            online: true,
            lastSeen: new Date()
          },
          { where: { id: userId } }
        );

        socket.broadcast.to(`company-${companyId}`).emit("user:online", {
          userId,
          lastSeen: new Date()
        });

        clearTimeout(socket.heartbeatTimeout);
        socket.heartbeatTimeout = setTimeout(async () => {
          await User.update(
            {
              online: false,
              lastSeen: new Date()
            },
            { where: { id: userId } }
          );
          socket.broadcast.to(`company-${companyId}`).emit("user:offline", {
            userId,
            lastSeen: new Date()
          });
        }, 30000);
      } catch (error) {
        logger.error("Error in handleHeartbeat:", error);
      }
    };

    // 🎂 NOVO: Handler para verificar aniversários quando usuário se conecta
    const checkAndEmitBirthdays = async (companyId: number) => {
      try {
        const birthdayData = await BirthdayService.getTodayBirthdaysForCompany(companyId);
        
        // Emitir eventos de aniversário se houver aniversariantes
        if (birthdayData.users.length > 0) {
          birthdayData.users.forEach(user => {
            socket.to(`company-${companyId}`).emit("user-birthday", {
              user: {
                id: user.id,
                name: user.name,
                age: user.age
              }
            });
            logger.info(`🎂 Emitido evento de aniversário para usuário: ${user.name}`);
          });
        }

        if (birthdayData.contacts.length > 0) {
          birthdayData.contacts.forEach(contact => {
            socket.to(`company-${companyId}`).emit("contact-birthday", {
              contact: {
                id: contact.id,
                name: contact.name,
                age: contact.age
              }
            });
            logger.info(`🎂 Emitido evento de aniversário para contato: ${contact.name}`);
          });
        }
      } catch (error) {
        logger.error("🎂 Error checking birthdays:", error);
      }
    };

    // 🎂 EVENTO: Quando cliente se conecta
    socket.on("connect", async () => {
      try {
        if (token !== token_api_oficial) {
          const decoded = verify(token, authConfig.secret);
          const decodedPayload = decoded as JwtPayload;
          const userId = decodedPayload.id;
          const companyId = parseInt(socket.nsp.name.split("/")[1]);

          socket.join(`company-${companyId}`);
          
          // Buscar dados do usuário
          const user = await User.findByPk(userId, {
            attributes: ["id", "name", "profileImage", "lastSeen"]
          });

          socket.broadcast.to(`company-${companyId}`).emit("user:new", {
            userId,
            user
          });

          // Buscar usuários online
          const onlineUsers = await User.findAll({
            where: {
              companyId,
              online: true
            },
            attributes: ["id", "name", "profileImage", "lastSeen"]
          });

          socket.emit("users:online", onlineUsers);

          // 🎂 NOVO: Verificar e emitir aniversários quando usuário se conecta
          await checkAndEmitBirthdays(companyId);
        }
      } catch (error) {
        logger.error("Error in socket connect:", error);
      }
    });

    // 🎂 NOVO: Evento para solicitar verificação manual de aniversários
    socket.on("checkBirthdays", async () => {
      try {
        const companyId = parseInt(socket.nsp.name.split("/")[1]);
        await checkAndEmitBirthdays(companyId);
      } catch (error) {
        logger.error("🎂 Error in manual birthday check:", error);
      }
    });

    // Eventos existentes
    socket.on("joinChatBox", (ticketId: string) => {
      socket.join(ticketId);
    });

    socket.on("joinNotification", () => {
      socket.join("notification");
    });

    socket.on("joinVersion", () => {
      logger.info(`A client joined version channel namespace ${socket.nsp.name}`);
      socket.join("version");
    });

    socket.on("joinTickets", (status: string) => {
      socket.join(status);
    });

    socket.on("joinTicketsLeave", (status: string) => {
      socket.leave(status);
    });

    socket.on("joinChatBoxLeave", (ticketId: string) => {
      socket.leave(ticketId);
    });

    socket.on("receivedMessageWhatsAppOficial", (data: any) => {
      const receivedService = new ReceibedWhatsAppService();
      receivedService.getMessage(data);
    });

    socket.on("readMessageWhatsAppOficial", (data: any) => {
      const receivedService = new ReceibedWhatsAppService();
      receivedService.readMessage(data);
    });

    // 🎂 NOVO: Heartbeat para manter usuário online e verificar aniversários periodicamente
    socket.on("heartbeat", () => handleHeartbeat(socket));

    // 🎂 EVENTO: Quando cliente se desconecta
    socket.on("disconnect", async () => {
      try {
        if (token !== token_api_oficial) {
          const companyId = parseInt(socket.nsp.name.split("/")[1]);
          const decoded = verify(token, authConfig.secret);
          const decodedPayload = decoded as JwtPayload;
          const userId = decodedPayload.id;

          await User.update(
            {
              online: false,
              lastSeen: new Date()
            },
            { where: { id: userId } }
          );

          socket.broadcast.to(`company-${companyId}`).emit("user:offline", {
            userId,
            lastSeen: new Date()
          });
        }
      } catch (error) {
        logger.error("Error in socket disconnect:", error);
      }
    });

  });
  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket IO not initialized");
  }
  return io;
};

// 🎂 NOVA FUNÇÃO: Emitir eventos de aniversário para uma empresa específica
export const emitBirthdayEvents = async (companyId: number) => {
  try {
    if (!io) return;

    const birthdayData = await BirthdayService.getTodayBirthdaysForCompany(companyId);
    
    // Emitir para todos os usuários da empresa
    if (birthdayData.users.length > 0) {
      birthdayData.users.forEach(user => {
        io.of(`/${companyId}`).emit("user-birthday", {
          user: {
            id: user.id,
            name: user.name,
            age: user.age
          }
        });
        logger.info(`🎂 [GLOBAL] Emitido evento de aniversário para usuário: ${user.name}`);
      });
    }

    if (birthdayData.contacts.length > 0) {
      birthdayData.contacts.forEach(contact => {
        io.of(`/${companyId}`).emit("contact-birthday", {
          contact: {
            id: contact.id,
            name: contact.name,
            age: contact.age
          }
        });
        logger.info(`🎂 [GLOBAL] Emitido evento de aniversário para contato: ${contact.name}`);
      });
    }
  } catch (error) {
    logger.error("🎂 [GLOBAL] Error emitting birthday events:", error);
  }
};