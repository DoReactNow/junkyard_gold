import { after, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, formatPhone } from "@/lib/phone";
import { cleanVin, decodeVin, isVin } from "@/lib/vin";
import { refreshDraft } from "@/lib/ai";
import { alertStaff, sendText } from "@/lib/sms";
import { BUSINESS, isOpenNow, siteUrl } from "@/lib/business";

const Body = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(80),
  phone: z.string().max(40),
  email: z.string().trim().max(120).optional().nullable(),
  vinOrVehicle: z.string().trim().max(120).optional().nullable(),
  partType: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  smsConsent: z.boolean(),
  partSlug: z.string().max(120).optional().nullable(),
  sourcePage: z.string().max(200).optional().nullable(),
  gclid: z.string().max(200).optional().nullable(),
  website: z.string().optional().nullable(), // honeypot: real people leave it empty
});

// Best-effort throttle per IP (resets when the server restarts).
const hits = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 8;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (throttled(ip)) return NextResponse.json({ error: "Too many requests. Please call or text us." }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  const b = parsed.data;
  if (b.website) return NextResponse.json({ ok: true }); // bot

  const phone = normalizePhone(b.phone);
  if (!phone) return NextResponse.json({ error: "Please enter a valid 10-digit US mobile number." }, { status: 400 });
  if (!b.smsConsent) return NextResponse.json({ error: "Please agree to receive texts so we can send your options." }, { status: 400 });

  const raw = b.vinOrVehicle || "";
  const maybeVin = cleanVin(raw);
  const vin = isVin(maybeVin) ? maybeVin : null;
  const decoded = vin ? await decodeVin(vin).catch(() => null) : null;
  const vehicle = decoded?.summary || (vin ? null : raw || null);
  const part = b.partSlug ? await db.part.findUnique({ where: { slug: b.partSlug } }) : null;
  const partType = b.partType === "Other" ? (part?.partType ?? "Other") : b.partType || part?.partType || null;

  // Same phone + same vehicle within 10 minutes = double submit; don't text twice.
  const dup = await db.lead.findFirst({
    where: { phone, createdAt: { gte: new Date(Date.now() - 10 * 60_000) }, vin: vin ?? undefined, vehicle: vin ? undefined : vehicle },
  });
  if (dup) return NextResponse.json({ ok: true, duplicate: true });

  const convo = await db.conversation.upsert({
    where: { phone },
    create: { phone, name: b.name, vin, vehicle, partType, unread: true },
    update: {
      name: b.name,
      unread: true,
      optedOut: false, // a new opt-in after STOP re-subscribes
      lastMessageAt: new Date(),
      ...(vin ? { vin } : {}),
      ...(vehicle ? { vehicle } : {}),
      ...(partType ? { partType } : {}),
    },
  });

  const lead = await db.lead.create({
    data: {
      name: b.name, phone, email: b.email || null, vin, vehicle, partType, notes: b.notes || null,
      smsConsent: true, sourcePage: b.sourcePage || null, gclid: b.gclid || null, conversationId: convo.id,
    },
  });

  const summary = [
    `New web request from ${b.name}`,
    vehicle && `Vehicle: ${vehicle}`,
    vin && `VIN: ${vin}`,
    partType && `Needs: ${partType}`,
    part && `Viewing: ${part.title} – $${part.price} (${part.stockNo || part.slug})`,
    b.notes && `Notes: ${b.notes}`,
    b.sourcePage && `Page: ${b.sourcePage}`,
  ].filter(Boolean).join("\n");
  await db.message.create({ data: { conversationId: convo.id, direction: "note", author: "system", body: summary, status: "received" } });

  const first = b.name.split(" ")[0];
  await sendText({
    conversationId: convo.id,
    to: phone,
    author: "auto",
    body: `Hi ${first}, this is ${BUSINESS.name} in Bradenton, FL. We got your request${vehicle ? ` for your ${vehicle}` : ""}. ${isOpenNow() ? "A parts specialist is checking stock now and will text you options shortly." : `We're open ${BUSINESS.hours} and a parts specialist will text you options as soon as we're back.`} Reply STOP to opt out.`,
  });

  after(async () => {
    await refreshDraft(convo.id).catch((e) => console.error("draft failed", e));
    await alertStaff(`New lead: ${b.name} ${formatPhone(phone)} – ${vehicle || "no vehicle"} – ${partType || "part"}. ${siteUrl()}/admin?c=${convo.id}`);
    if (process.env.WEB3FORMS_ACCESS_KEY) {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: process.env.WEB3FORMS_ACCESS_KEY,
          subject: `New parts request – ${vehicle || b.name}`,
          from_name: `${BUSINESS.name} website`,
          name: b.name, phone: formatPhone(phone), message: summary, lead_id: lead.id,
        }),
      }).catch((e) => console.error("email copy failed", e));
    }
  });

  return NextResponse.json({ ok: true });
}
