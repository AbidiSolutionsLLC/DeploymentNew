const { EMAIL_WRAP, HEADER, TITLE, DETAILS_TABLE, NOTE_BOX, CTA, FOOTER } = require('./components');

const ticketColors = {
  created: { statusColor: '#B45309', statusBg: '#FFFBEB', statusBorder: '#FDE68A' },
  inProgress: { statusColor: '#B45309', statusBg: '#FFFBEB', statusBorder: '#FDE68A' },
  resolved: { statusColor: '#166534', statusBg: '#F0FDF4', statusBorder: '#BBF7D0' }
};

function ticketCreated(d) {
  let html = HEADER('KARBEXA', d.status, ticketColors.created.statusColor, ticketColors.created.statusBg, ticketColors.created.statusBorder);
  html += TITLE('New support ticket created', d.subject);
  html += DETAILS_TABLE([
    { label: 'Ticket ID', value: d.ticketId },
    { label: 'Priority', value: d.priority },
    { label: 'Raised By', value: d.raisedBy },
    { label: 'Assigned To', value: d.assignedTo || 'Unassigned' },
    { label: 'Created', value: d.createdDate }
  ]);
  if (d.description) html += NOTE_BOX('Description', d.description);
  if (d.latestUpdate) html += NOTE_BOX('Latest Update', d.latestUpdate, '#FFFBEB', '#FDE68A');
  html += CTA('Manage Ticket', d.actionUrl);
  html += FOOTER(d.ticketId);
  return EMAIL_WRAP(html, 'New Support Ticket');
}

function ticketInProgress(d) {
  let html = HEADER('KARBEXA', d.status, ticketColors.inProgress.statusColor, ticketColors.inProgress.statusBg, ticketColors.inProgress.statusBorder);
  html += TITLE('Ticket update: ' + d.ticketId, d.subject);
  html += DETAILS_TABLE([
    { label: 'Ticket ID', value: d.ticketId },
    { label: 'Priority', value: d.priority },
    { label: 'Raised By', value: d.raisedBy },
    { label: 'Assigned To', value: d.assignedTo },
    { label: 'Created', value: d.createdDate }
  ]);
  if (d.description) html += NOTE_BOX('Description', d.description);
  if (d.latestUpdate) html += NOTE_BOX('Latest Update', d.latestUpdate, '#FFFBEB', '#FDE68A');
  html += CTA('View Ticket', d.actionUrl);
  html += FOOTER(d.ticketId);
  return EMAIL_WRAP(html, 'Ticket In Progress');
}

function ticketResolved(d) {
  let html = HEADER('KARBEXA', d.status, ticketColors.resolved.statusColor, ticketColors.resolved.statusBg, ticketColors.resolved.statusBorder);
  html += TITLE('Ticket resolved: ' + d.ticketId, d.subject);
  html += DETAILS_TABLE([
    { label: 'Ticket ID', value: d.ticketId },
    { label: 'Priority', value: d.priority },
    { label: 'Raised By', value: d.raisedBy },
    { label: 'Assigned To', value: d.assignedTo },
    { label: 'Created', value: d.createdDate },
    { label: 'Resolved', value: d.resolvedDate || 'N/A' }
  ]);
  if (d.description) html += NOTE_BOX('Description', d.description);
  if (d.latestUpdate) html += NOTE_BOX('Resolution', d.latestUpdate, '#F0FDF4', '#BBF7D0');
  html += CTA('View Ticket', d.actionUrl);
  html += FOOTER(d.ticketId);
  return EMAIL_WRAP(html, 'Ticket Resolved');
}

module.exports = {
  ticketCreated,
  ticketInProgress,
  ticketResolved
};
