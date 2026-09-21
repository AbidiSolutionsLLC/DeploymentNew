const { EMAIL_WRAP, HEADER, TITLE, DETAILS_TABLE, NOTE_BOX, CTA, FOOTER } = require('./components');

const statusColors = {
  pending: { statusColor: '#B45309', statusBg: '#FFFBEB', statusBorder: '#FDE68A' },
  approved: { statusColor: '#166534', statusBg: '#F0FDF4', statusBorder: '#BBF7D0' },
  rejected: { statusColor: '#DC2626', statusBg: '#FEF2F2', statusBorder: '#FECACA' },
  reimbursed: { statusColor: '#1E3A8A', statusBg: '#EFF6FF', statusBorder: '#BFDBFE' }
};

function expenseSubmitted(d) {
  let html = HEADER('KARBEXA', 'Pending', statusColors.pending.statusColor, statusColors.pending.statusBg, statusColors.pending.statusBorder);
  html += TITLE('New expense submitted', `${d.employeeName} has submitted an expense for review.`);
  html += DETAILS_TABLE([
    { label: 'Employee', value: d.employeeName },
    { label: 'Expense Title', value: d.title },
    { label: 'Amount', value: d.amount },
    { label: 'Date', value: d.date }
  ]);
  if (d.description) html += NOTE_BOX('Description', d.description);
  html += CTA('Review Expense', d.actionUrl);
  html += FOOTER(d.refId || Date.now().toString(36).toUpperCase());
  return EMAIL_WRAP(html, 'Expense Submitted');
}

function expenseStatusUpdated(d) {
  const isApproved = d.status === 'Approved';
  const isRejected = d.status === 'Rejected';
  const isReimbursed = d.status === 'Reimbursed';
  
  let colors = statusColors.pending;
  if (isApproved) colors = statusColors.approved;
  if (isRejected) colors = statusColors.rejected;
  if (isReimbursed) colors = statusColors.reimbursed;

  let html = HEADER('KARBEXA', d.status, colors.statusColor, colors.statusBg, colors.statusBorder);
  html += TITLE(`Expense ${d.status.toLowerCase()}`, `Your expense "${d.title}" has been ${d.status.toLowerCase()}.`);
  html += DETAILS_TABLE([
    { label: 'Expense Title', value: d.title },
    { label: 'Amount', value: d.amount },
    { label: 'Date', value: d.date }
  ]);
  
  if (d.note) {
    const noteBg = isApproved ? '#F0FDF4' : (isRejected ? '#FEF2F2' : '#EFF6FF');
    const noteBorder = isApproved ? '#BBF7D0' : (isRejected ? '#FECACA' : '#BFDBFE');
    html += NOTE_BOX('Reviewer Note', d.note, noteBg, noteBorder);
  }
  
  html += CTA('View Expense Details', d.actionUrl);
  html += FOOTER(d.refId || Date.now().toString(36).toUpperCase());
  return EMAIL_WRAP(html, `Expense ${d.status}`);
}

module.exports = {
  expenseSubmitted,
  expenseStatusUpdated
};
