import jwt from "jsonwebtoken";
import User from "../modules/auth/models/user.model.js";
import ApiError from "../utils/apiError.js";

const getTokenFromRequest = (req) => {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  const authorization = req.headers.authorization;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.split(" ")[1];
  }

  return null;
};

export const authenticate = async (req, _res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required");
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new ApiError(401, "Invalid authentication token");
    }

    if (user.status === "blocked") {
      throw new ApiError(403, "Your account is blocked");
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      status: user.status,
    };

    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Invalid or expired authentication token"));
    }

    return next(error);
  }
};

export const authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to access this resource"));
    }

    return next();
  };
};
