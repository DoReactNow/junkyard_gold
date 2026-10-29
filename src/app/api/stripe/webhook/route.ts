import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/payments";
import { normalizePhone } from "@/lib/phone";
import { alertStaff } from "@/lib/sms";

/** Stripe webhook (event: checkout.session.completed) → marks the unit sold. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "not configured" }, { status: 501 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") || "", secret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const partId = s.metadata?.partId;
    const part = partId ? await db.part.update({ where: { id: partId }, data: { status: "sold" } }).catch(() => null) : null;
    const phone = normalizePhone(s.customer_details?.phone);
    const amount = ((s.amount_total || 0) / 100).toFixed(2);
    const ship = s.collected_information?.shipping_details?.address;
    const note = `PAID $${amount} – ${part?.title || "part"} (${part?.stockNo || partId}). Ship to: ${
      ship ? [ship.line1, ship.city, ship.state, ship.postal_code].filter(Boolean).join(", ") : "n/a"
    }`;
    if (phone) {
      const convo = await db.conversation.upsert({
        where: { phone },
        create: { phone, name: s.customer_details?.name || null, unread: true },
        update: { unread: true, lastMessageAt: new Date() },
      });
      await db.message.create({ data: { conversationId: convo.id, direction: "note", author: "system", body: note, status: "received" } });
      await db.lead.updateMany({ where: { conversationId: convo.id, status: { in: ["new", "quoted"] } }, data: { status: "won" } });
    }
    await alertStaff(`💰 ${note}`);
  }
  return NextResponse.json({ received: true });
}
