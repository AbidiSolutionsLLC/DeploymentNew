const mongoose = require('mongoose');
const TimeTracker = require('./models/timeTrackerSchema');
const Timesheet = require('./models/timesheetSchema');
const User = require('./models/userSchema');

const MONGODB_URI = "mongodb+srv://AbbasAdil:m4y6_EuQpB7iFcH@hrportal.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000";

mongoose.connect(MONGODB_URI).then(async () => {
  const userId = '69c1a6624d052404b38cf35a';
  const dates = [
    {
      date: new Date('2026-08-13T04:00:00.000Z'),
      checkIn: new Date('2026-08-13T13:00:00.000Z'),
      checkOut: new Date('2026-08-13T22:00:00.000Z')
    },
    {
      date: new Date('2026-08-14T04:00:00.000Z'),
      checkIn: new Date('2026-08-14T13:00:00.000Z'),
      checkOut: new Date('2026-08-14T22:00:00.000Z')
    }
  ];

  const user = await User.findById(userId);
  let userName = user ? user.name : 'Unknown';
  let defaultCompany = user && user.company ? user.company : '661bc5a58728b746bb567958'; // common fallback

  for (const d of dates) {
    let tracker = await TimeTracker.findOne({ user: userId, date: d.date });
    let companyId = tracker && tracker.company ? tracker.company : defaultCompany;
    
    if (tracker) {
      if (!tracker.company) tracker.company = companyId;
      tracker.checkInTime = d.checkIn;
      tracker.checkOutTime = d.checkOut;
      tracker.totalHours = 9;
      tracker.status = 'Present';
      tracker.autoCheckedOut = false;
      tracker.notes = '';
      await tracker.save();
      console.log(`Updated TimeTracker for ${d.date}`);
    } else {
      console.log(`No TimeTracker found for ${d.date}`);
    }

    if (companyId) {
      let timesheet = await Timesheet.findOne({ employee: userId, date: d.date });
      if (timesheet) {
        if (!timesheet.company) timesheet.company = companyId;
        timesheet.submittedHours = 9;
        timesheet.approvedHours = 9;
        timesheet.status = 'Approved';
        await timesheet.save();
        console.log(`Updated Timesheet for ${d.date}`);
      } else {
        timesheet = new Timesheet({
          name: 'Regular Working Hours',
          description: 'Updated to 9-6 working hours.',
          employee: userId,
          employeeName: userName,
          company: companyId,
          date: d.date,
          submittedHours: 9,
          approvedHours: 9,
          status: 'Approved'
        });
        await timesheet.save();
        console.log(`Created Timesheet for ${d.date}`);
      }
    }
  }

  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
