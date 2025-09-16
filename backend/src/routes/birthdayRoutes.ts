// src/routes/birthdayRoutes.ts
import express from "express";
import isAuth from "../middleware/isAuth";
import * as BirthdayController from "../controllers/BirthdayController";

const birthdayRoutes = express.Router();

// Buscar aniversariantes do dia
birthdayRoutes.get("/birthdays/today", isAuth, BirthdayController.getTodayBirthdays);

// Configurações de aniversário
birthdayRoutes.get("/birthdays/settings", isAuth, BirthdayController.getBirthdaySettings);
birthdayRoutes.put("/birthdays/settings", isAuth, BirthdayController.updateBirthdaySettings);

// Enviar mensagem de aniversário manualmente
birthdayRoutes.post("/birthdays/send-message", isAuth, BirthdayController.sendBirthdayMessage);

// Testar mensagem de aniversário
birthdayRoutes.post("/birthdays/test-message", isAuth, BirthdayController.testBirthdayMessage);

// Processar aniversários manualmente (admin only)
birthdayRoutes.post("/birthdays/process", isAuth, BirthdayController.processTodayBirthdays);

export default birthdayRoutes;