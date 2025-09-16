import { getIO } from "../../libs/socket";
import ChatMessage from "../../models/ChatMessage";
import User from "../../models/User";

interface Request {
  messageId: number;
  userId: number;
  companyId: number;
}

const DeleteMessageService = async ({
  messageId,
  userId,
  companyId
}: Request): Promise<ChatMessage> => {
  const chatMessage = await ChatMessage.findByPk(messageId, {
    include: [
      { model: User, as: "sender", attributes: ["id", "name", "profileImage"] },
      {
        model: ChatMessage,
        as: "replyTo",
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "name", "profileImage"]
          }
        ],
        attributes: ["id", "message"]
      }
    ]
  });

  if (!chatMessage) {
    throw new Error("Message not found");
  }

  if (chatMessage.senderId !== userId) {
    throw new Error("You can only delete your own messages");
  }

  await chatMessage.update({
    isDeleted: true
  });

  const io = getIO();
  io.of(String(companyId)).emit(
    `company-${companyId}-chat-${chatMessage.chatId}`,
    {
      action: "delete-message",
      message: chatMessage
    }
  );

  return chatMessage;
};

export default DeleteMessageService;
