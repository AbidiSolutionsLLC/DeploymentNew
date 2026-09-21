const ticketTemplates = require('./ticketTemplates');
const authTemplates = require('./authTemplates');
const leaveTemplates = require('./leaveTemplates');
const expenseTemplates = require('./expenseTemplates');
const timesheetTemplates = require('./timesheetTemplates');
const payrollTemplates = require('./payrollTemplates');

module.exports = {
  ...ticketTemplates,
  ...authTemplates,
  ...leaveTemplates,
  ...expenseTemplates,
  ...timesheetTemplates,
  ...payrollTemplates
};
