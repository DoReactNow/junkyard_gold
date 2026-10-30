import { BUSINESS, isTextingNow } from "./business";
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
  await cancelQueued(opts.conversationId, "replaced by a new request");

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
  const queued = await db.message.count({ where: { conversationId, status: "queued" } });
  if (queued) await cancelQueued(conversationId, reason);
}
