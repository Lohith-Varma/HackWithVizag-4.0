import mongoose from "mongoose";
import SpotRegistration, { ensureSpotRegistrationIndexes } from "../models/spotRegistration.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/apiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";
import { validateUploadedFile } from "../../../middleware/upload.middleware.js";
import { deleteStoredFile, downloadStoredFile, uploadFile } from "../../../services/storage.service.js";
import { getOfflinePaymentConfig } from "../../../services/offlinePayment.service.js";
import { sendFileBuffer } from "../../../utils/fileResponse.js";
import {
  buildSpotRegistrationNumber,
  ensureEmailsAvailable,
  parseSpotPayload,
  validateSpotRegistration,
} from "../services/spotRegistration.service.js";
import { writeSpotAudit } from "../services/spotAudit.service.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toInt = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : Math.min(Math.max(parsed, min), max);
};

const screenshotSummary = (screenshot) => screenshot?.filename ? {
  available: true,
  originalName: screenshot.originalName,
  mimeType: screenshot.mimeType,
  size: screenshot.size,
} : { available: false };

const serialize = (registration, { details = false } = {}) => {
  const value = registration.toObject ? registration.toObject() : registration;
  const base = {
    _id: value._id,
    registrationNumber: value.registrationNumber,
    teamName: value.teamName,
    collegeName: value.collegeName,
    teamSize: value.teamSize,
    teamLeader: value.teamLeader,
    calculatedFee: value.calculatedFee,
    payment: {
      amount: value.payment?.amount,
      utr: value.payment?.utr,
      screenshot: screenshotSummary(value.payment?.screenshot),
    },
    status: value.status,
    submittedAt: value.submittedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    confirmedAt: value.confirmedAt,
    confirmedBy: value.confirmedBy,
  };
  return details ? { ...base, members: value.members || [] } : base;
};

export const getSpotPaymentInstructions = asyncHandler(async (req, res) => {
  const payment = await getOfflinePaymentConfig(Number(req.query.teamSize), { required: false });
  return sendSuccess(res, 200, "Spot Registration payment instructions fetched", { payment });
});

export const createSpotRegistration = asyncHandler(async (req, res) => {
  await ensureSpotRegistrationIndexes();
  const input = validateSpotRegistration(parseSpotPayload(req.body));
  if (!req.file) throw new ApiError(400, "Payment screenshot is required.");
  validateUploadedFile(req.file, {
    kind: "paymentProof",
    maxBytes: Number(process.env.MAX_PAYMENT_PROOF_UPLOAD_BYTES || 5 * 1024 * 1024),
  });

  const [payment] = await Promise.all([
    getOfflinePaymentConfig(input.teamSize),
    ensureEmailsAvailable(input.participantEmails),
  ]);
  const registrationId = new mongoose.Types.ObjectId();
  const uploadedScreenshot = await uploadFile({
    folder: "spot-payment-screenshots",
    ownerId: registrationId,
    file: req.file,
  });

  let registration;
  try {
    registration = await SpotRegistration.create({
      _id: registrationId,
      registrationNumber: buildSpotRegistrationNumber(registrationId),
      teamName: input.teamName,
      collegeName: input.collegeName,
      teamSize: input.teamSize,
      teamLeader: input.teamLeader,
      members: input.members,
      participantEmails: input.participantEmails,
      calculatedFee: payment.expectedAmount,
      payment: { amount: payment.expectedAmount, utr: input.utr, screenshot: uploadedScreenshot },
      status: "SPOT_SUBMITTED",
      submittedAt: new Date(),
    });
  } catch (error) {
    await deleteStoredFile(uploadedScreenshot).catch((cleanupError) => {
      console.error(`[storage-cleanup] context=spot-registration path=${uploadedScreenshot.storagePath} success=false message=${cleanupError.message}`);
    });
    if (error?.code === 11000) {
      throw new ApiError(409, "One or more participants are already registered for this event.");
    }
    throw error;
  }

  await writeSpotAudit({
    req,
    action: "SPOT_REGISTRATION_CREATED",
    registration,
    details: { status: registration.status, teamSize: registration.teamSize, calculatedFee: registration.calculatedFee },
  });

  return sendSuccess(res, 201, "Spot Registration submitted successfully", {
    registration: {
      registrationNumber: registration.registrationNumber,
      status: registration.status,
      submittedAt: registration.submittedAt,
    },
  });
});

export const listSpotRegistrations = asyncHandler(async (req, res) => {
  const page = toInt(req.query.page, 1, 1, 100000);
  const limit = toInt(req.query.limit, 25, 1, 100);
  const query = {};
  if (req.query.status) query.status = req.query.status;
  const search = String(req.query.search || "").trim();
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { registrationNumber: regex },
      { teamName: regex },
      { collegeName: regex },
      { "teamLeader.name": regex },
      { "teamLeader.email": regex },
      { "payment.utr": regex },
    ];
  }

  const [registrations, total, stats] = await Promise.all([
    SpotRegistration.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("confirmedBy", "name email").lean(),
    SpotRegistration.countDocuments(query),
    SpotRegistration.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(stats.map((row) => [row._id, row.count]));

  return sendSuccess(res, 200, "Spot Registrations fetched successfully", {
    spotRegistrations: registrations.map((registration) => serialize(registration)),
    stats: {
      total: (counts.SPOT_SUBMITTED || 0) + (counts.SPOT_CONFIRMED || 0),
      pending: counts.SPOT_SUBMITTED || 0,
      confirmed: counts.SPOT_CONFIRMED || 0,
    },
    pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
  });
});

