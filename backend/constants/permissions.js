const PERMISSIONS = {
  // USER MANAGEMENT
  'users:read':          ['superadmin', 'admin', 'hr', 'globalreader'],
  'users:create':        ['superadmin', 'admin', 'hr'],
  'users:update':        ['superadmin', 'admin', 'hr'],
  'users:delete':        ['superadmin'],
  'users:manage_roles':  ['superadmin', 'admin'],
  
  // ATTENDANCE
  'attendance:read:own':   ['*'],
  'attendance:read:team':  ['manager', 'superadmin', 'admin', 'hr', 'globalreader'],
  'attendance:read:all':   ['superadmin', 'admin', 'hr', 'globalreader'],
  'attendance:edit':       ['superadmin', 'admin', 'hr'],
  
  // TIMESHEETS
  'timesheets:read:own':   ['*'],
  'timesheets:read:team':  ['manager', 'superadmin', 'admin', 'globalreader'],
  'timesheets:read:all':   ['superadmin', 'admin', 'globalreader'],
  'timesheets:approve':    ['superadmin', 'admin', 'manager'],
  
  // EXPENSES
  'expenses:read:own':     ['*'],
  'expenses:read:team':    ['manager', 'superadmin', 'admin', 'hr', 'globalreader'],
  'expenses:read:all':     ['superadmin', 'admin', 'globalreader'],
  'expenses:approve':      ['superadmin', 'admin', 'manager'],
  
  // LEAVES
  'leaves:read:own':       ['*'],
  'leaves:read:team':      ['manager', 'superadmin', 'admin', 'hr', 'globalreader'],
  'leaves:read:all':       ['superadmin', 'admin', 'hr', 'globalreader'],
  'leaves:approve':        ['superadmin', 'admin', 'hr', 'manager'],
  
  // PAYROLL
  'payroll:read':          ['superadmin', 'admin', 'hr', 'globalreader'],
  'payroll:manage':        ['superadmin', 'admin', 'hr'],
  
  // TENANT
  'tenant:read':           ['superadmin', 'globalreader'],
  'tenant:manage':         ['superadmin'],
  
  // TICKETING
  'tickets:read:own':      ['*'],
  'tickets:read:team':     ['manager', 'superadmin', 'admin', 'globalreader'],
  'tickets:read:all':      ['superadmin', 'admin', 'globalreader'],
  'tickets:create':        ['*'],
  'tickets:assign':        ['superadmin', 'admin'],
  'tickets:edit':          ['superadmin', 'admin'],
  'tickets:manage_status': ['superadmin', 'admin', 'manager'],
  
  // PROJECTS / TASKS
  'projects:read:own':     ['*'],
  'projects:read:all':     ['superadmin', 'admin', 'globalreader'],
  'projects:manage':       ['superadmin', 'admin', 'manager'],
  
  // DOCUMENTS / FILES
  'files:read:all':        ['superadmin', 'admin', 'globalreader'],
  'files:manage':          ['superadmin', 'admin']
};

module.exports = PERMISSIONS;
