import Stripe from "stripe";
import type { Part } from "@prisma/client";
import { siteUrl } from "./business";
import { partUrl } from "./inventory";

export const paymentsLive = () => Boolean(process.env.STRIPE_SECRET_KEY);

let stripe: Stripe | null = null;
export const getStripe = () => (stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!));

/** Public link staff can text to a customer; opens Stripe Checkout for this unit. */
export function payLink(part: Pick<Part, "slug">) {
  return `${siteUrl()}/api/checkout?slug=${encodeURIComponent(part.slug)}`;
}

export async function createCheckout(part: Part) {
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: part.price * 100,
          product_data: {
            name: part.title,
            description: [part.mileage ? `${part.mileage.toLocaleString()} miles` : "", `${part.warranty} warranty`, part.stockNo ? `Stock ${part.stockNo}` : ""]
              .filter(Boolean)
              .join(" · "),
          },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    shipping_address_collection: { allowed_countries: ["US"] },
    custom_text: {
      submit: { message: "We confirm fitment with your VIN and text you the freight cost before the part ships." },
    },
    metadata: { partId: part.id, stockNo: part.stockNo || "" },
    success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}${partUrl(part)}`,
  });
  return session.url!;
}
