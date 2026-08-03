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
  department: user.department || "",
  year: user.year || "",
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
  const allowedFields = ["name", "phone", "college", "collegeName", "department", "year"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sendSuccess(res, 200, "User updated successfully", { user: buildUserResponse(user) });
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
