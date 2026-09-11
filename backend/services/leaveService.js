const LeaveRequest = require("../models/leaveRequestSchema");
const User = require("../models/userSchema");
const TimeTracker = require("../models/timeTrackerSchema");
const { moment, TIMEZONE, calculateBusinessDays } = require("../utils/dateUtils");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const sendEmail = require('../utils/emailService');
const { createNotification } = require('../utils/notificationService');
const APIFeatures = require("../utils/apiFeatures");
const { getTeamIds } = require("../utils/hierarchy"); // Assuming getTeamIds is centralized in hierarchy.js as used in expenseController
const { normalizeRole } = require("../utils/rbacUtils");

class LeaveService {
  async createLeaveRequest(userId, companyId, data) {
    const { leaveType, startDate, endDate, reason } = data;
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    if (!leaveType || !startDate || !endDate) throw new BadRequestError("Missing required fields");

    const start = moment.utc(startDate).startOf('day').tz(TIMEZONE, true).startOf('day');
    const end = moment.utc(endDate).startOf('day').tz(TIMEZONE, true).startOf('day');
    const daysDiff = calculateBusinessDays(startDate, endDate);
    if (daysDiff < 1) {
      throw new BadRequestError("Selected date range includes only weekends/holidays. Please choose at least one working day.");
    }

    const userLeaveBalance = user.leaves[leaveType.toLowerCase()] || 0;
    if (userLeaveBalance < daysDiff) throw new BadRequestError(`Not enough ${leaveType} leaves available`);

    const existingLeaves = await LeaveRequest.find({
      employee: user._id,
      company: companyId,
      status: { $in: ["Pending", "Approved"] }
    });

    const overlappingLeaves = existingLeaves.filter(leave => {
      const existingStart = new Date(leave.startDate);
      const existingEnd = new Date(leave.endDate);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);
      return (existingStart <= newEnd && newStart <= existingEnd);
    });

    if (overlappingLeaves.length > 0) {
      throw new BadRequestError('Leave dates overlap with an existing application');
    }

