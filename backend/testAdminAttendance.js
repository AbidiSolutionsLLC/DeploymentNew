const mongoose = require('mongoose');
const timeTrackerService = require('./services/timeTrackerService');
const User = require('./models/userSchema');
require('./models/department');
require('./models/timeTrackerSchema');

require('dotenv').config({ path: './.env' });
mongoose.connect(process.env.MONGODB_URI);

async function test() {
  const superadmin = await User.findOne({ role: 'Super Admin' });
  const result = await timeTrackerService.getAdminAttendanceSummary(superadmin, '2026-09-15');
  console.log('Present count:', result.counts.present);
  console.log('Absent count:', result.counts.absent);
  console.log('Present users:', result.present.map(p => p.user.name));
  process.exit();
}
test();
