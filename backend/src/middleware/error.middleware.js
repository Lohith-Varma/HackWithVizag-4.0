import { sendError } from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";

const formatValidationError = (error) => {
  if (error.name === "ValidationError") {
    return Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (error.code === 11000) {
    return Object.keys(error.keyValue || {}).map((field) => ({
      field,
      message: `${field} already exists`,
    }));
  }

  if (error.name === "MulterError") {
    return [
      {
        field: error.field || "file",
        message: error.message,
      },
    ];
  }

  return [];
};

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.name === "MulterError" ? 400 : error.statusCode || 500;
  const errors = error.errors?.length ? error.errors : formatValidationError(error);
  const message = statusCode === 500 ? "Internal server error" : error.message;

  if (statusCode === 500) {
    console.error(error);
  }

  return sendError(res, statusCode, message, errors);
};
