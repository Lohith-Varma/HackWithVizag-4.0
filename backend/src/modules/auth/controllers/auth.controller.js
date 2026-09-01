import { getProfile, loginUser, registerUser, updateUserProfile, changeUserPassword } from "../services/auth.service.js";
import { sendSuccess } from "../../../utils/apiResponse.js";

const cookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const days = Number(process.env.JWT_COOKIE_EXPIRES_IN_DAYS || 7);

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: days * 24 * 60 * 60 * 1000,
  };
};

const setAuthCookie = (res, token) => {
  res.cookie("accessToken", token, cookieOptions());
};

export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    setAuthCookie(res, result.token);

    return sendSuccess(res, 201, "Registration successful", {
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    setAuthCookie(res, result.token);

    return sendSuccess(res, 200, "Login successful", {
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = (_req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return sendSuccess(res, 200, "Logout successful");
};

export const profile = async (req, res, next) => {
  try {
    const user = await getProfile(req.user.id);

    return sendSuccess(res, 200, "Profile fetched successfully", {
      user,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await updateUserProfile(req.user.id, req.body);

    return sendSuccess(res, 200, "Profile updated successfully", {
      user,
    });
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await changeUserPassword(req.user.id, req.body);

    return sendSuccess(res, 200, result.message || "Password changed successfully");
  } catch (error) {
    return next(error);
  }
};

