import nodemailer from "nodemailer";

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://westrandjudoassociation.vercel.app/";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));

let transporter = null;

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  if (!transporter) {
    const port = Number(SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }
  return transporter;
}

function buildEmail({ name, message }) {
  const firstName = String(name || "").trim().split(/\s+/)[0] || "there";
  const preview = String(message || "").trim().slice(0, 600);
  const truncated = String(message || "").trim().length > 600 ? "..." : "";

  const text = [
    `Dear ${firstName},`,
    "",
    "Thank you for contacting the West Rand Judo Association. We have received your request and a member of our team will get back to you as soon as possible.",
    "",
    "A copy of your message:",
    `"${preview}${truncated}"`,
    "",
    "If you need to add anything, simply reply to this email.",
    "",
    "Kind regards,",
    "West Rand Judo Association",
    SITE_URL,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f2f0eb;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f0eb;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#1a1a1a;padding:28px 32px;">
                <div style="color:#c9a227;font-size:12px;letter-spacing:2px;font-weight:bold;">WEST RAND JUDO ASSOCIATION</div>
                <div style="color:#ffffff;font-size:24px;font-weight:bold;margin-top:8px;">We have received your request</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-size:16px;line-height:1.6;">
                <p style="margin:0 0 16px;">Dear ${escapeHtml(firstName)},</p>
                <p style="margin:0 0 16px;">Thank you for contacting the West Rand Judo Association. We have received your request and a member of our team will get back to you as soon as possible.</p>
                <p style="margin:24px 0 8px;font-size:13px;letter-spacing:1px;color:#7a6a1c;font-weight:bold;">A COPY OF YOUR MESSAGE</p>
                <div style="background:#faf8f2;border-left:4px solid #c9a227;padding:14px 16px;font-size:15px;color:#444444;white-space:pre-wrap;">${escapeHtml(preview)}${truncated}</div>
                <p style="margin:24px 0 0;">If you need to add anything, simply reply to this email.</p>
                <p style="margin:24px 0 0;">Kind regards,<br /><strong>West Rand Judo Association</strong></p>
              </td>
            </tr>
            <tr>
              <td style="background:#faf8f2;padding:20px 32px;font-size:12px;color:#777777;line-height:1.5;">
                You are receiving this email because a request was submitted on our website using this address. If this was not you, you can ignore this message.<br />
                <a href="${escapeHtml(SITE_URL)}" style="color:#7a6a1c;">${escapeHtml(SITE_URL.replace(/^https?:\/\//, ""))}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html };
}

// Sends the "we received your request" email.
// Returns false when email is not configured, and throws if sending fails.
export async function sendContactConfirmation({ name, email, message }) {
  const mail = getTransporter();
  if (!mail) return false;

  const { text, html } = buildEmail({ name, message });
  await mail.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    replyTo: process.env.MAIL_REPLY_TO || process.env.SMTP_USER,
    to: email,
    subject: "We have received your request | West Rand Judo Association",
    text,
    html,
  });
  return true;
}