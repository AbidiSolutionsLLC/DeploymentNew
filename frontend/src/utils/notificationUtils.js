/**
 * Map notification types to emoji icons for display in the UI.
 */
export const getNotificationIcon = (type) => {
  const icons = {
    LEAVE_APPROVED:           '✅',
    LEAVE_REJECTED:           '❌',
    LEAVE_REQUEST_SUBMITTED:  '📋',
    TASK_ASSIGNED:            '📌',
    TASK_STATUS_CHANGED:      '🔄',
    TASK_DUE_SOON:            '⏰',
    TASK_OVERDUE:             '🚨',
    TIMESHEET_APPROVED:       '✅',
    TIMESHEET_REJECTED:       '❌',
    TIMESHEET_SUBMITTED:      '⏱️',
    TICKET_RESPONSE_ADDED:    '💬',
    TICKET_STATUS_CHANGED:    '🎫',
    TICKET_ASSIGNED:          '🎫',
    PROJECT_MEMBER_ADDED:     '🗂️',
    PROJECT_CREATED:          '🚀',
    PROJECT_STATUS_UPDATED:   '📊',
    PROJECT_DELETED:          '🗑️',
    TASK_BLOCKED:             '🛑',
    TASK_DELETED:             '🗑️',
    TASK_UPDATED:             '📝',
    TICKET_CREATED:           '🆕',
    TICKET_CLOSED:            '✅',
    TICKET_DELETED:           '🗑️',
    DEPARTMENT_MEMBER_ADDED:  '🏢',
    COMPANY_UPDATED:          '⚙️',
    USER_CREATED:             '👤',
    USER_DEACTIVATED:         '🚫',
  };
  return icons[type] || '🔔';
};

/**
 * Map a notification's relatedEntity to a navigation route.
 * Returns null if no route is applicable.
 */
export const getRouteForNotification = (notif) => {
  if (!notif?.relatedEntity?.entityType || !notif?.relatedEntity?.entityId) return null;
  const { entityType, entityId } = notif.relatedEntity;

  const routes = {
    leave:       `/leave/summary`,
    task:        `/project/projectDashboard`,
    timetracker: `/people/timetracker`,
    ticket:      `/people/raise`,
    project:     `/project/projects`,
    user:        `/admin/userManagement`,
    department:  `/people/org-chart`,
    company:     `/admin/adminDashboard`,
  };

  return routes[entityType] || null;
};

/**
 * Format a notification date string for display.
 */
export const formatNotifDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
