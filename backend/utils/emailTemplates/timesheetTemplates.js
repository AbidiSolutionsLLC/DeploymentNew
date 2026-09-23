const { EMAIL_WRAP, HEADER, TITLE, DETAILS_TABLE, NOTE_BOX, CTA, FOOTER } = require('./components');

const statusColors = {
  pending: { statusColor: '#B45309', statusBg: '#FFFBEB', statusBorder: '#FDE68A' },
  approved: { statusColor: '#166534', statusBg: '#F0FDF4', statusBorder: '#BBF7D0' },
  rejected: { statusColor: '#DC2626', statusBg: '#FEF2F2', statusBorder: '#FECACA' }
};

function timesheetSubmitted(d) {
  let html = HEADER('ABIDI PRO', 'Pending', statusColors.pending.statusColor, statusColors.pending.statusBg, statusColors.pending.statusBorder);
  html += TITLE('Timesheet submitted', `${d.employeeName} has submitted a timesheet for review.`);
  html += DETAILS_TABLE([
    { label: 'Employee', value: d.employeeName },
    { label: 'Period', value: `${d.periodStart} to ${d.periodEnd}` },
    { label: 'Total Hours', value: d.totalHours }
  ]);
  html += CTA('Review Timesheet', d.actionUrl);
  html += FOOTER(d.refId || Date.now().toString(36).toUpperCase());
  return EMAIL_WRAP(html, 'Timesheet Submitted');
}

function timesheetStatusUpdated(d) {
  const isApproved = d.status === 'Approved';
  let colors = isApproved ? statusColors.approved : statusColors.rejected;

  let html = HEADER('ABIDI PRO', d.status, colors.statusColor, colors.statusBg, colors.statusBorder);
  html += TITLE(`Timesheet ${d.status.toLowerCase()}`, `Your timesheet for ${d.periodStart} to ${d.periodEnd} has been ${d.status.toLowerCase()}.`);
  html += DETAILS_TABLE([
    { label: 'Period', value: `${d.periodStart} to ${d.periodEnd}` },
    { label: 'Total Hours', value: d.totalHours }
  ]);
  
  if (d.note) {
    const noteBg = isApproved ? '#F0FDF4' : '#FEF2F2';
    const noteBorder = isApproved ? '#BBF7D0' : '#FECACA';
    html += NOTE_BOX('Reviewer Note', d.note, noteBg, noteBorder);
  }
  
  html += CTA('View Timesheet', d.actionUrl);
  html += FOOTER(d.refId || Date.now().toString(36).toUpperCase());
  return EMAIL_WRAP(html, `Timesheet ${d.status}`);
}

module.exports = {
  timesheetSubmitted,
  timesheetStatusUpdated
};
