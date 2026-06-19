const adminDashboardService = require("../services/adminDashboardService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const stats = await adminDashboardService.getDashboardStats(req.user, req.companyId);
  res.status(200).json(ApiResponse.success(stats, "Dashboard stats retrieved successfully"));
});