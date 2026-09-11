const mongoose = require('mongoose');
const Timesheet = require('./models/timesheetSchema');

const MONGODB_URI = "mongodb+srv://AbbasAdil:m4y6_EuQpB7iFcH@hrportal.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000";

// --- Configuration ---
const USER_ID = 'REPLACE_WITH_USER_ID';
const COMPANY_ID = 'REPLACE_WITH_COMPANY_ID';
const EMPLOYEE_NAME = 'REPLACE_WITH_EMPLOYEE_NAME';
const TARGET_DATE_STR = '2026-08-15'; // YYYY-MM-DD format
const SUBMITTED_HOURS = 8;
const DESCRIPTION = 'Worked on backend tasks.';
const STATUS = 'Approved'; // 'Pending', 'Approved', 'Rejected'
// ---------------------

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('Connected to DB. Adding/updating timesheet...');
  
  const targetDate = new Date(TARGET_DATE_STR);
  targetDate.setUTCHours(0, 0, 0, 0);

  let timesheet = await Timesheet.findOne({ employee: USER_ID, date: targetDate });
  
  if (timesheet) {
    console.log('Timesheet record exists. Updating...');
    timesheet.description = DESCRIPTION;
    timesheet.submittedHours = SUBMITTED_HOURS;
    timesheet.status = STATUS;
    if (STATUS === 'Approved') {
        timesheet.approvedHours = SUBMITTED_HOURS;
    }
    await timesheet.save();
    console.log('Successfully updated timesheet:', timesheet);
  } else {
    console.log('No timesheet record found. Creating new...');
    timesheet = new Timesheet({
      name: 'Timesheet Entry', // Assuming this is generic or can be adapted
      description: DESCRIPTION,
      employee: USER_ID,
      employeeName: EMPLOYEE_NAME,
      company: COMPANY_ID,
      date: targetDate,
      submittedHours: SUBMITTED_HOURS,
      approvedHours: STATUS === 'Approved' ? SUBMITTED_HOURS : 0,
      status: STATUS
    });
    await timesheet.save();
    console.log('Successfully created timesheet:', timesheet);
  }
  
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
