const LeaveRequest = require("../models/leaveRequestSchema");
const User = require("../models/userSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const catchAsync = require("../utils/catchAsync");
const { moment, TIMEZONE } = require("../utils/dateUtils");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const sendEmail = require('../utils/emailService');
const mongoose = require("mongoose");
 
// --- HELPER: GET FULL TEAM IDS (RECURSIVE) ---
const getTeamIds = async (managerId) => {
  let teamIds = [managerId.toString()];
  const directReports = await User.find({ reportsTo: managerId }).distinct('_id');
  if (directReports.length > 0) {
    for (const reportId of directReports) {
      const subTeam = await getTeamIds(reportId);
      teamIds = [...new Set([...teamIds, ...subTeam])];
    }
  }
  return teamIds;
};
 
// --- CREATE LEAVE REQUEST ---
exports.createLeaveRequest = catchAsync(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new NotFoundError("User not found");
 
  if (!leaveType || !startDate || !endDate) throw new BadRequestError("Missing required fields");
 
  const start = moment(startDate).tz(TIMEZONE).startOf('day');
  const end = moment(endDate).tz(TIMEZONE).startOf('day');
  const daysDiff = end.diff(start, 'days') + 1;
 
  const userLeaveBalance = user.leaves[leaveType.toLowerCase()] || 0;
  if (userLeaveBalance < daysDiff) throw new BadRequestError(`Not enough ${leaveType} leaves available`);
 
  const existingLeaves = await LeaveRequest.find({
    employee: user._id,
    status: { $in: ["Pending", "Approved"] }
  });
 
  const overlappingLeaves = existingLeaves.filter(leave => {
    const existingStart = new Date(leave.startDate);
    const existingEnd = new Date(leave.endDate);
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    return (existingStart <= newEnd && newStart <= existingEnd);
  });
 
  if (overlappingLeaves.length > 0) throw new BadRequestError(`Overlap detected with existing leave.`);
 
  const leaveRequest = new LeaveRequest({
    employee: user._id,
    employeeName: user.name,
    email: user.email,
    leaveType,
    startDate,
    endDate,
    reason,
    // Initialize empty responses array
    responses: []
  });
 
  const savedLeaveRequest = await leaveRequest.save();
 
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
    },
    $inc: {
      [`leaves.${leaveType.toLowerCase()}`]: -daysDiff,
      bookedLeaves: daysDiff,
      avalaibleLeaves: -daysDiff
    }
  };
 
  await User.findByIdAndUpdate(user._id, updateObj);
 
  const timeTrackerEntries = [];
  const curr = start.clone();
  while (curr.isSameOrBefore(end)) {
    const dateStart = curr.toDate();
    const existingEntry = await TimeTracker.findOne({ user: user._id, date: dateStart });
    if (existingEntry) {
      existingEntry.status = 'Leave';
      await existingEntry.save();
    } else {
      timeTrackerEntries.push({
        user: user._id,
        date: dateStart,
        status: 'Leave',
        notes: `Leave: ${leaveType} - ${reason || 'No reason provided'}`
      });
    }
    curr.add(1, 'days');
  }
  if (timeTrackerEntries.length > 0) await TimeTracker.insertMany(timeTrackerEntries);
 
  // Send notification to HR/Managers about new leave request
  sendLeaveCreationNotification(savedLeaveRequest).catch(console.error);
 
  res.status(201).json({ success: true, data: savedLeaveRequest });
});
// Controller to get all responses for a leave request////////////////////////////////////////
exports.getLeaveRequestResponses = catchAsync(async (req, res) => {
  const { id } = req.params;
 
  // Find leave request with populated responses
  const leaveRequest = await LeaveRequest.findById(id)
    .populate('responses.author', 'name email avatar role')
    .select('responses employee status');
 
  if (!leaveRequest) throw new NotFoundError("Leave request");
 
  // Check permissions
  const currentUserId = req.user.id;
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
 
  const isOwner = leaveRequest.employee.toString() === currentUserId;
  const isSuperAdminOrHR = ['superadmin', 'hr'].includes(roleKey);
 
  if (!isOwner && !isSuperAdminOrHR) {
    if (roleKey === 'admin' || roleKey === 'manager') {
      const teamIds = await getTeamIds(currentUserId);
      const isInTeam = teamIds.includes(leaveRequest.employee.toString());
      if (!isInTeam) {
        throw new ForbiddenError("You don't have permission to view responses for this leave request");
      }
    } else {
      throw new ForbiddenError("You don't have permission to view these responses");
    }
  }
 
  res.status(200).json({
    success: true,
    data: leaveRequest.responses
  });
});
// Controller to update a response//////////////////////////////////////////////
exports.updateLeaveResponse = catchAsync(async (req, res) => {
  const { id, responseId } = req.params;
  const { content } = req.body;
 
  if (!content || content.trim() === '') {
    throw new BadRequestError("Response content is required");
  }
 
  // Find the leave request
  const leaveRequest = await LeaveRequest.findById(id);
  if (!leaveRequest) throw new NotFoundError("Leave request");
 
  // Find the specific response
  const response = leaveRequest.responses.id(responseId);
  if (!response) throw new NotFoundError("Response");
 
  // Check permissions - only author can update
  const currentUserId = req.user.id;
  const isAuthor = response.author.toString() === currentUserId;
 
  if (!isAuthor) {
    throw new ForbiddenError("You can only edit your own responses");
  }
 
  // Update the response
  response.content = content.trim();
  response.editedAt = new Date();
  response.isEdited = true;
 
  await leaveRequest.save();
 
  // Populate for response
  const populatedLeaveRequest = await LeaveRequest.findById(id)
    .populate('responses.author', 'name email avatar role');
 
  res.status(200).json({
    success: true,
    message: "Response updated successfully",
    data: populatedLeaveRequest.responses.id(responseId)
  });
});
// --- GET LEAVE REQUESTS (RECURSIVE TEAM VIEW) ---
exports.getLeaveRequests = catchAsync(async (req, res) => {
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  let query = {};
  const currentUserId = req.user.id || req.user._id;
 
  if (roleKey === 'superadmin' || roleKey === 'hr') {
      query = {};
  }
  else if (roleKey === 'manager' || roleKey === 'admin') {
      const fullTeamIds = await getTeamIds(currentUserId);
      query.employee = { $in: fullTeamIds };
  }
  else {
      query.employee = currentUserId;
  }
 
  if (req.query.employeeName) query.employeeName = { $regex: req.query.employeeName, $options: 'i' };
  if (req.query.leaveType) query.leaveType = req.query.leaveType;
  if (req.query.status) query.status = req.query.status;
 
  const leaveRequests = await LeaveRequest.find(query)
    .populate('employee', 'name email avatar department')
    .populate('responses.author', 'name email avatar role')
    .sort({ appliedAt: -1 });
   
  res.json({ success: true, data: leaveRequests });
});
 
