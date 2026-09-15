const fs = require('fs');
const path = 'backend/services/leaveService.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/const start = moment\.utc\(startDate\)\.startOf\('day'\)\.tz\(TIMEZONE,\s*true\)\.startOf\('day'\);/g, "const start = moment.utc(startDate, 'YYYY-MM-DD').startOf('day');");
c = c.replace(/const end = moment\.utc\(endDate\)\.startOf\('day'\)\.tz\(TIMEZONE,\s*true\)\.startOf\('day'\);/g, "const end = moment.utc(endDate, 'YYYY-MM-DD').startOf('day');");

c = c.replace(/const start = moment\.utc\(leaveRequest\.startDate\)\.startOf\('day'\)\.tz\(TIMEZONE,\s*true\)\.startOf\('day'\);/g, "const start = moment.utc(leaveRequest.startDate, 'YYYY-MM-DD').startOf('day');");
c = c.replace(/const end = moment\.utc\(leaveRequest\.endDate\)\.startOf\('day'\)\.tz\(TIMEZONE,\s*true\)\.startOf\('day'\);/g, "const end = moment.utc(leaveRequest.endDate, 'YYYY-MM-DD').startOf('day');");

c = c.replace(/const startDateObj = moment\.utc\(leaveRequest\.startDate\)\.tz\(TIMEZONE,\s*true\);/g, "const startDateObj = moment.utc(leaveRequest.startDate, 'YYYY-MM-DD');");
c = c.replace(/const endDateObj = moment\.utc\(leaveRequest\.endDate\)\.tz\(TIMEZONE,\s*true\);/g, "const endDateObj = moment.utc(leaveRequest.endDate, 'YYYY-MM-DD');");

c = c.replace(/let nextWorkDay = moment\.utc\(leaveRequest\.endDate\)\.tz\(TIMEZONE,\s*true\)\.add\(1, 'day'\);/g, "let nextWorkDay = moment.utc(leaveRequest.endDate, 'YYYY-MM-DD').add(1, 'day');");

fs.writeFileSync(path, c);
console.log('Fixed leaveService.js');
