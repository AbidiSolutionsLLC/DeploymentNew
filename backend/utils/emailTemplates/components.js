const CSS_HEAD = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .p-mobile { padding: 20px 16px !important; }
      .cal-box { width: 100% !important; margin-bottom: 10px !important; }
      .cal-separator { display: none !important; }
    }
  </style>
</head>`;

function EMAIL_WRAP(inner, title) {
  return `${CSS_HEAD}
<title>${title}</title>
<body style="margin: 0; padding: 0; background-color: #F8FAFC;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; table-layout: fixed;">
    <tr><td align="center" style="padding: 40px 16px;">
      <!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="580"><tr><td align="center" valign="top" width="580"><![endif]-->
      <table role="presentation" class="container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden;">
        ${inner}
      </table>
      <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body></html>`;
}

function HEADER(brandText, statusText, statusColor, statusBg, statusBorder) {
  return `
  <tr><td style="padding: 14px 24px; background-color: #FFFFFF; border-bottom: 1px solid #E2E8F0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 18px; font-weight: 700; color: #0F172A; letter-spacing: 2px;">
          <span style="color: #D4AF37; font-size: 16px; vertical-align: middle; margin-right: 6px;">&#9670;</span>
          <span style="color: #B8860B; font-size: 22px; font-family: 'Georgia', serif; letter-spacing: 4px; vertical-align: middle;">${brandText}</span>
        </td>
        <td align="right" style="vertical-align: middle;">
          ${statusText ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="display: inline-table;">
            <tr><td style="padding: 5px 12px; border-radius: 50px; border: 1px solid ${statusBorder}; background-color: ${statusBg};">
              <span style="font-size: 11px; font-weight: 600; color: ${statusColor}; letter-spacing: 0.3px;">${statusText}</span>
            </td></tr>
          </table>` : ''}
        </td>
      </tr>
    </table>
  </td></tr>`;
}

function TITLE(heading, subtitle) {
  return `
  <tr><td style="padding: 24px 24px 8px 24px;">
    <h1 style="margin: 0 0 4px 0; font-size: 22px; font-weight: 800; color: #0F172A; line-height: 1.3;">${heading}</h1>
    <p style="margin: 0; font-size: 14px; color: #64748B; line-height: 1.5;">${subtitle}</p>
  </td></tr>`;
}

function DETAILS_TABLE(items, accentColor = '#D4AF37') {
  let rows = '';
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const borderStyle = i < items.length - 1 ? 'border-bottom: 1px solid #EAE5D9;' : '';
    rows += `
          <tr>
            <td style="padding: 10px 16px; font-size: 10px; font-weight: 600; color: #94A3B8; letter-spacing: 0.5px; text-transform: uppercase; width: 40%; background-color: #FAF8F2; border-right: 1px solid #EAE5D9; ${borderStyle} vertical-align: top;">${it.label}</td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #0F172A; background-color: #FAF8F2; ${borderStyle} vertical-align: top; line-height: 1.4;">${it.value}</td>
          </tr>`;
  }
  return `
  <tr><td style="padding: 16px 24px 20px 24px;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="width: 4px; background-color: ${accentColor}; border-radius: 4px; vertical-align: stretch;"></td>
        <td style="padding-left: 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF8F2; border: 1px solid #EAE5D9; border-radius: 8px; overflow: hidden;">
            ${rows}
          </table>
        </td>
      </tr>
    </table>
  </td></tr>`;
}

function NOTE_BOX(label, text, bgColor = '#F8FAFC', borderColor = '#E2E8F0') {
  return `
  <tr><td style="padding: 0 24px 20px 24px;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px;">
      <tr><td style="padding: 14px 16px;">
        <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 700; color: #94A3B8; letter-spacing: 0.5px; text-transform: uppercase;">${label}</p>
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">${text}</p>
      </td></tr>
    </table>
  </td></tr>`;
}

function CTA(text, href) {
  return `
  <tr><td style="padding: 8px 24px 28px 24px;" align="center">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="background-color: #D4AF37; border-radius: 8px;">
          <a href="${href || '#'}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; letter-spacing: 0.3px;">${text}</a>
        </td>
      </tr>
    </table>
  </td></tr>`;
}

function FOOTER(refId) {
  return `
  <tr><td style="padding: 0 24px 20px 24px;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #E2E8F0;">
      <tr><td style="padding-top: 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size: 11px; color: #94A3B8;">Ref: ${refId}</td>
            <td align="right" style="font-size: 11px; color: #94A3B8;">Auto-generated notification</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding: 0 24px 24px 24px; text-align: center;">
    <p style="margin: 0; font-size: 11px; color: #CBD5E1;">This is an automated notification from the Abidi Pro platform.</p>
  </td></tr>`;
}

module.exports = {
  EMAIL_WRAP,
  HEADER,
  TITLE,
  DETAILS_TABLE,
  NOTE_BOX,
  CTA,
  FOOTER
};
