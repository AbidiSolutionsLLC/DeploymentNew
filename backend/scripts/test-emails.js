const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendEmail } = require('../config/emailConfig');
const templates = require('../utils/emailTemplates');

async function testAllEmails() {
    const testEmail = process.argv[2];
    if (!testEmail) {
        console.error("Please provide a test email address: node test-emails.js your-email@example.com");
        process.exit(1);
    }

    console.log(`Sending test emails to ${testEmail}...`);

    const d = {
        name: 'Bilal Raza',
        email: testEmail,
        role: 'Software Engineer',
        loginUrl: 'https://abidipro.abidisolutions.com/auth/login',
        resetUrl: 'https://abidipro.abidisolutions.com/auth/reset-password',
        otp: '847291',
        purpose: 'Login verification',
        ticketId: 'TK-10294',
        subject: 'Cannot access project dashboard after password reset',
        priority: 'Medium Priority',
        status: 'Open',
        raisedBy: testEmail,
        assignedTo: 'Hamza Tariq',
        createdDate: 'Sep 18, 2025 at 09:42 AM',
        resolvedDate: 'Sep 19, 2025 at 02:15 PM',
        description: 'After resetting my password, the project dashboard shows a 403 error. Other pages work fine.',
        latestUpdate: 'Assigned to Hamza Tariq. Investigation in progress - checking role permissions.',
        actionUrl: 'https://abidipro.abidisolutions.com/tickets/TK-10294'
    };

    const tests = [
        { subject: 'Test: Ticket Created', html: templates.ticketCreated(d) },
        { subject: 'Test: Ticket In Progress', html: templates.ticketInProgress({ ...d, status: 'In Progress' }) },
        { subject: 'Test: Ticket Resolved', html: templates.ticketResolved({ ...d, status: 'Resolved', latestUpdate: 'Root cause: stale session token after password reset. Fix deployed. Marking as resolved.' }) },
        { subject: 'Test: User Invitation', html: templates.invitation(d) },
        { subject: 'Test: OTP Verification', html: templates.otpEmail(d) },
        { subject: 'Test: Password Reset', html: templates.passwordReset(d) },
        
        // --- NEW TEMPLATES ---
        { subject: 'Test: Leave Submitted', html: templates.leaveSubmitted({ employeeName: 'Bilal Raza', leaveType: 'Paid Time Off (PTO)', startDate: 'Oct 01, 2025', endDate: 'Oct 05, 2025', days: 5, submittedDate: 'Sep 21, 2025', reason: 'Going on a family vacation.', actionUrl: 'https://karbexa.com', refId: 'LR-1234' }) },
        { subject: 'Test: Leave Approved', html: templates.leaveApproved({ employeeName: 'Bilal Raza', leaveType: 'Sick Leave', startDate: 'Oct 01, 2025', endDate: 'Oct 02, 2025', days: 2, note: 'Approved, get well soon!', actionUrl: 'https://karbexa.com', refId: 'LR-1235' }) },
        { subject: 'Test: Leave Rejected', html: templates.leaveRejected({ employeeName: 'Bilal Raza', leaveType: 'Paid Time Off (PTO)', startDate: 'Oct 01, 2025', endDate: 'Oct 05, 2025', days: 5, note: 'Cannot approve at this time due to major project release.', actionUrl: 'https://karbexa.com', refId: 'LR-1236' }) },
        { subject: 'Test: Leave Response', html: templates.leaveResponseAdded({ employeeName: 'Bilal Raza', leaveType: 'Paid Time Off (PTO)', authorName: 'Hamza Tariq', content: 'Can we move this to next week?', actionUrl: 'https://karbexa.com', refId: 'LR-1237' }) },
        
        { subject: 'Test: Expense Submitted', html: templates.expenseSubmitted({ employeeName: 'Bilal Raza', title: 'Client Dinner', amount: '$150.00', date: 'Sep 20, 2025', description: 'Dinner with the new enterprise client.', actionUrl: 'https://karbexa.com', refId: 'EX-9876' }) },
        { subject: 'Test: Expense Approved', html: templates.expenseStatusUpdated({ title: 'Client Dinner', amount: '$150.00', date: 'Sep 20, 2025', status: 'Approved', note: 'Looks good. Receipts match.', actionUrl: 'https://karbexa.com', refId: 'EX-9876' }) },
        { subject: 'Test: Expense Rejected', html: templates.expenseStatusUpdated({ title: 'Client Dinner', amount: '$150.00', date: 'Sep 20, 2025', status: 'Rejected', note: 'Missing itemized receipt.', actionUrl: 'https://karbexa.com', refId: 'EX-9877' }) },
        
        { subject: 'Test: Timesheet Submitted', html: templates.timesheetSubmitted({ employeeName: 'Bilal Raza', periodStart: 'Sep 15, 2025', periodEnd: 'Sep 21, 2025', totalHours: '40', actionUrl: 'https://karbexa.com', refId: 'TS-456' }) },
        { subject: 'Test: Timesheet Approved', html: templates.timesheetStatusUpdated({ periodStart: 'Sep 15, 2025', periodEnd: 'Sep 21, 2025', totalHours: '40', status: 'Approved', note: 'All hours accounted for.', actionUrl: 'https://karbexa.com', refId: 'TS-456' }) },
        { subject: 'Test: Timesheet Rejected', html: templates.timesheetStatusUpdated({ periodStart: 'Sep 15, 2025', periodEnd: 'Sep 21, 2025', totalHours: '45', status: 'Rejected', note: 'Overtime requires prior approval.', actionUrl: 'https://karbexa.com', refId: 'TS-457' }) },

        { subject: 'Test: Payroll Generated', html: templates.payrollCreated({ batchId: 'PR-999', period: 'Sep 01, 2025 to Sep 15, 2025', employeeCount: '45', totalAmount: '$125,450.00', processedDate: 'Sep 16, 2025', actionUrl: 'https://karbexa.com' }) }
    ];

    for (const t of tests) {
        try {
            console.log(`Sending: ${t.subject}`);
            await sendEmail({
                to: testEmail,
                subject: t.subject,
                htmlContent: t.html,
                companyId: null // Defaults to Azure if Custom SMTP not found
            });
            console.log(`✅ Success: ${t.subject}`);
        } catch (error) {
            console.error(`❌ Failed: ${t.subject}`, error.message);
        }
    }

    console.log("All tests completed!");
    process.exit(0);
}

testAllEmails();
