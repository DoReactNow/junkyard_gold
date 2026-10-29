import { after } from "next/server";
import { refreshDraft } from "@/lib/ai";
import { recordInbound } from "@/lib/inbound";
import { alertStaff, validateTwilioRequest } from "@/lib/sms";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { siteUrl } from "@/lib/business";

const twiml = () =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, { headers: { "Content-Type": "text/xml" } });

/** Twilio "A message comes in" webhook: POST {SITE_URL}/api/sms/inbound */
export async function POST(req: Request) {
  const form = await req.formData();
  const params = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  if (!validateTwilioRequest(req.headers.get("x-twilio-signature"), `${siteUrl()}/api/sms/inbound`, params)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const from = normalizePhone(params.From) || params.From;
  const body = (params.Body || "").trim();
  if (!from || !body) return twiml();

  const { convo, stopped } = await recordInbound(from, body, params.MessageSid || null);
  // On STOP, Twilio sends the carrier-required opt-out confirmation itself.
  if (!stopped) {
    after(async () => {
      await refreshDraft(convo.id).catch((e) => console.error("draft failed", e));
      await alertStaff(`Text from ${formatPhone(from)}: "${body.slice(0, 80)}" ${siteUrl()}/admin?c=${convo.id}`);
    });
  }
  return twiml();
}
