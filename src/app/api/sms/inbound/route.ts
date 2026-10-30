import { after } from "next/server";
import { timingSafeEqual } from "crypto";
import { afterInbound, recordInbound } from "@/lib/inbound";
import { rcMessageText } from "@/lib/ringcentral";
import { normalizePhone } from "@/lib/phone";

type Notification = {
  event?: string;
  body?: { id?: string | number; type?: string; direction?: string; subject?: string; from?: { phoneNumber?: string } };
};

function tokenOk(got: string | null) {
  const want = process.env.RINGCENTRAL_WEBHOOK_TOKEN;
  if (!want) return true;
  if (!got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** RingCentral webhook for incoming texts: POST {SITE_URL}/api/sms/inbound */
export async function POST(req: Request) {
  // Subscription handshake: echo the Validation-Token header back within 3 seconds.
  const validation = req.headers.get("validation-token");
  if (validation) {
    return new Response("", { status: 200, headers: { "Validation-Token": validation, "Content-Type": "application/json" } });
  }
  if (!tokenOk(req.headers.get("verification-token"))) return new Response("Forbidden", { status: 403 });

  const note = (await req.json().catch(() => ({}))) as Notification;
  const msg = note.body;
  if (!msg || msg.type !== "SMS" || (msg.direction && msg.direction !== "Inbound")) return Response.json({ ok: true });

  const from = normalizePhone(msg.from?.phoneNumber) || msg.from?.phoneNumber;
  if (!from || from === process.env.RINGCENTRAL_FROM_NUMBER) return Response.json({ ok: true });
  const id = msg.id != null ? String(msg.id) : null;
  let text = (msg.subject || "").trim();
  if (!text && id) text = (await rcMessageText(id).catch(() => "")).trim();
  if (!text) return Response.json({ ok: true });

  const { convo, needsReply } = await recordInbound(from, text, id);
  if (convo && needsReply) {
    after(() => afterInbound(convo.id, from, text));
  }
  return Response.json({ ok: true });
}
