import { db } from "./db";
import { BUSINESS, siteUrl } from "./business";
import { decodeVin, findVinInText } from "./vin";
import { alertStaff, sendText } from "./sms";
import { refreshDraft } from "./ai";
import { formatPhone, normalizePhone } from "./phone";
import { rcInboundSince, ringCentralConfigured } from "./ringcentral";
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

/** Draft a reply and alert staff for a text recordInbound just stored. */
export async function afterInbound(conversationId: string, from: string, text: string) {
  await refreshDraft(conversationId).catch((e) => console.error("draft failed", e));
  await alertStaff(`Text from ${formatPhone(from)}: "${text.slice(0, 80)}" ${siteUrl()}/admin?c=${conversationId}`);
}

const LOOKBACK = 24 * 3600_000;
const WEBHOOK_HEAD_START = 90_000; // give the webhook first go, so the two can't store one text twice

/**
 * Backstop for the webhook: picks up any incoming text RingCentral didn't deliver to us.
 * Texts already stored are skipped by recordInbound. Runs every minute (src/instrumentation.ts).
 */
export async function pollInbound() {
  if (!ringCentralConfigured()) return 0;
  const now = Date.now();
  const records = await rcInboundSince(new Date(now - LOOKBACK));
  let added = 0;
  for (const m of [...records].reverse()) {
    const text = (m.subject || "").trim();
    const raw = m.from?.phoneNumber;
    if (!text || !raw || raw === process.env.RINGCENTRAL_FROM_NUMBER) continue;
    if (m.creationTime && now - new Date(m.creationTime).getTime() < WEBHOOK_HEAD_START) continue;
    const from = normalizePhone(raw) || raw;
    const { convo, needsReply } = await recordInbound(from, text, String(m.id));
    if (!convo) continue;
    added++;
    if (needsReply) await afterInbound(convo.id, from, text);
  }
  return added;
}

// Shared on globalThis: the timers and the admin page load this code separately
type InboundHealth = { webhook?: string; webhookError?: string; pollError?: string; polledAt?: string };
const store = globalThis as unknown as { __jgInbound?: InboundHealth };
export const inboundHealth = (): InboundHealth => store.__jgInbound ?? {};
export const noteInbound = (patch: InboundHealth) => {
  store.__jgInbound = { ...store.__jgInbound, ...patch };
};
