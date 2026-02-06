const TimeLog = require("../models/timeLogsSchema");
const Timesheet = require("../models/timesheetSchema");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");
const { moment, TIMEZONE } = require("../utils/dateUtils"); // Using your project's moment/timezone utils

// --- CREATE TIME LOG ---
exports.createTimeLog = catchAsync(async (req, res) => {
  const { job, date, description, hours } = req.body;
  const employee = req.user.id;

  // FIX: Force incoming date string into EST Midnight to prevent day-shifting
  const estDate = moment.tz(date, TIMEZONE).startOf('day').toDate();

  const attachments = req.files?.map(file => ({
    blobName: file.blobName,
    url: file.url || file.path,
    originalname: file.originalname,
    format: file.mimetype,
    size: file.size
  })) || [];

  const timeLog = new TimeLog({
    employee,
    job,
    date: estDate, 
    description,
    hours,
    attachments
  });

  const savedTimeLog = await timeLog.save();
  res.status(201).json(savedTimeLog);
});

// --- GET EMPLOYEE TIME LOGS ---
exports.getEmployeeTimeLogs = catchAsync(async (req, res) => {
  const employee = req.user.id;
  const { date } = req.query; // Raw YYYY-MM-DD string from frontend

  const query = { employee };
  if (date) {
    // FIX: Define a strict 24-hour window in EST for the search
    const startDate = moment.tz(date, TIMEZONE).startOf('day').toDate();
    const endDate = moment.tz(date, TIMEZONE).endOf('day').toDate();

    query.date = {
      $gte: startDate,
      $lte: endDate
    };
  }

  const timeLogs = await TimeLog.find(query).sort({ date: 1 });
  res.status(200).json(timeLogs);
});

// --- UPDATE TIME LOG ---
exports.updateTimeLog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { job, date, description, hours } = req.body;

  const timeLog = await TimeLog.findById(id);
  if (!timeLog) throw new NotFoundError("TimeLog");

  if (timeLog.isAddedToTimesheet) {
    throw new BadRequestError("Cannot update time log already added to a timesheet");
  }

  if (req.files && req.files.length > 0) {
    timeLog.attachments = req.files.map(file => ({
      blobName: file.blobName,
      url: file.url || file.path,
      originalname: file.originalname,
      format: file.mimetype,
      size: file.size
    }));
  }

  timeLog.job = job;
  // FIX: Align updated date back to EST
  timeLog.date = moment.tz(date, TIMEZONE).startOf('day').toDate();
  timeLog.description = description;
  timeLog.hours = hours;

  const updatedTimeLog = await timeLog.save();
  res.status(200).json(updatedTimeLog);
});

// --- DELETE TIME LOG ---
exports.deleteTimeLog = catchAsync(async (req, res) => {
  const { id } = req.params;
  const timeLog = await TimeLog.findById(id);
  if (!timeLog) throw new NotFoundError("TimeLog");
  if (timeLog.isAddedToTimesheet) throw new BadRequestError("Cannot delete log already in timesheet");
  await timeLog.deleteOne();
  res.status(200).json({ message: "Time log deleted successfully" });
});

// --- DOWNLOAD ATTACHMENT ---
exports.downloadTimeLogAttachment = catchAsync(async (req, res) => {
  const { id, attachmentId } = req.params;
  const timeLog = await TimeLog.findById(id);
  if (!timeLog) throw new NotFoundError("TimeLog");
  const attachment = timeLog.attachments.id(attachmentId);
  if (!attachment) throw new NotFoundError("Attachment");

  try {
    if (attachment.blobName) {
      const blockBlobClient = require("../config/azureConfig").containerClient.getBlockBlobClient(attachment.blobName);
      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: "r",
        expiresOn: new Date(new Date().valueOf() + 300 * 1000),
        contentDisposition: `attachment; filename="${attachment.originalname}"`
      });
      return res.redirect(sasUrl);
    } else if (attachment.url) {
      return res.redirect(attachment.url);
    } else {
      throw new BadRequestError("No valid attachment URL found");
    }
  } catch (error) {
    console.error("Download error:", error);
    throw new BadRequestError("Failed to generate download link");
  }
});