// --- GET SINGLE LEAVE REQUEST WITH RESPONSES ---
exports.getLeaveRequestById = catchAsync(async (req, res) => {
  const leaveRequest = await LeaveRequest.findById(req.params.id)
    .populate('employee', 'name email avatar department position')
    .populate('responses.author', 'name email avatar role');
   
  if (!leaveRequest) throw new NotFoundError("Leave request");
 
  // Check if user has permission to view this leave request
  const currentUserId = req.user.id || req.user._id;
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
 
  const isOwner = leaveRequest.employee._id.toString() === currentUserId.toString();
  const isSuperAdminOrHR = ['superadmin', 'hr'].includes(roleKey);
 
  if (!isOwner && !isSuperAdminOrHR) {
    if (roleKey === 'admin' || roleKey === 'manager') {
      const teamIds = await getTeamIds(currentUserId);
      const isInTeam = teamIds.includes(leaveRequest.employee._id.toString());
      if (!isInTeam) {
        throw new ForbiddenError("You don't have permission to view this leave request");
      }
    } else {
      throw new ForbiddenError("You don't have permission to view this leave request");
    }
  }
 
  res.json({ success: true, data: leaveRequest });
});
 
// --- UPDATE LEAVE REQUEST ---
exports.updateLeaveRequest = catchAsync(async (req, res) => {
  const leaveRequest = await LeaveRequest.findById(req.params.id);
  if (!leaveRequest) throw new NotFoundError("Leave request");
 
  // Check if user has permission to update
  const currentUserId = req.user.id || req.user._id;
  const isOwner = leaveRequest.employee.toString() === currentUserId.toString();
 
  // Only the employee who created the leave request can update it (when pending)
  if (!isOwner && leaveRequest.status === 'Pending') {
    throw new ForbiddenError("Only the requester can update a pending leave request");
  }
 
  // If leave is already approved/rejected, no updates allowed
  if (leaveRequest.status !== 'Pending') {
    throw new BadRequestError("Cannot update leave request after it has been processed");
  }
 
  const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  ).populate('employee', 'name email avatar');
 
  res.json({ success: true, data: updatedLeaveRequest });
});
 
