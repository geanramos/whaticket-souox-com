import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as TicketFinalizationReasonController from "../controllers/TicketFinalizationReasonController";

const ticketFinalizationReasonRoutes = Router();

ticketFinalizationReasonRoutes.use(isAuth);

ticketFinalizationReasonRoutes.get(
  "/ticketFinalizationReasons",
  TicketFinalizationReasonController.index
);

ticketFinalizationReasonRoutes.post(
  "/ticketFinalizationReasons",
  TicketFinalizationReasonController.store
);

ticketFinalizationReasonRoutes.put(
  "/ticketFinalizationReasons/:id",
  TicketFinalizationReasonController.update
);

ticketFinalizationReasonRoutes.delete(
  "/ticketFinalizationReasons/:id",
  TicketFinalizationReasonController.remove
);

export default ticketFinalizationReasonRoutes;
