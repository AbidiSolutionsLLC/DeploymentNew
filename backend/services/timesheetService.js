const Timesheet = require("../models/timesheetSchema");
const TimeLog = require("../models/timeLogsSchema");
const User = require("../models/userSchema"); 
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const { getStartOfDay, getEndOfDay, moment, TIMEZONE } = require("../utils/dateUtils");
const { createNotification } = require('../utils/notificationService');
const { normalizeRole } = require("../utils/rbacUtils");
const { getSearchScope } = require("../utils/rbac");

class TimesheetService {
  async createTimesheet(user, companyId, data) {
    let { name, description, timeLogs, date, employeeId } = data;
    const role = normalizeRole(user.role);
    
    let employee = user.id || user._id;
    let employeeName = user.name;

    if (employeeId && ['superadmin', 'admin'].includes(role)) {
        const targetUser = await User.findOne({ _id: employeeId, company: companyId });
        if (!targetUser) throw new BadRequestError("Target employee not found");
        employee = targetUser._id;
        employeeName = targetUser.name;
    }

    let logIds = Array.isArray(timeLogs) ? timeLogs : (timeLogs ? [timeLogs] : []);
    if (logIds.length === 0) throw new BadRequestError("No time logs provided");

    let timesheetDate = date ? moment.tz(date, TIMEZONE).startOf('day').toDate() : getStartOfDay();

    const existingTimesheet = await Timesheet.findOne({
      company: companyId,
      employee,
      date: { $gte: getStartOfDay(timesheetDate), $lte: getEndOfDay(timesheetDate) }
    });

    if (existingTimesheet) {
      throw new BadRequestError(`You have already submitted a timesheet for ${moment(timesheetDate).tz(TIMEZONE).format('MM-DD-YYYY')}.`);
    }

    const logs = await TimeLog.find({ _id: { $in: logIds }, employee, isAddedToTimesheet: false });
    if (logs.length !== logIds.length) {
      throw new BadRequestError("Invalid logs or logs already added to another timesheet");
    }

    const submittedHours = logs.reduce((total, log) => total + log.hours, 0);

    const startOfWeek = moment(timesheetDate).tz(TIMEZONE).startOf('isoWeek').toDate();
    const endOfWeek = moment(timesheetDate).tz(TIMEZONE).endOf('isoWeek').toDate();

    const weeklyTimesheets = await Timesheet.find({
      company: companyId,
      employee,
      date: { $gte: startOfWeek, $lte: endOfWeek },
      status: { $in: ["Pending", "Approved"] }
    });

    const weeklyTotalHours = weeklyTimesheets.reduce((total, sheet) => total + sheet.submittedHours, 0);
    if (weeklyTotalHours + submittedHours > 40) throw new BadRequestError(`Weekly limit (40h) exceeded.`);

    const timesheet = new Timesheet({
      name, description, employee, employeeName,
      date: timesheetDate,
      submittedHours,
      timeLogs: logIds,
      company: companyId
    });

    const savedTimesheet = await timesheet.save();
    await TimeLog.updateMany({ _id: { $in: logIds } }, { isAddedToTimesheet: true, timesheet: savedTimesheet._id });

    return savedTimesheet;
  }

  async getWeeklyTimesheets(user, companyId, query) {
    const { weekStart, userId, my } = query; 
    if (!weekStart) throw new BadRequestError("Week start date is required");

    const startDate = moment.tz(weekStart, TIMEZONE).startOf('day').toDate();
    const endDate = moment(startDate).add(6, 'days').endOf('day').toDate();

    let dbQuery = { date: { $gte: startDate, $lte: endDate }, company: companyId };
    const scope = await getSearchScope(user, 'timesheet');

    if (my === 'true' || my === true) {
        dbQuery.employee = user.id || user._id;
    } else {
        Object.assign(dbQuery, scope);
        if (userId) {
            if (scope.employee && scope.employee.$in) {
                if (!scope.employee.$in.map(String).includes(String(userId))) {
                    dbQuery._id = null;
                } else {
                    dbQuery.employee = userId;
                }
            } else if (scope.employee && String(scope.employee) !== String(userId)) {
                dbQuery._id = null;
            } else {
                dbQuery.employee = userId;
            }
        }
    }

    const timesheets = await Timesheet.find(dbQuery)
      .populate("timeLogs")
      .populate("employee", "name email role") 
      .sort({ date: 1 });

    const weeklyTotal = timesheets.reduce((total, sheet) => total + sheet.submittedHours, 0);

    return {
      weekStart: startDate.toISOString(),
      weekEnd: endDate.toISOString(),
      timesheets,
      weeklyTotal,
      remainingHours: Math.max(0, 40 - weeklyTotal) 
    };
  }

