const Timesheet = require("../models/timesheetSchema");
const TimeLog = require("../models/timeLogsSchema");
// --- NEW: Import User to find subordinates ---
const User = require("../models/userSchema"); 
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const { cloudinary } = require("../storageConfig");
const { getStartOfESTDay, getEndOfESTDay, moment, TIMEZONE } = require("../utils/dateUtils");
const sendEmail = require('../utils/emailService');

// Create Timesheet
exports.createTimesheet = catchAsync(async (req, res) => {
  let { name, description, timeLogs, date } = req.body;
  const employee = req.user.id;
  const employeeName = req.user.name;

  let logIds = [];
  if (Array.isArray(timeLogs)) {
    logIds = timeLogs;
  } else if (timeLogs) {
    logIds = [timeLogs];
  }

  if (logIds.length === 0) {
    throw new BadRequestError("No time logs provided");
  }

  let timesheetDate;
  if (date) {
    // FIX: Parse the string directly into EST Midnight to prevent day-shifting
    timesheetDate = moment.tz(date, TIMEZONE).startOf('day').toDate();
  } else {
    timesheetDate = getStartOfESTDay();
  }

  const timesheetDateStart = getStartOfESTDay(timesheetDate);
  const timesheetDateEnd = getEndOfESTDay(timesheetDate);

  const existingTimesheet = await Timesheet.findOne({
    employee,
    date: {
      $gte: timesheetDateStart,
      $lte: timesheetDateEnd
    }
  });

  if (existingTimesheet) {
    throw new BadRequestError(`You have already submitted a timesheet for ${new Date(timesheetDate).toLocaleDateString()}.`);
  }

  const logs = await TimeLog.find({
    _id: { $in: logIds },
    employee,
    isAddedToTimesheet: false,
  });

  if (logs.length !== logIds.length) {
    throw new BadRequestError("Invalid time logs or logs already added to another timesheet");
  }

  const submittedHours = logs.reduce((total, log) => total + log.hours, 0);

  const weekStartMoment = moment(timesheetDate).tz(TIMEZONE).startOf('isoWeek');
  const weekEndMoment = moment(timesheetDate).tz(TIMEZONE).endOf('isoWeek');
  const startOfWeek = weekStartMoment.toDate();
  const endOfWeek = weekEndMoment.toDate();

  const weeklyTimesheets = await Timesheet.find({
    employee,
    date: { $gte: startOfWeek, $lte: endOfWeek },
    status: { $in: ["Pending", "Approved"] }
  });

  const weeklyTotalHours = weeklyTimesheets.reduce((total, sheet) => total + sheet.submittedHours, 0);

  if (weeklyTotalHours + submittedHours > 40) {
    throw new BadRequestError(`Weekly hour limit (40 hours) exceeded.`);
  }

  // FIX: Compare dates using formatted EST strings instead of UTC objects
  const targetDateStr = moment(timesheetDate).tz(TIMEZONE).format('YYYY-MM-DD');
  const mismatchedLogs = logs.filter(log => {
    const logDateStr = moment(log.date).tz(TIMEZONE).format('YYYY-MM-DD');
    return logDateStr !== targetDateStr;
  });

  if (mismatchedLogs.length > 0) {
    throw new BadRequestError(`All time logs must be for the same date as the timesheet (${targetDateStr}).`);
  }

  const attachmentData = req.files?.map(file => ({
    public_id: file.public_id,
    url: file.path,
    originalname: file.originalname,
    format: file.format,
    size: file.size
  }));

  const timesheet = new Timesheet({
    name,
    description,
    employee,
    employeeName,
    date: timesheetDate,
    submittedHours,
    timeLogs: logIds,
    attachments: attachmentData || [],
  });

  const savedTimesheet = await timesheet.save();

  await TimeLog.updateMany(
    { _id: { $in: logIds } },
    { isAddedToTimesheet: true, timesheet: savedTimesheet._id }
  );

  res.status(201).json(savedTimesheet);
});

