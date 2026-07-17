const payrollService = require("../services/payrollService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.previewPayroll = catchAsync(async (req, res) => {
  const { startDate, endDate, standardHours } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json(ApiResponse.error("Start date and end date are required"));
  }

  const payrollData = await payrollService.previewPayroll(
    req.user, 
    startDate, 
    endDate, 
    parseFloat(standardHours) || 0
  );
  
  res.status(200).json(ApiResponse.success(payrollData));
});

exports.generatePayslips = catchAsync(async (req, res) => {
  const payslips = await payrollService.generatePayslips(req.user, req.body);
  res.status(201).json(ApiResponse.success(payslips, "Payslips generated successfully"));
});

exports.getPayslipHistory = catchAsync(async (req, res) => {
  const history = await payrollService.getPayslipHistory(req.user);
  res.status(200).json(ApiResponse.success(history));
});
