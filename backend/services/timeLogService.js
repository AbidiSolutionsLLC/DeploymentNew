const TimeLog = require("../models/timeLogsSchema");
const Task = require("../models/taskSchema");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");
const { moment, TIMEZONE } = require("../utils/dateUtils");
const { normalizeRole } = require("../utils/rbacUtils");
const { getSearchScope } = require("../utils/rbac");

const POPULATE_CONFIG = [
  {
    path: "task",
    select: "title taskID status priority project completionPercent workedHours",
    populate: { path: "project", select: "title projectID" }
  },
  {
    path: "project",
    select: "title projectID"
  }
];

class TimeLogService {
  async createTimeLog(user, companyId, data, files) {
    const { job, date, description, hours, employeeId, taskId, task, projectId, project, markAsDone } = data;
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

    let linkedTask = null;
    let linkedProject = null;
    const targetTaskId = taskId || task;

    if (targetTaskId) {
      const taskDoc = await Task.findOne({ _id: targetTaskId, company: companyId });
      if (taskDoc) {
        linkedTask = taskDoc._id;
        linkedProject = taskDoc.project;

        // If employee marked task as done on completion of work
        if (markAsDone === true || markAsDone === 'true') {
          taskDoc.status = "Done";
          taskDoc.completionPercent = 100;
          await taskDoc.save();
        }
      }
    } else if (projectId || project) {
      linkedProject = projectId || project;
    }

    const timeLog = new TimeLog({
      employee,
      company: companyId,
      job,
      date: estDate, 
      description,
      hours,
      attachments,
      task: linkedTask,
      project: linkedProject,
    });

    const saved = await timeLog.save();
    return TimeLog.findById(saved._id).populate(POPULATE_CONFIG);
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

    return TimeLog.find(dbQuery)
      .populate(POPULATE_CONFIG)
      .sort({ date: 1 });
  }

  async updateTimeLog(user, companyId, timeLogId, data, files) {
    const { job, date, description, hours, taskId, task, projectId, project, markAsDone } = data;
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

    if (job !== undefined) timeLog.job = job;
    if (date !== undefined) timeLog.date = moment.tz(date, TIMEZONE).startOf('day').toDate();
    if (description !== undefined) timeLog.description = description;
    if (hours !== undefined) timeLog.hours = hours;

    // Handle task link update/detach
    if (taskId !== undefined || task !== undefined) {
      const targetTaskId = taskId !== undefined ? taskId : task;
      if (targetTaskId) {
        const taskDoc = await Task.findOne({ _id: targetTaskId, company: companyId });
        if (taskDoc) {
          timeLog.task = taskDoc._id;
          timeLog.project = taskDoc.project;

          if (markAsDone === true || markAsDone === 'true') {
            taskDoc.status = "Done";
            taskDoc.completionPercent = 100;
            await taskDoc.save();
          }
        }
      } else {
        timeLog.task = null;
        timeLog.project = null;
      }
    } else if (projectId !== undefined || project !== undefined) {
      const targetProjectId = projectId !== undefined ? projectId : project;
      timeLog.project = targetProjectId || null;
    }

    const saved = await timeLog.save();
    return TimeLog.findById(saved._id).populate(POPULATE_CONFIG);
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
