const { ExpressError, BadRequestError } = require("../utils/ExpressError");

const globalErrorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(", ");
    err = new BadRequestError(message);
  }

  if (err.name === "CastError") {
    err = new BadRequestError(`Invalid ${err.path}: ${err.value}`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]; // e.g. "contact"
    const value = err.keyValue[field];          // e.g. "+923090769754"
    const friendlyMessage = `This ${field} is already registered: ${value}`;
    err = new BadRequestError(friendlyMessage);
  }

  const statusCode = err.status || 500;
  const message = err.message || "Something went wrong";

  console.error("Error:", err);
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = globalErrorHandler;
