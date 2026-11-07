/** Escape user-supplied text before putting it in HTML. */

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
<title>You're registered</title>
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
    .btn { display:block !important; text-align:center !important; }
  }
</style>
</head>
<body style="margin:0 !important; padding:0 !important; background-color:#f4f5f8;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; color:#f4f5f8;">
  You're confirmed for ${eventTitle} on ${eventDate}. Your ticket reference is inside.
</div>

<table border="0" cellpadding="0" cellspacing="0" width="100%">
<tr><td align="center" bgcolor="#f4f5f8" style="padding:40px 10px;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;">

  <!-- Logo -->
  <tr><td align="center" style="padding:0 0 28px 0;">
    <img src="https://dlwyouth.org/main_logo.svg" alt="dlwyc" width="140" style="display:block; font-family:sans-serif; color:#00a5f4; font-size:22px; font-weight:bold;" border="0">
  </td></tr>

  <!-- Card -->
  <tr><td>
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff; border:1px solid #e2e4ea; border-radius:12px; overflow:hidden;">

    <tr><td height="4" style="background:#091e54; font-size:0; line-height:0;">&nbsp;</td></tr>

    <!-- Confirmation -->
    <tr><td class="px" align="center" style="padding:36px 40px 8px;">
      <table border="0" cellpadding="0" cellspacing="0"><tr>
        <td width="48" height="48" align="center" valign="middle" bgcolor="#e7f6ee" style="border-radius:24px; font-size:22px; line-height:48px; color:#16a34a; font-weight:bold;">&#10003;</td>
      </tr></table>
      <h2 style="font-size:20px; font-weight:600; margin:16px 0 6px; color:#091e54;">You're in, ${fullName}</h2>
      <p style="margin:0; color:#5c677d; font-size:13.5px; line-height:1.7;">
        Your registration is confirmed. Here are the details for your records.
      </p>
    </td></tr>

    <!-- Event details -->
    <tr><td class="px" style="padding:24px 40px 8px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f5f8; border-radius:10px; border-left:4px solid #091e54;">
        <tr><td style="padding:16px 18px 6px;">
          <p style="margin:2px 0 0; font-size:16px; line-height:22px; font-weight:600; color:#091e54;">${eventTitle}</p>
        </td></tr>
        <tr><td style="padding:6px 18px 16px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size:13px; line-height:20px;">
            <tr><td class="lbl" valign="top" style="width:76px; padding:5px 0; color:#687787;">Date</td><td style="padding:5px 0; color:#27305f; font-weight:500;">${eventDate}</td></tr>
            <tr><td class="lbl" valign="top" style="padding:5px 0; color:#687787;">Time</td><td style="padding:5px 0; color:#27305f; font-weight:500;">${eventLocation}</td></tr>
            <tr><td class="lbl" valign="top" style="padding:5px 0; color:#687787;">Where</td><td style="padding:5px 0; color:#27305f; font-weight:500;">${eventTime}</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>

    <!-- CTA -->
    <tr><td class="px" align="left" style="padding:20px 40px 30px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
      <a class="btn" href="${"/dashboard/events"}" target="_blank" style="display:inline-block; padding:13px 32px; font-size:13.5px; color:#ffffff; font-weight:500; text-decoration:none; border-radius:10px; background:#091e54;">
        <td align="center" bgcolor="#091e54" style="border-radius:10px;">
          
          View my ticket &rarr;
          </td>
          </a>
      </tr></table>
    </td></tr>

    <!-- Notice -->
    <tr><td class="px" style="padding:0 40px 30px; border-top:1px solid #e8eaef;">
      <p style="margin:20px 0 0; font-size:12px; color:#687787; line-height:1.7;">
        Can't make it, or something looks wrong? Contact us at
        <a href="mailto:dlwyouth@gmail.com" style="color:#27305f; font-weight:500; text-decoration:none;">dlwyouth@gmail.com</a>
        and include your ticket reference.
      </p>
    </td></tr>

    <!-- Footer -->
    <tr><td class="px" style="padding:14px 40px 18px; border-top:1px solid #e8eaef; background:#fafbfc;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td style="font-size:11.5px; color:#9aa5b4;">&copy; 2026 dlwyc</td>
        <td align="right" style="font-size:11.5px;"><a href="https://dlwyouth.org" style="color:#27305f; font-weight:500; text-decoration:none;">dlwyouth.org</a></td>
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
