import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../../../utils/apiError.js";

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
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const signAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

export const registerUser = async ({ name, email, phone, password, college, collegeName, registeredNumber, department, year, gender }) => {
  if (!password || password.length < 8) {
    throw new ApiError(400, "Password is required and must be at least 8 characters");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    college: college || collegeName || "",
    collegeName: collegeName || college || "",
    registeredNumber: registeredNumber || "",
    department: department || "",
    year: year === "Final Year" ? "4th Year" : (year || ""),
    gender: gender || "",
  });

  return {
    user: buildUserResponse(user),
    token: signAccessToken(user),
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status === "blocked") {
    throw new ApiError(403, "Your account is blocked. Please contact the administrator");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  return {
    user: buildUserResponse(user),
    token: signAccessToken(user),
  };
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return buildUserResponse(user);
};

export const updateUserProfile = async (userId, payload) => {
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

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  }

  if (updates.year === "Final Year") {
    updates.year = "4th Year";
  }

  if (payload.college && !payload.collegeName) {
    updates.collegeName = payload.college;
  }

  const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return buildUserResponse(user);
};

export const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCurrentValid = await user.comparePassword(currentPassword);
  if (!isCurrentValid) {
    throw new ApiError(400, "Current password does not match our records");
  }

  user.password = newPassword;
  await user.save();

  return { message: "Password updated successfully" };
};

