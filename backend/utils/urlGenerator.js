const generateActionUrl = (recipientRole, module, actionType = null) => {
  const role = (recipientRole || '').replace(/\s+/g, '').toLowerCase();
  const isAdmin = ['superadmin', 'admin', 'hr', 'globalreader'].includes(role);
  
  const frontendBaseUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
    ? process.env.FRONTEND_URL.replace(/\/+$/, '')
    : 'https://abidipro.abidisolutions.com';

  let path = '';
  
  if (isAdmin) {
    switch (module) {
      case 'timesheet': path = '/admin/approve'; break;
      case 'ticket': path = '/admin/assign-ticket'; break; 
      case 'leave': path = '/admin/leaveTrackerAdmin'; break;
      case 'expense': path = '/admin/ExpenseManagement'; break;
      case 'payroll': path = '/admin/payroll'; break;
      default: path = '/admin/dashboard';
    }
  } else {
    switch (module) {
      case 'timesheet': path = '/people/timetracker'; break; 
      case 'ticket': 
        if (actionType === 'assigned') path = '/people/assigned-tickets';
        else path = '/people/raise';
        break;
      case 'leave': path = '/people/summary'; break;
      case 'expense': path = '/people/home'; break; // Employees might not have an explicit expense view yet
      default: path = '/people/home';
    }
  }
  
  return `${frontendBaseUrl}${path}`;
};

module.exports = { generateActionUrl };
