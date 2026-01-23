const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { info, warn, error, debug } = require("../utils/logger");
const Log = require("../models//LogSchema"); // Your log model
const User = require("../models/userSchema"); // User model to get admin users
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

// Email transporter setup (using the existing nodemailer configuration)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "syedmunawarali906@gmail.com", // Replace with your email
    pass: "tsdo zpys wyoc lykh", // Replace with your email password
  },
});

const sendEmailNotification = async (logsData) => {
  // Clean up the log data by excluding internal Mongoose properties
  const cleanedLogsData = logsData.map((log) => {
    return {
      _id: log._id.toString(), // Convert _id to string for better readability
      level: log.level,
      message: log.message,
      timestamp: log.createdAt.toISOString(), // Convert timestamp to ISO string
    };
  });

  console.log("Logs data to send via email:", cleanedLogsData); // Log the cleaned logs data

  // Convert cleaned log data to XLSX format
  const worksheet = XLSX.utils.json_to_sheet(cleanedLogsData); // Convert cleaned log data to a sheet
  const workbook = XLSX.utils.book_new(); // Create a new workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Logs"); // Add the sheet to the workbook

  // Define the path to save the XLSX file temporarily
  const filePath = path.join(__dirname, "logs_to_send.xlsx");

  // Write the workbook to the file system
  XLSX.writeFile(workbook, filePath);

  // Query for all admin users
  const adminUsers = await User.find({ role: "Admin" });

  if (adminUsers.length === 0) {
    console.log("No admin users found.");
    return;
  }

  // Extract emails of all admin users
  const adminEmails = adminUsers.map((user) => user.email);

  // Define the email options
  const mailOptions = {
    from: "no-reply@viaride.com", // Your email
    to: adminEmails, // Send to all admin emails
    subject: "Logs from the Last 30 Minutes",
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; margin: 0; padding: 0;">
          <table style="width: 100%; background-color: #ffffff; padding: 20px;">
            <tr>
              <td>
                <h2 style="font-size: 24px; color: #007bff; margin-bottom: 20px;">Viaride Portal - Logs Update</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #555;">
                  Dear Admin,
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #555;">
                  The logs from the last 30 minutes attached below. This report contains detailed information regarding recent system activity.
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #555;">
                  You can download the attached Excel file and review all the logs. If you notice anything unusual or need further assistance, feel free to reach out to the technical team.
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #555;">
                  Thank you for your attention and continuous support.
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #555;">
                  Best Regards,<br>
                  <strong>The Viaride Team</strong><br>
                  <a href="mailto:support@viaride.com" style="color: #007bff;">support@viaride.com</a>
                </p>
                <hr style="border: 1px solid #f1f1f1;">
                <footer style="text-align: center; font-size: 12px; color: #aaa; padding-top: 10px;">
                  <p>&copy; 2025 Viaride. All rights reserved.</p>
                  <p>For support or inquiries, contact us at <a href="mailto:support@viaride.com" style="color: #007bff;">support@viaride.com</a></p>
                </footer>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    attachments: [
      {
        filename: "logs_to_send.xlsx", // Name of the file to be attached
        path: filePath, // Path to the generated XLSX file
      },
    ],
  };

  // Send email with attachment to all admins
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent: " + info.response); // This will show if the email is sent
    }

    // Delete the temporary XLSX file after email is sent
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting the temporary file:", err);
      } else {
        console.log("Temporary file deleted.");
      }
    });
  });
};

cron.schedule("0 0 * * *", async () => {
  // Runs every day at midnight
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // Subtract 5 minutes from the current time

    console.log(`Cron job executed at: ${now.toISOString()}`);
    console.log(
      `Searching for logs between ${thirtyMinutesAgo.toISOString()} and ${now.toISOString()}`
    );

    // Find logs created within the last 5 minutes
    const logsToSend = await Log.find({
      createdAt: { $gte: thirtyMinutesAgo, $lt: now },
    });

    if (logsToSend.length > 0) {
      console.log(
        `${logsToSend.length
        } logs found between ${thirtyMinutesAgo.toISOString()} and ${now.toISOString()}.`
      );
      // Send the logs via email
      sendEmailNotification(logsToSend);

      // After sending the email, delete the logs
      const deletedLogs = await Log.deleteMany({
        createdAt: { $gte: thirtyMinutesAgo, $lt: now },
      });
      console.log(
        `${deletedLogs.deletedCount} logs deleted from the database.`
      );
    } else {
      console.log("No logs found in the last 5 minutes.");
    }
  } catch (err) {
    console.error("Error processing logs:", err);
  }
}, {
  timezone: "America/New_York"
});
