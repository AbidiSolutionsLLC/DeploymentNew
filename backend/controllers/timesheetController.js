const Timesheet = require("../models/timesheetSchema");
const TimeLog = require("../models/timeLogsSchema");
const User = require("../models/userSchema"); 
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const { cloudinary } = require("../storageConfig");
const { getStartOfESTDay, getEndOfESTDay, moment, TIMEZONE } = require("../utils/dateUtils");
const sendEmail = require('../utils/emailService');
const { createNotification } = require('../utils/notificationService');

// --- 1. CREATE TIMESHEET ---
exports.createTimesheet = catchAsync(async (req, res) => {
  let { name, description, timeLogs, date, employeeId } = req.body;
  const role = req.user.role ? req.user.role.toLowerCase() : "";
  
  let employee = req.user.id;
  let employeeName = req.user.name;

  if (employeeId && ['super admin', 'admin'].includes(role)) {
      const targetUser = await User.findById(employeeId);
      if (!targetUser) throw new BadRequestError("Target employee not found");
      employee = targetUser._id;
      employeeName = targetUser.name;
  }

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

  // --- NOTIFICATION: Only Notify Reporting Manager ---
  try {
    const user = await User.findById(employee).select('reportsTo name');
    if (user && user.reportsTo) {
      await createNotification({
        recipient: user.reportsTo,
        type: 'TIMESHEET_SUBMITTED',
        title: 'New Timesheet Submitted',
        message: `${user.name} submitted a new timesheet for ${moment(timesheetDate).tz(TIMEZONE).format('MM-DD-YYYY')}.`,
        relatedEntity: { entityType: 'timesheet', entityId: savedTimesheet._id },
      });
    }
  } catch (notifErr) {
    console.error('[Notification Error] Timesheet submission:', notifErr.message);
  }

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
  const { status, approvedHours, comment } = req.body;
  const timesheet = await Timesheet.findById(id).populate('employee', 'name email');
  if (!timesheet) throw new NotFoundError("Timesheet");

  timesheet.status = status;
  if (approvedHours !== undefined) timesheet.approvedHours = approvedHours;
  
  // Add comment if provided
  if (comment && comment.trim()) {
    const newComment = {
      author: req.user?.name || "Unknown",
      authorId: req.user?.id || req.user?._id,
      content: comment.trim(),
      time: new Date(),
      avatar: req.user?.avatar || ""
    };
    timesheet.comments.push(newComment);
  }
  
  const updatedTimesheet = await timesheet.save();

  if (timesheet.employee?.email) {
    const statusColor = status === 'Approved' ? '#2e7d32' : '#c62828';
    const commentSection = comment ? `<p><strong>Comment:</strong> ${comment}</p>` : '';
    const emailBody = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: ${statusColor};">Timesheet ${status}</h2>
        <p>Hello <strong>${timesheet.employee.name}</strong>, your timesheet for ${new Date(timesheet.date).toDateString()} was reviewed.</p>
        <p><strong>Status:</strong> ${status}</p>
        ${commentSection}
      </div>`;
    sendEmail(timesheet.employee.email, `Timesheet Update: ${status}`, emailBody).catch(console.error);
  }

  // --- NOTIFICATION: Notify Employee ---
  try {
    const type = status === 'Approved' ? 'TIMESHEET_APPROVED' : 'TIMESHEET_REJECTED';
    const title = `Timesheet ${status}`;
    const message = `Your timesheet for ${new Date(timesheet.date).toDateString()} has been ${status.toLowerCase()}.`;

    await createNotification({
      recipient: timesheet.employee._id,
      type,
      title,
      message,
      relatedEntity: { entityType: 'timesheet', entityId: updatedTimesheet._id },
    });
  } catch (notifErr) {
    console.error('[Notification Error] Timesheet status update:', notifErr.message);
  }

  res.status(200).json(updatedTimesheet);
});

// ... existing imports

// --- 6. GLOBAL FETCH (Super Admin / Reporting View) ---
exports.getAllTimesheets = catchAsync(async (req, res) => {
  const { month, year, startDate, endDate } = req.query;
  const { role } = req.user;
  
  let query = {};

  // 1. Date Filtering: Support Range (Weekly) OR Month/Year
  if (startDate && endDate) {
    query.date = { 
      $gte: moment.tz(startDate, TIMEZONE).startOf('day').toDate(), 
      $lte: moment.tz(endDate, TIMEZONE).endOf('day').toDate() 
    };
  } else if (month && year) {
    query.date = { 
      $gte: moment.tz([year, month - 1], TIMEZONE).startOf('month').toDate(),
      $lte: moment.tz([year, month - 1], TIMEZONE).endOf('month').toDate()
    };
  }

  // 2. RBAC: Who sees what?
  if (role === 'Super Admin' || role === 'HR') {
     // See ALL
  } 
  else if (role === 'Manager' || role === 'Admin') {
     // See Subordinates + Self
     const subordinates = await User.find({ reportsTo: req.user.id || req.user._id }).select('_id');
     const validIds = subordinates.map(u => u._id);
     validIds.push(req.user.id || req.user._id);
     query.employee = { $in: validIds };
  } 
  else {
     // Fallback: See Self
     query.employee = req.user.id;
  }

  const timesheets = await Timesheet.find(query)
    .populate("timeLogs")
    .populate("employee", "name email role designation avatar")
    .sort({ date: -1 });

  res.status(200).json(timesheets); // Returns an Array []
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

// --- 7. ADD COMMENT TO TIMESHEET ---
exports.addTimesheetComment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new BadRequestError("Comment content is required");
  }

  const timesheet = await Timesheet.findById(id);
  if (!timesheet) throw new NotFoundError("Timesheet");

  const newComment = {
    author: req.user?.name || "Unknown",
    authorId: req.user?.id || req.user?._id,
    content: content.trim(),
    time: new Date(),
    avatar: req.user?.avatar || ""
  };

  timesheet.comments.push(newComment);
  await timesheet.save();

  res.status(200).json(timesheet);
});

// --- 8. UPDATE TIMESHEET (Employee can edit only if status is Pending) ---
exports.updateTimesheet = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description, date } = req.body;

  const timesheet = await Timesheet.findById(id);
  if (!timesheet) throw new NotFoundError("Timesheet");

  // Only allow employee to edit if status is Pending
  if (timesheet.status !== 'Pending') {
    throw new ForbiddenError("You can only edit timesheets that are in Pending status");
  }

  // Verify ownership
  if (timesheet.employee.toString() !== (req.user.id || req.user._id).toString()) {
    throw new ForbiddenError("You can only edit your own timesheets");
  }

  if (name) timesheet.name = name;
  if (description) timesheet.description = description;
  if (date) timesheet.date = moment.tz(date, TIMEZONE).startOf('day').toDate();

  // Handle new attachments if uploaded
  if (req.files && req.files.length > 0) {
    const attachmentData = req.files.map(file => ({
      public_id: file.public_id,
      url: file.path,
      originalname: file.originalname,
      format: file.format,
      size: file.size
    }));
    timesheet.attachments.push(...attachmentData);
  }

  await timesheet.save();
  res.status(200).json(timesheet);
});

// --- 9. DELETE TIMESHEET (Employee can delete only if status is Pending) ---
exports.deleteTimesheet = catchAsync(async (req, res) => {
  const { id } = req.params;

  const timesheet = await Timesheet.findById(id);
  if (!timesheet) throw new NotFoundError("Timesheet");

  // Only allow employee to delete if status is Pending
  if (timesheet.status !== 'Pending') {
    throw new ForbiddenError("You can only delete timesheets that are in Pending status");
  }

  // Verify ownership
  if (timesheet.employee.toString() !== (req.user.id || req.user._id).toString()) {
    throw new ForbiddenError("You can only delete your own timesheets");
  }

  // Reset time logs to not be added to timesheet
  if (timesheet.timeLogs && timesheet.timeLogs.length > 0) {
    await TimeLog.updateMany(
      { _id: { $in: timesheet.timeLogs } },
      { $set: { isAddedToTimesheet: false, timesheet: null } }
    );
  }

  await timesheet.deleteOne();
  res.status(200).json({ message: "Timesheet deleted successfully" });
});