// --- FIX: RBAC Logic to see Subordinates for Admin/Manager ---
exports.getWeeklyTimesheets = catchAsync(async (req, res) => {
  const { weekStart } = req.query; 

  if (!weekStart) {
    throw new BadRequestError("Week start date is required");
  }

  const startDate = moment.tz(weekStart, TIMEZONE).startOf('day').toDate();
  const endDate = moment(startDate).tz(TIMEZONE).add(6, 'days').endOf('day').toDate();

  let query = {
    date: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (req.user.role === 'Super Admin') {
    // Super Admin sees everything
  } 
  else if (req.user.role === 'Admin' || req.user.role === 'Manager') {
    const subordinates = await User.find({ reportingManager: req.user._id }).select('_id');
    const subordinateIds = subordinates.map(user => user._id);
    subordinateIds.push(req.user._id);
    query.employee = { $in: subordinateIds };
  } 
  else {
    query.employee = req.user.id;
  }

  const timesheets = await Timesheet.find(query)
    .populate("timeLogs")
    .populate("employee", "name email role") 
    .sort({ date: 1 });

  const weeklyTotal = timesheets.reduce((total, sheet) => total + sheet.submittedHours, 0);

  const processedTimesheets = timesheets.map(timesheet => ({
    ...timesheet.toObject(),
    date: timesheet.date.toISOString()
  }));

  res.status(200).json({
    weekStart: startDate.toISOString(),
    weekEnd: endDate.toISOString(),
    timesheets: processedTimesheets,
    weeklyTotal,
    remainingHours: Math.max(0, 40 - weeklyTotal) 
  });
});

exports.getEmployeeTimesheets = catchAsync(async (req, res) => {
  const { month, year, startDate, endDate } = req.query;
  let query = {};

  if (req.user.role === 'Super Admin') {
      // No filter
  } else if (req.user.role === 'Admin' || req.user.role === 'Manager') {
      const subordinates = await User.find({ reportingManager: req.user._id }).select('_id');
      const subordinateIds = subordinates.map(user => user._id);
      subordinateIds.push(req.user._id);
      query.employee = { $in: subordinateIds };
  } else {
      query.employee = req.user.id;
  }

  if (startDate && endDate) {
    query.date = {
      $gte: moment.tz(startDate, TIMEZONE).startOf('day').toDate(),
      $lte: moment.tz(endDate, TIMEZONE).endOf('day').toDate()
    };
  }
  else if (month && year) {
    const start = moment.tz([year, month - 1], TIMEZONE).startOf('month').toDate();
    const end = moment.tz([year, month - 1], TIMEZONE).endOf('month').toDate();
    query.date = { $gte: start, $lte: end };
  }

  const timesheets = await Timesheet.find(query)
    .populate("timeLogs")
    .populate("employee", "name email")
    .sort({ date: -1 });

  res.status(200).json(timesheets);
});

exports.getTimesheetById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const timesheet = await Timesheet.findById(id).populate("timeLogs");
  if (!timesheet) throw new NotFoundError("Timesheet");
  res.status(200).json(timesheet);
});

exports.updateTimesheetStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, approvedHours } = req.body;

  const timesheet = await Timesheet.findById(id).populate('employee', 'name email');
  if (!timesheet) throw new NotFoundError("Timesheet");

  timesheet.status = status;
  if (approvedHours !== undefined) {
    timesheet.approvedHours = approvedHours;
  }

  const updatedTimesheet = await timesheet.save();

  if (timesheet.employee && timesheet.employee.email) {
    const statusColor = status === 'Approved' ? '#2e7d32' : '#c62828';
    const emailSubject = `Timesheet Update: ${status}`;
    const emailBody = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background-color: ${statusColor}; color: white; padding: 20px; text-align: center;">
          <h2 style="margin:0;">Timesheet ${status}</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hello <strong>${timesheet.employee.name}</strong>,</p>
          <p>Your timesheet submission for <strong>${new Date(timesheet.date).toDateString()}</strong> has been reviewed.</p>
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Status:</strong> ${status}</p>
            ${approvedHours ? `<p style="margin: 5px 0;"><strong>Approved Hours:</strong> ${approvedHours}</p>` : ''}
          </div>
        </div>
      </div>`;
    sendEmail(timesheet.employee.email, emailSubject, emailBody).catch(err => console.error(err.message));
  }
  res.status(200).json(updatedTimesheet);
});

exports.getAllTimesheets = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  let query = {};
  if (month && year) {
    const start = moment.tz([year, month - 1], TIMEZONE).startOf('month').toDate();
    const end = moment.tz([year, month - 1], TIMEZONE).endOf('month').toDate();
    query.date = { $gte: start, $lte: end };
  }
  const timesheets = await Timesheet.find(query).populate("timeLogs").populate("employee", "name email role").sort({ date: -1 });
  res.status(200).json(timesheets);
});

exports.downloadAttachment = catchAsync(async (req, res) => {
  const { id, attachmentId } = req.params;
  const timesheet = await Timesheet.findById(id);
  if (!timesheet) throw new NotFoundError("Timesheet");
  const attachment = timesheet.attachments.id(attachmentId);
  if (!attachment) throw new NotFoundError("Attachment");

  try {
    if (attachment.public_id) {
      const downloadUrl = cloudinary.url(attachment.public_id, { secure: true, resource_type: 'raw', flags: 'attachment', attachment: attachment.originalname, sign_url: true });
      return res.redirect(downloadUrl);
    } else {
      return res.redirect(attachment.url);
    }
  } catch (error) {
    throw new BadRequestError("Failed to generate download link");
  }
});
