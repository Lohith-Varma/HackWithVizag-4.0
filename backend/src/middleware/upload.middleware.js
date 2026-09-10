import path from "path";
import multer from "multer";
import ApiError from "../utils/apiError.js";

const MB = 1024 * 1024;

const fileRules = {
  ppt: {
    extensions: [".ppt", ".pptx", ".pdf"],
    mimeTypes: {
      ".ppt": ["application/vnd.ms-powerpoint", "application/mspowerpoint", "application/powerpoint", "application/octet-stream"],
      ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/zip", "application/octet-stream"],
      ".pdf": ["application/pdf"],
    },
  },
  supportingDoc: {
    extensions: [".pdf", ".zip", ".rar", ".doc", ".docx"],
    mimeTypes: {
      ".pdf": ["application/pdf"],
      ".zip": ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
      ".rar": ["application/vnd.rar", "application/x-rar-compressed", "application/octet-stream"],
      ".doc": ["application/msword", "application/octet-stream"],
      ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/octet-stream"],
    },
  },
  profile: {
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    mimeTypes: {
      ".jpg": ["image/jpeg"],
      ".jpeg": ["image/jpeg"],
      ".png": ["image/png"],
      ".webp": ["image/webp"],
    },
  },
  paymentProof: {
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    mimeTypes: {
      ".jpg": ["image/jpeg"],
      ".jpeg": ["image/jpeg"],
      ".png": ["image/png"],
      ".webp": ["image/webp"],
    },
  },
};

const validateFileType = (file, kind) => {
  const rules = fileRules[kind];
  const extension = path.extname(file.originalname || "").toLowerCase();
  const mimeType = String(file.mimetype || "").toLowerCase();

  if (!rules || !rules.extensions.includes(extension)) {
    throw new ApiError(400, `Invalid file type. Allowed: ${rules?.extensions.join(", ") || "none"}`);
  }

  if (!rules.mimeTypes[extension]?.includes(mimeType)) {
    throw new ApiError(400, `File content type does not match the ${extension} extension`);
  }
};

const fileFilter = (kind) => (_req, file, callback) => {
  try {
    validateFileType(file, kind);
    callback(null, true);
  } catch (error) {
    callback(error);
  }
};

const createUploader = (kind, fileSize) => multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter(kind),
  limits: { fileSize, files: 1 },
});

export const validateUploadedFile = (file, { kind, maxBytes } = {}) => {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new ApiError(400, "Uploaded file data is missing");
  }

  validateFileType(file, kind);

  if (maxBytes && file.size > maxBytes) {
    throw new ApiError(400, `File exceeds the ${Math.ceil(maxBytes / MB)} MB upload limit`);
  }

  return file;
};

export const uploadPpt = createUploader("ppt", Number(process.env.MAX_PPT_UPLOAD_BYTES || 20 * MB));
export const uploadSupportingDoc = createUploader("supportingDoc", Number(process.env.MAX_DOC_UPLOAD_BYTES || 20 * MB));
export const uploadProfileImage = createUploader("profile", Number(process.env.MAX_PROFILE_UPLOAD_BYTES || 5 * MB));
export const uploadPaymentScreenshot = createUploader("paymentProof", Number(process.env.MAX_PAYMENT_PROOF_UPLOAD_BYTES || 5 * MB));

export const uploadProjectFiles = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, callback) {
    const kind = file.fieldname === "pptFile" ? "ppt" : "supportingDoc";
    return fileFilter(kind)(req, file, callback);
  },
  limits: {
    fileSize: 25 * MB,
    files: 2,
  },
}).fields([
  { name: "pptFile", maxCount: 1 },
  { name: "supportingDocFile", maxCount: 1 },
]);
