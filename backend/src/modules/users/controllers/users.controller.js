import User from "../../auth/models/user.model.js";
import { uploadRoot } from "../../../middleware/upload.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/apiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";

const buildUserResponse = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  college: user.college || user.collegeName || "",
  collegeName: user.collegeName || user.college || "",
  registeredNumber: user.registeredNumber || "",
  department: user.department || "",
  year: user.year || "",
  gender: user.gender || "",
  resumeUrl: user.resumeUrl || "",
  githubUrl: user.githubUrl || "",
  linkedinUrl: user.linkedinUrl || "",
  portfolioUrl: user.portfolioUrl || "",
  team: user.team ? user.team.toString() : null,
  role: user.role,
  status: user.status,
  profilePhoto: user.profilePhoto,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sendSuccess(res, 200, "User fetched successfully", { user: buildUserResponse(user) });
});

export const updateCurrentUser = asyncHandler(async (req, res) => {
  const allowedFields = [
    "name",
    "phone",
    "college",
    "collegeName",
    "registeredNumber",
    "department",
    "year",
    "gender",
    "githubUrl",
    "linkedinUrl",
    "portfolioUrl",
    "resumeUrl",
  ];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.year === "Final Year") {
    updates.year = "4th Year";
  }

  if (req.body.college && !req.body.collegeName) {
    updates.collegeName = req.body.college;
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sendSuccess(res, 200, "User updated successfully", { user: buildUserResponse(user) });
});

export const lookupUser = asyncHandler(async (req, res) => {
  const email = req.query.email ? String(req.query.email).trim().toLowerCase() : "";
  const registeredNumber = req.query.registeredNumber ? String(req.query.registeredNumber).trim() : "";

  if (!email && !registeredNumber) {
    throw new ApiError(400, "Email or Registered Number is required for lookup");
  }

  const query = {};
  if (email) {
    query.email = email;
  } else if (registeredNumber) {
    query.registeredNumber = new RegExp(`^${registeredNumber}$`, "i");
  }

  const user = await User.findOne(query);

  if (!user) {
    return sendSuccess(res, 200, "User lookup result", { user: null });
  }

  return sendSuccess(res, 200, "User found", {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      college: user.college || user.collegeName || "",
      collegeName: user.collegeName || user.college || "",
      registeredNumber: user.registeredNumber || "",
      department: user.department || "",
      year: user.year || "",
      gender: user.gender || "",
      role: user.role,
    },
  });
});

export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Profile image is required");
  }

  const relativePath = req.file.path.replace(uploadRoot, "").replace(/\\/g, "/");
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      profilePhoto: `/uploads${relativePath}`,
    },
    { new: true, runValidators: true }
  );

  return sendSuccess(res, 200, "Profile image uploaded successfully", { user: buildUserResponse(user) });
});
