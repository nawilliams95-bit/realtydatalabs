const AppError = require("../utils/appError");

function errorHandler(err, req, res, next) {
  const isAppError = err instanceof AppError;

  const statusCode = isAppError ? err.statusCode : 500;
  const payload = {
    error: isAppError ? err.message : "Internal Server Error",
  };

  if (isAppError && err.details) payload.details = err.details;

  if (process.env.NODE_ENV !== "production" && !isAppError) {
    payload.debug = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  return res.status(statusCode).json(payload);
}

module.exports = errorHandler;
