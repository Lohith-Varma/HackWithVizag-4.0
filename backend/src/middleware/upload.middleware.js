import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import ApiError from "../utils/apiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadRoot = path.resolve(__dirname, "../../uploads");

const uploadDirectories = {
  ppt: path.join(uploadRoot, "ppt"),
  supportingDoc: path.join(uploadRoot, "docs"),
  profile: path.join(uploadRoot, "profile"),
  temp: path.join(uploadRoot, "temp"),
};

Object.values(uploadDirectories).forEach((directory) => {
  fs.mkdirSync(directory, { recursive: true });
});

const allowedExtensions = {
  ppt: [".ppt", ".pptx", ".pdf"],
  supportingDoc: [".pdf", ".zip", ".rar", ".doc", ".docx"],
  profile: [".jpg", ".jpeg", ".png", ".webp"],
  temp: [".pdf", ".ppt", ".pptx", ".zip", ".rar", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"],
};

const buildStorage = (folder) =>
  multer.diskStorage({
    destination(_req, _file, callback) {
      callback(null, uploadDirectories[folder]);
    },
    filename(_req, file, callback) {
      const extension = path.extname(file.originalname).toLowerCase();
      const safeBaseName = path
        .basename(file.originalname, extension)
        .replace(/[^a-z0-9]/gi, "-")
        .replace(/-+/g, "-")
        .toLowerCase()
        .slice(0, 60);

      callback(null, `${Date.now()}-${safeBaseName || "upload"}${extension}`);
    },
  });

const fileFilter = (folder) => (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions[folder].includes(extension)) {
    return callback(new ApiError(400, `Invalid file type. Allowed: ${allowedExtensions[folder].join(", ")}`));
  }

  return callback(null, true);
};

const createUploader = (folder, fileSize) =>
  multer({
    storage: buildStorage(folder),
    fileFilter: fileFilter(folder),
    limits: {
      fileSize,
      files: 1,
    },
  });

export const uploadPpt = createUploader("ppt", Number(process.env.MAX_PPT_UPLOAD_BYTES || 20 * 1024 * 1024));
export const uploadSupportingDoc = createUploader("supportingDoc", Number(process.env.MAX_DOC_UPLOAD_BYTES || 20 * 1024 * 1024));
export const uploadProfileImage = createUploader("profile", Number(process.env.MAX_PROFILE_UPLOAD_BYTES || 5 * 1024 * 1024));
export const uploadTemp = createUploader("temp", Number(process.env.MAX_TEMP_UPLOAD_BYTES || 20 * 1024 * 1024));

export const uploadProjectFiles = multer({
  storage: multer.diskStorage({
    destination(_req, file, callback) {
      if (file.fieldname === "pptFile") {
        callback(null, uploadDirectories.ppt);
      } else if (file.fieldname === "supportingDocFile") {
        callback(null, uploadDirectories.supportingDoc);
      } else {
        callback(null, uploadDirectories.temp);
      }
    },
    filename(_req, file, callback) {
      const extension = path.extname(file.originalname).toLowerCase();
      const safeBaseName = path
        .basename(file.originalname, extension)
        .replace(/[^a-z0-9]/gi, "-")
        .replace(/-+/g, "-")
        .toLowerCase()
        .slice(0, 60);

      callback(null, `${Date.now()}-${safeBaseName || "file"}${extension}`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
}).fields([
  { name: "pptFile", maxCount: 1 },
  { name: "supportingDocFile", maxCount: 1 },
]);
