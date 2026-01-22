const TimeLog = require("../models/timeLogsSchema");
const Timesheet = require("../models/timesheetSchema");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");
const { cloudinary } = require("../storageConfig");
const { containerClient } = require("../config/azureConfig");


// Create Time Log
exports.createTimeLog = catchAsync(async (req, res) => {
  const { job, date, description, hours } = req.body;
  const employee = req.user.id;
  
const attachments = req.files?.map(file => ({
    blobName: file.blobName, // Store blobName instead of public_id
    url: file.url || file.path,
    originalname: file.originalname,
    format: file.mimetype,
    size: file.size
  })) || [];

  console.log("Attachments:", attachments);

  const timeLog = new TimeLog({
    employee,
    job,
    date,
    description,
    hours,
    attachments // This matches your schema
  });

  const savedTimeLog = await timeLog.save();
  res.status(201).json(savedTimeLog);
});

// Get Time Logs for Employee
exports.getEmployeeTimeLogs = catchAsync(async (req, res) => {
  const employee = req.user.id;
  const { date } = req.query;

  const query = { employee };
  if (date) {
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    query.date = {
      $gte: startDate,
      $lte: endDate
    };
  }

  const timeLogs = await TimeLog.find(query);
  res.status(200).json(timeLogs);
});

// Update Time Log
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

  // Update other fields
  timeLog.job = job;
  timeLog.date = date;
  timeLog.description = description;
  timeLog.hours = hours;

  const updatedTimeLog = await timeLog.save();
  res.status(200).json(updatedTimeLog);
});

// Delete Time Log
exports.deleteTimeLog = catchAsync(async (req, res) => {
  const { id } = req.params;

  const timeLog = await TimeLog.findById(id);
  if (!timeLog) throw new NotFoundError("TimeLog");

  if (timeLog.isAddedToTimesheet) {
    throw new BadRequestError("Cannot delete time log already added to a timesheet");
  }

  await timeLog.deleteOne();
  res.status(200).json({ message: "Time log deleted successfully" });
});


exports.downloadTimeLogAttachment = catchAsync(async (req, res) => {
  const { id, attachmentId } = req.params;
  
  const timeLog = await TimeLog.findById(id);
  if (!timeLog) throw new NotFoundError("TimeLog");
  
  const attachment = timeLog.attachments.id(attachmentId);
  if (!attachment) throw new NotFoundError("Attachment");
  
  try {
    if (attachment.blobName) {
      const blockBlobClient = containerClient.getBlockBlobClient(attachment.blobName);
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