// --- ADD RESPONSE TO LEAVE REQUEST ---///////////////////////////////////////////
exports.addLeaveResponse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
 
  if (!content || content.trim() === '') {
    throw new BadRequestError("Response content is required");
  }
 
  const leaveRequest = await LeaveRequest.findById(id);
  if (!leaveRequest) throw new NotFoundError("Leave request");
 
  const currentUser = await User.findById(req.user.id);
  if (!currentUser) throw new NotFoundError("User not found");
 
  // Check if user has permission to respond
  const currentUserId = req.user.id || req.user._id;
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  console.log(req.user)
 
  const isOwner = leaveRequest.employee.toString() === currentUserId.toString();
  const isSuperAdminOrHR = ['superadmin', 'hr'].includes(roleKey);
  let isAuthorized = false;
 
  if (isOwner) {
    isAuthorized = true;
  } else if (isSuperAdminOrHR) {
    isAuthorized = true;
  } else if (roleKey === 'admin' || roleKey === 'manager') {
    const teamIds = await getTeamIds(currentUserId);
    const isInTeam = teamIds.includes(leaveRequest.employee.toString());
    if (isInTeam) {
      isAuthorized = true;
    }
  }
 
  if (!isAuthorized) {
    throw new ForbiddenError("You don't have permission to respond to this leave request");
  }
 
  // Create new response object
  const newResponse = {
    author: currentUser._id,
    content: content.trim(),
    time: new Date(),
    role: currentUser.role,
    isSystemNote: false,
    isEdited: false,
    attachments: []
  };
 
  // Add to leave request
  leaveRequest.responses.push(newResponse);
  await leaveRequest.save();
 
  // Get the newly added response (last one in array)
  const savedResponse = leaveRequest.responses[leaveRequest.responses.length - 1];
 
  // Populate author info for just this response
  const populatedResponse = await LeaveRequest.findOne(
    {
      _id: id,
      'responses._id': savedResponse._id
    },
    {
      'responses.$': 1
    }
  )
  .populate('responses.author', 'name email avatar role');
 
  // Extract just the response from the result
  const responseData = populatedResponse.responses[0];
 
  // Format the response to match your frontend structure
  const formattedResponse = {
    _id: responseData._id,
    content: responseData.content,
    time: responseData.time,
    role: responseData.role,
    attachments: responseData.attachments || [],
    isEdited: responseData.isEdited || false,
    isSystemNote: responseData.isSystemNote || false,
    author: {
      _id: responseData.author._id,
      email: responseData.author.email,
      name: responseData.author.name,
      avatar: responseData.author.avatar,
      role: responseData.author.role
    }
  };
 
  console.log("New response created:", formattedResponse);
 
  // Send email notification
  sendLeaveResponseNotification(leaveRequest, currentUser, content).catch(console.error);
 
  res.status(200).json({
    success: true,
    message: "Response added successfully",
    data: formattedResponse  // Return only the new response, not entire leave request
  });
});
 
// --- DELETE RESPONSE FROM LEAVE REQUEST ---
exports.deleteLeaveResponse = catchAsync(async (req, res) => {
  const { id, responseId } = req.params;
 
  const leaveRequest = await LeaveRequest.findById(id);
  if (!leaveRequest) throw new NotFoundError("Leave request");
 
  const response = leaveRequest.responses.id(responseId);
  if (!response) throw new NotFoundError("Response");
 
  // Check if user is the author of the response or has admin privileges
  const currentUserId = req.user.id || req.user._id;
  const isAuthor = response.author.toString() === currentUserId.toString();
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  const isSuperAdminOrHR = ['superadmin', 'hr'].includes(roleKey);
 
  if (!isAuthor && !isSuperAdminOrHR) {
    throw new ForbiddenError("You can only delete your own responses");
  }
 
  response.deleteOne();
  await leaveRequest.save();
 
  res.status(200).json({
    success: true,
    message: "Response deleted successfully",
    data: leaveRequest
  });
});
 
