import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  DataType,
  Default
} from "sequelize-typescript";
import User from "./User";
import Chat from "./Chat";
import Company from "./Company";

@Table({ tableName: "ChatMessages" })
class ChatMessage extends Model<ChatMessage> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => Chat)
  @Column
  chatId: number;

  @ForeignKey(() => User)
  @Column
  senderId: number;

  @Column({ defaultValue: "" })
  message: string;

  @Column(DataType.STRING)
  get mediaPath(): string | null {
    if (this.getDataValue("mediaPath")) {
      return `${process.env.BACKEND_URL}${
        process.env.PROXY_PORT ? `:${process.env.PROXY_PORT}` : ""
      }/public/company${this.companyId}/chat/${this.chatId}/${this.getDataValue(
        "mediaPath"
      )}`;
    }
    return null;
  }

  @Column
  mediaType: string;

  @Column
  mediaName: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Chat)
  chat: Chat;

  @BelongsTo(() => User)
  sender: User;

  @ForeignKey(() => ChatMessage)
  @Column
  replyToId: number;

  @BelongsTo(() => ChatMessage, { as: "replyTo", foreignKey: "replyToId" })
  replyTo: ChatMessage;

  @Default(false)
  @Column
  isEdited: boolean;

  @Default(false)
  @Column
  isDeleted: boolean;

  @ForeignKey(() => ChatMessage)
  @Column
  forwardedFromId: number;

  @BelongsTo(() => ChatMessage, {
    as: "forwardedFrom",
    foreignKey: "forwardedFromId"
  })
  forwardedFrom: ChatMessage;
}

export default ChatMessage;
