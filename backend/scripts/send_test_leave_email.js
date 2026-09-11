const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/userSchema');
const Department = require('../models/department');
const leaveService = require('../services/leaveService');
const sendEmail = require('../utils/emailService');
const { moment, TIMEZONE, calculateBusinessDays } = require('../utils/dateUtils');

async function run() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected.');

  // Find a real user in the database to use authentic data
  let user = await User.findOne({ email: 'tsaleem@abidisolutions.com' }).populate('department');
  if (!user) {
    user = await User.findOne({ empStatus: 'Active' }).populate('department');
  }
  if (!user) {
    user = await User.findOne({}).populate('department');
  }

  console.log('👤 Using Employee for Test Email:', {
    name: user?.name,
    email: user?.email,
    role: user?.role,
    designation: user?.designation,
    department: user?.department?.name,
    empID: user?.empID
  });

  // Target test recipient
  const targetEmail = 'tsaleem@abidisolutions.com';

  // Construct a realistic Leave Request object (e.g. 3 business days starting next Monday)
  const now = moment().tz(TIMEZONE);
  const nextMonday = now.clone().add(1, 'week').startOf('isoWeek'); // Next Monday
  const nextWednesday = nextMonday.clone().add(2, 'days'); // Next Wednesday (3 days: Mon, Tue, Wed)

  const testLeaveRequest = {
    _id: new mongoose.Types.ObjectId(),
    employee: user ? user._id : new mongoose.Types.ObjectId(),
    employeeName: user?.name || 'Tayyab Saleem',
    email: user?.email || 'tsaleem@abidisolutions.com',
    leaveType: 'PTO',
    startDate: nextMonday.toDate(),
    endDate: nextWednesday.toDate(),
    reason: 'Attending annual family commitment and out-of-town travel. All current project sprint deliverables are handed over to the team.',
    status: 'Pending',
    appliedAt: new Date()
  };

  console.log('📅 Leave Request Dates:', {
    startDate: moment(testLeaveRequest.startDate).format('YYYY-MM-DD (dddd)'),
    endDate: moment(testLeaveRequest.endDate).format('YYYY-MM-DD (dddd)'),
    businessDays: calculateBusinessDays(testLeaveRequest.startDate, testLeaveRequest.endDate)
  });

  const subject = `[TEST] New Leave Request: ${testLeaveRequest.employeeName} - ${testLeaveRequest.leaveType}`;
  const htmlContent = leaveService.generateLeaveCreationEmailTemplate(testLeaveRequest, user);

  console.log(`📨 Sending email to ${targetEmail}...`);
  const result = await sendEmail(targetEmail, subject, htmlContent);

  if (result.success) {
    console.log(`🎉 SUCCESS! Leave notification email sent to ${targetEmail}`);
  } else {
    console.error('❌ FAILED to send email:', result.error);
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected from DB.');
  process.exit(0);
}

run().catch((err) => {
  console.error('💥 Execution Error:', err);
  process.exit(1);
});
