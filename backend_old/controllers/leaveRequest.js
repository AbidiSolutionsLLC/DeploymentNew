const LeaveRequest = require("../models/leaveRequestSchema");
const User = require("../models/userSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const catchAsync = require("../utils/catchAsync");
const { getStartOfESTDay, moment, TIMEZONE } = require("../utils/dateUtils");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");

// Create Leave Request
exports.createLeaveRequest = catchAsync(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!leaveType || !startDate || !endDate) {
    throw new BadRequestError("Missing required fields");
  }

  // Calculate days difference using moment to handle DST and Timezones strictly
  const start = moment(startDate).tz(TIMEZONE).startOf('day');
  const end = moment(endDate).tz(TIMEZONE).startOf('day');
  const daysDiff = end.diff(start, 'days') + 1;

  // Check if user has enough leaves for the specific type
  const userLeaveBalance = user.leaves[leaveType.toLowerCase()] || 0;
  if (userLeaveBalance < daysDiff) {
    throw new BadRequestError(`Not enough ${leaveType} leaves available`);
  }

  // Check for overlapping leave requests (Pending or Approved only)
  const existingLeaves = await LeaveRequest.find({
    employee: user._id,
    status: { $in: ["Pending", "Approved"] }
  });

  // Check for date overlaps
  const overlappingLeaves = existingLeaves.filter(leave => {
    const existingStart = new Date(leave.startDate);
    const existingEnd = new Date(leave.endDate);
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    // Two date ranges overlap if: start1 <= end2 AND start2 <= end1
    return (existingStart <= newEnd && newStart <= existingEnd);
  });

  if (overlappingLeaves.length > 0) {
    const overlappingLeave = overlappingLeaves[0];
    const overlapStart = new Date(overlappingLeave.startDate).toLocaleDateString();
    const overlapEnd = new Date(overlappingLeave.endDate).toLocaleDateString();
    throw new BadRequestError(
      `You already have a ${overlappingLeave.status.toLowerCase()} leave request from ${overlapStart} to ${overlapEnd}. Please select different dates.`
    );
  }

  const leaveRequest = new LeaveRequest({
    employee: user._id,
    employeeName: user.name,
    email: user.email,
    leaveType,
    startDate,
    endDate,
    reason,
  });

  const savedLeaveRequest = await leaveRequest.save();

  // Update user's leave data
  const updateObj = {
    $push: {
      leaveHistory: {
        leaveId: savedLeaveRequest._id,
        leaveType,
        startDate: start,
        endDate: end,
        status: 'Pending',
        daysTaken: daysDiff,
        reason: reason
      }
    }
  };

  // Deduct leaves and update booked/available leaves
  updateObj.$inc = {};
  updateObj.$inc[`leaves.${leaveType.toLowerCase()}`] = -daysDiff;
  updateObj.$inc.bookedLeaves = daysDiff; // Increment booked leaves
  updateObj.$inc.avalaibleLeaves = -daysDiff; // Decrement available leaves

  await User.findByIdAndUpdate(user._id, updateObj);

  // Create TimeTracker entries for each day in the leave range
  const timeTrackerEntries = [];
  const curr = start.clone(); // Use moment object for iteration

  while (curr.isSameOrBefore(end)) {
    const dateStart = curr.toDate(); // Get JS Date aligned to EST start of day

    // Check if TimeTracker entry already exists for this date
    const existingEntry = await TimeTracker.findOne({
      user: user._id,
      date: dateStart
    });

    if (existingEntry) {
      // Update existing entry to Leave status
      existingEntry.status = 'Leave';
      await existingEntry.save();
    } else {
      // Create new TimeTracker entry
      timeTrackerEntries.push({
        user: user._id,
        date: dateStart,
        status: 'Leave',
        notes: `Leave: ${leaveType} - ${reason || 'No reason provided'}`
      });
    }

    // Move to next day
    curr.add(1, 'days');
  }

  // Bulk insert TimeTracker entries if any
  if (timeTrackerEntries.length > 0) {
    await TimeTracker.insertMany(timeTrackerEntries);
  }

  res.status(201).json({ success: true, data: savedLeaveRequest });
});

// Get all Leave Requests (filtered by logged-in user, unless admin)
exports.getLeaveRequests = catchAsync(async (req, res) => {
  const query = {};

  // If user is not admin, only show their own leaves
  if (req.user.role !== "Admin") {
    query.employee = req.user.id;
  }

  // Additional query filters
  if (req.query.employeeName) query.employeeName = req.query.employeeName;
  if (req.query.leaveType) query.leaveType = req.query.leaveType;
  if (req.query.status) query.status = req.query.status;

  const leaveRequests = await LeaveRequest.find(query).sort({ appliedAt: -1 });
  res.json({ success: true, data: leaveRequests });
});

// Get Leave Request by ID
exports.getLeaveRequestById = catchAsync(async (req, res) => {
  const leaveRequest = await LeaveRequest.findById(req.params.id);
  if (!leaveRequest) {
    throw new NotFoundError("Leave request");
  }
  res.json({ success: true, data: leaveRequest });
});

// Update Leave Request
exports.updateLeaveRequest = catchAsync(async (req, res) => {
  const { employeeName, leaveType, startDate, endDate, reason, status } = req.body;

  const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(
    req.params.id,
    { employeeName, leaveType, startDate, endDate, reason, status },
    { new: true }
  );

  if (!updatedLeaveRequest) {
    throw new NotFoundError("Leave request");
  }

  res.json({ success: true, data: updatedLeaveRequest });
});

