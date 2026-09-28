const { EMAIL_WRAP, HEADER, TITLE, DETAILS_TABLE, NOTE_BOX, CTA, FOOTER } = require('./components');

function payrollCreated(d) {
  let html = HEADER('KARBEXA', 'Processed', '#1E3A8A', '#EFF6FF', '#BFDBFE');
  html += TITLE('Payroll Processing Complete', `Payroll has been successfully processed for ${d.period}.`);
  html += DETAILS_TABLE([
    { label: 'Payroll Batch ID', value: d.batchId },
    { label: 'Period', value: d.period },
    { label: 'Total Employees', value: d.employeeCount },
    { label: 'Total Amount', value: d.totalAmount },
    { label: 'Processed Date', value: d.processedDate }
  ]);
  html += NOTE_BOX('System Confirmation', 'The payroll receipts have been generated. No slips were directly sent to employees via email.', '#F0FDF4', '#BBF7D0');
  html += CTA('View Payroll Reports', d.actionUrl);
  html += FOOTER('PR-' + d.batchId);
  return EMAIL_WRAP(html, 'Payroll Processed');
}

module.exports = {
  payrollCreated
};
