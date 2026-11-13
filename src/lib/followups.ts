import { BUSINESS, isTextingNow, reviewUrl } from "./business";
import { db } from "./db";
import { cancelQueued, queueText, sendIfDue } from "./sms";
import { nextTextWindow } from "./schedule";

const H = 3600 * 1000;
const D = 24 * H;

/**
 * For a web lead that ticked the SMS consent box: the instant "we got it" text, then
 * follow-ups after 3 hours, 1 day and 3 days (same wording as v1). All of them respect the
 * 10 AM–8 PM Eastern window, and a reply from the customer cancels the rest.
 */
export async function startLeadTexts(opts: { conversationId: string; name: string; vehicle: string | null; partType: string | null }) {
  await cancelQueued(opts.conversationId, "replaced by a new request", { keep: [REVIEW_KIND] });

  const first = opts.name.split(" ")[0];
  const hi = `Hi ${first},`;
  const vehicle = opts.vehicle || "vehicle";
  const part = (opts.partType && opts.partType !== "Other" ? opts.partType : "part").toLowerCase();
  const a = /^[aeiou]/.test(part) ? "an" : "a";
  const phone = BUSINESS.phoneDisplay;
  const now = new Date();
  const sendAt = nextTextWindow(now);

  const instant = await queueText({
    conversationId: opts.conversationId,
    kind: "instant",
    at: now,
    body:
      `Hi ${first}, this is ${BUSINESS.name} in Bradenton, FL. We got your request${opts.vehicle ? ` for your ${opts.vehicle}` : ""}. ` +
      (isTextingNow(sendAt)
        ? "A parts specialist is checking stock now and will text you options shortly."
        : `We answer texts ${BUSINESS.textHours} and a parts specialist will text you options as soon as we're back at 10 AM ET.`) +
      " Reply STOP to opt out.",
  });

  const follow = [
    { kind: "followup1", delay: 3 * H, body: `${hi} still looking for ${a} ${part} for your ${vehicle}? I can confirm exact price and availability. Just reply with your VIN, or call ${phone}.` },
    { kind: "followup2", delay: 1 * D, body: `${hi} quick follow-up on your ${vehicle} ${part} quote from ${BUSINESS.name}. Happy to answer questions or send photos of the actual unit. Just reply here.` },
    { kind: "followup3", delay: 3 * D, body: `${hi} last note from ${BUSINESS.name} about your ${vehicle} ${part}. If you still need it, reply here or call ${phone}. Reply STOP to opt out.` },
  ];
  for (const f of follow) {
    await queueText({ conversationId: opts.conversationId, kind: f.kind, body: f.body, at: new Date(now.getTime() + f.delay) });
  }

  await sendIfDue(instant.id);
}

/** A customer reply, STOP, or a closed lead ends the automatic follow-ups. */
export async function stopFollowups(conversationId: string, reason: string) {
  const queued = await db.message.count({ where: { conversationId, status: "queued", kind: { not: REVIEW_KIND } } });
  if (queued) await cancelQueued(conversationId, reason, { keep: [REVIEW_KIND] });
}

const REVIEW_KIND = "review";
/** Delivery takes 5–7 days; ask a few days after the part should have arrived. */
const REVIEW_DELAY = 10 * D;

/**
 * Queues one text asking a customer who bought for a Google review, 10 days after the sale.
 * Every buyer gets the same ask (no screening for happy customers, no incentive), at most once per
 * customer, and only when REVIEW_URL is set and the customer agreed to texts or texted us first.
 */
export async function queueReviewRequest(conversationId: string) {
  const url = reviewUrl();
  if (!url) return null;
  const convo = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { name: true, optedOut: true, leads: { select: { name: true, consentAt: true } }, messages: { where: { direction: "in" }, select: { id: true }, take: 1 } },
  });
  if (!convo || convo.optedOut) return null;
  const consented = convo.leads.some((l) => l.consentAt) || convo.messages.length > 0;
  if (!consented) return null;
  const asked = await db.message.count({ where: { conversationId, kind: REVIEW_KIND, status: { not: "cancelled" } } });
  if (asked) return null;
  const first = (convo.name || convo.leads[0]?.name || "").split(" ")[0];
  return queueText({
    conversationId,
    kind: REVIEW_KIND,
    at: new Date(Date.now() + REVIEW_DELAY),
    body:
      `Hi${first ? ` ${first}` : ""}, thanks for your order from ${BUSINESS.name}. If you have a minute, a Google review helps a small business a lot: ${url} ` +
      "If anything isn't right with your part, just reply here and we'll take care of it. Reply STOP to opt out.",
  });
}

/** An order marked lost or reopened: drop a review request that hasn't gone out yet. */
export async function cancelReviewRequest(conversationId: string, reason: string) {
  await cancelQueued(conversationId, reason, { kinds: [REVIEW_KIND] });
}
