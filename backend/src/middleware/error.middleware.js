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
    const keys = Object.keys(error.keyValue || error.keyPattern || {});
    const fieldName = keys.length ? keys[0] : "Field";
    const formattedField = fieldName.replace(/([A-Z])/g, " $1").toLowerCase();
    return [
      {
        field: fieldName,
        message: `Registration conflict: ${formattedField} is already registered.`,
      },
    ];
  }

  if (error.name === "MulterError") {
    return [
      {
        field: error.field || "file",
        message: error.message,
      },
    ];
  }

  if (error.name === "CastError") {
    return [
      {
        field: error.path || "id",
        message: `Invalid format for ${error.path || "id"}: ${error.value}`,
      },
    ];
  }

  return [];
};

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode;

  if (!statusCode) {
    if (error.name === "MulterError") statusCode = 400;
    else if (error.name === "CastError") statusCode = 400;
    else if (error.code === 11000) statusCode = 409;
    else statusCode = 500;
  }

  const errors = error.errors?.length ? error.errors : formatValidationError(error);
  
  let message = error.message;
  if (error.name === "CastError") {
    message = `Invalid ${error.path || "identifier"} format`;
  } else if (error.code === 11000) {
    message = "Registration conflict: Record or email already exists.";
  } else if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "Internal server error";
  }

  if (statusCode === 500) {
    console.error("Unhandled Server Error:", error);
  }

  return sendError(res, statusCode, message, errors);
};

