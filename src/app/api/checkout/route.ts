import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/business";
import { createCheckout, paymentsLive } from "@/lib/payments";

async function go(slug: string | null) {
  const part = slug ? await db.part.findUnique({ where: { slug } }) : null;
  if (!part || part.status !== "available") {
    return NextResponse.redirect(`${siteUrl()}/checkout/unavailable?reason=sold`, 303);
  }
  if (!paymentsLive()) {
    return NextResponse.redirect(`${siteUrl()}/checkout/unavailable?slug=${encodeURIComponent(part.slug)}`, 303);
  }
  try {
    return NextResponse.redirect(await createCheckout(part), 303);
  } catch (err) {
    console.error("Stripe checkout failed", err);
    return NextResponse.redirect(`${siteUrl()}/checkout/unavailable?slug=${encodeURIComponent(part.slug)}`, 303);
  }
}

// From the "Buy Now" button
export async function POST(req: Request) {
  const form = await req.formData();
  return go(String(form.get("slug") || ""));
}

// From a pay link texted by staff
export async function GET(req: Request) {
  return go(new URL(req.url).searchParams.get("slug"));
}
