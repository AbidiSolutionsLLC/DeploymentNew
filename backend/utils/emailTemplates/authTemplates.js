const { EMAIL_WRAP, HEADER, TITLE, DETAILS_TABLE, NOTE_BOX, CTA, FOOTER } = require('./components');

function invitation(d) {
  let html = HEADER('ABIDI PRO');
  html += TITLE(`Welcome to the team, ${d.name}!`, 'Your account has been created. Set up your password to get started.');
  html += DETAILS_TABLE([
    { label: 'Name', value: d.name },
    { label: 'Email', value: d.email },
    { label: 'Role', value: d.role }
  ]);
  html += CTA('Set Up Password & Login', d.loginUrl);
  html += FOOTER('INV-' + (d.empId || Date.now().toString(36).toUpperCase()));
  return EMAIL_WRAP(html, 'Welcome to Abidi Pro');
}

function otpEmail(d) {
  let html = HEADER('ABIDI PRO');
  html += TITLE('Your verification code', `Use the code below to complete ${d.purpose}.`);
  html += DETAILS_TABLE([
    { label: 'Name', value: d.name },
    { label: 'Purpose', value: d.purpose },
    { label: 'Expires In', value: '10 minutes' }
  ]);
  html += `
  <tr><td style="padding: 0 24px 24px 24px;" align="center">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border: 2px dashed #D4AF37; border-radius: 12px;">
      <tr><td align="center" style="padding: 28px 20px;">
        <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase;">Your verification code</p>
        <p style="margin: 0; font-size: 40px; font-weight: 800; color: #0F172A; letter-spacing: 8px; font-family: 'Courier New', monospace;">${d.otp}</p>
      </td></tr>
    </table>
  </td></tr>`;
  html += NOTE_BOX('Security Note', 'Do not share this code with anyone. If you did not request this verification, please contact IT support immediately.', '#FEF2F2', '#FECACA');
  html += FOOTER('OTP-' + Date.now().toString(36).toUpperCase());
  return EMAIL_WRAP(html, 'Verification Code');
}

function passwordReset(d) {
  let html = HEADER('ABIDI PRO');
  html += TITLE('Reset your password', 'We received a request to reset your Abidi Pro password.');
  html += DETAILS_TABLE([
    { label: 'Name', value: d.name },
    { label: 'Request', value: 'Password Reset' },
    { label: 'Expires In', value: '60 minutes' }
  ]);
  html += CTA('Reset Password', d.resetUrl);
  html += NOTE_BOX('Security Note', 'If you did not request a password reset, please ignore this email or contact IT support. Your password will remain unchanged.', '#FEF2F2', '#FECACA');
  html += FOOTER('PWD-' + Date.now().toString(36).toUpperCase());
  return EMAIL_WRAP(html, 'Password Reset');
}

module.exports = {
  invitation,
  otpEmail,
  passwordReset
};
