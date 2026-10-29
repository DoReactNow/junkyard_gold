import nodemailer, { type Transporter } from "nodemailer";
import { BUSINESS } from "./business";

// Lead alerts by email through the Zoho mailbox (support@junkyardgold.com).
// Zoho needs an app-specific password when 2FA is on: Zoho Mail → Settings → Security → App Passwords.
export const emailLive = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

let transport: Transporter | null = null;
function getTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.zoho.com",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

export async function emailStaff(subject: string, text: string) {
  if (!emailLive()) return;
  try {
    await getTransport().sendMail({
      from: `"${BUSINESS.name} website" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_TO || BUSINESS.email,
      subject,
      text,
    });
  } catch (err) {
    console.error("Lead email failed", err);
  }
}
