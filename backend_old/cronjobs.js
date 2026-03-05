const cron = require('node-cron');
const TimeTracker = require("./models/timeTrackerSchema");
const Log = require("./models/LogSchema");
const User = require("./models/userSchema");
const Timesheet = require("./models/timesheetSchema");
const sendEmail = require("./utils/emailService");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const moment = require("moment-timezone");

class CronJobs {
  constructor() {
    this.init();
  }

  init() {
    // Run every 30 minutes to catch 12h expirations frequently
    cron.schedule('*/30 * * * *', this.handleAbandonedSessions.bind(this));

    // 1. Logs: Every day at midnight
    cron.schedule("0 0 * * *", this.sendLogsEmail.bind(this), {
      timezone: "America/New_York"
    });

    // 2. Missing Check-in: Mon-Fri at 10:00 AM
    cron.schedule("0 10 * * 1-5", this.checkMissingCheckIn.bind(this), {
      timezone: "America/New_York"
    });

    // 3. Missing Checkout: Mon-Fri at 7:00 PM (19:00)
    cron.schedule("0 19 * * 1-5", this.checkMissingCheckout.bind(this), {
      timezone: "America/New_York"
    });

    // 4. Missing Timesheet: Every Friday at 6:00 PM (18:00)
    cron.schedule("0 18 * * 5", this.checkMissingTimesheet.bind(this), {
      timezone: "America/New_York"
    });

    console.log('✅ Cron jobs initialized: Abandoned Sessions, Logs, Attendance, Timesheets.');
  }

  // Helper to check if today is a working day (Mon-Fri)
  isWorkingDay() {
    const day = moment().tz("America/New_York").day();
    return day !== 0 && day !== 6; // 0=Sun, 6=Sat
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
        console.log(`Found ${abandonedSessions.length} abandoned sessions > 12h.`);
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
      console.error('CRON ERROR (AbandonedSessions):', error);
    }
  }

  async sendLogsEmail() {
    try {
      const now = new Date();
      // Logic from original code: last 5 minutes (was it? verify)
      // I will go with 30 mins as per earlier plan
      const lookBackTime = new Date(now.getTime() - 30 * 60 * 1000);

      console.log(`Searching for logs since ${lookBackTime.toISOString()}`);

      const logsToSend = await Log.find({
        createdAt: { $gte: lookBackTime, $lt: now },
      });

      if (logsToSend.length === 0) {
        console.log("No logs found to send.");
        return;
      }

      const cleanedLogsData = logsToSend.map((log) => ({
        _id: log._id.toString(),
        level: log.level,
        message: log.message,
        timestamp: log.createdAt.toISOString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(cleanedLogsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

      const filePath = path.join(__dirname, "logs_temp.xlsx");
      XLSX.writeFile(workbook, filePath);

      const fileContent = fs.readFileSync(filePath).toString("base64");

      const adminUsers = await User.find({ role: "Admin" });
      const adminEmails = adminUsers.map((user) => user.email);

      if (adminEmails.length > 0) {
        await sendEmail({
          to: adminEmails,
          subject: "System Logs Report",
          template: "logs/logs-report",
          data: {},
          attachments: [
            {
              name: "system_logs.xlsx",
              contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              contentInBase64: fileContent,
            },
          ],
        });
      }

      fs.unlinkSync(filePath);
      await Log.deleteMany({
        createdAt: { $gte: lookBackTime, $lt: now },
      });
      console.log("Logs email sent and logs converted/deleted.");

    } catch (error) {
      console.error("Error in sendLogsEmail:", error);
    }
  }

  async checkMissingCheckIn() {
    if (!this.isWorkingDay()) return;

    try {
      const startOfDay = moment().tz("America/New_York").startOf('day').toDate();
      const endOfDay = moment().tz("America/New_York").endOf('day').toDate();

      const users = await User.find({ empStatus: "Active", role: { $ne: "SuperAdmin" } });

      for (const user of users) {
        const attendance = await TimeTracker.findOne({
          user: user._id,
          date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!attendance || !attendance.checkInTime) {
          await sendEmail({
            to: user.email,
            subject: "Reminder: Please Check In",
            template: "attendance/no-checkin",
            data: {
              name: user.name,
              date: moment().format("MMMM Do, YYYY")
            }
          });
          console.log(`Sent missing check-in email to ${user.email}`);
        }
      }
    } catch (error) {
      console.error("Error in checkMissingCheckIn:", error);
    }
  }

  async checkMissingCheckout() {
    if (!this.isWorkingDay()) return;

    try {
      const startOfDay = moment().tz("America/New_York").startOf('day').toDate();
      const endOfDay = moment().tz("America/New_York").endOf('day').toDate();

      const trackers = await TimeTracker.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        checkInTime: { $exists: true },
        checkOutTime: { $exists: false }
      }).populate('user');

      for (const tracker of trackers) {
        if (tracker.user) {
          await sendEmail({
            to: tracker.user.email,
            subject: "Reminder: You forgot to Checkout",
            template: "attendance/no-checkout",
            data: {
              name: tracker.user.name,
              date: moment().format("MMMM Do, YYYY")
            }
          });
          console.log(`Sent missing checkout email to ${tracker.user.email}`);
        }
      }
    } catch (error) {
      console.error("Error in checkMissingCheckout:", error);
    }
  }

  async checkMissingTimesheet() {
    try {
      const startOfWeek = moment().tz("America/New_York").startOf('week').toDate();
      const endOfWeek = moment().tz("America/New_York").endOf('week').toDate();

      const users = await User.find({ empStatus: "Active" });

      for (const user of users) {
        const timesheet = await Timesheet.findOne({
          employee: user._id,
          date: { $gte: startOfWeek, $lte: endOfWeek }
        });

        if (!timesheet || timesheet.status === 'Pending') {
          await sendEmail({
            to: user.email,
            subject: "Action Required: Submit Your Weekly Timesheet",
            template: "timesheet/no-timesheet",
            data: {
              name: user.name,
              weekEndingDate: moment(endOfWeek).format("MMMM Do, YYYY")
            }
          });
          console.log(`Sent timesheet reminder to ${user.email}`);
        }
      }
    } catch (error) {
      console.error("Error in checkMissingTimesheet:", error);
    }
  }
}

module.exports = CronJobs;