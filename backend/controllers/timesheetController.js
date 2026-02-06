const Timesheet = require("../models/timesheetSchema");
const TimeLog = require("../models/timeLogsSchema");
const User = require("../models/userSchema"); 
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const { cloudinary } = require("../storageConfig");
const { getStartOfESTDay, getEndOfESTDay, moment, TIMEZONE } = require("../utils/dateUtils");
const sendEmail = require('../utils/emailService');

// --- 1. CREATE TIMESHEET ---
exports.createTimesheet = catchAsync(async (req, res) => {
  let { name, description, timeLogs, date } = req.body;
  const employee = req.user.id;
  const employeeName = req.user.name;

  let logIds = Array.isArray(timeLogs) ? timeLogs : (timeLogs ? [timeLogs] : []);
  if (logIds.length === 0) throw new BadRequestError("No time logs provided");

  // FIX: Force dates into EST Midnight
  let timesheetDate = date ? moment.tz(date, TIMEZONE).startOf('day').toDate() : getStartOfESTDay();

  const timesheetDateStart = getStartOfESTDay(timesheetDate);
  const timesheetDateEnd = getEndOfESTDay(timesheetDate);

  const existingTimesheet = await Timesheet.findOne({
    employee,
    date: { $gte: timesheetDateStart, $lte: timesheetDateEnd }
  });

  if (existingTimesheet) {
    throw new BadRequestError(`You have already submitted a timesheet for ${moment(timesheetDate).tz(TIMEZONE).format('MM-DD-YYYY')}.`);
  }

  const logs = await TimeLog.find({ _id: { $in: logIds }, employee, isAddedToTimesheet: false });
  if (logs.length !== logIds.length) {
    throw new BadRequestError("Invalid logs or logs already added to another timesheet");
  }

  const submittedHours = logs.reduce((total, log) => total + log.hours, 0);

  // Weekly Limit (EST Week)
  const startOfWeek = moment(timesheetDate).tz(TIMEZONE).startOf('isoWeek').toDate();
  const endOfWeek = moment(timesheetDate).tz(TIMEZONE).endOf('isoWeek').toDate();

  const weeklyTimesheets = await Timesheet.find({
    employee,
    date: { $gte: startOfWeek, $lte: endOfWeek },
    status: { $in: ["Pending", "Approved"] }
  });

  const weeklyTotalHours = weeklyTimesheets.reduce((total, sheet) => total + sheet.submittedHours, 0);
  if (weeklyTotalHours + submittedHours > 40) throw new BadRequestError(`Weekly limit (40h) exceeded.`);

  // Validation: Date Mismatch using EST strings
  const targetDateStr = moment(timesheetDate).tz(TIMEZONE).format('YYYY-MM-DD');
  const mismatchedLogs = logs.filter(log => {
    const logDateStr = moment(log.date).tz(TIMEZONE).format('YYYY-MM-DD');
    return logDateStr !== targetDateStr;
  });

  if (mismatchedLogs.length > 0) {
    throw new BadRequestError(`All time logs must be for ${targetDateStr}.`);
  }

  const attachmentData = req.files?.map(file => ({
    public_id: file.public_id,
    url: file.path,
    originalname: file.originalname,
    format: file.format,
    size: file.size
  }));

  const timesheet = new Timesheet({
    name, description, employee, employeeName,
    date: timesheetDate,
    submittedHours,
    timeLogs: logIds,
    attachments: attachmentData || [],
  });

  const savedTimesheet = await timesheet.save();
  await TimeLog.updateMany({ _id: { $in: logIds } }, { isAddedToTimesheet: true, timesheet: savedTimesheet._id });

  res.status(201).json(savedTimesheet);
});

