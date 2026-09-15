const TimeLog = require("../models/timeLogsSchema");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");
const { moment, TIMEZONE } = require("../utils/dateUtils");
const { normalizeRole } = require("../utils/rbacUtils");
const { getSearchScope } = require("../utils/rbac");

class TimeLogService {
  async createTimeLog(user, companyId, data, files) {
    const { job, date, description, hours, employeeId } = data;
    const role = normalizeRole(user.role);
    const employee = (employeeId && ['superadmin', 'admin'].includes(role)) ? employeeId : user.id || user._id;

    if (employee !== (user.id || user._id)) {
        const User = require("../models/userSchema");
        const emp = await User.findById(employee).select('company');
        if (!emp || !emp.company || emp.company.toString() !== companyId.toString()) {
            throw new BadRequestError("Cannot add time log for an employee from a different company.");
        }
    }

    const estDate = moment.tz(date, TIMEZONE).startOf('day').toDate();

    const attachments = files?.map(file => ({
      blobName: file.blobName,
      url: file.url || file.path,
      originalname: file.originalname,
      format: file.mimetype,
      size: file.size
    })) || [];

    const timeLog = new TimeLog({
      employee,
      company: companyId,
      job,
      date: estDate, 
      description,
      hours,
      attachments
    });

    return timeLog.save();
  }

  async getEmployeeTimeLogs(user, companyId, query) {
    const { date, userId, my } = query; 
    const scope = await getSearchScope(user, 'timelog');
    
    let dbQuery = { company: companyId };

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

    if (date) {
      const startDate = moment.tz(date, TIMEZONE).startOf('day').toDate();
      const endDate = moment.tz(date, TIMEZONE).endOf('day').toDate();
      dbQuery.date = { $gte: startDate, $lte: endDate };
    }

    return TimeLog.find(dbQuery).sort({ date: 1 });
  }

  async updateTimeLog(user, companyId, timeLogId, data, files) {
    const { job, date, description, hours } = data;
    const scope = await getSearchScope(user, 'timelog');

    const timeLog = await TimeLog.findOne({ _id: timeLogId, company: companyId, ...scope });
    if (!timeLog) throw new NotFoundError("TimeLog or you do not have permission to access it");

    if (timeLog.isAddedToTimesheet) {
      throw new BadRequestError("Cannot update time log already added to a timesheet");
    }

    if (files && files.length > 0) {
      timeLog.attachments = files.map(file => ({
        blobName: file.blobName,
        url: file.url || file.path,
        originalname: file.originalname,
        format: file.mimetype,
        size: file.size
      }));
    }

    timeLog.job = job;
    timeLog.date = moment.tz(date, TIMEZONE).startOf('day').toDate();
    timeLog.description = description;
    timeLog.hours = hours;

    return timeLog.save();
  }

  async deleteTimeLog(user, companyId, timeLogId) {
    const scope = await getSearchScope(user, 'timelog');
    const timeLog = await TimeLog.findOne({ _id: timeLogId, company: companyId, ...scope });
    if (!timeLog) throw new NotFoundError("TimeLog or you do not have permission to access it");
    if (timeLog.isAddedToTimesheet) throw new BadRequestError("Cannot delete log already in timesheet");
    await timeLog.deleteOne();
  }

  async downloadTimeLogAttachment(user, companyId, timeLogId, attachmentId) {
    const scope = await getSearchScope(user, 'timelog');
    const timeLog = await TimeLog.findOne({ _id: timeLogId, company: companyId, ...scope });
    if (!timeLog) throw new NotFoundError("TimeLog or you do not have permission to access it");
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
        return sasUrl;
      } else if (attachment.url) {
        return attachment.url;
      } else {
        throw new BadRequestError("No valid attachment URL found");
      }
    } catch (error) {
      console.error("Download error:", error);
      throw new BadRequestError("Failed to generate download link");
    }
  }
}

module.exports = new TimeLogService();
