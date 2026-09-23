const mongoose = require('mongoose');
const Leave = require('./models/leaveRequestSchema.js');
const User = require('./models/userSchema.js');
require('dotenv').config();

const parseISOToLocalDate = (dateString) => {
  if (!dateString) return new Date();
  const datePart = dateString.split('T')[0];
  if (datePart.includes('-')) {
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
};

const formatDisplayDate = (dateString, options = {}) => {
  if (!dateString) return '-';
  const dateObj = parseISOToLocalDate(dateString);
  return dateObj.toLocaleDateString('en-US', options);
};

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const leaves = await Leave.find().limit(5);
  console.log('--- LEAVE REQUESTS ---');
  leaves.forEach(l => {
    console.log('startDate:', l.startDate, ' => ', formatDisplayDate(l.startDate));
    console.log('endDate:', l.endDate, ' => ', formatDisplayDate(l.endDate));
  });

  const users = await User.find({ 'leaveHistory.0': { $exists: true } }).limit(2);
  console.log('--- USER LEAVE HISTORY ---');
  users.forEach(u => {
    u.leaveHistory.forEach(lh => {
      console.log('startDate:', lh.startDate, ' => ', formatDisplayDate(lh.startDate));
      console.log('endDate:', lh.endDate, ' => ', formatDisplayDate(lh.endDate));
    });
  });
  
  process.exit(0);
});