// --- 2. GET WEEKLY TIMESHEETS (FIXED: STRICT PERSONAL DEFAULT) ---
exports.getWeeklyTimesheets = catchAsync(async (req, res) => {
  const { weekStart, userId } = req.query; 
  if (!weekStart) throw new BadRequestError("Week start date is required");

  const startDate = moment.tz(weekStart, TIMEZONE).startOf('day').toDate();
  const endDate = moment(startDate).add(6, 'days').endOf('day').toDate();

  let query = { date: { $gte: startDate, $lte: endDate } };
  const roleKey = req.user.role ? req.user.role.toLowerCase() : "";

  // LOGIC FIX: 
  // ONLY show other users if 'userId' is explicitly provided AND user is Admin/Manager.
  // Otherwise, DEFAULT to the logged-in user (req.user.id).
  // This stops the "broadcasting" issue where Admins see everyone on their own dashboard.
  
  if (userId && ['super admin', 'admin', 'manager'].includes(roleKey)) {
      query.employee = userId;
  } else {
      query.employee = req.user.id; // Strict Personal Scope
  }

  const timesheets = await Timesheet.find(query)
    .populate("timeLogs")
    .populate("employee", "name email role") 
    .sort({ date: 1 });

  const weeklyTotal = timesheets.reduce((total, sheet) => total + sheet.submittedHours, 0);

  res.status(200).json({
    weekStart: startDate.toISOString(),
    weekEnd: endDate.toISOString(),
    timesheets,
    weeklyTotal,
    remainingHours: Math.max(0, 40 - weeklyTotal) 
  });
});

// --- 3. GET EMPLOYEE TIMESHEETS (FIXED: STRICT PERSONAL DEFAULT) ---
exports.getEmployeeTimesheets = catchAsync(async (req, res) => {
  const { month, year, startDate, endDate, userId } = req.query;
  let query = {};
  const roleKey = req.user.role ? req.user.role.toLowerCase() : "";

  // Same Logic: Default to Self unless specifically asking for another user
  if (userId && ['super admin', 'admin', 'manager'].includes(roleKey)) {
      query.employee = userId;
  } else {
      query.employee = req.user.id;
  }

  if (startDate && endDate) {
    query.date = { 
        $gte: moment.tz(startDate, TIMEZONE).startOf('day').toDate(), 
        $lte: moment.tz(endDate, TIMEZONE).endOf('day').toDate() 
    };
  } else if (month && year) {
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

// --- 4. GET BY ID ---
exports.getTimesheetById = catchAsync(async (req, res) => {
  const timesheet = await Timesheet.findById(req.params.id).populate("timeLogs");
  if (!timesheet) throw new NotFoundError("Timesheet");
  res.status(200).json(timesheet);
});

// --- 5. UPDATE STATUS ---
exports.updateTimesheetStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, approvedHours } = req.body;
  const timesheet = await Timesheet.findById(id).populate('employee', 'name email');
  if (!timesheet) throw new NotFoundError("Timesheet");

  timesheet.status = status;
  if (approvedHours !== undefined) timesheet.approvedHours = approvedHours;
  const updatedTimesheet = await timesheet.save();

  if (timesheet.employee?.email) {
    const statusColor = status === 'Approved' ? '#2e7d32' : '#c62828';
    const emailBody = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: ${statusColor};">Timesheet ${status}</h2>
        <p>Hello <strong>${timesheet.employee.name}</strong>, your timesheet for ${new Date(timesheet.date).toDateString()} was reviewed.</p>
        <p><strong>Status:</strong> ${status}</p>
      </div>`;
    sendEmail(timesheet.employee.email, `Timesheet Update: ${status}`, emailBody).catch(console.error);
  }
  res.status(200).json(updatedTimesheet);
});

// --- 6. GLOBAL FETCH (Keep for Super Admin Reporting View) ---
exports.getAllTimesheets = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  let query = {};
  if (month && year) {
    query.date = { 
      $gte: moment.tz([year, month - 1], TIMEZONE).startOf('month').toDate(),
      $lte: moment.tz([year, month - 1], TIMEZONE).endOf('month').toDate()
    };
  }
  const timesheets = await Timesheet.find(query)
    .populate("timeLogs")
    .populate("employee", "name email role")
    .sort({ date: -1 });
  res.status(200).json(timesheets);
});

exports.downloadAttachment = catchAsync(async (req, res) => {
  const { id, attachmentId } = req.params;
  const timesheet = await Timesheet.findById(id);
  if (!timesheet) throw new NotFoundError("Timesheet");
  const attachment = timesheet.attachments.id(attachmentId);
  if (!attachment) throw new NotFoundError("Attachment");

  if (attachment.public_id) {
    const downloadUrl = cloudinary.url(attachment.public_id, { secure: true, resource_type: 'raw', flags: 'attachment', attachment: attachment.originalname, sign_url: true });
    return res.redirect(downloadUrl);
  }
  return res.redirect(attachment.url);
});
