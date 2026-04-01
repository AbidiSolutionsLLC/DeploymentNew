const cron = require('node-cron');
const TimeTracker = require("./models/timeTrackerSchema");
const Task = require("./models/taskSchema");
const Notification = require("./models/notificationSchema");
const { createNotification } = require('./utils/notificationService');

class CronJobs {
  constructor() {
    this.init();
  }

  init() {
    // Run every 30 minutes to catch 12h expirations frequently
    cron.schedule('*/30 * * * *', this.handleAbandonedSessions.bind(this));

    // Task Due Soon — runs every day at 8:00 AM (notify team members 24h before dueDate)
    cron.schedule('0 8 * * *', this.handleTaskDueSoon.bind(this));

    // Task Overdue — runs every day at 9:00 AM (notify managers about overdue tasks)
    cron.schedule('0 9 * * *', this.handleTaskOverdue.bind(this));

    console.log('Cron jobs initialized: Abandoned sessions (30min), Task Due Soon (8AM), Task Overdue (9AM).');
  }

  async handleAbandonedSessions() {
    try {
      const now = new Date();
      // The Cut-off: Anything checked in BEFORE this time (12h ago)
      // and still open must be closed.
      const twelveHoursAgo = new Date(now.getTime() - (12 * 60 * 60 * 1000));

      // Find sessions where checkOutTime is NULL AND checkInTime < 12 hours ago
      const abandonedSessions = await TimeTracker.find({
        checkOutTime: { $exists: false },
        checkInTime: { $lt: twelveHoursAgo }
      }).populate('user');

      if (abandonedSessions.length > 0) {
        console.log(`Found ${abandonedSessions.length} abandoned sessions >12h.`);
      }

      for (const session of abandonedSessions) {
        try {
          // 1. Force Close Time
          // We can set checkout time to (CheckIn + 12h) OR (Now).
          // Using (CheckIn + 12h) keeps the math clean at exactly 12h.
          const autoCloseTime = new Date(session.checkInTime.getTime() + (12 * 60 * 60 * 1000));

          session.checkOutTime = autoCloseTime;
          session.autoCheckedOut = true;
          session.totalHours = 12;

          // 2. APPLY PENALTY RULE:
          // "if user check in and forget to checkout with in 12 hours then that day should marked as absent"
          session.status = "Absent";

          session.notes = session.notes
            ? `${session.notes} | System Auto-Close (Absent: >12h limit)`
            : 'System Auto-Close (Absent: >12h limit)';

          await session.save();
          console.log(`Auto-closed session for user ${session.user?._id || 'unknown'} as ABSENT.`);
        } catch (err) {
          console.error(`Error processing session ${session._id}:`, err);
        }
      }
    } catch (error) {
      console.error('CRON ERROR (abandoned sessions):', error);
    }
  }

  async handleTaskDueSoon() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayStart = new Date(tomorrow);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(tomorrow);
      dayEnd.setHours(23, 59, 59, 999);

      const tasks = await Task.find({
        dueDate: { $gte: dayStart, $lte: dayEnd },
        status: { $nin: ['Done'] },
        team: { $exists: true, $ne: [] },
      }).populate('team');

      console.log(`[CRON] Task Due Soon: found ${tasks.length} tasks due tomorrow.`);

      for (const task of tasks) {
        for (const member of task.team) {
          await createNotification({
            recipient: member._id,
            type: 'TASK_DUE_SOON',
            title: 'Task Due Tomorrow',
            message: `Reminder: Task "${task.title}" is due tomorrow.`,
            relatedEntity: { entityType: 'task', entityId: task._id },
          });
        }
      }
    } catch (error) {
      console.error('CRON ERROR (task due soon):', error);
    }
  }

  async handleTaskOverdue() {
    try {
      const now = new Date();

      const overdueTasks = await Task.find({
        dueDate: { $lt: now },
        status: { $nin: ['Done'] },
        team: { $exists: true, $ne: [] },
      }).populate('team');

      console.log(`[CRON] Task Overdue: found ${overdueTasks.length} overdue tasks.`);

      for (const task of overdueTasks) {
        for (const member of task.team) {
          // Deduplication: only notify if not already notified in the last 24 hours
          const recentNotif = await Notification.findOne({
            recipient: member._id,
            type: 'TASK_OVERDUE',
            'relatedEntity.entityId': task._id,
            createdAt: { $gte: new Date(Date.now() - 86400000) },
          });

          if (!recentNotif) {
            await createNotification({
              recipient: member._id,
              type: 'TASK_OVERDUE',
              title: 'Task Overdue',
              message: `Task "${task.title}" was due on ${task.dueDate.toDateString()} and is now overdue.`,
              relatedEntity: { entityType: 'task', entityId: task._id },
            });
          }
        }
      }
    } catch (error) {
      console.error('CRON ERROR (task overdue):', error);
    }
  }
}

module.exports = CronJobs;