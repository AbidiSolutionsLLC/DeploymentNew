const mongoose = require('mongoose');
async function run() {
  await mongoose.connect('mongodb+srv://AbbasAdil:m4y6_EuQpB7iFcH@hrportal.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000');
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({name: /Rashid Bashir/i});
  const timesheets = await db.collection('timesheets').find({employee: user._id, description: 'Automatically restored from time logs'}).toArray();
  const logs = await db.collection('timelogs').find({timesheet: {$in: timesheets.map(t => t._id)}}).toArray();
  logs.forEach(l => {
    console.log(`Restored Log Date: ${l.date.toISOString()} | Hours: ${l.hours} | Job: ${l.job}`);
  });
  process.exit(0);
}
run().catch(console.error);