// Delete Leave Request
exports.deleteLeaveRequest = catchAsync(async (req, res) => {
  const leaveRequest = await LeaveRequest.findByIdAndDelete(req.params.id);
  if (!leaveRequest) {
    throw new NotFoundError("Leave request");
  }
  res.json({ success: true, message: "Leave request deleted" });
});


// Update Leave Status
exports.updateLeaveStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const validStatuses = ["Pending", "Approved", "Rejected"];
  if (!status || !validStatuses.includes(status)) {
    throw new BadRequestError("Invalid or missing status");
  }

  const leaveRequest = await LeaveRequest.findById(id);
  if (!leaveRequest) {
    throw new NotFoundError("Leave request not found");
  }

  // Calculate days difference
  const start = moment(leaveRequest.startDate).tz(TIMEZONE).startOf('day');
  const end = moment(leaveRequest.endDate).tz(TIMEZONE).startOf('day');
  const daysDiff = end.diff(start, 'days') + 1;

  const updateObj = {
    $set: {
      "leaveHistory.$[elem].status": status
    }
  };

  // Handle status changes and update booked/available leaves accordingly
  const oldStatus = leaveRequest.status;

  if (oldStatus === "Pending" && status === "Rejected") {
    // Reverse the booking: return leaves and decrement booked, increment available
    updateObj.$inc = {};
    updateObj.$inc[`leaves.${leaveRequest.leaveType.toLowerCase()}`] = daysDiff;
    updateObj.$inc.bookedLeaves = -daysDiff;
    updateObj.$inc.avalaibleLeaves = daysDiff;
  } else if (oldStatus === "Approved" && status === "Rejected") {
    // Return leaves and decrement booked, increment available
    updateObj.$inc = {};
    updateObj.$inc[`leaves.${leaveRequest.leaveType.toLowerCase()}`] = daysDiff;
    updateObj.$inc.bookedLeaves = -daysDiff;
    updateObj.$inc.avalaibleLeaves = daysDiff;
  } else if (oldStatus === "Rejected" && status === "Approved") {
    // Re-apply the booking: deduct leaves and increment booked, decrement available
    updateObj.$inc = {};
    updateObj.$inc[`leaves.${leaveRequest.leaveType.toLowerCase()}`] = -daysDiff;
    updateObj.$inc.bookedLeaves = daysDiff;
    updateObj.$inc.avalaibleLeaves = -daysDiff;
  } else if (oldStatus === "Pending" && status === "Approved") {
    // Status changes from Pending to Approved - no change needed (already counted in bookedLeaves)
    // But we should ensure leaves are still deducted (they should be from creation)
  }

  await User.findByIdAndUpdate(leaveRequest.employee, updateObj, {
    arrayFilters: [{ "elem.leaveId": leaveRequest._id }]
  });

  // Update TimeTracker entries based on status change
  const curr = start.clone();

  while (curr.isSameOrBefore(end)) {
    const dateStart = curr.toDate();

    const timeTrackerEntry = await TimeTracker.findOne({
      user: leaveRequest.employee,
      date: dateStart
    });

    if (timeTrackerEntry) {
      if (status === "Rejected") {
        // If rejected, check if this TimeTracker entry was created only for the leave
        // (i.e., no check-in/check-out times, meaning user didn't actually work that day)
        const wasCreatedForLeave = !timeTrackerEntry.checkInTime && !timeTrackerEntry.checkOutTime &&
          timeTrackerEntry.status === 'Leave';

        if (wasCreatedForLeave) {
          // Check if this date is a holiday before deleting
          const Holiday = require("../models/holidaySchema");
          const holiday = await Holiday.findOne({ date: dateStart });

          if (holiday) {
            // If it's a holiday, update to Holiday status instead of deleting
            timeTrackerEntry.status = 'Holiday';
            timeTrackerEntry.notes = `Holiday: ${holiday.holidayName}`;
            await timeTrackerEntry.save();
          } else {
            // Delete the entry since it was only created for the rejected leave
            await TimeTracker.findByIdAndDelete(timeTrackerEntry._id);
          }
        } else {
          // Entry has check-in/check-out data, meaning user worked that day
          // Just remove leave status and set to Present (unless it's a holiday)
          const Holiday = require("../models/holidaySchema");
          const holiday = await Holiday.findOne({ date: dateStart });

          if (holiday) {
            timeTrackerEntry.status = 'Holiday';
            timeTrackerEntry.notes = timeTrackerEntry.notes?.replace(/Leave:.*/, '').trim() || `Holiday: ${holiday.holidayName}`;
          } else {
            timeTrackerEntry.status = 'Present';
            timeTrackerEntry.notes = timeTrackerEntry.notes?.replace(/Leave:.*/, '').trim() || '';
          }
          await timeTrackerEntry.save();
        }
      } else if (status === "Approved") {
        // Ensure status is Leave for approved leaves
        timeTrackerEntry.status = 'Leave';
        await timeTrackerEntry.save();
      }
    } else if (status === "Approved") {
      // Create TimeTracker entry if it doesn't exist and status is Approved
      await TimeTracker.create({
        user: leaveRequest.employee,
        date: dateStart,
        status: 'Leave',
        notes: `Leave: ${leaveRequest.leaveType} - ${leaveRequest.reason || 'No reason provided'}`
      });
    }

    // Move to next day
    curr.add(1, 'days');
  }

  leaveRequest.status = status;
  await leaveRequest.save();

  res.status(200).json({
    success: true,
    message: `Leave status updated to ${status}`,
    data: leaveRequest,
  });
});