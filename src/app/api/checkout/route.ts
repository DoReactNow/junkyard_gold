import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/business";
import { BUSINESS } from "@/lib/business";
import { createCheckout, paymentsLive, startCheckout } from "@/lib/payments";
import { specsFor } from "@/lib/specs";
import { unitOptions, unitRef } from "@/lib/unit-options";

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

/** A unit we source to order. The price is worked out here, never taken from the browser. */
async function goUnit(form: FormData) {
  const field = (k: string) => String(form.get(k) || "");
  const v = { year: parseInt(field("year"), 10), make: field("make"), model: field("model"), partType: field("partType"), spec: field("spec") };
  const unit = v.year && specsFor(v.year, v.make, v.model, v.partType).includes(v.spec) ? (await unitOptions(v))?.[parseInt(field("tier"), 10)] : null;
  if (!unit) return NextResponse.redirect(`${siteUrl()}/checkout/unavailable`, 303);

  const ref = unitRef(v);
  const title = `${v.year} ${v.make} ${v.model} Used ${v.partType}`;
  const line = `${v.spec} · ${unit.miles.toLocaleString()} miles`;
  const q = new URLSearchParams({ year: String(v.year), make: v.make, model: v.model, type: v.partType, spec: v.spec });
  const unavailable = () => NextResponse.redirect(`${siteUrl()}/checkout/unavailable?${new URLSearchParams({ slug: `${title}, ${line} at $${unit.price.toLocaleString("en-US")} (ref ${ref})` })}`, 303);
  if (!paymentsLive()) return unavailable();
  try {
    const url = await startCheckout({
      title,
      price: unit.price,
      description: `${line} · ${BUSINESS.warrantyAdj} warranty · Ref ${ref}`,
      metadata: { item: `${title}, ${line}`, stockNo: ref },
      cancelPath: `/parts/options?${q}`,
    });
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error("Stripe checkout failed", err);
    return unavailable();
  }
}

// From the "Buy Now" button
export async function POST(req: Request) {
  const form = await req.formData();
  if (form.has("tier")) return goUnit(form);
  return go(String(form.get("slug") || ""));
}

// From a pay link texted by staff
export async function GET(req: Request) {
  return go(new URL(req.url).searchParams.get("slug"));
}
