import express from "express";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";
import multer from "multer";
const upload = multer(uploadConfig);

import * as ChatController from "../controllers/ChatController";

const routes = express.Router();

routes.get("/chats", isAuth, ChatController.index);
routes.get("/chats/:id", isAuth, ChatController.show);
routes.get("/chats/:id/messages", isAuth, ChatController.messages);
routes.post(
  "/chats/:id/messages",
  isAuth,
  upload.array("medias"),
  ChatController.saveMessage
);
routes.post("/chats/:id/read", isAuth, ChatController.checkAsRead);
routes.post("/chats", isAuth, ChatController.store);
routes.put("/chats/:id", isAuth, ChatController.update);
routes.delete("/chats/:id", isAuth, ChatController.remove);

routes.post(
  "/chats/upload",
  isAuth,
  multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const companyId = req.user.companyId;
        const folder = require("path").resolve(
          __dirname,
          "..",
          "..",
          "public",
          `company${companyId}`,
          "groups"
        );
        const fs = require("fs");
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
          fs.chmodSync(folder, 0o777);
        }
        cb(null, folder);
      },
      filename: function (req, file, cb) {
        const fileName =
          new Date().getTime() +
          "_" +
          file.originalname.replace("/", "-").replace(/ /g, "_");
        cb(null, fileName);
      }
    })
  }).single("file"),
  async (req, res) => {
    const companyId = req.user.companyId;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    // Retorna apenas o nome do arquivo, o frontend deve montar a URL
    return res.status(200).json({
      fileName: file.filename,
      url: `/public/company${companyId}/groups/${file.filename}`
    });
  }
);

routes.put("/chats/messages/:messageId", isAuth, ChatController.editMessage);

routes.delete(
  "/chats/messages/:messageId",
  isAuth,
  ChatController.deleteMessage
);

routes.post(
  "/chats/messages/:messageId/forward",
  isAuth,
  ChatController.forwardMessage
);

export default routes;
