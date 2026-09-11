const mongoose = require('mongoose');
const TimeTracker = require('./models/timeTrackerSchema');

const MONGODB_URI = "mongodb+srv://AbbasAdil:m4y6_EuQpB7iFcH@hrportal.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000";

// --- Configuration ---
const USER_ID = 'REPLACE_WITH_USER_ID';
const COMPANY_ID = 'REPLACE_WITH_COMPANY_ID';
const TARGET_DATE_STR = '2026-08-15'; // YYYY-MM-DD format
const CHECK_IN_TIME_STR = '2026-08-15T09:00:00-04:00'; 
const CHECK_OUT_TIME_STR = '2026-08-15T18:00:00-04:00'; // Set to null if not checking out
const STATUS = 'Present'; // 'Present', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Weekend'
const NOTES = 'Added via template script';
// ---------------------

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('Connected to DB. Adding/updating attendance...');
  
  const targetDate = new Date(TARGET_DATE_STR);
  targetDate.setUTCHours(0, 0, 0, 0);

  const checkInTime = CHECK_IN_TIME_STR ? new Date(CHECK_IN_TIME_STR) : null;
  const checkOutTime = CHECK_OUT_TIME_STR ? new Date(CHECK_OUT_TIME_STR) : null;
  
  let totalHours = 0;
  if (checkInTime && checkOutTime) {
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    totalHours = diffMs / (1000 * 60 * 60);
  }

  let tracker = await TimeTracker.findOne({ user: USER_ID, date: targetDate });
  
  if (tracker) {
    console.log('Attendance record exists. Updating...');
    tracker.checkInTime = checkInTime || tracker.checkInTime;
    tracker.checkOutTime = checkOutTime || tracker.checkOutTime;
    if (checkInTime && checkOutTime) {
      tracker.totalHours = totalHours;
    }
    tracker.status = STATUS;
    tracker.notes = NOTES;
    await tracker.save();
    console.log('Successfully updated attendance:', tracker);
  } else {
    console.log('No attendance record found. Creating new...');
    tracker = new TimeTracker({
      user: USER_ID,
      company: COMPANY_ID,
      date: targetDate,
      checkInTime,
      checkOutTime,
      totalHours,
      status: STATUS,
      notes: NOTES
    });
    await tracker.save();
    console.log('Successfully created attendance:', tracker);
  }
  
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
