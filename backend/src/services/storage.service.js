import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import ApiError from "../utils/apiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const legacyUploadRoot = path.resolve(__dirname, "../../uploads");
const DEFAULT_BUCKET = "hackwithvizag-uploads";
const CONTENT_TYPE_BY_EXTENSION = {
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

let cachedClient;
let cachedConfigKey;
let bucketReadyPromise;

const getConfig = () => {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY
  )?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET;

  if (!url || !serviceRoleKey) {
    throw new ApiError(503, "Supabase Storage is not configured on the backend");
  }

  if (!/^[a-z0-9][a-z0-9._-]{1,62}$/i.test(bucket)) {
    throw new ApiError(500, "SUPABASE_STORAGE_BUCKET is invalid");
  }

  return { url, serviceRoleKey, bucket };
};

const getClient = () => {
  const config = getConfig();
  const configKey = `${config.url}\n${config.serviceRoleKey}\n${config.bucket}`;
  if (!cachedClient || cachedConfigKey !== configKey) {
    cachedClient = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    cachedConfigKey = configKey;
    bucketReadyPromise = undefined;
  }
  return { client: cachedClient, bucket: config.bucket };
};

const normalizeObjectPath = (storagePath) => {
  const normalized = String(storagePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized.split("/");
  if (!normalized || segments.some((segment) => !/^[a-z0-9][a-z0-9._-]*$/i.test(segment))) {
    throw new ApiError(400, "Invalid storage path");
  }
  return normalized;
};

const normalizeOwnerId = (ownerId) => {
  const value = String(ownerId || "").trim().toLowerCase();
  if (!/^[a-f0-9]{24}$/.test(value)) {
    throw new ApiError(400, "Invalid storage owner id");
  }
  return value;
};

const sanitizeOriginalName = (originalName) => {
  const submittedName = path.posix.basename(String(originalName || "upload").replace(/\\/g, "/"));
  const submittedExtension = path.posix.extname(submittedName);
  const extension = submittedExtension.toLowerCase();
  const submittedBaseName = submittedExtension
    ? submittedName.slice(0, -submittedExtension.length)
    : submittedName;
  const baseName = submittedBaseName
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60) || "upload";
  return { baseName, extension };
};

