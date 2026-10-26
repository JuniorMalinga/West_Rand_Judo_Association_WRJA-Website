import nodemailer from "nodemailer";
import { PASSWORD_RESET_OTP_TTL_SECONDS } from "../passwordResetPolicy.js";

const getSiteUrl = () => process.env.PUBLIC_SITE_URL || "https://westrandjudoassociation.vercel.app/";

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

export function isPasswordResetEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export const isEmailConfigured = isPasswordResetEmailConfigured;

function buildEmail({ name, message }) {
  const siteUrl = getSiteUrl();
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
    siteUrl,
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
                <a href="${escapeHtml(siteUrl)}" style="color:#7a6a1c;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>
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

export async function sendPasswordResetCode({ email, name, code, expiresAt }) {
  const mail = getTransporter();
  if (!mail) {
    throw new Error("Password recovery email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }

  const firstName = String(name || "").trim().split(/\s+/)[0] || "there";
  const expiryMinutes = Math.ceil(PASSWORD_RESET_OTP_TTL_SECONDS / 60);
  const expiryTime = new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(expiresAt));
  const text = [
    `Dear ${firstName},`,
    "",
    `Your WRJA password reset code is: ${code}`,
    "",
    `Enter this code on the password reset page. The ${expiryMinutes}-minute timer ends at ${expiryTime} SAST. The code can only be used once.`,
    "If you did not request this code, you can ignore this email. Do not share this code with anyone.",
    "",
    "West Rand Judo Association",
  ].join("\n");
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px 12px;background:#f2f0eb;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:#1a1a1a;padding:28px 32px;color:#c9a227;font-size:12px;letter-spacing:2px;font-weight:bold;">WEST RAND JUDO ASSOCIATION</td></tr>
      <tr><td style="padding:32px;font-size:16px;line-height:1.6;">
        <p>Dear ${escapeHtml(firstName)},</p>
        <p>Use this one-time code to reset your WRJA password:</p>
        <p style="padding:18px;background:#faf8f2;border-radius:8px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1a1a;">${escapeHtml(code)}</p>
        <p>This ${expiryMinutes}-minute timer ends at <strong>${escapeHtml(expiryTime)} SAST</strong>. The code can only be used once. If you did not request it, ignore this email. Never share this code.</p>
      </td></tr>
    </table>
  </body>
</html>`;

  await mail.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    replyTo: process.env.MAIL_REPLY_TO || process.env.SMTP_USER,
    to: email,
    subject: "Your WRJA password reset code",
    text,
    html,
  });
}

export async function sendSignupNotification({ email, name }) {
  const mail = getTransporter();
  if (!mail) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }

  const firstName = String(name || "").trim().split(/\s+/)[0] || "there";
  const text = [
    `Dear ${firstName},`,
    "",
    "Your West Rand Judo Association account has been created successfully.",
    "",
    "No email confirmation is required. You can sign in to the website with the password you chose during registration.",
    "",
    "If you did not create this account, please contact the West Rand Judo Association.",
    "",
    "West Rand Judo Association",
  ].join("\n");
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px 12px;background:#f2f0eb;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:#1a1a1a;padding:28px 32px;color:#c9a227;font-size:12px;letter-spacing:2px;font-weight:bold;">WEST RAND JUDO ASSOCIATION</td></tr>
      <tr><td style="padding:32px;font-size:16px;line-height:1.6;">
        <p>Dear ${escapeHtml(firstName)},</p>
        <p>Your West Rand Judo Association account has been created successfully.</p>
        <p>No email confirmation is required. You can sign in to the website with the password you chose during registration.</p>
        <p>If you did not create this account, please contact the West Rand Judo Association.</p>
      </td></tr>
    </table>
  </body>
</html>`;

  await mail.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    replyTo: process.env.MAIL_REPLY_TO || process.env.SMTP_USER,
    to: email,
    subject: "Your WRJA account is ready",
    text,
    html,
  });
}