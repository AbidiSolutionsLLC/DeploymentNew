const mongoose = require('mongoose');
require('dotenv').config();

const TimeTracker = require('./models/timeTrackerSchema.js');

async function updateTrackers() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  
  const userId = "6aa16ea166b571ff2fa1f314";
  const companyId = "6a4303dac5168d244c8ba392";

  const updates = [
    {
      dateStr: '2026-09-09',
      dateField: new Date('2026-09-09T04:00:00.000Z'),
      checkIn: new Date('2026-09-09T12:36:00.000Z'),
      checkOut: new Date('2026-09-09T22:15:00.000Z')
    }
  ];

  for (const u of updates) {
    const totalHours = (u.checkOut.getTime() - u.checkIn.getTime()) / 3600000;
    
    const existing = await TimeTracker.findOne({ 
      user: userId, 
      date: u.dateField
    });

    if (existing) {
      existing.checkInTime = u.checkIn;
      existing.checkOutTime = u.checkOut;
      existing.totalHours = totalHours;
      existing.status = 'Present';
      // Ensure company is set!
      if (!existing.company) {
          existing.company = companyId;
      }
      await existing.save();
      console.log(`Updated ${u.dateStr}`);
    } else {
      await TimeTracker.create({
        user: userId,
        company: companyId,
        date: u.dateField,
        checkInTime: u.checkIn,
        checkOutTime: u.checkOut,
        totalHours: totalHours,
        status: 'Present'
      });
      console.log(`Created ${u.dateStr}`);
    }
  }

  // Double check the results
  const updatedTrackers = await TimeTracker.find({ 
    user: userId,
    date: { 
      $gte: new Date('2026-09-01T00:00:00Z'),
      $lt: new Date('2026-09-12T00:00:00Z')
    }
  }).sort({ date: 1 });
  
  updatedTrackers.forEach(t => {
    console.log(`Date Field: ${t.date.toISOString()}`);
    console.log(`CheckIn: ${t.checkInTime ? t.checkInTime.toISOString() : 'none'}`);
    console.log(`CheckOut: ${t.checkOutTime ? t.checkOutTime.toISOString() : 'none'}`);
    console.log(`TotalHours: ${t.totalHours}`);
    console.log('---');
  });

  process.exit();
}

updateTrackers().catch(err => {
  console.error(err);
  process.exit(1);
});
