const nodemailer = require("nodemailer");
const path = require("path");
const htmlToText = require("html-to-text");
require("dotenv").config();
const Company = require("../models/companySchema");
const azureSendEmail = require("../utils/emailService");
const templates = require("../utils/emailTemplates");

async function getCustomTransporter(companyId) {
  if (companyId) {
    const company = await Company.findById(companyId);
    if (company && company.emailConfig && company.emailConfig.provider === 'Custom') {
      const config = company.emailConfig;
      return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass
        }
      });
    }
  }
  return null;
}

const sendEmail = async ({ to, subject, htmlContent, companyId }) => {
  try {
    const html = htmlContent;
    const customTransporter = await getCustomTransporter(companyId);
    
    let info;
    if (customTransporter) {
      let fromEmail = "";
      const company = await Company.findById(companyId);
      if (company && company.emailConfig && company.emailConfig.fromEmail) {
         fromEmail = `"${company.companyName}" <${company.emailConfig.fromEmail}>`;
      }
      const mailOptions = {
        from: fromEmail,
        to,
        subject,
        html,
        text: htmlToText.htmlToText(html),
      };
      info = await customTransporter.sendMail(mailOptions);
      console.log("Custom SMTP email sent: %s", info.messageId);
    } else {
      // Use Azure Email Service by Default
      info = await azureSendEmail(to, subject, html);
    }
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendInvitationEmail = async ({ to, name, role, loginURL, companyId }) => {
  try {
    const htmlContent = templates.invitation({
      name,
      email: to,
      role,
      loginUrl: loginURL
    });

    await sendEmail({
      to,
      subject: "Welcome to Abidi Pro - Account Created",
      htmlContent,
      companyId
    });
  } catch (error) {
    console.error("Error sending invitation email:", error);
  }
};

const sendOTPEmail = async ({ to, otp, name, companyId }) => {
  try {
    const htmlContent = templates.otpEmail({
      name,
      otp,
      purpose: "Login verification"
    });

    await sendEmail({
      to,
      subject: "Your Login OTP",
      htmlContent,
      companyId
    });
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

const sendForgotPasswordEmail = async ({ to, name, resetURL, companyId }) => {
  try {
    const htmlContent = templates.passwordReset({
      name,
      resetUrl: resetURL
    });

    await sendEmail({
      to,
      subject: "Password Reset Request",
      htmlContent,
      companyId
    });
  } catch (error) {
    console.error("Error sending forgot password email:", error);
  }
};

module.exports = {
  sendEmail,
  sendInvitationEmail,
  sendOTPEmail,
  sendForgotPasswordEmail
};