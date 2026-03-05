const { EmailClient } = require("@azure/communication-email");
const ejs = require("ejs");
const path = require("path");

// Initialize Client
const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;

let client;

try {
  client = new EmailClient(connectionString);
} catch (error) {
  console.error("Failed to initialize Azure Email Client:", error.message);
}

/**
 * Send an email using Azure Communication Services
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name (e.g., 'tickets/ticket-created')
 * @param {Object} options.data - Data to be passed to the template
 * @param {Array} options.attachments - Optional array of attachments [{ name, contentType, contentInBase64 }]
 */
const sendEmail = async ({ to, subject, template, data, attachments = [] }) => {
  if (!client) {
    console.error("Email client is not initialized.");
    return { success: false, error: "Email client not ready" };
  }

  try {
    // Render the EJS template
    const templatePath = path.join(__dirname, `../views/emails/${template}.ejs`);
    const htmlContent = await ejs.renderFile(templatePath, { ...data, subject });

    const toAddresses = Array.isArray(to)
      ? to.map(addr => ({ address: addr }))
      : [{ address: to }];

    const emailMessage = {
      // Must match your Azure "MailFrom" address exactly
      senderAddress: process.env.SENDER_EMAIL_ADDRESS,
      content: {
        subject: subject,
        html: htmlContent,
      },
      recipients: {
        to: toAddresses,
      },
      attachments: attachments
    };

    console.log(`📨 Attempting to send '${template}' email to ${to}...`);

    // Start the send process
    const poller = await client.beginSend(emailMessage);

    // We just assume success if 'beginSend' doesn't throw an error.
    console.log(`✅ Email queued successfully!`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
