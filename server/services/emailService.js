import nodemailer from "nodemailer";

let transporter = null;
let transporterPass = null;
let missingPassWarned = false;

function getEmailConfig() {
  const user = process.env.EMAIL_USER || "queenbwarning@gmail.com";
  // Gmail App Passwords are often pasted with spaces — strip them for SMTP auth
  const pass = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "");
  const admin = process.env.ADMIN_EMAIL || user;
  return { user, pass, admin };
}

function getTransporter() {
  const { user, pass } = getEmailConfig();
  if (!pass) {
    if (!missingPassWarned) {
      missingPassWarned = true;
      console.warn(
        "[email] EMAIL_PASS is not set — notification emails will be skipped"
      );
    }
    return null;
  }

  if (transporter && transporterPass === pass) return transporter;

  transporterPass = pass;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Send an email from the admin mailbox.
 * Failures are logged; callers should not block on delivery.
 */
export async function sendMail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) return { skipped: true };

  const { user } = getEmailConfig();
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipients.length === 0) return { skipped: true };

  const info = await transport.sendMail({
    from: `"Meant To B" <${user}>`,
    to: recipients.join(", "),
    subject,
    text,
    html: html || `<p>${escapeHtml(text)}</p>`,
  });

  console.log(`[email] Sent "${subject}" → ${recipients.join(", ")}`);
  return { ok: true, messageId: info.messageId };
}

export function getAdminEmail() {
  return getEmailConfig().admin;
}

export function getEmailFromAddress() {
  return getEmailConfig().user;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
