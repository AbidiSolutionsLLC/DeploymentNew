const logService = require("../services/logService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError } = require("../utils/ExpressError");

exports.createLog = catchAsync(async (req, res) => {
  const { level, message } = req.body;
  if (!level || !message) throw new BadRequestError("Level and message are required");
  
  await logService.saveLog(level, message, req.companyId);
  res.status(200).json(ApiResponse.success(null, "Log entry created successfully."));
});

exports.createInfoLog = catchAsync(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new BadRequestError("Message is required");

  await logService.saveLog("info", message, req.companyId);
  res.status(200).json(ApiResponse.success(null, "Info log created"));
});

exports.createErrorLog = catchAsync(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new BadRequestError("Message is required");

  await logService.saveLog("error", message, req.companyId);
  res.status(200).json(ApiResponse.success(null, "Error log created"));
});

exports.createWarnLog = catchAsync(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new BadRequestError("Message is required");

  await logService.saveLog("warn", message, req.companyId);
  res.status(200).json(ApiResponse.success(null, "Warn log created"));
});

exports.createDebugLog = catchAsync(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new BadRequestError("Message is required");

  await logService.saveLog("debug", message, req.companyId);
  res.status(200).json(ApiResponse.success(null, "Debug log created"));
});

exports.getAllLogs = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await logService.getAllLogs(req.companyId, page, limit);
  // pass pagination data as meta (3rd argument)
  const pagination = {
    totalLogs: result.totalLogs,
    totalPages: result.totalPages,
    currentPage: result.currentPage
  };
  res.status(200).json(ApiResponse.success(result.logs || result.data || result, "Logs retrieved successfully", pagination));
});
