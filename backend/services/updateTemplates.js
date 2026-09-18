const fs = require('fs');

let content = fs.readFileSync('c:/Users/TayyabSaleem/Desktop/Projects/Karbexa/backend/services/leaveService.js', 'utf8');

const statusTemplate = `
    generateLeaveStatusEmailTemplate(leaveRequest, status, note) {
      const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const refId = (leaveRequest._id.toString()).slice(-6).toUpperCase();
      const statusColor = status === 'Approved' ? '#059669' : '#DC2626';
      
      return \`<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Leave Request \${status} - Karbexa</title>
      <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased; }
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .p-mobile { padding: 20px 16px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="580" class="container">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <img src="https://i.ibb.co/3s71yN7/Karbexa-logo.png" alt="Karbexa Logo" width="180" style="display: block; border: 0;" />
                </td>
              </tr>
              <tr>
                <td class="p-mobile" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0F172A;">Leave Request \${status}</h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #475569;">
                    Hello <strong>\${leaveRequest.employeeName}</strong>,<br>
                    Your leave request for <strong>\${leaveRequest.leaveType}</strong> has been <span style="font-weight: 700; color: \${statusColor};">\${status}</span>.
                  </p>
                  \${note ? \`
                  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B; margin-bottom: 4px;">
                      Note from Reviewer
                    </div>
                    <div style="font-size: 13px; color: #334155; line-height: 1.5;">
                      "\${note}"
                    </div>
                  </div>\` : ''}
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center">
                        <a href="\${portalUrl}" style="display: inline-block; box-sizing: border-box; background-color: #D4AF37; color: #FFFFFF; font-size: 14px; font-weight: 700; text-align: center; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                          View in Karbexa Portal
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 28px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9; text-align: center; font-size: 11px; color: #94A3B8;">
                  Karbexa System Notification &bull; Ref ID: <code>\${refId}</code> &bull; Auto-generated
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>\`;
    }
  `;
  
  const responseTemplate = `
    generateLeaveResponseEmailTemplate(leaveRequest, responder, responseContent) {
      const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const refId = (leaveRequest._id.toString()).slice(-6).toUpperCase();
      
      return \`<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Response on Leave Request - Karbexa</title>
      <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased; }
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .p-mobile { padding: 20px 16px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="580" class="container">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <img src="https://i.ibb.co/3s71yN7/Karbexa-logo.png" alt="Karbexa Logo" width="180" style="display: block; border: 0;" />
                </td>
              </tr>
              <tr>
                <td class="p-mobile" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0F172A;">New Response on Leave Request</h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #475569;">
                    Hello <strong>\${leaveRequest.employeeName}</strong>,<br>
                    You have received a new response on your leave request from <strong>\${responder.name}</strong>:
                  </p>
                  <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                    <div style="font-size: 13px; color: #92400E; line-height: 1.5;">
                      "\${responseContent}"
                    </div>
                  </div>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center">
                        <a href="\${portalUrl}" style="display: inline-block; box-sizing: border-box; background-color: #D4AF37; color: #FFFFFF; font-size: 14px; font-weight: 700; text-align: center; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                          Reply in Karbexa Portal
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 28px; background-color: #F8FAFC; border-top: 1px solid #F1F5F9; text-align: center; font-size: 11px; color: #94A3B8;">
                  Karbexa System Notification &bull; Ref ID: <code>\${refId}</code> &bull; Auto-generated
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>\`;
    }`;
  
  const regexStatus = /generateLeaveStatusEmailTemplate\(leaveRequest, status, note\) \{[\s\S]*?<\/html>\s*`;\s*}/;
  const regexResponse = /generateLeaveResponseEmailTemplate\(leaveRequest, responder, responseContent\) \{[\s\S]*?<\/html>\s*`;\s*}/;
  
  content = content.replace(regexStatus, statusTemplate.trim());
  content = content.replace(regexResponse, responseTemplate.trim());
  
  fs.writeFileSync('c:/Users/TayyabSaleem/Desktop/Projects/Karbexa/backend/services/leaveService.js', content, 'utf8');
  console.log('Templates successfully updated in leaveService.js');
