require('dotenv').config();
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
