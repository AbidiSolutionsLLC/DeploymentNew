const leaveService = require("../services/leaveService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createLeaveRequest = catchAsync(async (req, res) => {
  const data = await leaveService.createLeaveRequest(req.user.id || req.user._id, req.companyId, req.body);
  res.status(201).json(ApiResponse.success(data));
});

exports.getLeaveRequestResponses = catchAsync(async (req, res) => {
  const data = await leaveService.getLeaveRequestResponses(req.user, req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(data));
});

exports.updateLeaveResponse = catchAsync(async (req, res) => {
  const currentUserId = req.user.id || req.user._id;
  const data = await leaveService.updateLeaveResponse(currentUserId, req.companyId, req.params.id, req.params.responseId, req.body.content);
  res.status(200).json(ApiResponse.success(data, "Response updated successfully"));
});

exports.getLeaveRequests = catchAsync(async (req, res) => {
  const result = await leaveService.getLeaveRequests(req.user, req.companyId, req.query);
  res.status(200).json(ApiResponse.success(result.data, "Leave requests retrieved", {
    total: result.total,
    count: result.count,
    page: result.page,
    limit: result.limit
  }));
});

exports.getLeaveRequestById = catchAsync(async (req, res) => {
  const data = await leaveService.getLeaveRequestById(req.user, req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(data));
});

exports.updateLeaveRequest = catchAsync(async (req, res) => {
  const currentUserId = req.user.id || req.user._id;
  const data = await leaveService.updateLeaveRequest(currentUserId, req.companyId, req.params.id, req.body);
  res.status(200).json(ApiResponse.success(data));
});

exports.addLeaveResponse = catchAsync(async (req, res) => {
  const data = await leaveService.addLeaveResponse(req.user, req.companyId, req.params.id, req.body.content);
  res.status(200).json(ApiResponse.success(data, "Response added successfully"));
});

exports.deleteLeaveResponse = catchAsync(async (req, res) => {
  const data = await leaveService.deleteLeaveResponse(req.user, req.companyId, req.params.id, req.params.responseId);
  res.status(200).json(ApiResponse.success(data, "Response deleted successfully"));
});

exports.updateLeaveStatus = catchAsync(async (req, res) => {
  const data = await leaveService.updateLeaveStatus(req.user, req.companyId, req.params.id, req.body.status, req.body.responseNote);
  res.status(200).json(ApiResponse.success(data, `Leave status updated to ${req.body.status}`));
});

exports.deleteLeaveRequest = catchAsync(async (req, res) => {
  await leaveService.deleteLeaveRequest(req.user, req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(null, "Leave request deleted"));
});

exports.manageHolidays = catchAsync(async (req, res) => {
  await leaveService.manageHolidays(req.user);
  res.status(200).json(ApiResponse.success(null, "Holiday list updated."));
});

exports.getLeaveBalance = catchAsync(async (req, res) => {
  const data = await leaveService.getLeaveBalance(req.user.id || req.user._id);
  res.status(200).json(ApiResponse.success(data));
});

exports.bulkUpdateStatus = catchAsync(async (req, res) => {
  const data = await leaveService.bulkUpdateStatus(req.user, req.companyId, req.body.ids, req.body.status);
  res.status(200).json(ApiResponse.success(data, `Successfully updated ${data.length} requests to ${req.body.status}`));
});

exports.exportLeaves = catchAsync(async (req, res) => {
  const csv = await leaveService.exportLeaves(req.user, req.companyId);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=leaves.csv');
  res.status(200).send(csv);
});
