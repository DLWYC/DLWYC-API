/** Escape user-supplied text before putting it in HTML. */
const formatEventDate = require('./dateFormatter')

const eventRegistrationEmail = ({
  fullName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventType,
  dashboardUrl,
}) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>You're registered for ${eventTitle}</title>
<style>
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
  table { border-collapse:collapse !important; }
  body { height:100% !important; margin:0 !important; padding:0 !important; width:100% !important; background-color:#f4f5f8;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important; }
  @media only screen and (max-width:480px) {
    .px { padding-left:22px !important; padding-right:22px !important; }
    .lbl { width:64px !important; }
    .btn { display:block !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f8;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:#f4f5f8;">
  You're confirmed for ${eventTitle} on ${eventDate}. Your ticket is inside.&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
</div>

<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
<tr><td align="center" bgcolor="#f4f5f8" style="padding:40px 10px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width:520px;">

  <!-- Logo (use PNG: SVG is blocked by Gmail and Outlook) -->
  <tr><td align="center" style="padding:0 0 28px 0;">
    <img src="https://dlwyouth.org/Logo1.svg" alt="DLWYC" width="140" style="display:block; font-family:sans-serif; color:#00a5f4; font-size:22px; font-weight:bold;" border="0">
  </td></tr>

  <!-- Card -->
  <tr><td>
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background:#ffffff; border:1px solid #e2e4ea; border-radius:12px; overflow:hidden;">

    <tr><td height="5" bgcolor="#091e54" style="background:#091e54; font-size:0; line-height:0;">&nbsp;</td></tr>

    <!-- Confirmation -->
    <tr><td class="px" align="center" style="padding:36px 40px 4px;">
      <table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td width="52" height="52" align="center" valign="middle" bgcolor="#e7f6ee" style="border-radius:26px; font-size:24px; line-height:52px; color:#16a34a; font-weight:bold;">&#10003;</td>
      </tr></table>
      <h1 style="font-size:22px; line-height:28px; font-weight:700; margin:18px 0 8px; color:#091e54;">You're in, ${fullName}!</h1>
      <p style="margin:0; color:#5c677d; font-size:14px; line-height:1.7;">
        Your registration is confirmed. Here are the details for your records.
      </p>
    </td></tr>

    <!-- Event details -->
    <tr><td class="px" style="padding:24px 40px 8px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background:#f4f5f8; border-radius:10px; border-left:4px solid #091e54;">
        <tr><td style="padding:16px 18px 4px;">
          <p style="margin:0; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#687787; font-weight:600;">Event</p>
          <p style="margin:4px 0 0; font-size:17px; line-height:24px; font-weight:700; color:#091e54;">${eventTitle}</p>
        </td></tr>
        <tr><td style="padding:6px 18px 16px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="font-size:13.5px; line-height:20px;">
            <tr><td class="lbl" valign="top" style="width:76px; padding:6px 0; color:#687787;">Date</td><td style="padding:6px 0; color:#27305f; font-weight:600;">${eventDate}</td></tr>
            <tr><td class="lbl" valign="top" style="padding:6px 0; color:#687787;">Time</td><td style="padding:6px 0; color:#27305f; font-weight:600;">${formatEventDate(eventTime)}</td></tr>
            <tr><td class="lbl" valign="top" style="padding:6px 0; color:#687787;">Where</td><td style="padding:6px 0; color:#27305f; font-weight:600;">${eventLocation}</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>

    <!-- CTA (bulletproof button) -->
    <tr><td class="px" align="center" style="padding:24px 40px 28px;">
      <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr>
        <td align="center" bgcolor="#091e54" style="border-radius:10px;">
          <a class="btn" href="${process.env.FRONTEND_DOMAIN}/dashboard/events" target="_blank" style="display:inline-block; padding:14px 32px; font-size:14px; color:#ffffff; font-weight:600; text-decoration:none; border-radius:10px;">View my ticket &rarr;</a>
        </td>
      </tr></table>
    </td></tr>

    <!-- Tips -->
    <tr><td class="px" style="padding:20px 40px 8px; border-top:1px solid #e8eaef;">
      <p style="margin:0 0 8px; font-size:13px; font-weight:700; color:#091e54;">Before you arrive</p>
      <p style="margin:0; font-size:13px; color:#5c677d; line-height:1.8;">
        &#8226; Arrive 15 minutes early for check-in<br>
        &#8226; Have your ticket ready on your phone
      </p>
    </td></tr>

    <!-- Notice -->
    <tr><td class="px" style="padding:12px 40px 28px;">
      <p style="margin:12px 0 0; font-size:12px; color:#687787; line-height:1.7;">
        Can't make it, or something looks wrong? Contact us at
        <a href="mailto:dlwyouth@gmail.com" style="color:#27305f; font-weight:600; text-decoration:underline;">dlwyouth@gmail.com</a>.
      </p>
    </td></tr>

    <!-- Footer -->
    <tr><td class="px" bgcolor="#fafbfc" style="padding:14px 40px 18px; border-top:1px solid #e8eaef; background:#fafbfc;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr>
        <td style="font-size:11.5px; color:#8792a2;">&copy; 2026 DLWYC</td>
        <td align="right" style="font-size:11.5px;"><a href="https://dlwyouth.org" style="color:#27305f; font-weight:600; text-decoration:none;">dlwyouth.org</a></td>
      </tr></table>
    </td></tr>

  </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`;

/* Usage:
emailQueue.push({
  to: email,
  subject: `You're registered: ${event.eventTitle}`,
  html: eventRegistrationEmail({
    fullName: user.fullName,
    eventTitle: event.eventTitle,
    eventDate: format(event.eventDate, "EEEE, MMM dd, yyyy"),
    eventTime: event.eventTime,
    eventLocation: event.eventLocation,
    eventType: event.eventType,
    ticketRef: registration.reference ?? registration.registrationCode,
    dashboardUrl: `${config.client.domain}/dashboard/events`,
  }),
});
*/

module.exports = eventRegistrationEmail;
