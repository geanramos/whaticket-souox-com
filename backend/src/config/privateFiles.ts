import path from "path";
import multer from "multer";

const privateFolder = path.resolve(__dirname, "..", "..", "private");
export default {
  directory: privateFolder,

  storage: multer.diskStorage({
    destination: privateFolder,
    filename(req, file, cb) {
      const fileName = file.originalname.replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      return cb(null, fileName);
    }
  })
};
