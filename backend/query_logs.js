const mongoose = require('mongoose');
async function run() {
  await mongoose.connect('mongodb+srv://AbbasAdil:m4y6_EuQpB7iFcH@hrportal.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000');
  const db = mongoose.connection.db;
  const start = new Date('2026-09-09T00:00:00Z');
  const end = new Date('2026-09-12T00:00:00Z');
  const logs = await db.collection('timelogs').find({ date: { $gte: start, $lt: end } }).toArray();
  const users = await db.collection('users').find({ _id: { $in: logs.map(l => l.employee) } }).toArray();
  const userMap = {};
  users.forEach(u => userMap[u._id.toString()] = u.name);

  logs.forEach(log => {
      console.log(`Log Date: ${log.date.toISOString()} | User: ${userMap[log.employee.toString()]} | Job: ${log.job} | Hours: ${log.hours} | isAddedToTimesheet: ${log.isAddedToTimesheet}`);
  });
  console.log(`Total logs found between Sept 9 and Sept 11: ${logs.length}`);
  process.exit(0);
}
run().catch(console.error);
