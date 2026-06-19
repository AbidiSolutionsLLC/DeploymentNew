const holidayService = require("../services/holidayService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createHoliday = catchAsync(async (req, res) => {
  const holiday = await holidayService.createHoliday(req.user, req.body);
  res.status(201).json(ApiResponse.success(holiday, "Holiday created successfully"));
});

exports.getAllHolidays = catchAsync(async (req, res) => {
  const holidays = await holidayService.getAllHolidays();
  res.status(200).json(ApiResponse.success(holidays, "Holidays retrieved successfully"));
});

exports.getHolidayById = catchAsync(async (req, res) => {
  const holiday = await holidayService.getHolidayById(req.params.id);
  res.status(200).json(ApiResponse.success(holiday, "Holiday retrieved successfully"));
});

exports.updateHoliday = catchAsync(async (req, res) => {
  const updatedHoliday = await holidayService.updateHoliday(req.user, req.params.id, req.body);
  res.status(200).json(ApiResponse.success(updatedHoliday, "Holiday updated successfully"));
});

exports.deleteHoliday = catchAsync(async (req, res) => {
  await holidayService.deleteHoliday(req.user, req.params.id);
  res.status(200).json(ApiResponse.success(null, "Holiday deleted successfully"));
});

exports.getHolidaysByYear = catchAsync(async (req, res) => {
  const holidays = await holidayService.getHolidaysByYear(req.params.year);
  res.status(200).json(ApiResponse.success(holidays, "Holidays retrieved successfully"));
});