import Stripe from "stripe";
import type { Part } from "@prisma/client";
import { deliveryLine, siteUrl, type Delivery } from "./business";
import { partUrl, warrantyAdj } from "./inventory";

export const paymentsLive = () => Boolean(process.env.STRIPE_SECRET_KEY);

let stripe: Stripe | null = null;
export const getStripe = () => (stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!));

/** Public link staff can text to a customer; opens Stripe Checkout for this unit. */
export function payLink(part: Pick<Part, "slug">) {
  return `${siteUrl()}/api/checkout?slug=${encodeURIComponent(part.slug)}`;
}

type CheckoutItem = { title: string; price: number; description: string; metadata: Record<string, string>; cancelPath: string; delivery: Delivery };

export const createCheckout = (part: Part, delivery: Delivery) =>
  startCheckout({
    title: part.title,
    price: part.price,
    description: [part.mileage ? `${part.mileage.toLocaleString()} miles` : "", `${warrantyAdj(part.warranty)} warranty`, part.stockNo ? `Stock ${part.stockNo}` : ""]
      .filter(Boolean)
      .join(" · "),
    metadata: { partId: part.id, stockNo: part.stockNo || "" },
    cancelPath: partUrl(part),
    delivery,
  });

export async function startCheckout(item: CheckoutItem) {
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: item.price * 100,
          product_data: { name: item.title, description: `${item.description} · ${deliveryLine(item.delivery)}` },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    shipping_address_collection: { allowed_countries: ["US"] },
    custom_text: {
      submit: { message: item.delivery === "home" ? "We deliver to the lower 48 states. We confirm fitment with your VIN and text you the home delivery cost ($200–$500, based on the part price) before the part ships. All sales are final unless something goes wrong with the part." : "We deliver to the lower 48 states. We confirm fitment with your VIN before the part ships. Delivery to your repair shop is free. All sales are final unless something goes wrong with the part." },
    },
    metadata: { ...item.metadata, delivery: deliveryLine(item.delivery) },
    success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}${item.cancelPath}`,
  });
  return session.url!;
}
