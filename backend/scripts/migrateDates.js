require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const db = mongoose.connection.db;

    // 1. Migrate Holidays
    console.log('--- Migrating Holidays ---');
    const holidays = await db.collection('holidays').find({}).toArray();
    let holidayCount = 0;
    for (const holiday of holidays) {
      if (holiday.date instanceof Date) {
        // Convert to YYYY-MM-DD
        const dateStr = holiday.date.toISOString().split('T')[0];
        await db.collection('holidays').updateOne(
          { _id: holiday._id },
          { $set: { date: dateStr } }
        );
        holidayCount++;
      }
    }
    console.log(`Migrated ${holidayCount} holidays.`);

    // 2. Migrate LeaveRequests
    console.log('--- Migrating LeaveRequests ---');
    const leaves = await db.collection('leaverequests').find({}).toArray();
    let leaveCount = 0;
    for (const leave of leaves) {
      const updates = {};
      if (leave.startDate instanceof Date) {
        updates.startDate = leave.startDate.toISOString().split('T')[0];
      }
      if (leave.endDate instanceof Date) {
        updates.endDate = leave.endDate.toISOString().split('T')[0];
      }
      
      if (Object.keys(updates).length > 0) {
        await db.collection('leaverequests').updateOne(
          { _id: leave._id },
          { $set: updates }
        );
        leaveCount++;
      }
    }
    console.log(`Migrated ${leaveCount} leave requests.`);

    // 3. Migrate User.leaveHistory
    console.log('--- Migrating User leaveHistory ---');
    const users = await db.collection('users').find({ 'leaveHistory.0': { $exists: true } }).toArray();
    let userCount = 0;
    for (const user of users) {
      if (user.leaveHistory && Array.isArray(user.leaveHistory)) {
        let changed = false;
        const newHistory = user.leaveHistory.map(hist => {
          if (hist.startDate instanceof Date) {
            hist.startDate = hist.startDate.toISOString().split('T')[0];
            changed = true;
          }
          if (hist.endDate instanceof Date) {
            hist.endDate = hist.endDate.toISOString().split('T')[0];
            changed = true;
          }
          return hist;
        });

        if (changed) {
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { leaveHistory: newHistory } }
          );
          userCount++;
        }
      }
    }
    console.log(`Migrated leave history for ${userCount} users.`);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
