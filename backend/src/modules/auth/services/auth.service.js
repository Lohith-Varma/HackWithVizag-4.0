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
  department: user.department || "",
  year: user.year || "",
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

export const registerUser = async ({ name, email, phone, password }) => {
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
