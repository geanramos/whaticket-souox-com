import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  HasMany
} from "sequelize-typescript";

import Company from "./Company";
import User from "./User";
import QuickMessageComponent from "./QuickMessageComponent";
import Whatsapp from "./Whatsapp";

@Table
class QuickMessage extends Model<QuickMessage> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  shortcode: string;

  @Column
  message: string;

  @Column
  get mediaPath(): string | null {
    if (this.getDataValue("mediaPath")) {
      
      return `${process.env.BACKEND_URL}/public/company${this.companyId}/quickMessage/${this.getDataValue("mediaPath")}`;

    }
    return null;
  }
  
  @Column
  mediaName: string;

  // Novo campo para tipo de mídia
  @Column
  mediaType: string; // 'image', 'audio', 'video', 'document'

  @Column
  geral: boolean;
  
  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column
  visao: boolean;

  @Column
  isOficial: boolean;

  @Column
  language: string;

  @Column
  status: string;

  @Column
  category: string;

  @Column
  metaID: string;

  @HasMany(() => QuickMessageComponent)
  components: QuickMessageComponent[];

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;
}

export default QuickMessage;