// --- APPROVE / REJECT LEAVE (RESTRICTED TO HR/ADMIN) ---
exports.updateLeaveStatus = catchAsync(async (req, res) => {
  const { status, responseNote } = req.body;
  const { id } = req.params;
 
  if (!["Pending", "Approved", "Rejected"].includes(status)) throw new BadRequestError("Invalid status");
 
  const leaveRequest = await LeaveRequest.findById(id);
  if (!leaveRequest) throw new NotFoundError("Leave request not found");
 
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  const currentUserId = req.user.id || req.user._id;
 
  // --- REQUIREMENT: Managers are READ ONLY ---
  if (!['superadmin', 'admin', 'hr'].includes(roleKey)) {
     throw new ForbiddenError("Managers have read-only access to leaves. Contact HR for approvals.");
  }
 
  // --- SECURITY: Hierarchy & Self-Approval Block ---
  if (roleKey === 'admin') {
     if (leaveRequest.employee.toString() === currentUserId.toString()) {
        throw new ForbiddenError("You cannot update the status of your own leave request.");
     }
     const adminTeam = await getTeamIds(currentUserId);
     if (!adminTeam.includes(leaveRequest.employee.toString())) {
        throw new ForbiddenError("Admins can only manage leaves for their own team hierarchy.");
     }
  }
 
  const start = moment(leaveRequest.startDate).tz(TIMEZONE).startOf('day');
  const end = moment(leaveRequest.endDate).tz(TIMEZONE).startOf('day');
  const daysDiff = end.diff(start, 'days') + 1;
 
  const updateObj = { $set: { "leaveHistory.$[elem].status": status } };
  const oldStatus = leaveRequest.status;
 
  if (status === "Rejected" && oldStatus !== "Rejected") {
    updateObj.$inc = {
      [`leaves.${leaveRequest.leaveType.toLowerCase()}`]: daysDiff,
      bookedLeaves: -daysDiff,
      avalaibleLeaves: daysDiff
    };
  } else if (status === "Approved" && oldStatus === "Rejected") {
    updateObj.$inc = {
      [`leaves.${leaveRequest.leaveType.toLowerCase()}`]: -daysDiff,
      bookedLeaves: daysDiff,
      avalaibleLeaves: -daysDiff
    };
  }
 
  await User.findByIdAndUpdate(leaveRequest.employee, updateObj, {
    arrayFilters: [{ "elem.leaveId": leaveRequest._id }]
  });
 
  // Add automatic response when status changes
  const currentUser = await User.findById(currentUserId);
  if (currentUser && (oldStatus !== status || responseNote)) {
    const responseContent = responseNote ||
      `Leave request status changed from "${oldStatus}" to "${status}" by ${currentUser.name} (${currentUser.role}).`;
   
    leaveRequest.responses.push({
      author: currentUser._id,
      content: responseContent,
      time: new Date(),
      role: currentUser.role,
      isSystemNote: !responseNote
    });
  }
 
  leaveRequest.status = status;
  await leaveRequest.save();
 
  // Send status update email
  if (leaveRequest.email) {
    const emailSubject = `Leave Request ${status}`;
    const emailBody = generateLeaveStatusEmailTemplate(leaveRequest, status, responseNote);
    sendEmail(leaveRequest.email, emailSubject, emailBody).catch(console.error);
  }
 
  res.status(200).json({
    success: true,
    message: `Leave status updated to ${status}`,
    data: leaveRequest
  });
});
 
