const Log = require("../models/LogSchema");
const { info, warn, error, debug } = require("../utils/logger");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");

const saveLog = async (level, message) => {
  const log = new Log({
    level,
    message,
    createdAt: new Date(),
  });

  await log.save();

  switch (level) {
    case "info":
      info(message);
      break;
    case "warn":
      warn(message);
      break;
    case "error":
      error(message);
      break;
    case "debug":
      debug(message);
      break;
    default:
      error(`Unknown log level: ${level}`);
      break;
  }
};

// Create a custom log
const createLog = async (req, res) => {
  const { level, message } = req.body;

  if (!level || !message) {
    throw new BadRequestError("Level and message are required");
  }

  await saveLog(level, message);
  res.status(200).json({ message: "Log entry created successfully." });
};

// Create info log
const createInfoLog = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    throw new BadRequestError("Message is required");
  }

  await saveLog("info", message);
  res.status(200).json({ message: "Info log created" });
};

// Create error log
const createErrorLog = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    throw new BadRequestError("Message is required");
  }

  await saveLog("error", message);
  res.status(200).json({ message: "Error log created" });
};

// Create warn log
const createWarnLog = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    throw new BadRequestError("Message is required");
  }

  await saveLog("warn", message);
  res.status(200).json({ message: "Warn log created" });
};

// Create debug log
const createDebugLog = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    throw new BadRequestError("Message is required");
  }

  await saveLog("debug", message);
  res.status(200).json({ message: "Debug log created" });
};

// Get all logs (with pagination)
const getAllLogs = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const logs = await Log.find()
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const totalLogs = await Log.countDocuments();

  if (!logs.length) {
    throw new NotFoundError("Logs");
  }

  res.status(200).json({
    logs,
    totalLogs,
  });
};

module.exports = {
  createLog,
  createInfoLog,
  createErrorLog,
  getAllLogs,
  createWarnLog,
  createDebugLog,
};
