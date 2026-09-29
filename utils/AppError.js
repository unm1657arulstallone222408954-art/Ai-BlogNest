/**
 * Operational error class. Controllers throw/next() this instead of
 * generic Errors so the centralized error handler can respond with
 * the right HTTP status code and a clean message.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