export const buildStoragePath = ({ folder, ownerId, originalName }) => {
  const safeFolder = String(folder || "").trim();
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(safeFolder)) throw new ApiError(400, "Invalid storage folder");

  const safeOwnerId = normalizeOwnerId(ownerId);
  const { baseName, extension } = sanitizeOriginalName(originalName);
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${baseName}${extension}`;
  return {
    filename: uniqueName,
    storagePath: normalizeObjectPath(`${safeFolder}/${safeOwnerId}/${uniqueName}`),
  };
};

const describeStorageError = (action, error) => {
  console.error(`[storage] provider=supabase action=${action} success=false status=${error?.statusCode || "unknown"} message=${error?.message || "unknown"}`);
  return new ApiError(502, `Persistent file storage ${action} failed`);
};

export const ensurePrivateBucket = async () => {
  if (bucketReadyPromise) return bucketReadyPromise;

  bucketReadyPromise = (async () => {
    const { client, bucket } = getClient();
    const { data, error } = await client.storage.getBucket(bucket);

    if (error && Number(error.statusCode) !== 404) throw describeStorageError("bucket check", error);

    if (!data) {
      const { error: createError } = await client.storage.createBucket(bucket, { public: false });
      if (createError) throw describeStorageError("bucket creation", createError);
      console.info(`[storage] provider=supabase bucket=${bucket} created=true private=true`);
      return bucket;
    }

    if (data.public) {
      const { error: updateError } = await client.storage.updateBucket(bucket, { public: false });
      if (updateError) throw describeStorageError("bucket privacy update", updateError);
      console.warn(`[storage] provider=supabase bucket=${bucket} changedToPrivate=true`);
    }

    return bucket;
  })().catch((error) => {
    bucketReadyPromise = undefined;
    throw error;
  });

  return bucketReadyPromise;
};

export const uploadFile = async ({ folder, ownerId, file }) => {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new ApiError(400, "Uploaded file data is missing");
  }

  const { filename: uniqueName, storagePath } = buildStoragePath({ folder, ownerId, originalName: file.originalname });
  const mimeType = CONTENT_TYPE_BY_EXTENSION[path.extname(uniqueName).toLowerCase()] || file.mimetype;
  const { client } = getClient();
  const bucket = await ensurePrivateBucket();

  const { error } = await client.storage.from(bucket).upload(storagePath, file.buffer, {
    contentType: mimeType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw describeStorageError("upload", error);

  console.info(`[storage] provider=supabase bucket=${bucket} path=${storagePath} size=${file.size} uploadSuccessful=true`);
  return {
    storageProvider: "supabase",
    bucket,
    storagePath,
    filename: uniqueName,
    originalName: path.posix.basename(String(file.originalname || uniqueName).replace(/\\/g, "/")),
    mimeType,
    size: file.size,
  };
};

export const downloadFile = async ({ storagePath, bucket: requestedBucket } = {}) => {
  const { client, bucket: configuredBucket } = getClient();
  const bucket = requestedBucket || configuredBucket;
  if (bucket !== configuredBucket) throw new ApiError(404, "Stored file bucket is not available");

  const safePath = normalizeObjectPath(storagePath);
  const { data, error } = await client.storage.from(bucket).download(safePath);
  if (error) {
    if (Number(error.statusCode) === 404) throw new ApiError(404, "This document is no longer available");
    throw describeStorageError("download", error);
  }

  return Buffer.from(await data.arrayBuffer());
};

export const deleteFile = async ({ storagePath, bucket: requestedBucket } = {}) => {
  if (!storagePath) return false;
  const { client, bucket: configuredBucket } = getClient();
  const bucket = requestedBucket || configuredBucket;
  if (bucket !== configuredBucket) throw new ApiError(400, "Stored file bucket does not match the configured bucket");

  const safePath = normalizeObjectPath(storagePath);
  const { error } = await client.storage.from(bucket).remove([safePath]);
  if (error) throw describeStorageError("delete", error);
  console.info(`[storage] provider=supabase bucket=${bucket} path=${safePath} deleteSuccessful=true`);
  return true;
};

export const getFileMetadata = async ({ storagePath, bucket: requestedBucket } = {}) => {
  const { client, bucket: configuredBucket } = getClient();
  const bucket = requestedBucket || configuredBucket;
  if (bucket !== configuredBucket) return null;

  const safePath = normalizeObjectPath(storagePath);
  const directory = path.posix.dirname(safePath);
  const filename = path.posix.basename(safePath);
  const { data, error } = await client.storage.from(bucket).list(directory, { limit: 10, search: filename });
  if (error) throw describeStorageError("metadata lookup", error);
  return data?.find((item) => item.name === filename && item.id) || null;
};

export const fileExists = async (reference) => Boolean(await getFileMetadata(reference));

export const isSupabaseFile = (file) => file?.storageProvider === "supabase" && Boolean(file.storagePath);

export const deleteStoredFile = async (file) => {
  if (!isSupabaseFile(file)) return false;
  return deleteFile({ storagePath: file.storagePath, bucket: file.bucket });
};

export const downloadStoredFile = async (file, { legacyFolder } = {}) => {
  if (file?.storageProvider === "supabase") {
    if (!file.storagePath) {
      throw new ApiError(404, "Stored file metadata is incomplete");
    }
    return downloadFile({ storagePath: file.storagePath, bucket: file.bucket });
  }

  const storedReference = file?.url || file?.path || file?.filename || "";
  const filename = path.basename(String(storedReference).replace(/\\/g, "/"));
  if (!legacyFolder || !filename || filename === ".") throw new ApiError(404, "This document is no longer available");

  const folderRoot = path.resolve(legacyUploadRoot, legacyFolder);
  const resolvedPath = path.resolve(folderRoot, filename);
  if (!resolvedPath.startsWith(`${folderRoot}${path.sep}`)) throw new ApiError(404, "This document is no longer available");

  try {
    return await fs.readFile(resolvedPath);
  } catch {
    throw new ApiError(404, "This document is no longer available");
  }
};

export const storageBucketName = () => process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET;
