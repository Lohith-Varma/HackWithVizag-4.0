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
  profile: path.join(uploadRoot, "profile"),
  temp: path.join(uploadRoot, "temp"),
};

Object.values(uploadDirectories).forEach((directory) => {
  fs.mkdirSync(directory, { recursive: true });
});

const allowedExtensions = {
  ppt: [".ppt", ".pptx"],
  profile: [".jpg", ".jpeg", ".png", ".webp"],
  temp: [".pdf", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".webp"],
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

export const uploadPpt = createUploader("ppt", Number(process.env.MAX_PPT_UPLOAD_BYTES || 15 * 1024 * 1024));
export const uploadProfileImage = createUploader(
  "profile",
  Number(process.env.MAX_PROFILE_UPLOAD_BYTES || 3 * 1024 * 1024)
);
export const uploadTemp = createUploader("temp", Number(process.env.MAX_TEMP_UPLOAD_BYTES || 5 * 1024 * 1024));
