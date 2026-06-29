const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const TimeTracker = require('./models/timeTrackerSchema');
  const logs = await TimeTracker.find({ user: '69cfcd024cfc1b489b7865ea', totalHours: 5 }).sort({_id: -1}).limit(5);
  console.log(JSON.stringify(logs, null, 2));
  process.exit(0);
});
