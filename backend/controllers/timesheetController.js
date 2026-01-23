const Timesheet = require("../models/timesheetSchema");
const TimeLog = require("../models/timeLogsSchema");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");
const { cloudinary } = require("../storageConfig");
const { getStartOfESTDay, getEndOfESTDay, moment, TIMEZONE } = require("../utils/dateUtils");


// Create Timesheet
exports.createTimesheet = catchAsync(async (req, res) => {
  let { name, description, timeLogs, date } = req.body;
  const employee = req.user.id;
  const attachments = req.files;
  const employeeName = req.user.name;

  // FIX: Handle FormData 'timeLogs' field
  let logIds = [];
  if (Array.isArray(timeLogs)) {
    logIds = timeLogs;
  } else if (timeLogs) {
    logIds = [timeLogs];
  }

  if (logIds.length === 0) {
    throw new BadRequestError("No time logs provided");
  }

  // Determine Timesheet Date - Use the date from the request (could be any date)
  let timesheetDate;
  if (date) {
    timesheetDate = new Date(date);
  } else {
    // If no date provided, use today (EST aligned)
    timesheetDate = getStartOfESTDay();
  }

  // Calculate Start and End of EST Day for this date
  const timesheetDateStart = getStartOfESTDay(timesheetDate);
  const timesheetDateEnd = getEndOfESTDay(timesheetDate);

  // VALIDATION 1: Check if timesheet already exists for THIS SPECIFIC DATE
  const existingTimesheet = await Timesheet.findOne({
    employee,
    date: {
      $gte: timesheetDateStart,
      $lte: timesheetDateEnd
    }
  });

  if (existingTimesheet) {
    throw new BadRequestError(`You have already submitted a timesheet for ${timesheetDate.toLocaleDateString()}. Only one timesheet per day is allowed.`);
  }

  // Verify all time logs belong to the employee and aren't already in a timesheet
  const logs = await TimeLog.find({
    _id: { $in: logIds },
    employee,
    isAddedToTimesheet: false,
  });

  if (logs.length !== logIds.length) {
    throw new BadRequestError("Invalid time logs or logs already added to another timesheet");
  }

  // Calculate total hours for this timesheet
  const submittedHours = logs.reduce((total, log) => total + log.hours, 0);

  // VALIDATION 2: Check if this timesheet would exceed 40 hours for the week
  // Get start and end of the week (Monday to Sunday) based on the timesheet date IN EST
  // Use moment to safely calculate week boundaries in specific timezone
  const weekStartMoment = moment(timesheetDate).tz(TIMEZONE).startOf('isoWeek'); // Monday
  const weekEndMoment = moment(timesheetDate).tz(TIMEZONE).endOf('isoWeek'); // Sunday

  const startOfWeek = weekStartMoment.toDate();
  const endOfWeek = weekEndMoment.toDate();

  // Get all timesheets for this employee in the same week
  const weeklyTimesheets = await Timesheet.find({
    employee,
    date: {
      $gte: startOfWeek,
      $lte: endOfWeek
    },
    status: { $in: ["Pending", "Approved"] } // Only count pending and approved
  });

  // Calculate total hours already submitted this week
  const weeklyTotalHours = weeklyTimesheets.reduce((total, sheet) =>
    total + sheet.submittedHours, 0
  );

  // Check if adding this timesheet would exceed 40 hours
  if (weeklyTotalHours + submittedHours > 40) {
    throw new BadRequestError(
      `Weekly hour limit (40 hours) exceeded. You have ${weeklyTotalHours} hours already submitted for week of ${startOfWeek.toLocaleDateString()}.`
    );
  }

  // VALIDATION 3: Ensure all time logs match the timesheet date
  const mismatchedLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    return logDate.toDateString() !== timesheetDate.toDateString();
  });

  if (mismatchedLogs.length > 0) {
    throw new BadRequestError(
      `All time logs must be for the same date as the timesheet (${timesheetDate.toLocaleDateString()}). Found logs for different dates.`
    );
  }

  const attachmentData = attachments?.map(file => ({
    public_id: file.public_id,
    url: file.path,
    originalname: file.originalname,
    format: file.format,
    size: file.size
  }));

  // Create timesheet with the specific date
  const timesheet = new Timesheet({
    name,
    description,
    employee,
    employeeName,
    date: timesheetDate, // Store the specific date
    submittedHours,
    timeLogs: logIds,
    attachments: attachmentData || [],
  });

  // Save timesheet and update time logs
  const savedTimesheet = await timesheet.save();

  // Update time logs to mark them as added to timesheet
  await TimeLog.updateMany(
    { _id: { $in: logIds } },
    { isAddedToTimesheet: true, timesheet: savedTimesheet._id }
  );

  res.status(201).json(savedTimesheet);
});

