const mongoose = require('mongoose');
const TimeTracker = require('./models/timeTrackerSchema');
const Timesheet = require('./models/timesheetSchema');

const MONGODB_URI = 'mongodb+srv://AbbasAdil:m4y6_EuQpB7iFcH@hrportal.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000';

mongoose.connect(MONGODB_URI).then(async () => {
  const userId = '69c1a6624d052404b38cf35a';
  const start = new Date('2026-08-12T00:00:00.000Z');
  const end = new Date('2026-08-16T00:00:00.000Z');

  const trackers = await TimeTracker.find({ user: userId, date: { $gte: start, $lte: end } });
  const timesheets = await Timesheet.find({ employee: userId, date: { $gte: start, $lte: end } });

  console.log('TimeTrackers:', JSON.stringify(trackers, null, 2));
  console.log('Timesheets:', JSON.stringify(timesheets, null, 2));
  
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
