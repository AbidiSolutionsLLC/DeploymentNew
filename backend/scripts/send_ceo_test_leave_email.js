const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/userSchema');
const Department = require('../models/department');
const sendEmail = require('../utils/emailService');
const { moment, TIMEZONE, calculateBusinessDays } = require('../utils/dateUtils');

async function run() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected.');

  // Find real user data for authentic representation
  let user = await User.findOne({ email: 'tsaleem@abidisolutions.com' }).populate('department');
  if (!user) {
    user = await User.findOne({ empStatus: 'Active' }).populate('department');
  }

  const employeeName = user?.name || 'Tayyab Saleem';
  const empID = user?.empID || 'EMP-1769120686356';
  const departmentName = user?.department?.name || 'Product and Engineering';
  const designation = user?.designation || 'Software Engineer';

  // Dates
  const now = moment().tz(TIMEZONE);
  const nextMonday = now.clone().add(1, 'week').startOf('isoWeek');
  const nextWednesday = nextMonday.clone().add(2, 'days');

  const startMonthYear = nextMonday.format('MMMM YYYY').toUpperCase();
  const startDayNum = nextMonday.format('DD');
  const startDayName = nextMonday.format('dddd');
  const startDateFormatted = nextMonday.format('MMM DD, YYYY');

  const endMonthYear = nextWednesday.format('MMMM YYYY').toUpperCase();
  const endDayNum = nextWednesday.format('DD');
  const endDayName = nextWednesday.format('dddd');
  const endDateFormatted = nextWednesday.format('MMM DD, YYYY');

  const businessDays = 3;
  const daysLabel = `${businessDays} business days`;
  const returnDateFormatted = nextWednesday.clone().add(1, 'day').format('dddd, MMM DD, YYYY');
  const appliedDateFormatted = now.format('MMMM DD, YYYY');

  const portalUrl = 'https://abidipro.abidisolutions.com/admin/leaveTrackerAdmin';

  const testEmailHtml = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>[TEST EMAIL] New Leave Request - ${employeeName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      -webkit-font-smoothing: antialiased;
    }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .p-mobile { padding: 20px 16px !important; }
      .cal-box { width: 100% !important; margin-bottom: 10px !important; }
      .cal-separator { display: none !important; }
      .kv-col { display: block !important; width: 100% !important; margin-bottom: 8px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC;">

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 30px 16px;">

        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="580">
        <tr>
        <td align="center" valign="top" width="580">
        <![endif]-->
        <table role="presentation" class="container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden;">
          
          <!-- PROMINENT TEST EMAIL WATERMARK BANNER -->
          <tr>
            <td style="background-color: #FEF3C7; border-bottom: 2px dashed #F59E0B; padding: 12px 20px; text-align: center;">
              <span style="display: inline-block; font-size: 13px; font-weight: 800; color: #B45309; letter-spacing: 0.5px; text-transform: uppercase;">
                🧪 [TEST EMAIL — SAMPLE DEMO ONLY] 🧪
              </span>
              <div style="font-size: 11px; color: #92590C; margin-top: 2px; font-weight: 600;">
                No action required. This is a preview of the newly redesigned <strong>Sowaye Leave Notification Template</strong>.
              </div>
            </td>
          </tr>

          <!-- Header with Minimal Logo and Status Badge -->
          <tr>
            <td style="padding: 24px 28px 16px 28px; border-bottom: 1px solid #F1F5F9;" class="p-mobile">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="display: inline-block; font-size: 18px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">
                      <span style="color: #D4AF37;">◆</span> SOWAYE
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                      TEST DEMO • PENDING REVIEW
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px;" class="p-mobile">
              
              <!-- Title -->
              <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0F172A;">
                [TEST] Leave Request from ${employeeName}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748B; line-height: 1.5;">
                Submitted on <strong>${appliedDateFormatted}</strong> for <strong>${daysLabel}</strong> of Paid Time Off (PTO).
              </p>

              <!-- DUAL CALENDAR TEAR-OFF BADGES -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF8F2; border: 1px solid #EAE5D9; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- Start Date Badge -->
                        <td class="cal-box" width="42%" align="center" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                          <!-- Month Top Header -->
                          <div style="background-color: #D4AF37; color: #FFFFFF; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 0; letter-spacing: 1px;">
                            ${startMonthYear}
                          </div>
                          <!-- Day Number -->
                          <div style="padding: 10px 0 4px 0;">
                            <span style="font-size: 26px; font-weight: 900; color: #0F172A; line-height: 1;">${startDayNum}</span>
                          </div>
                          <!-- Day Name -->
                          <div style="font-size: 12px; font-weight: 600; color: #92590C; padding-bottom: 8px;">
                            ${startDayName} (Start)
                          </div>
                        </td>

                        <!-- Connector Arrow -->
                        <td class="cal-separator" width="16%" align="center" style="font-size: 18px; color: #D4AF37; font-weight: 700;">
                          ➔
                          <div style="font-size: 11px; font-weight: 800; color: #B45309; margin-top: 2px;">${businessDays} Days</div>
                        </td>

                        <!-- End Date Badge -->
                        <td class="cal-box" width="42%" align="center" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                          <!-- Month Top Header -->
                          <div style="background-color: #1E293B; color: #FFFFFF; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 0; letter-spacing: 1px;">
                            ${endMonthYear}
                          </div>
                          <!-- Day Number -->
                          <div style="padding: 10px 0 4px 0;">
                            <span style="font-size: 26px; font-weight: 900; color: #0F172A; line-height: 1;">${endDayNum}</span>
                          </div>
                          <!-- Day Name -->
                          <div style="font-size: 12px; font-weight: 600; color: #64748B; padding-bottom: 8px;">
                            ${endDayName} (End)
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Request Key-Value Table -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #64748B; width: 35%;">
                    Employee Name
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #0F172A;">
                    ${employeeName} (${empID})
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #64748B;">
                    Department & Role
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #0F172A;">
                    ${departmentName} • ${designation}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #64748B;">
                    Leave Category
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #B8860B;">
                    Paid Time Off (PTO)
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #64748B;">
                    Duration
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #0F172A;">
                    ${startDateFormatted} to ${endDateFormatted} (${daysLabel})
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #64748B;">
                    Return to Office Date
                  </td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #059669;">
                    ${returnDateFormatted}
                  </td>
                </tr>
              </table>

              <!-- Employee Reason Box -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B; margin-bottom: 4px;">
                  Employee Note / Reason
                </div>
                <div style="font-size: 13px; color: #334155; line-height: 1.5;">
                  “[TEST REASON] Sample application for demonstrating the redesigned Sowaye leave approval notification template with full date range, duration, and return-to-office breakdown.”
                </div>
              </div>

              <!-- Primary CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${portalUrl}" style="display: block; width: 100%; box-sizing: border-box; background-color: #D4AF37; color: #FFFFFF; font-size: 14px; font-weight: 700; text-align: center; text-decoration: none; padding: 14px 20px; border-radius: 8px;">
                      Review Leave in Sowaye Portal ➔
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9; text-align: center; font-size: 11px; color: #94A3B8;">
              🧪 <strong>TEST EMAIL PREVIEW</strong> • Sowaye System Notification • Ref ID: <code>TEST-DEMO-001</code> • Auto-generated
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>`;

  const recipients = ['jeff@abidisolutions.com', 'tsaleem@abidisolutions.com'];
  const subject = `[TEST EMAIL - DEMO ONLY] New Leave Request: ${employeeName} - PTO (Sowaye HRMS)`;

  for (const recipient of recipients) {
    console.log(`📨 Sending clearly marked TEST email to ${recipient}...`);
    const result = await sendEmail(recipient, subject, testEmailHtml);
    if (result.success) {
      console.log(`🎉 SUCCESS! Sent test email to ${recipient}`);
    } else {
      console.error(`❌ FAILED sending to ${recipient}:`, result.error);
    }
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected from DB.');
  process.exit(0);
}

run().catch((err) => {
  console.error('💥 Execution Error:', err);
  process.exit(1);
});
