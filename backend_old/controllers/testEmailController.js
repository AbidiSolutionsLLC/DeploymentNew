const sendEmail = require("../utils/emailService");
const moment = require("moment-timezone");
const User = require("../models/userSchema");
const { catchAsync } = require("../utils/catchAsync"); // Check if catchAsync is exported properly

// Helper to get formatted date
const getDate = () => moment().format("MMMM Do, YYYY");

exports.testCheckInReminder = async (req, res) => {
    const { email, name = "Test User" } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const result = await sendEmail({
            to: email,
            subject: "Reminder: Please Check In (TEST)",
            template: "attendance/no-checkin",
            data: {
                name: name,
                date: getDate()
            }
        });

        res.json({ message: "Check-in reminder sent", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.testCheckoutReminder = async (req, res) => {
    const { email, name = "Test User" } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const result = await sendEmail({
            to: email,
            subject: "Reminder: You forgot to Checkout (TEST)",
            template: "attendance/no-checkout",
            data: {
                name: name,
                date: getDate()
            }
        });

        res.json({ message: "Checkout reminder sent", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.testTimesheetReminder = async (req, res) => {
    const { email, name = "Test User" } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        // Friday of this week
        const weekEnding = moment().endOf('week').format("MMMM Do, YYYY");

        const result = await sendEmail({
            to: email,
            subject: "Action Required: Submit Your Weekly Timesheet (TEST)",
            template: "timesheet/no-timesheet",
            data: {
                name: name,
                weekEndingDate: weekEnding
            }
        });

        res.json({ message: "Timesheet reminder sent", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.testTicketCreated = async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const dummyTicket = {
            _id: "dummy_id_123",
            ticketID: "TKT-TEST-001",
            subject: "Test Ticket Subject",
            status: "opened",
            priority: "Medium Priority",
            description: "This is a test description for the ticket creation email template.",
        };

        const result = await sendEmail({
            to: email,
            subject: `New Ticket Created - #${dummyTicket.ticketID} (TEST)`,
            template: "tickets/ticket-created",
            data: { ticket: dummyTicket }
        });

        res.json({ message: "Ticket Created email sent", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.testTicketAssigned = async (req, res) => {
    const { email, name = "Admin User" } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const dummyTicket = {
            _id: "dummy_id_456",
            ticketID: "TKT-TEST-002",
            subject: "Urgent Server Issue",
            status: "opened",
            priority: "High Priority",
            description: "Server is down, please investigate.",
            emailAddress: "user@example.com"
        };

        const result = await sendEmail({
            to: email,
            subject: `Ticket #${dummyTicket.ticketID} Assigned to You (TEST)`,
            template: "tickets/ticket-assigned",
            data: {
                ticket: dummyTicket,
                name: name
            }
        });

        res.json({ message: "Ticket Assigned email sent", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.testUserInvite = async (req, res) => {
    const { email, name = "New Employee" } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const result = await sendEmail({
            to: email,
            subject: "Welcome to Abidi Pro - Account Invite (TEST)",
            template: "users/user-invitation",
            data: {
                name: name,
                email: email,
                role: "Employee",
                loginURL: process.env.FRONTEND_URL || "http://localhost:3000/auth/login"
            }
        });

        res.json({ message: "User Invite email sent", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
