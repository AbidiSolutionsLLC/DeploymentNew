const timeLogService = require("../services/timeLogService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createTimeLog = catchAsync(async (req, res) => {
  const timeLog = await timeLogService.createTimeLog(req.user, req.body, req.files);
  res.status(201).json(ApiResponse.success(timeLog, 'Time log created successfully'));
});

exports.getEmployeeTimeLogs = catchAsync(async (req, res) => {
  const timeLogs = await timeLogService.getEmployeeTimeLogs(req.user, req.query);
  res.status(200).json(ApiResponse.success(timeLogs, 'Time logs retrieved successfully'));
});

exports.updateTimeLog = catchAsync(async (req, res) => {
  const updatedTimeLog = await timeLogService.updateTimeLog(req.params.id, req.body, req.files);
  res.status(200).json(ApiResponse.success(updatedTimeLog, 'Time log updated successfully'));
});

exports.deleteTimeLog = catchAsync(async (req, res) => {
  await timeLogService.deleteTimeLog(req.params.id);
  res.status(200).json(ApiResponse.success(null, "Time log deleted successfully"));
});

exports.downloadTimeLogAttachment = catchAsync(async (req, res) => {
  const url = await timeLogService.downloadTimeLogAttachment(req.params.id, req.params.attachmentId);
  return res.redirect(url);
});
