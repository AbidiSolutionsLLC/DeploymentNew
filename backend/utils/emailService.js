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

    // Wait for the operation to complete to catch actual send errors
    const result = await poller.pollUntilDone();
    
    if (result.status === "Succeeded") {
      console.log(`✅ Email Sent successfully!`);
    } else {
      console.error(`❌ Email failed to send:`, result);
      return { success: false, error: "Email failed to send." };
    }

    return { success: true };
 
  } catch (error) {

    console.error("❌ Failed to send email:", error.message);

    return { success: false, error: error.message };

  }

};
 
module.exports = sendEmail;
 