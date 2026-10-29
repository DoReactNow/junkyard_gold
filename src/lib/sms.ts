import twilio from "twilio";
import { db } from "./db";

export const smsLive = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);

let client: ReturnType<typeof twilio> | null = null;
function getClient() {
  if (!client) client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  return client;
}

/**
 * Sends a text and records it in the conversation. Without Twilio credentials the message is
 * stored as "simulated" so the whole flow can be tested from the staff inbox.
 */
export async function sendText(opts: {
  conversationId: string;
  to: string;
  body: string;
  author: "staff" | "auto";
}) {
  const convo = await db.conversation.findUnique({ where: { id: opts.conversationId } });
  if (convo?.optedOut) {
    return db.message.create({
      data: { conversationId: opts.conversationId, direction: "note", author: "system", body: "Not sent — customer replied STOP.", status: "failed" },
    });
  }

  let status = "simulated";
  let providerId: string | null = null;
  if (smsLive()) {
    try {
      const msg = await getClient().messages.create({
        to: opts.to,
        from: process.env.TWILIO_FROM_NUMBER!,
        body: opts.body,
      });
      status = "sent";
      providerId = msg.sid;
    } catch (err) {
      console.error("Twilio send failed", err);
      status = "failed";
    }
  }

  const [message] = await db.$transaction([
    db.message.create({
      data: { conversationId: opts.conversationId, direction: "out", author: opts.author, body: opts.body, status, providerId },
    }),
    db.conversation.update({ where: { id: opts.conversationId }, data: { lastMessageAt: new Date() } }),
  ]);
  return message;
}

/** Plain alert to a staff cell phone (not stored in any customer thread). */
export async function alertStaff(body: string) {
  const to = process.env.STAFF_ALERT_PHONE;
  if (!to || !smsLive()) return;
  try {
    await getClient().messages.create({ to, from: process.env.TWILIO_FROM_NUMBER!, body });
  } catch (err) {
    console.error("Staff alert failed", err);
  }
}

export function validateTwilioRequest(signature: string | null, url: string, params: Record<string, string>) {
  if (!process.env.TWILIO_AUTH_TOKEN) return true; // demo mode
  if (!signature) return false;
  return twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params);
}
