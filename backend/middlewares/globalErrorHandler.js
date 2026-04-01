const { ExpressError, BadRequestError } = require("../utils/ExpressError");

const globalErrorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map(val => val.message).join(", ");
    err = new BadRequestError(message);
  }

  if (err.name === "CastError") {
    err = new BadRequestError(`Invalid ${err.path}: ${err.value}`);
  }

  if (err.code === 11000) {
    const kv = err.keyValue || (err.errorResponse && err.errorResponse.keyValue) || {};
    const keys = Object.keys(kv);
    const field = keys.length > 0 ? keys[0] : 'field';
    const value = keys.length > 0 ? kv[field] : '';
    const friendlyMessage = value ? `This ${field} is already registered: ${value}` : 'A record with this information already exists.';
    err = new BadRequestError(friendlyMessage);
  }

  const statusCode = err.status || 500;
  const message = err.message || "Something went wrong";

  // LOG FOR DEBUGGING
  console.log(`[API ERROR] Status: ${statusCode}, Message: ${message}`);

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message, // This MUST be the field 'message' for react-toastify
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = globalErrorHandler;