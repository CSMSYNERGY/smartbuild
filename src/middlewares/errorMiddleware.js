import logger from "../config/logger.js";
import { AppError } from "../models/errors.js";

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error("Error:", {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    errorCode: err.errorCode,
    path: req.path,
    method: req.method,
  });

  // If it's our custom error, send the appropriate response
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "failure",
      message: err.message
    });
  }

  // Default error response for unexpected errors
  return res.status(500).json({
    status: "failure",
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
};
