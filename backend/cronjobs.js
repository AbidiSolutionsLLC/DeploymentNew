const cron = require('node-cron');
const TimeTracker = require("./models/timeTrackerSchema");

class CronJobs {
  constructor() {
    this.init();
  }

  init() {
    // Run every 30 minutes to catch 12h expirations frequently
    cron.schedule('*/30 * * * *', this.handleAbandonedSessions.bind(this));
    console.log('Cron jobs initialized: Checking for abandoned sessions every 30 mins.');
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
      console.error('CRON ERROR:', error);
    }
  }
}

module.exports = CronJobs;