// --- DELETE LEAVE REQUEST ---
exports.deleteLeaveRequest = catchAsync(async (req, res) => {
  const leaveRequest = await LeaveRequest.findById(req.params.id);
  if (!leaveRequest) throw new NotFoundError("Leave request");
 
  // Check if user has permission to delete
  const currentUserId = req.user.id || req.user._id;
  const isOwner = leaveRequest.employee.toString() === currentUserId.toString();
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
  const isSuperAdminOrHR = ['superadmin', 'hr'].includes(roleKey);
 
  // Only allow deletion if pending and user is owner or has admin privileges
  if (leaveRequest.status !== 'Pending') {
    throw new BadRequestError("Cannot delete leave request after it has been processed");
  }
 
  if (!isOwner && !isSuperAdminOrHR) {
    throw new ForbiddenError("You don't have permission to delete this leave request");
  }
 
  // Restore leave balance if request is deleted
  if (isSuperAdminOrHR || isOwner) {
    const start = moment(leaveRequest.startDate).tz(TIMEZONE).startOf('day');
    const end = moment(leaveRequest.endDate).tz(TIMEZONE).startOf('day');
    const daysDiff = end.diff(start, 'days') + 1;
   
    await User.findByIdAndUpdate(leaveRequest.employee, {
      $inc: {
        [`leaves.${leaveRequest.leaveType.toLowerCase()}`]: daysDiff,
        bookedLeaves: -daysDiff,
        avalaibleLeaves: daysDiff
      },
      $pull: {
        leaveHistory: { leaveId: leaveRequest._id }
      }
    });
   
    // Remove time tracker entries
    await TimeTracker.deleteMany({
      user: leaveRequest.employee,
      date: { $gte: start.toDate(), $lte: end.toDate() },
      status: 'Leave'
    });
  }
 
  await LeaveRequest.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Leave request deleted" });
});
 
// --- MANAGE HOLIDAYS (NEW RESTRICTION) ---
exports.manageHolidays = catchAsync(async (req, res) => {
  const roleKey = req.user.role.replace(/\s+/g, '').toLowerCase();
 
  // Only Super Admin, Admin, and HR can manage holidays
  if (!['superadmin', 'admin', 'hr'].includes(roleKey)) {
    throw new ForbiddenError("Permission Denied: Managers cannot manage company holidays.");
  }
 
  // Logic for adding/updating holiday entries would go here
  res.status(200).json({ success: true, message: "Holiday list updated." });
});
 
// =========================================================
// EMAIL HELPERS
// =========================================================
 
const sendLeaveCreationNotification = async (leaveRequest) => {
  // Get HR and relevant managers
  const hrAndManagers = await User.find({
    $or: [
      { role: 'HR' },
      { role: 'Super Admin' },
      { role: 'Admin' }
    ]
  });
 
  const recipientEmails = hrAndManagers.map(user => user.email);
 
  if (recipientEmails.length > 0) {
    const subject = `New Leave Request: ${leaveRequest.employeeName} - ${leaveRequest.leaveType}`;
    const htmlContent = generateLeaveCreationEmailTemplate(leaveRequest);
   
    recipientEmails.forEach(email => {
      sendEmail(email, subject, htmlContent)
        .catch(err => console.error(`❌ Failed to send leave notification to ${email}:`, err.message));
    });
  }
};
 
const sendLeaveResponseNotification = async (leaveRequest, responder, responseContent) => {
  // Notify the employee about the response
  if (leaveRequest.email && leaveRequest.email !== responder.email) {
    const subject = `New Response on Your Leave Request: ${leaveRequest.leaveType}`;
    const htmlContent = generateLeaveResponseEmailTemplate(leaveRequest, responder, responseContent);
   
    sendEmail(leaveRequest.email, subject, htmlContent)
      .catch(err => console.error(`❌ Failed to send response notification to ${leaveRequest.email}:`, err.message));
  }
};
 
