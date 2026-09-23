const { EMAIL_WRAP, HEADER, TITLE, DETAILS_TABLE, NOTE_BOX, CTA, FOOTER } = require('./components');

const statusColors = {
  pending: { statusColor: '#B45309', statusBg: '#FFFBEB', statusBorder: '#FDE68A' },
  approved: { statusColor: '#166534', statusBg: '#F0FDF4', statusBorder: '#BBF7D0' },
  rejected: { statusColor: '#DC2626', statusBg: '#FEF2F2', statusBorder: '#FECACA' }
};

function leaveSubmitted(d) {
  let html = HEADER('ABIDI PRO', 'Pending', statusColors.pending.statusColor, statusColors.pending.statusBg, statusColors.pending.statusBorder);
  html += TITLE('New leave request submitted', `Requested by ${d.employeeName} for ${d.leaveType} leave.`);
  html += DETAILS_TABLE([
    { label: 'Employee', value: d.employeeName },
    { label: 'Leave Type', value: d.leaveType },
    { label: 'Duration', value: `${d.startDate} to ${d.endDate} (${d.days} days)` },
    { label: 'Submitted', value: d.submittedDate }
  ]);
  if (d.reason) html += NOTE_BOX('Reason', d.reason);
  html += CTA('Review Leave Request', d.actionUrl);
  html += FOOTER(d.refId || Date.now().toString(36).toUpperCase());
  return EMAIL_WRAP(html, 'Leave Request Submitted');
}

function leaveApproved(d) {
  let html = HEADER('ABIDI PRO', 'Approved', statusColors.approved.statusColor, statusColors.approved.statusBg, statusColors.approved.statusBorder);
  html += TITLE('Leave request approved', `Your request for ${d.leaveType} leave has been approved.`);
  html += DETAILS_TABLE([
    { label: 'Employee', value: d.employeeName },
    { label: 'Leave Type', value: d.leaveType },
    { label: 'Duration', value: `${d.startDate} to ${d.endDate} (${d.days} days)` }
  ]);
  if (d.note) html += NOTE_BOX('Reviewer Note', d.note, '#F0FDF4', '#BBF7D0');
  html += CTA('View Leave Details', d.actionUrl);
  html += FOOTER(d.refId || Date.now().toString(36).toUpperCase());
  return EMAIL_WRAP(html, 'Leave Request Approved');
}

function leaveRejected(d) {
  let html = HEADER('ABIDI PRO', 'Rejected', statusColors.rejected.statusColor, statusColors.rejected.statusBg, statusColors.rejected.statusBorder);
  html += TITLE('Leave request rejected', `Your request for ${d.leaveType} leave has been rejected.`);
  html += DETAILS_TABLE([
    { label: 'Employee', value: d.employeeName },
    { label: 'Leave Type', value: d.leaveType },
    { label: 'Duration', value: `${d.startDate} to ${d.endDate} (${d.days} days)` }
  ]);
  if (d.note) html += NOTE_BOX('Reason for Rejection', d.note, '#FEF2F2', '#FECACA');
  html += CTA('View Leave Details', d.actionUrl);
  html += FOOTER(d.refId || Date.now().toString(36).toUpperCase());
  return EMAIL_WRAP(html, 'Leave Request Rejected');
}

function leaveResponseAdded(d) {
  let html = HEADER('ABIDI PRO');
  html += TITLE('New comment on leave request', `${d.authorName} added a response to your leave request.`);
  html += DETAILS_TABLE([
    { label: 'Employee', value: d.employeeName },
    { label: 'Leave Type', value: d.leaveType },
    { label: 'Author', value: d.authorName }
  ]);
  html += NOTE_BOX('Response', d.content, '#FFFBEB', '#FDE68A');
  html += CTA('Reply in Portal', d.actionUrl);
  html += FOOTER(d.refId || Date.now().toString(36).toUpperCase());
  return EMAIL_WRAP(html, 'New Response on Leave Request');
}

module.exports = {
  leaveSubmitted,
  leaveApproved,
  leaveRejected,
  leaveResponseAdded
};