    const leaveRequest = new LeaveRequest({
      employee: user._id,
      company: companyId,
      employeeName: user.name,
      email: user.email,
      leaveType,
      startDate,
      endDate,
      reason,
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
          reason: reason,
          appliedAt: savedLeaveRequest.appliedAt,
          createdAt: savedLeaveRequest.createdAt || new Date()
        }
      },
      $inc: {
        [`leaves.${leaveType.toLowerCase()}`]: -daysDiff,
        bookedLeaves: daysDiff,
        avalaibleLeaves: -daysDiff
      }
    };

    await User.findByIdAndUpdate(user._id, updateObj);

    this.sendLeaveCreationNotification(savedLeaveRequest).catch(console.error);

    try {
      const hrManagers = await User.find({
        $or: [{ role: 'HR' }, { role: 'Super Admin' }, { role: 'Admin' }],
        company: companyId
      }).select('_id');

      const notifPromises = hrManagers.map(mgr =>
        createNotification({
          recipient: mgr._id,
          type: 'LEAVE_REQUEST_SUBMITTED',
          title: 'New Leave Request',
          message: `${user.name} has submitted a ${leaveType} leave request from ${moment(startDate).format('MMM DD, YYYY')} to ${moment(endDate).format('MMM DD, YYYY')}. Action required.`,
          relatedEntity: { entityType: 'leave', entityId: savedLeaveRequest._id },
        })
      );
      await Promise.all(notifPromises);
    } catch (notifErr) {
      console.error('[Notification] Leave request submitted:', notifErr.message);
    }

    return savedLeaveRequest;
  }

  async getLeaveRequestResponses(user, companyId, id) {
    const leaveRequest = await LeaveRequest.findOne({ _id: id, company: companyId })
      .populate('responses.author', 'name email avatar role')
      .select('responses employee status');

    if (!leaveRequest) throw new NotFoundError("Leave request");

    const currentUserId = user.id || user._id;
    const roleKey = normalizeRole(user.role);

    const isOwner = leaveRequest.employee.toString() === currentUserId.toString();
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

    return leaveRequest.responses;
  }

  async updateLeaveResponse(userId, companyId, leaveId, responseId, content) {
    if (!content || content.trim() === '') {
      throw new BadRequestError("Response content is required");
    }

    const leaveRequest = await LeaveRequest.findOne({ _id: leaveId, company: companyId });
    if (!leaveRequest) throw new NotFoundError("Leave request");

    const response = leaveRequest.responses.id(responseId);
    if (!response) throw new NotFoundError("Response");

    if (response.author.toString() !== userId.toString()) {
      throw new ForbiddenError("You can only edit your own responses");
    }

    response.content = content.trim();
    response.editedAt = new Date();
    response.isEdited = true;

    await leaveRequest.save();

    const populatedLeaveRequest = await LeaveRequest.findOne({ _id: leaveId, company: companyId })
      .populate('responses.author', 'name email avatar role');

    return populatedLeaveRequest.responses.id(responseId);
  }

  async getLeaveRequests(user, companyId, query) {
    const roleKey = normalizeRole(user.role);
    let baseQuery = {};
    const currentUserId = user.id || user._id;

    if (query.my === 'true' || query.my === true) {
        baseQuery.employee = currentUserId;
        baseQuery.company = companyId;
    } else if (roleKey === 'superadmin' || roleKey === 'hr') {
        baseQuery = { company: companyId };
    }
    else if (roleKey === 'manager' || roleKey === 'admin') {
        const fullTeamIds = await getTeamIds(currentUserId);
        baseQuery.employee = { $in: fullTeamIds };
        baseQuery.company = companyId;
    }
    else {
        baseQuery.employee = currentUserId;
        baseQuery.company = companyId;
    }

    const features = new APIFeatures(
      LeaveRequest.find(baseQuery)
        .populate('employee', 'name email avatar department')
        .populate('responses.author', 'name email avatar role'),
      query
    )
      .filter()
      .search(['employeeName', 'reason', 'leaveType'])
      .sort()
      .limitFields()
      .paginate();

    const leaveRequests = await features.query;
    const totalCount = await LeaveRequest.countDocuments(baseQuery);
    
    return {
      total: totalCount,
      count: leaveRequests.length,
      page: query.page * 1 || 1,
      limit: query.limit * 1 || 100,
      data: leaveRequests
    };
  }

  async getLeaveRequestById(user, companyId, id) {
    const leaveRequest = await LeaveRequest.findOne({ _id: id, company: companyId })
      .populate('employee', 'name email avatar department position')
      .populate('responses.author', 'name email avatar role');
      
    if (!leaveRequest) throw new NotFoundError("Leave request");

    const currentUserId = user.id || user._id;
    const roleKey = normalizeRole(user.role);

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

    return leaveRequest;
  }

  async updateLeaveRequest(userId, companyId, id, data) {
    const leaveRequest = await LeaveRequest.findOne({ _id: id, company: companyId });
    if (!leaveRequest) throw new NotFoundError("Leave request");

    const isOwner = leaveRequest.employee.toString() === userId.toString();

    if (!isOwner) {
      const callerUser = await User.findById(userId);
      const roleKey = normalizeRole(callerUser?.role || '');
      if (!['superadmin', 'hr', 'admin'].includes(roleKey)) {
        throw new ForbiddenError("You don't have permission to update this leave request");
      }
    }

    if (leaveRequest.status !== 'Pending') {
      throw new BadRequestError("Cannot update leave request after it has been processed");
    }

    const updatedStartDate = data.startDate || leaveRequest.startDate;
    const updatedEndDate = data.endDate || leaveRequest.endDate;
    const updatedBusinessDays = calculateBusinessDays(updatedStartDate, updatedEndDate);
    if (updatedBusinessDays < 1) {
      throw new BadRequestError("Selected date range includes only weekends/holidays. Please choose at least one working day.");
    }

    const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    ).populate('employee', 'name email avatar');

    if (isOwner && updatedLeaveRequest.employee) {
      const empId = updatedLeaveRequest.employee._id || updatedLeaveRequest.employee;
      
      const dayDifference = updatedBusinessDays - calculateBusinessDays(leaveRequest.startDate, leaveRequest.endDate);
      
      const updateData = {
        $set: {
          'leaveHistory.$[elem].leaveType': updatedLeaveRequest.leaveType,
          'leaveHistory.$[elem].startDate': updatedLeaveRequest.startDate,
          'leaveHistory.$[elem].endDate': updatedLeaveRequest.endDate,
          'leaveHistory.$[elem].reason': updatedLeaveRequest.reason,
          'leaveHistory.$[elem].status': updatedLeaveRequest.status,
          'leaveHistory.$[elem].daysTaken': updatedBusinessDays
        }
      };

      if (dayDifference !== 0) {
        updateData.$inc = {
          [`leaves.${updatedLeaveRequest.leaveType.toLowerCase()}`]: -dayDifference,
          bookedLeaves: dayDifference,
          avalaibleLeaves: -dayDifference
        };
      }

      await User.findByIdAndUpdate(
        empId,
        updateData,
        {
          runValidators: true,
          arrayFilters: [{ 'elem.leaveId': updatedLeaveRequest._id }]
        }
      );
    }

    return updatedLeaveRequest;
  }

  async addLeaveResponse(user, companyId, id, content) {
    if (!content || content.trim() === '') {
      throw new BadRequestError("Response content is required");
    }

    const leaveRequest = await LeaveRequest.findOne({ _id: id, company: companyId });
    if (!leaveRequest) throw new NotFoundError("Leave request");

    const currentUser = await User.findById(user.id || user._id);
    if (!currentUser) throw new NotFoundError("User not found");

    const currentUserId = currentUser._id.toString();
    const roleKey = currentUser.role.replace(/\s+/g, '').toLowerCase();

    const isOwner = leaveRequest.employee.toString() === currentUserId;
    const isSuperAdminOrHR = ['superadmin', 'hr'].includes(roleKey);
    let isAuthorized = false;

    if (isOwner || isSuperAdminOrHR) {
      isAuthorized = true;
    } else if (roleKey === 'admin' || roleKey === 'manager') {
      const teamIds = await getTeamIds(currentUserId);
      if (teamIds.includes(leaveRequest.employee.toString())) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenError("You don't have permission to respond to this leave request");
    }

    const newResponse = {
      author: currentUser._id,
      content: content.trim(),
      time: new Date(),
      role: currentUser.role,
      isSystemNote: false,
      isEdited: false,
      attachments: []
    };

    leaveRequest.responses.push(newResponse);
    await leaveRequest.save();

    const savedResponse = leaveRequest.responses[leaveRequest.responses.length - 1];

    const populatedResponse = await LeaveRequest.findOne(
      { _id: id, 'responses._id': savedResponse._id },
      { 'responses.$': 1 }
    ).populate('responses.author', 'name email avatar role');

    const responseData = populatedResponse.responses[0];

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

    this.sendLeaveResponseNotification(leaveRequest, currentUser, content).catch(console.error);

    return formattedResponse;
  }

  async deleteLeaveResponse(user, companyId, id, responseId) {
    const leaveRequest = await LeaveRequest.findOne({ _id: id, company: companyId });
    if (!leaveRequest) throw new NotFoundError("Leave request");

    const response = leaveRequest.responses.id(responseId);
    if (!response) throw new NotFoundError("Response");

    const currentUserId = user.id || user._id;
    const isAuthor = response.author.toString() === currentUserId.toString();
    const roleKey = normalizeRole(user.role);
    const isSuperAdminOrHR = ['superadmin', 'hr'].includes(roleKey);

    if (!isAuthor && !isSuperAdminOrHR) {
      throw new ForbiddenError("You can only delete your own responses");
    }

    response.deleteOne();
    await leaveRequest.save();

    return leaveRequest;
  }

  async updateLeaveStatus(user, companyId, id, status, responseNote) {
    if (!["Pending", "Approved", "Rejected"].includes(status)) throw new BadRequestError("Invalid status");

    const leaveRequest = await LeaveRequest.findOne({ _id: id, company: companyId });
    if (!leaveRequest) throw new NotFoundError("Leave request not found");

    const roleKey = normalizeRole(user.role);
    const currentUserId = user.id || user._id;

    if (!['superadmin', 'admin', 'hr'].includes(roleKey)) {
       throw new ForbiddenError("Managers have read-only access to leaves. Contact HR for approvals.");
    }

    if (leaveRequest.employee.toString() === currentUserId.toString()) {
       throw new ForbiddenError("You cannot update the status of your own leave request.");
    }

    if (roleKey === 'admin') {
       const adminTeam = await getTeamIds(currentUserId);
       if (!adminTeam.includes(leaveRequest.employee.toString())) {
          throw new ForbiddenError("Admins can only manage leaves for their own team hierarchy.");
       }
    }

    const start = moment(leaveRequest.startDate).tz(TIMEZONE).startOf('day');
    const end = moment(leaveRequest.endDate).tz(TIMEZONE).startOf('day');
    const daysDiff = calculateBusinessDays(leaveRequest.startDate, leaveRequest.endDate);

    if (status === 'Approved') {
      const existingLeaves = await LeaveRequest.find({
        employee: leaveRequest.employee,
        company: companyId,
        status: "Approved",
        _id: { $ne: leaveRequest._id }
      });
      const overlappingLeaves = existingLeaves.filter(leave => {
        const existingStart = new Date(leave.startDate);
        const existingEnd = new Date(leave.endDate);
        const newStart = new Date(leaveRequest.startDate);
        const newEnd = new Date(leaveRequest.endDate);
        return (existingStart <= newEnd && newStart <= existingEnd);
      });
      if (overlappingLeaves.length > 0) {
        throw new BadRequestError('Cannot approve: Leave dates overlap with an already approved leave.');
      }
    }

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

    if (leaveRequest.email) {
      const emailSubject = `Leave Request ${status}`;
      const emailBody = this.generateLeaveStatusEmailTemplate(leaveRequest, status, responseNote);
      sendEmail(leaveRequest.email, emailSubject, emailBody).catch(console.error);
    }

    try {
      const isApproved = status === 'Approved';
      if (status === 'Approved' || status === 'Rejected') {
        await createNotification({
          recipient: leaveRequest.employee,
          type: isApproved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
          title: isApproved ? 'Leave Approved' : 'Leave Rejected',
          message: isApproved
            ? `Your ${leaveRequest.leaveType} leave request from ${moment(leaveRequest.startDate).format('MMM DD, YYYY')} to ${moment(leaveRequest.endDate).format('MMM DD, YYYY')} has been approved.`
            : `Your ${leaveRequest.leaveType} leave request has been rejected.${responseNote ? ' Reason: ' + responseNote : ''}`,
          relatedEntity: { entityType: 'leave', entityId: leaveRequest._id },
        });
      }
    } catch (notifErr) {
      console.error('[Notification] Leave status update:', notifErr.message);
    }

    if (status === "Approved" && oldStatus !== "Approved") {
      const timeTrackerEntries = [];
      const curr = start.clone();
      while (curr.isSameOrBefore(end)) {
        const dateStart = curr.toDate();
        const existingEntry = await TimeTracker.findOne({ user: leaveRequest.employee, date: dateStart });
        if (existingEntry) {
          existingEntry.status = 'Leave';
          existingEntry.notes = `Leave Request Approved: ${leaveRequest.leaveType}`;
          await existingEntry.save();
        } else {
          timeTrackerEntries.push({
            user: leaveRequest.employee,
            date: dateStart,
            status: 'Leave',
            notes: `Leave: ${leaveRequest.leaveType} - ${leaveRequest.reason || 'No reason provided'}`
          });
        }
        curr.add(1, 'days');
      }
      if (timeTrackerEntries.length > 0) await TimeTracker.insertMany(timeTrackerEntries);
    } else if (status !== "Approved" && oldStatus === "Approved") {
      await TimeTracker.deleteMany({
        user: leaveRequest.employee,
        date: { $gte: start.toDate(), $lte: end.toDate() },
        status: 'Leave'
      });
    }

    return leaveRequest;
  }

  async deleteLeaveRequest(user, companyId, id) {
    const leaveRequest = await LeaveRequest.findOne({ _id: id, company: companyId });
    if (!leaveRequest) throw new NotFoundError("Leave request");

    const currentUserId = user.id || user._id;
    const isOwner = leaveRequest.employee.toString() === currentUserId.toString();
    const roleKey = normalizeRole(user.role);
    const isSuperAdminOrHR = ['superadmin', 'hr'].includes(roleKey);

    if (leaveRequest.status !== 'Pending') {
      throw new BadRequestError("Cannot delete leave request after it has been processed");
    }

    if (!isOwner && !isSuperAdminOrHR) {
      throw new ForbiddenError("You don't have permission to delete this leave request");
    }

    if (isSuperAdminOrHR || isOwner) {
      const start = moment(leaveRequest.startDate).tz(TIMEZONE).startOf('day');
      const end = moment(leaveRequest.endDate).tz(TIMEZONE).startOf('day');
      const daysDiff = calculateBusinessDays(leaveRequest.startDate, leaveRequest.endDate);
     
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
     
      await TimeTracker.deleteMany({
        user: leaveRequest.employee,
        date: { $gte: start.toDate(), $lte: end.toDate() },
        status: 'Leave'
      });
    }

    await LeaveRequest.findOneAndDelete({ _id: id, company: companyId });
  }

  async manageHolidays(user) {
    const roleKey = normalizeRole(user.role);
    if (!['superadmin', 'admin', 'hr'].includes(roleKey)) {
      throw new ForbiddenError("Permission Denied: Managers cannot manage company holidays.");
    }
  }

  async getLeaveBalance(userId) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    return {
      leaves: user.leaves || {},
      bookedLeaves: user.bookedLeaves || 0,
      avalaibleLeaves: user.avalaibleLeaves || 0
    };
  }

  async bulkUpdateStatus(user, companyId, ids, status) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) throw new BadRequestError("No leave IDs provided");
    if (!["Pending", "Approved", "Rejected"].includes(status)) throw new BadRequestError("Invalid status");

    const roleKey = normalizeRole(user.role);
    if (!['superadmin', 'admin', 'hr'].includes(roleKey)) {
       throw new ForbiddenError("Managers have read-only access to leaves. Contact HR for approvals.");
    }

    const results = [];
    const currentUserId = user.id || user._id;

    for (const id of ids) {
      try {
        const leaveRequest = await LeaveRequest.findOne({ _id: id, company: companyId });
        if (!leaveRequest || leaveRequest.status === status) continue;

        if (roleKey === 'admin') {
           const adminTeam = await getTeamIds(currentUserId);
           if (!adminTeam.includes(leaveRequest.employee.toString())) continue;
        }

        const daysDiff = calculateBusinessDays(leaveRequest.startDate, leaveRequest.endDate);
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

        leaveRequest.status = status;
        await leaveRequest.save();
        results.push(id);
      } catch (err) {
        console.error("Bulk update error for id", id, err);
      }
    }

    return results;
  }

  async exportLeaves(user, companyId) {
    const roleKey = normalizeRole(user.role);
    let baseQuery = { company: companyId };
    
    if (!['superadmin', 'hr', 'admin'].includes(roleKey)) {
      throw new ForbiddenError("You don't have permission to export leaves");
    }

    if (roleKey === 'admin') {
      const fullTeamIds = await getTeamIds(user.id || user._id);
      baseQuery.employee = { $in: fullTeamIds };
    }

    const leaves = await LeaveRequest.find(baseQuery)
      .populate('employee', 'name email department')
      .sort('-createdAt');

    let csv = 'Employee,Email,Department,Leave Type,Start Date,End Date,Reason,Status,Applied At\n';
    leaves.forEach(l => {
      const emp = l.employee || {};
      csv += `"${emp.name || l.employeeName}","${emp.email || l.email}","${emp.department || ''}","${l.leaveType}","${l.startDate}","${l.endDate}","${(l.reason || '').replace(/"/g, '""')}","${l.status}","${l.appliedAt}"\n`;
    });
    return csv;
  }

  // =========================================================
  // EMAIL HELPERS
  // =========================================================
  
  async sendLeaveCreationNotification(leaveRequest) {
    let employee = null;
    if (leaveRequest.employee) {
      employee = await User.findById(leaveRequest.employee).populate('department', 'name');
    }

    const hrAndManagers = await User.find({
      $or: [{ role: 'HR' }, { role: 'Super Admin' }, { role: 'Admin' }],
      company: leaveRequest.company
    });
   
    const recipientEmails = hrAndManagers.map(user => user.email);
   
    if (recipientEmails.length > 0) {
      const subject = `New Leave Request: ${leaveRequest.employeeName} - ${leaveRequest.leaveType}`;
      const htmlContent = this.generateLeaveCreationEmailTemplate(leaveRequest, employee);
     
      recipientEmails.forEach(email => {
        sendEmail(email, subject, htmlContent)
          .catch(err => console.error(`❌ Failed to send leave notification to ${email}:`, err.message));
      });
    }
  }
   
  async sendLeaveResponseNotification(leaveRequest, responder, responseContent) {
    if (leaveRequest.email && leaveRequest.email !== responder.email) {
      const subject = `New Response on Your Leave Request: ${leaveRequest.leaveType}`;
      const htmlContent = this.generateLeaveResponseEmailTemplate(leaveRequest, responder, responseContent);
     
      sendEmail(leaveRequest.email, subject, htmlContent)
        .catch(err => console.error(`❌ Failed to send response notification to ${leaveRequest.email}:`, err.message));
    }
  }
   
  generateLeaveCreationEmailTemplate(leaveRequest, employee = null) {
    const employeeName = leaveRequest.employeeName || employee?.name || 'Employee';
    const empID = employee?.empID || (employee?._id ? `EMP-${employee._id.toString().slice(-4).toUpperCase()}` : '');
    const departmentName = employee?.department?.name || 'General';
    const designation = employee?.designation || employee?.role || 'Team Member';
    const leaveTypeLabel = leaveRequest.leaveType === 'PTO' ? 'Paid Time Off (PTO)' : (leaveRequest.leaveType === 'Sick' ? 'Sick Leave' : leaveRequest.leaveType);
    
    // Dates formatting
    const startDateObj = moment(leaveRequest.startDate).tz(TIMEZONE);
    const endDateObj = moment(leaveRequest.endDate).tz(TIMEZONE);
    const appliedDateObj = moment(leaveRequest.appliedAt || leaveRequest.createdAt || new Date()).tz(TIMEZONE);
    
    const startMonthYear = startDateObj.format('MMMM YYYY').toUpperCase();
    const startDayNum = startDateObj.format('DD');
    const startDayName = startDateObj.format('dddd');
    const startDateFormatted = startDateObj.format('MMM DD, YYYY');

    const endMonthYear = endDateObj.format('MMMM YYYY').toUpperCase();
    const endDayNum = endDateObj.format('DD');
    const endDayName = endDateObj.format('dddd');
    const endDateFormatted = endDateObj.format('MMM DD, YYYY');

    const appliedDateFormatted = appliedDateObj.format('MMMM DD, YYYY');

    // Calculate working business days
    const businessDays = calculateBusinessDays(leaveRequest.startDate, leaveRequest.endDate);
    const daysLabel = `${businessDays} business day${businessDays > 1 ? 's' : ''}`;

    // Return to work date calculation (next business day after end date)
    let nextWorkDay = moment(leaveRequest.endDate).tz(TIMEZONE).add(1, 'day');
    while (nextWorkDay.day() === 0 || nextWorkDay.day() === 6) {
      nextWorkDay.add(1, 'day');
    }
    const returnDateFormatted = nextWorkDay.format('dddd, MMM DD, YYYY');

    const reason = leaveRequest.reason && leaveRequest.reason.trim() ? leaveRequest.reason.trim() : 'No additional note provided.';
    const leaveId = leaveRequest._id ? leaveRequest._id.toString() : '';
    const refId = leaveId ? `LR-${leaveId.slice(-6).toUpperCase()}` : `LR-${Date.now().toString().slice(-6)}`;
    
    const portalUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
      ? `${process.env.FRONTEND_URL.replace(/\/+$/, '')}/admin/leaveTrackerAdmin`
      : 'https://abidipro.abidisolutions.com/admin/leaveTrackerAdmin';

    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>New Leave Request - ${escapeHtml(employeeName)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      -webkit-font-smoothing: antialiased;
    }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .p-mobile { padding: 20px 16px !important; }
      .cal-box { width: 100% !important; margin-bottom: 10px !important; }
      .cal-separator { display: none !important; }
      .kv-col { display: block !important; width: 100% !important; margin-bottom: 8px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC;">

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="580">
        <tr>
        <td align="center" valign="top" width="580">
        <![endif]-->
        <table role="presentation" class="container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden;">
          
          <!-- Header with Minimal Logo and Status Badge -->
          <tr>
            <td style="padding: 28px 28px 20px 28px; border-bottom: 1px solid #F1F5F9;" class="p-mobile">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="display: inline-block; font-size: 18px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">
                      <span style="color: #D4AF37;">◆</span> SOWAYE
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                      Pending Review
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px;" class="p-mobile">
              
              <!-- Title -->
              <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0F172A;">
                Leave Request from ${escapeHtml(employeeName)}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748B; line-height: 1.5;">
                Submitted on <strong>${escapeHtml(appliedDateFormatted)}</strong> for <strong>${escapeHtml(daysLabel)}</strong> of ${escapeHtml(leaveTypeLabel)}.
              </p>

              <!-- DUAL CALENDAR TEAR-OFF BADGES -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF8F2; border: 1px solid #EAE5D9; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- Start Date Badge -->
                        <td class="cal-box" width="42%" align="center" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                          <!-- Month Top Header -->
                          <div style="background-color: #D4AF37; color: #FFFFFF; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 0; letter-spacing: 1px;">
                            ${escapeHtml(startMonthYear)}
                          </div>
                          <!-- Day Number -->
                          <div style="padding: 10px 0 4px 0;">
                            <span style="font-size: 26px; font-weight: 900; color: #0F172A; line-height: 1;">${escapeHtml(startDayNum)}</span>
                          </div>
                          <!-- Day Name -->
                          <div style="font-size: 12px; font-weight: 600; color: #92590C; padding-bottom: 8px;">
                            ${escapeHtml(startDayName)} (Start)
                          </div>
                        </td>

                        <!-- Connector Arrow -->
                        <td class="cal-separator" width="16%" align="center" style="font-size: 18px; color: #D4AF37; font-weight: 700;">
                          ➔
                          <div style="font-size: 11px; font-weight: 800; color: #B45309; margin-top: 2px;">${businessDays} Day${businessDays > 1 ? 's' : ''}</div>
                        </td>

                        <!-- End Date Badge -->
                        <td class="cal-box" width="42%" align="center" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                          <!-- Month Top Header -->
                          <div style="background-color: #1E293B; color: #FFFFFF; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 0; letter-spacing: 1px;">
                            ${escapeHtml(endMonthYear)}
                          </div>
                          <!-- Day Number -->
                          <div style="padding: 10px 0 4px 0;">
                            <span style="font-size: 26px; font-weight: 900; color: #0F172A; line-height: 1;">${escapeHtml(endDayNum)}</span>
                          </div>
                          <!-- Day Name -->
                          <div style="font-size: 12px; font-weight: 600; color: #64748B; padding-bottom: 8px;">
                            ${escapeHtml(endDayName)} (End)
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Request Key-Value Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #64748B; width: 35%;">
                    Employee Name
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #0F172A;">
                    ${escapeHtml(employeeName)} ${empID ? `(${escapeHtml(empID)})` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #64748B;">
                    Department & Role
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #0F172A;">
                    ${escapeHtml(departmentName)} • ${escapeHtml(designation)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #64748B;">
                    Leave Category
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #B8860B;">
                    ${escapeHtml(leaveTypeLabel)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #64748B;">
                    Duration
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #0F172A;">
                    ${startDateFormatted} to ${endDateFormatted} (${escapeHtml(daysLabel)})
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #64748B;">
                    Return to Office Date
                  </td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #059669;">
                    ${escapeHtml(returnDateFormatted)}
                  </td>
                </tr>
              </table>

              <!-- Employee Reason Box -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B; margin-bottom: 4px;">
                  Employee Note / Reason
                </div>
                <div style="font-size: 13px; color: #334155; line-height: 1.5;">
                  “${escapeHtml(reason)}”
                </div>
              </div>

              <!-- Primary CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${portalUrl}" style="display: block; width: 100%; box-sizing: border-box; background-color: #D4AF37; color: #FFFFFF; font-size: 14px; font-weight: 700; text-align: center; text-decoration: none; padding: 14px 20px; border-radius: 8px;">
                      Review Leave in Sowaye Portal ➔
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9; text-align: center; font-size: 11px; color: #94A3B8;">
              Sowaye System Notification • Ref ID: <code>${escapeHtml(refId)}</code> • Auto-generated
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>`;
  }
   
  generateLeaveStatusEmailTemplate(leaveRequest, status, note) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Leave Request ${status}</title>
      </head>
      <body>
        <div>
          <h1>Leave Request ${status}</h1>
          <p>Hello ${leaveRequest.employeeName},</p>
          <p>Your leave request has been <strong>${status}</strong>.</p>
          ${note ? `<p><strong>Note from reviewer:</strong> ${note}</p>` : ''}
        </div>
      </body>
      </html>
    `;
  }
   
  generateLeaveResponseEmailTemplate(leaveRequest, responder, responseContent) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>New Response on Leave Request</title>
      </head>
      <body>
        <div>
          <h1>New Response on Leave Request</h1>
          <p>Hello ${leaveRequest.employeeName},</p>
          <p>You have received a new response on your leave request from ${responder.name}:</p>
          <p>${responseContent}</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new LeaveService();