  async getAllTimesheets(user, companyId, queryParams) {
    const { page = 1, limit = 20, status, employeeId, startDate, endDate, my } = queryParams;
    const skip = (page - 1) * limit;

    let query = { company: companyId };

    if (status && status !== 'All') query.status = status;
    if (employeeId && employeeId !== 'All') query.employee = employeeId;
    
    if (startDate && endDate) {
      query.date = { 
        $gte: moment.tz(startDate, TIMEZONE).startOf('day').toDate(), 
        $lte: moment.tz(endDate, TIMEZONE).endOf('day').toDate() 
      };
    }

    const scope = await getSearchScope(user, 'timesheet');

    if (my === 'true' || my === true) {
       query.employee = user.id || user._id;
    } else {
       Object.assign(query, scope);
       if (employeeId && employeeId !== 'All') {
           if (scope.employee && scope.employee.$in) {
               if (!scope.employee.$in.map(String).includes(String(employeeId))) {
                   query._id = null; 
               } else {
                   query.employee = employeeId;
               }
           } else if (scope.employee && String(scope.employee) !== String(employeeId)) {
               query._id = null;
           } else {
               query.employee = employeeId;
           }
       }
    }

    const [data, total] = await Promise.all([
      Timesheet.find(query)
        .populate("timeLogs")
        .populate("employee", "name email role avatar")
        .skip(skip)
        .limit(Number(limit))
        .sort({ date: -1 }),
      Timesheet.countDocuments(query)
    ]);

    return {
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getTimesheetById(user, companyId, id) {
    const scope = await getSearchScope(user, 'timesheet');
    const timesheet = await Timesheet.findOne({ _id: id, company: companyId, ...scope }).populate("timeLogs");
    if (!timesheet) throw new NotFoundError("Timesheet or you do not have permission to view it");
    return timesheet;
  }

  async updateTimesheet(user, companyId, id, data, files) {
    const timesheet = await Timesheet.findOne({ _id: id, company: companyId });
    if (!timesheet) throw new NotFoundError("Timesheet");

    if (timesheet.status !== 'Pending') {
      throw new ForbiddenError("You can only edit timesheets that are in Pending status");
    }

    if (timesheet.employee.toString() !== (user.id || user._id).toString()) {
      throw new ForbiddenError("You can only edit your own timesheets");
    }

    // Update fields
    if (data.name) timesheet.name = data.name;
    if (data.description !== undefined) timesheet.description = data.description;
    
    // Process new attachments if any
    if (files && files.length > 0) {
      const newAttachments = files.map(file => ({
        filename: file.filename || file.originalname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path || `/uploads/timesheets/${file.filename}`
      }));
      timesheet.attachments = [...(timesheet.attachments || []), ...newAttachments];
    }

    const updatedTimesheet = await timesheet.save();
    return updatedTimesheet;
  }

  async updateTimesheetStatus(user, companyId, id, data) {
    const { status, approvedHours, comment } = data;
    const scope = await getSearchScope(user, 'timesheet');
    const timesheet = await Timesheet.findOne({ _id: id, company: companyId, ...scope }).populate('employee', 'name email');
    if (!timesheet) throw new NotFoundError("Timesheet or you do not have permission to modify it");

    const currentUserId = (user.id || user._id).toString();
    if (timesheet.employee._id.toString() === currentUserId) {
      throw new ForbiddenError("You cannot approve your own timesheet.");
    }

    timesheet.status = status;
    if (approvedHours !== undefined) timesheet.approvedHours = approvedHours;
    
    if (comment && comment.trim()) {
      timesheet.comments.push({
        author: user?.name || "Unknown",
        authorId: user?.id || user?._id,
        content: comment.trim(),
        time: new Date(),
        avatar: user?.avatar || ""
      });
    }
    
    const updatedTimesheet = await timesheet.save();

    try {
      await createNotification({
        recipient: timesheet.employee._id,
        type: status === 'Approved' ? 'TIMESHEET_APPROVED' : 'TIMESHEET_REJECTED',
        title: `Timesheet ${status}`,
        message: `Your timesheet for ${new Date(timesheet.date).toDateString()} has been ${status.toLowerCase()}.`,
        relatedEntity: { entityType: 'timesheet', entityId: updatedTimesheet._id },
      });
    } catch (err) {}

    return updatedTimesheet;
  }

  async deleteTimesheet(user, companyId, id) {
    const timesheet = await Timesheet.findOne({ _id: id, company: companyId });
    if (!timesheet) throw new NotFoundError("Timesheet");

    if (timesheet.status !== 'Pending') {
      throw new ForbiddenError("You can only delete timesheets that are in Pending status");
    }

    if (timesheet.employee.toString() !== (user.id || user._id).toString()) {
      throw new ForbiddenError("You can only delete your own timesheets");
    }

    if (timesheet.timeLogs && timesheet.timeLogs.length > 0) {
      await TimeLog.updateMany(
        { _id: { $in: timesheet.timeLogs } },
        { $set: { isAddedToTimesheet: false, timesheet: null } }
      );
    }

    await timesheet.deleteOne();
  }
}

module.exports = new TimesheetService();
