const mongoose = require('mongoose');
const TimeTracker = require('./models/timeTrackerSchema');
const Timesheet = require('./models/timesheetSchema');

const MONGODB_URI = 'mongodb+srv://AbbasAdil:m4y6_EuQpB7iFcH@hrportal.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000';

mongoose.connect(MONGODB_URI).then(async () => {
  const userId = '69c1a6624d052404b38cf35a';
  
  const trackers = await TimeTracker.find({ user: userId });
  const timesheets = await Timesheet.find({ employee: userId });

  console.log('TimeTrackers:', JSON.stringify(trackers.map(t => ({ id: t._id, date: t.date, totalHours: t.totalHours, checkIn: t.checkInTime, checkOut: t.checkOutTime, status: t.status })), null, 2));
  console.log('Timesheets:', JSON.stringify(timesheets.map(ts => ({ id: ts._id, date: ts.date, submittedHours: ts.submittedHours, approvedHours: ts.approvedHours, status: ts.status })), null, 2));
  
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
