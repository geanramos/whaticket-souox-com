import { FlowBuilderModel } from "../../models/FlowBuilder";
import { FlowCampaignModel } from "../../models/FlowCampaign";
import { FlowDefaultModel } from "../../models/FlowDefault";
import { WebhookModel } from "../../models/Webhook";
import { randomString } from "../../utils/randomCode";

interface Request {
  companyId: number;
  flowIdWelcome: number
  flowIdPhrase:number
  flowIdInactiveTime?: number
}

const UpdateFlowDefaultService = async ({
  companyId,
  flowIdWelcome,
  flowIdPhrase,
  flowIdInactiveTime
}: Request): Promise<String> => {
  try {

    const flow = await FlowDefaultModel.update({ flowIdWelcome, flowIdNotPhrase: flowIdPhrase, flowIdInactiveTime }, {
      where: {companyId}
    });

    return 'ok';
  } catch (error) {
    console.error("Erro ao inserir o usuário:", error);

    return error
  }
};

export default UpdateFlowDefaultService;