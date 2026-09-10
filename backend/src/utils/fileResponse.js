import path from "path";

const MIME_BY_EXTENSION = {
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export const safeDownloadName = (name, fallback = "document") => {
  const basename = path.basename(String(name || fallback)).replace(/[\u0000-\u001f\u007f"\\/]/g, "-").trim();
  return basename.slice(0, 180) || fallback;
};

export const sendFileBuffer = (res, { buffer, file, disposition = "inline", fallbackName = "document" }) => {
  const downloadName = safeDownloadName(file?.originalName || file?.filename, fallbackName);
  const asciiName = downloadName.replace(/[^\x20-\x7e]/g, "_");
  const mimeType = MIME_BY_EXTENSION[path.extname(downloadName).toLowerCase()] || file?.mimeType || "application/octet-stream";

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Content-Disposition", `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
  return res.send(buffer);
};
