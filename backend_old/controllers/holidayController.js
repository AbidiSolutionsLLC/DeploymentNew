const Holiday = require("../models/holidaySchema");
const User = require("../models/userSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");

// Create Holiday
exports.createHoliday = catchAsync(async (req, res) => {
  const { date, day, holidayName, holidayType, description, isRecurring } = req.body;

  const existingHoliday = await Holiday.findOne({ date });
  if (existingHoliday) {
    throw new BadRequestError("Holiday for this date already exists");
  }

  const newHoliday = new Holiday({
    date,
    day,
    holidayName,
    holidayType,
    description,
    isRecurring: isRecurring || false,
  });

  const savedHoliday = await newHoliday.save();

  // Create TimeTracker entries for all users for this holiday date
  const holidayDate = new Date(date);
  holidayDate.setHours(0, 0, 0, 0);

  // Get all active users
  const allUsers = await User.find({ empStatus: "Active" }).select("_id");
  const userIds = allUsers.map(user => user._id);

  // Get existing TimeTracker entries for this date
  const existingEntries = await TimeTracker.find({
    date: holidayDate,
    user: { $in: userIds }
  });

  const existingUserIds = new Set(existingEntries.map(entry => entry.user.toString()));
  const entriesToUpdate = [];
  const entriesToCreate = [];

  // Separate entries that need updating vs creating
  for (const entry of existingEntries) {
    // Only update if status is not 'Leave' (leave takes precedence)
    if (entry.status !== 'Leave') {
      entriesToUpdate.push(entry._id);
    }
  }

  // Prepare new entries for users who don't have a TimeTracker entry for this date
  for (const user of allUsers) {
    if (!existingUserIds.has(user._id.toString())) {
      entriesToCreate.push({
        user: user._id,
        date: holidayDate,
        status: 'Holiday',
        notes: `Holiday: ${holidayName}`
      });
    }
  }

  // Bulk update existing entries
  if (entriesToUpdate.length > 0) {
    await TimeTracker.updateMany(
      { _id: { $in: entriesToUpdate } },
      {
        $set: {
          status: 'Holiday',
          notes: `Holiday: ${holidayName}`
        }
      }
    );
  }

  // Bulk insert new TimeTracker entries
  if (entriesToCreate.length > 0) {
    await TimeTracker.insertMany(entriesToCreate);
  }

  res.status(201).json(savedHoliday);
});

// Get All Holidays
exports.getAllHolidays = catchAsync(async (req, res) => {
  const holidays = await Holiday.find().sort({ date: 1 });
  res.status(200).json(holidays);
});

// Get Holiday by ID
exports.getHolidayById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const holiday = await Holiday.findById(id);

  if (!holiday) throw new NotFoundError("Holiday");

  res.status(200).json(holiday);
});

// Update Holiday
exports.updateHoliday = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  const holiday = await Holiday.findById(id);
  if (!holiday) throw new NotFoundError("Holiday");

  const oldDate = new Date(holiday.date);
  oldDate.setHours(0, 0, 0, 0);

  // Only update allowed fields
  const allowedFields = ["date", "day", "holidayName", "holidayType", "description", "isRecurring"];
  
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      holiday[field] = updates[field];
    }
  });

  const updatedHoliday = await holiday.save();

  // If date changed, update TimeTracker entries
  if (updates.date) {
    const newDate = new Date(updates.date);
    newDate.setHours(0, 0, 0, 0);

    // Remove Holiday status from old date (unless it's a Leave)
    await TimeTracker.updateMany(
      {
        date: oldDate,
        status: { $ne: 'Leave' }
      },
      {
        $set: {
          status: 'Present',
          notes: ''
        }
      }
    );

    // Add Holiday status to new date for all active users
    const allUsers = await User.find({ empStatus: "Active" }).select("_id");
    const timeTrackerEntries = [];

    for (const user of allUsers) {
      const existingEntry = await TimeTracker.findOne({
        user: user._id,
        date: newDate
      });

      if (existingEntry) {
        // Update existing entry to Holiday status (unless it's a Leave)
        if (existingEntry.status !== 'Leave') {
          existingEntry.status = 'Holiday';
          existingEntry.notes = `Holiday: ${holiday.holidayName}`;
          await existingEntry.save();
        }
      } else {
        // Create new entry
        timeTrackerEntries.push({
          user: user._id,
          date: newDate,
          status: 'Holiday',
          notes: `Holiday: ${holiday.holidayName}`
        });
      }
    }

    if (timeTrackerEntries.length > 0) {
      await TimeTracker.insertMany(timeTrackerEntries);
    }
  } else if (updates.holidayName) {
    // If only holiday name changed, update notes in TimeTracker
    await TimeTracker.updateMany(
      {
        date: oldDate,
        status: 'Holiday'
      },
      {
        $set: {
          notes: `Holiday: ${holiday.holidayName}`
        }
      }
    );
  }

  res.status(200).json(updatedHoliday);
});

// Delete Holiday
exports.deleteHoliday = catchAsync(async (req, res) => {
  const { id } = req.params;
  const holiday = await Holiday.findByIdAndDelete(id);

  if (!holiday) throw new NotFoundError("Holiday");

  // Remove Holiday status from TimeTracker entries (unless it's a Leave)
  const holidayDate = new Date(holiday.date);
  holidayDate.setHours(0, 0, 0, 0);

  await TimeTracker.updateMany(
    {
      date: holidayDate,
      status: 'Holiday'
    },
    {
      $set: {
        status: 'Present',
        notes: ''
      }
    }
  );

  res.status(200).json({ message: "Holiday deleted successfully" });
});

// Get Holidays by Year
exports.getHolidaysByYear = catchAsync(async (req, res) => {
  const { year } = req.params;
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  const holidays = await Holiday.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });

  res.status(200).json(holidays);
});