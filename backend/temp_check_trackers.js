const mongoose = require('mongoose');
require('dotenv').config();

const TimeTracker = require('./models/timeTrackerSchema.js');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  
  const userId = "6aa16ea166b571ff2fa1f314";
  
  const trackers = await TimeTracker.find({ 
    user: userId,
    date: { 
      $gte: new Date('2026-09-01T00:00:00Z'),
      $lt: new Date('2026-09-12T00:00:00Z')
    }
  }).sort({ date: 1 });
  
  trackers.forEach(t => {
    console.log(`Date Field: ${t.date.toISOString()}`);
    console.log(`CheckIn: ${t.checkInTime ? t.checkInTime.toISOString() : 'none'}`);
    console.log(`CheckOut: ${t.checkOutTime ? t.checkOutTime.toISOString() : 'none'}`);
    console.log('---');
  });
  
  process.exit();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