const generateLeaveCreationEmailTemplate = (leaveRequest) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>New Leave Request</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .email-container { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background-color: #3a7ca5; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 25px; }
        .leave-card { background-color: #f5f5f5; border-left: 4px solid #3a7ca5; padding: 15px; margin-bottom: 20px; border-radius: 0 4px 4px 0; }
        .leave-id { font-size: 18px; font-weight: bold; color: #3a7ca5; margin-bottom: 10px; }
        .leave-field { margin-bottom: 8px; }
        .leave-field strong { display: inline-block; width: 120px; color: #666; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .footer { text-align: center; padding: 15px; font-size: 12px; color: #777; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>New Leave Request Submitted</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>A new leave request has been submitted and requires your review:</p>
          <div class="leave-card">
            <div class="leave-id">Leave Request #${leaveRequest._id.toString().slice(-6)}</div>
            <div class="leave-field"><strong>Employee:</strong> ${leaveRequest.employeeName}</div>
            <div class="leave-field"><strong>Leave Type:</strong> ${leaveRequest.leaveType}</div>
            <div class="leave-field"><strong>Dates:</strong> ${moment(leaveRequest.startDate).format('MMM DD, YYYY')} to ${moment(leaveRequest.endDate).format('MMM DD, YYYY')}</div>
            <div class="leave-field"><strong>Duration:</strong> ${moment(leaveRequest.endDate).diff(moment(leaveRequest.startDate), 'days') + 1} days</div>
            <div class="leave-field"><strong>Status:</strong> <span class="status-badge status-pending">${leaveRequest.status}</span></div>
            <div class="leave-field"><strong>Reason:</strong> ${leaveRequest.reason || 'No reason provided'}</div>
            <div class="leave-field"><strong>Submitted:</strong> ${moment(leaveRequest.appliedAt).format('MMM DD, YYYY hh:mm A')}</div>
          </div>
          <p>Please review this request in the leave management system.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Abidi Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
 
const generateLeaveStatusEmailTemplate = (leaveRequest, status, note) => {
  const statusColor = status === 'Approved' ? '#28a745' : status === 'Rejected' ? '#dc3545' : '#ffc107';
 
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Leave Request ${status}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .email-container { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 25px; }
        .leave-card { background-color: #f5f5f5; border-left: 4px solid ${statusColor}; padding: 15px; margin-bottom: 20px; border-radius: 0 4px 4px 0; }
        .leave-id { font-size: 18px; font-weight: bold; color: ${statusColor}; margin-bottom: 10px; }
        .leave-field { margin-bottom: 8px; }
        .leave-field strong { display: inline-block; width: 120px; color: #666; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; background-color: ${statusColor}20; color: ${statusColor}; }
        .note-box { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 15px; font-size: 12px; color: #777; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Leave Request ${status}</h1>
        </div>
        <div class="content">
          <p>Hello ${leaveRequest.employeeName},</p>
          <p>Your leave request has been <strong>${status}</strong>. Here are the details:</p>
          <div class="leave-card">
            <div class="leave-id">Leave Request #${leaveRequest._id.toString().slice(-6)}</div>
            <div class="leave-field"><strong>Leave Type:</strong> ${leaveRequest.leaveType}</div>
            <div class="leave-field"><strong>Dates:</strong> ${moment(leaveRequest.startDate).format('MMM DD, YYYY')} to ${moment(leaveRequest.endDate).format('MMM DD, YYYY')}</div>
            <div class="leave-field"><strong>Duration:</strong> ${moment(leaveRequest.endDate).diff(moment(leaveRequest.startDate), 'days') + 1} days</div>
            <div class="leave-field"><strong>Status:</strong> <span class="status-badge">${status}</span></div>
          </div>
          ${note ? `
          <div class="note-box">
            <strong>Note from reviewer:</strong><br>
            ${note}
          </div>
          ` : ''}
          <p>You can view all the details and any responses in the leave management system.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Abidi Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
 
const generateLeaveResponseEmailTemplate = (leaveRequest, responder, responseContent) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>New Response on Leave Request</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .email-container { background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background-color: #6c757d; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 25px; }
        .leave-card { background-color: #f5f5f5; border-left: 4px solid #6c757d; padding: 15px; margin-bottom: 20px; border-radius: 0 4px 4px 0; }
        .leave-id { font-size: 18px; font-weight: bold; color: #6c757d; margin-bottom: 10px; }
        .response-box { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .responder-info { display: flex; align-items: center; margin-bottom: 10px; }
        .responder-info strong { margin-right: 10px; }
        .footer { text-align: center; padding: 15px; font-size: 12px; color: #777; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>New Response on Leave Request</h1>
        </div>
        <div class="content">
          <p>Hello ${leaveRequest.employeeName},</p>
          <p>You have received a new response on your leave request:</p>
          <div class="leave-card">
            <div class="leave-id">Leave Request #${leaveRequest._id.toString().slice(-6)}</div>
            <p><strong>Leave Type:</strong> ${leaveRequest.leaveType}</p>
            <p><strong>Dates:</strong> ${moment(leaveRequest.startDate).format('MMM DD, YYYY')} to ${moment(leaveRequest.endDate).format('MMM DD, YYYY')}</p>
            <p><strong>Status:</strong> ${leaveRequest.status}</p>
          </div>
          <div class="response-box">
            <div class="responder-info">
              <strong>From:</strong> ${responder.name} (${responder.role})
            </div>
            <div>
              <strong>Response:</strong><br>
              ${responseContent}
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #6c757d;">
              Sent on: ${new Date().toLocaleString()}
            </div>
          </div>
          <p>You can respond to this message in the leave management system.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Abidi Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
