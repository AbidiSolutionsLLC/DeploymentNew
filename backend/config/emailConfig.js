const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const htmlToText = require("html-to-text");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, template, context }) => {
  try {
    const html = await ejs.renderFile(
      path.join(__dirname, `../views/emails/${template}.ejs`),
      context
    );

    const mailOptions = {
      from: `"Abidi Pro" <${process.env.GMAIL}>`,
      to,
      subject,
      html,
      text: htmlToText.htmlToText(html),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

/**
 * Send Invitation Email for Microsoft Login
 */
const sendInvitationEmail = async ({ to, name, role, loginURL }) => {
  try {
    await sendEmail({
      to,
      subject: "Welcome to Abidi Pro - Account Created",
      template: "invitationEmail", // Matches the filename created above
      context: {
        name,
        email: to,
        role,
        loginURL, // URL to your frontend login page
      },
    });
  } catch (error) {
    console.error("Error sending invitation email:", error);
  }
};

module.exports = {
  sendEmail,
  sendInvitationEmail,
};