// Updated getWeeklyTimesheets function
exports.getWeeklyTimesheets = catchAsync(async (req, res) => {
  const employee = req.user.id;
  const { weekStart } = req.query; // Expecting YYYY-MM-DD format for Monday

  if (!weekStart) {
    throw new BadRequestError("Week start date is required");
  }

  const startDate = moment(weekStart).tz(TIMEZONE).startOf('day').toDate();
  if (isNaN(startDate.getTime())) {
    throw new BadRequestError("Invalid date format");
  }

  const endDate = moment(startDate).tz(TIMEZONE).add(6, 'days').endOf('day').toDate();

  // Get all timesheets for this week
  const timesheets = await Timesheet.find({
    employee,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .populate("timeLogs")
    .sort({ date: 1 }); // Sort by date ascending

  // Calculate weekly total
  const weeklyTotal = timesheets.reduce((total, sheet) => total + sheet.submittedHours, 0);

  // Convert dates to ISO strings for frontend consistency
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

// Get Timesheets for Employee
exports.getEmployeeTimesheets = catchAsync(async (req, res) => {
  const employee = req.user.id;
  const { month, year, startDate, endDate } = req.query;

  let query = { employee };

  // Support Date Range Query (Week View)
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  // Fallback to Month View
  else if (month && year) {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    query.date = {
      $gte: start,
      $lte: end
    };
  }

  const timesheets = await Timesheet.find(query)
    .populate("timeLogs")
    .sort({ date: -1 });

  res.status(200).json(timesheets);
});

// Get Timesheet by ID
exports.getTimesheetById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const timesheet = await Timesheet.findById(id).populate("timeLogs");

  if (!timesheet) throw new NotFoundError("Timesheet");

  res.status(200).json(timesheet);
});

// Update Timesheet Status
exports.updateTimesheetStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, approvedHours } = req.body;

  const timesheet = await Timesheet.findById(id);
  if (!timesheet) throw new NotFoundError("Timesheet");

  timesheet.status = status;
  if (approvedHours !== undefined) {
    timesheet.approvedHours = approvedHours;
  }

  const updatedTimesheet = await timesheet.save();
  res.status(200).json(updatedTimesheet);
});

// Get All Timesheets (admin)
exports.getAllTimesheets = catchAsync(async (req, res) => {
  const { month, year } = req.query;

  let query = {};

  if (month && year) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    query.date = {
      $gte: startDate,
      $lte: endDate
    };
  }

  const timesheets = await Timesheet.find(query)
    .populate("timeLogs")
    .sort({ date: -1 });

  res.status(200).json(timesheets);
});


exports.downloadAttachment = catchAsync(async (req, res) => {
  const { id, attachmentId } = req.params;

  const timesheet = await Timesheet.findById(id);
  if (!timesheet) throw new NotFoundError("Timesheet");

  const attachment = timesheet.attachments.id(attachmentId);
  if (!attachment) {
    throw new NotFoundError("Attachment");
  }

  try {
    if (attachment.public_id) {
      // Cloudinary attachment
      const downloadUrl = cloudinary.url(attachment.public_id, {
        secure: true,
        resource_type: 'raw',
        flags: 'attachment',
        attachment: attachment.originalname,
        sign_url: true
      });

      return res.redirect(downloadUrl);
    } else if (attachment.url) {
      // Direct URL
      const response = await fetch(attachment.url);
      const buffer = await response.buffer();

      res.set({
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${attachment.originalname}"`,
        'Content-Length': buffer.length
      });

      return res.send(buffer);
    } else {
      throw new BadRequestError("No valid attachment URL found");
    }

  } catch (error) {
    console.error("Download error:", error);

    // Fallback
    if (attachment.url) {
      return res.redirect(attachment.url);
    }

    throw new BadRequestError("Failed to generate download link");
  }
});