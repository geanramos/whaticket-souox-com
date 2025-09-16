import {
  Model,
  Table,
  Column,
  PrimaryKey,
  AutoIncrement,
  DataType,
  CreatedAt,
  UpdatedAt,
  HasMany
} from "sequelize-typescript";
import { FlowCampaignModel } from "./FlowCampaign";

@Table({
  tableName: "FlowBuilders"
})
export class FlowBuilderModel extends Model<FlowBuilderModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  user_id: number;

  @Column
  name: string;

  @Column
  company_id: number;

  @Column
  active: boolean;

  @Column(DataType.JSON)
  flow: {} | null;

  @HasMany(() => FlowCampaignModel, 'flowId')
  campaigns: FlowCampaignModel[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
export default FlowBuilderModel;