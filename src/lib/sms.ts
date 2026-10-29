import type { Message } from "@prisma/client";
import { db } from "./db";
import { rcSendSms, ringCentralConfigured } from "./ringcentral";
import { inTextWindow, nextTextWindow } from "./schedule";

export const smsLive = ringCentralConfigured;

/** Sends through RingCentral, or returns "simulated" in demo mode. */
async function deliver(to: string, body: string): Promise<{ status: string; providerId: string | null; error: string | null }> {
  if (!smsLive()) return { status: "simulated", providerId: null, error: null };
  try {
    return { status: "sent", providerId: await rcSendSms(to, body), error: null };
  } catch (err) {
    console.error("SMS send failed", err);
    return { status: "failed", providerId: null, error: String(err instanceof Error ? err.message : err).slice(0, 500) };
  }
}

/**
 * Sends a staff-written text right away and records it in the conversation.
 * Without RingCentral credentials it is stored as "simulated" (demo mode).
 */
export async function sendText(opts: { conversationId: string; to: string; body: string; author: "staff" | "auto"; kind?: string }) {
  const convo = await db.conversation.findUnique({ where: { id: opts.conversationId } });
  if (convo?.optedOut) {
    return db.message.create({
      data: { conversationId: opts.conversationId, direction: "note", author: "system", kind: "note", body: "Not sent — customer replied STOP.", status: "failed" },
    });
  }
  const r = await deliver(opts.to, opts.body);
  const [message] = await db.$transaction([
    db.message.create({
      data: { conversationId: opts.conversationId, direction: "out", author: opts.author, kind: opts.kind || "manual", body: opts.body, ...r },
    }),
    db.conversation.update({ where: { id: opts.conversationId }, data: { lastMessageAt: new Date() } }),
  ]);
  return message;
}

/** Queues an automatic text. It goes out at `at`, or the next 10 AM–8 PM Eastern window. */
export async function queueText(opts: { conversationId: string; body: string; kind: string; at?: Date }) {
  return db.message.create({
    data: {
      conversationId: opts.conversationId, direction: "out", author: "auto", kind: opts.kind,
      body: opts.body, status: "queued", scheduledAt: nextTextWindow(opts.at ?? new Date()),
    },
  });
}

/** Cancels queued automatic texts (follow-ups) for a conversation. */
export async function cancelQueued(conversationId: string, reason: string) {
  await db.message.updateMany({
    where: { conversationId, status: "queued" },
    data: { status: "cancelled", error: reason },
  });
}

async function sendQueued(m: Message & { conversation: { phone: string; optedOut: boolean } }) {
  // claim it so two workers never send the same text
  const claimed = await db.message.updateMany({ where: { id: m.id, status: "queued" }, data: { status: "sending" } });
  if (!claimed.count) return;
  if (m.conversation.optedOut) {
    await db.message.update({ where: { id: m.id }, data: { status: "cancelled", error: "opted out" } });
    return;
  }
  const r = await deliver(m.conversation.phone, m.body);
  await db.$transaction([
    db.message.update({ where: { id: m.id }, data: { ...r, createdAt: new Date() } }),
    db.conversation.update({ where: { id: m.conversationId }, data: { lastMessageAt: new Date() } }),
  ]);
}

/** Sends every queued text that is due. Runs every minute (see src/instrumentation.ts). */
export async function processDueTexts() {
  if (!inTextWindow()) return 0;
  const due = await db.message.findMany({
    where: { status: "queued", scheduledAt: { lte: new Date() } },
    include: { conversation: { select: { phone: true, optedOut: true } } },
    orderBy: { scheduledAt: "asc" },
    take: 25,
  });
  for (const m of due) await sendQueued(m);
  return due.length;
}

/** Sends a queued text immediately if it's already due (used for the instant reply). */
export async function sendIfDue(messageId: string) {
  const m = await db.message.findUnique({ where: { id: messageId }, include: { conversation: { select: { phone: true, optedOut: true } } } });
  if (m && m.status === "queued" && m.scheduledAt && m.scheduledAt <= new Date()) await sendQueued(m);
}

/** Plain alert to a staff cell phone (not stored in any customer thread). */
export async function alertStaff(body: string) {
  const to = process.env.STAFF_ALERT_PHONE;
  if (!to || !smsLive()) return;
  await deliver(to, body);
}
