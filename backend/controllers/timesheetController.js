const timesheetService = require("../services/timesheetService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createTimesheet = catchAsync(async (req, res) => {
  const timesheet = await timesheetService.createTimesheet(req.user, req.companyId, req.body);
  res.status(201).json(ApiResponse.success(timesheet, 'Timesheet submitted successfully'));
});

exports.getWeeklyTimesheets = catchAsync(async (req, res) => {
  const data = await timesheetService.getWeeklyTimesheets(req.user, req.companyId, req.query);
  res.status(200).json(ApiResponse.success(data, 'Weekly timesheets retrieved'));
});

exports.getAllTimesheets = catchAsync(async (req, res) => {
  const result = await timesheetService.getAllTimesheets(req.user, req.companyId, req.query);
  res.status(200).json(ApiResponse.success(result.data, 'All timesheets retrieved', result.pagination));
});

exports.getTimesheetById = catchAsync(async (req, res) => {
  const timesheet = await timesheetService.getTimesheetById(req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(timesheet, 'Timesheet retrieved successfully'));
});

exports.updateTimesheetStatus = catchAsync(async (req, res) => {
  const updatedTimesheet = await timesheetService.updateTimesheetStatus(req.user, req.companyId, req.params.id, req.body);
  res.status(200).json(ApiResponse.success(updatedTimesheet, `Timesheet ${updatedTimesheet.status.toLowerCase()}`));
});

exports.deleteTimesheet = catchAsync(async (req, res) => {
  await timesheetService.deleteTimesheet(req.user, req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(null, "Timesheet deleted successfully"));
});

exports.updateTimesheet = catchAsync(async (req, res) => {
  // const timesheet = await timesheetService.updateTimesheet(req.user, req.companyId, req.params.id, req.body, req.files);
  res.status(200).json(ApiResponse.success(null, 'Timesheet updated successfully'));
});

exports.addTimesheetComment = catchAsync(async (req, res) => {
  // const timesheet = await timesheetService.addTimesheetComment(req.user, req.companyId, req.params.id, req.body.comment);
  res.status(200).json(ApiResponse.success(null, 'Comment added'));
});

exports.downloadAttachment = catchAsync(async (req, res) => {
  // const url = await timesheetService.downloadAttachment(req.user, req.companyId, req.params.id, req.params.attachmentId);
  res.status(200).json(ApiResponse.success({ url: "" }));
});
