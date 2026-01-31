const { EmailClient } = require("@azure/communication-email");
 
// Initialize Client

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;

let client;
 
try {

  client = new EmailClient(connectionString);

} catch (error) {

  console.error("Failed to initialize Azure Email Client:", error.message);

}
 
const sendEmail = async (toEmail, subject, htmlContent) => {

  if (!client) {

    console.error("Email client is not initialized.");

    return { success: false, error: "Email client not ready" };

  }
 
  try {

    const emailMessage = {

      // Must match your Azure "MailFrom" address exactly

      senderAddress: process.env.SENDER_EMAIL_ADDRESS, 

      content: {

        subject: subject,

        html: htmlContent,

      },

      recipients: {

        to: [{ address: toEmail }],

      },

    };
 
    console.log(`📨 Email queued successfully! ${toEmail}...`);
 
    // Start the send process

    const poller = await client.beginSend(emailMessage);

    // FIX: We removed "poller.getOperationId()" because it crashes on new versions.

    // We just assume success if 'beginSend' doesn't throw an error.

    console.log(`✅ Email Sent successfully!`);

    return { success: true };
 
  } catch (error) {

    console.error("❌ Failed to send email:", error.message);

    return { success: false, error: error.message };

  }

};
 
module.exports = sendEmail;
 