import { db } from "./db";
import { decodeVin, findVinInText } from "./vin";

const STOP = /^\s*(stop|stopall|unsubscribe|cancel|end|quit)\s*$/i;
const START = /^\s*(start|unstop|yes)\s*$/i;

/** Stores an incoming customer text. Returns the conversation and whether it was an opt-out. */
export async function recordInbound(from: string, body: string, providerId: string | null) {
  const vin = findVinInText(body);
  const decoded = vin ? await decodeVin(vin).catch(() => null) : null;

  const convo = await db.conversation.upsert({
    where: { phone: from },
    create: { phone: from, vin, vehicle: decoded?.summary ?? null, unread: true },
    update: { unread: true, lastMessageAt: new Date(), ...(vin ? { vin } : {}), ...(decoded ? { vehicle: decoded.summary } : {}) },
  });
  await db.message.create({
    data: { conversationId: convo.id, direction: "in", author: "customer", body, status: "received", providerId },
  });

  if (STOP.test(body)) {
    await db.conversation.update({ where: { id: convo.id }, data: { optedOut: true, aiDraft: null, aiDraftNote: null, aiDraftParts: null } });
    return { convo, stopped: true };
  }
  if (START.test(body)) await db.conversation.update({ where: { id: convo.id }, data: { optedOut: false } });
  return { convo, stopped: false };
}
