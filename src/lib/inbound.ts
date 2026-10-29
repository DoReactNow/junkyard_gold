import { db } from "./db";
import { BUSINESS } from "./business";
import { decodeVin, findVinInText } from "./vin";
import { sendText } from "./sms";
import { stopFollowups } from "./followups";

// Carrier keywords (same list RingCentral uses)
const STOP = /^\s*(stop|stopall|unsubscribe|cancel|end|quit)\s*[.!]?\s*$/i;
const START = /^\s*(start|unstop|subscribe|resume|continue)\s*[.!]?\s*$/i;
const HELP = /^\s*(help|info)\s*[.!?]?\s*$/i;

/**
 * Stores an incoming customer text, handles STOP / START / HELP, and ends the automatic
 * follow-ups (a customer who replies is talking to a person now).
 * Returns the conversation and whether staff should get a draft reply.
 */
export async function recordInbound(from: string, body: string, providerId: string | null) {
  if (providerId && (await db.message.findFirst({ where: { providerId } }))) return { convo: null, needsReply: false }; // duplicate webhook

  const vin = findVinInText(body);
  const decoded = vin ? await decodeVin(vin).catch(() => null) : null;

  const convo = await db.conversation.upsert({
    where: { phone: from },
    create: { phone: from, vin, vehicle: decoded?.summary ?? null, unread: true },
    update: { unread: true, lastMessageAt: new Date(), ...(vin ? { vin } : {}), ...(decoded ? { vehicle: decoded.summary } : {}) },
  });
  await db.message.create({
    data: { conversationId: convo.id, direction: "in", author: "customer", kind: "inbound", body, status: "received", providerId },
  });

  if (STOP.test(body)) {
    await stopFollowups(convo.id, "customer replied STOP");
    // Carriers expect one confirmation; RingCentral leaves it to the app.
    await sendText({
      conversationId: convo.id, to: from, author: "auto", kind: "optout",
      body: `${BUSINESS.name}: you're unsubscribed and won't get more texts from us. Reply START to opt back in.`,
    });
    await db.conversation.update({ where: { id: convo.id }, data: { optedOut: true, aiDraft: null, aiDraftNote: null, aiDraftParts: null } });
    return { convo, needsReply: false };
  }
  if (START.test(body)) {
    await db.conversation.update({ where: { id: convo.id }, data: { optedOut: false } });
    await sendText({ conversationId: convo.id, to: from, author: "auto", kind: "optin", body: `${BUSINESS.name}: you're subscribed again. Reply STOP to opt out.` });
    return { convo, needsReply: false };
  }
  if (HELP.test(body)) {
    await sendText({
      conversationId: convo.id, to: from, author: "auto", kind: "help",
      body: `${BUSINESS.name} parts quotes. Call ${BUSINESS.phoneDisplay} or email ${BUSINESS.email}. Msg & data rates may apply. Reply STOP to opt out.`,
    });
    return { convo, needsReply: false };
  }

  await stopFollowups(convo.id, "customer replied");
  return { convo, needsReply: !convo.optedOut };
}