export const getSpotRegistration = asyncHandler(async (req, res) => {
  const registration = await SpotRegistration.findById(req.params.id).populate("confirmedBy", "name email");
  if (!registration) throw new ApiError(404, "Spot Registration not found");
  return sendSuccess(res, 200, "Spot Registration fetched successfully", { spotRegistration: serialize(registration, { details: true }) });
});

const changedFields = (before, after) => {
  const fields = ["teamName", "collegeName", "teamSize", "teamLeader", "members", "calculatedFee", "payment"];
  return fields.filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]));
};

export const updateSpotRegistration = asyncHandler(async (req, res) => {
  const registration = await SpotRegistration.findById(req.params.id).select("+participantEmails");
  if (!registration) throw new ApiError(404, "Spot Registration not found");
  const input = validateSpotRegistration(parseSpotPayload(req.body));
  if (req.file) {
    validateUploadedFile(req.file, {
      kind: "paymentProof",
      maxBytes: Number(process.env.MAX_PAYMENT_PROOF_UPLOAD_BYTES || 5 * 1024 * 1024),
    });
  }

  const [payment] = await Promise.all([
    getOfflinePaymentConfig(input.teamSize),
    ensureEmailsAvailable(input.participantEmails, { excludeSpotId: registration._id }),
  ]);
  const previousScreenshot = registration.payment.screenshot?.toObject?.() || registration.payment.screenshot;
  const newScreenshot = req.file ? await uploadFile({
    folder: "spot-payment-screenshots",
    ownerId: registration._id,
    file: req.file,
  }) : null;
  const before = registration.toObject();

  try {
    registration.teamName = input.teamName;
    registration.collegeName = input.collegeName;
    registration.teamSize = input.teamSize;
    registration.teamLeader = input.teamLeader;
    registration.members = input.members;
    registration.participantEmails = input.participantEmails;
    registration.calculatedFee = payment.expectedAmount;
    registration.payment.amount = payment.expectedAmount;
    registration.payment.utr = input.utr;
    if (newScreenshot) registration.payment.screenshot = newScreenshot;
    await registration.save();
  } catch (error) {
    if (newScreenshot) await deleteStoredFile(newScreenshot).catch(() => {});
    if (error?.code === 11000) throw new ApiError(409, "One or more participants are already registered for this event.");
    throw error;
  }

  if (newScreenshot && previousScreenshot?.storagePath) {
    await deleteStoredFile(previousScreenshot).catch((error) => {
      console.error(`[storage-cleanup] context=spot-registration-replacement path=${previousScreenshot.storagePath} success=false message=${error.message}`);
    });
  }
  await writeSpotAudit({
    req,
    action: "SPOT_REGISTRATION_UPDATED",
    registration,
    details: { changedFields: changedFields(before, registration.toObject()) },
  });
  return sendSuccess(res, 200, "Spot Registration updated successfully", { spotRegistration: serialize(registration, { details: true }) });
});

export const confirmSpotRegistration = asyncHandler(async (req, res) => {
  const confirmedAt = new Date();
  const registration = await SpotRegistration.findOneAndUpdate(
    { _id: req.params.id, status: "SPOT_SUBMITTED" },
    { $set: { status: "SPOT_CONFIRMED", confirmedAt, confirmedBy: req.user.id } },
    { new: true, runValidators: true }
  ).populate("confirmedBy", "name email");
  if (!registration) {
    if (await SpotRegistration.exists({ _id: req.params.id })) throw new ApiError(409, "Spot Registration is already confirmed");
    throw new ApiError(404, "Spot Registration not found");
  }
  await writeSpotAudit({
    req,
    action: "SPOT_REGISTRATION_CONFIRMED",
    registration,
    details: { status: registration.status, confirmedAt },
  });
  return sendSuccess(res, 200, "Spot Registration confirmed successfully", { spotRegistration: serialize(registration, { details: true }) });
});

export const getSpotPaymentScreenshot = asyncHandler(async (req, res) => {
  const registration = await SpotRegistration.findById(req.params.id);
  if (!registration) throw new ApiError(404, "Spot Registration not found");
  const screenshot = registration.payment?.screenshot;
  if (!screenshot?.storagePath) throw new ApiError(404, "Payment screenshot unavailable");
  const buffer = await downloadStoredFile(screenshot);
  return sendFileBuffer(res, { buffer, file: screenshot, disposition: "inline", fallbackName: "spot-payment-screenshot" });
});
