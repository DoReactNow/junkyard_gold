export const BUSINESS = {
  name: "Junkyard Gold",
  domain: "junkyardgold.com",
  // calls
  phoneDisplay: "904-481-5300",
  phoneE164: "+19044815300",
  // texts (the RingCentral number; also RINGCENTRAL_FROM_NUMBER in deploy.yml)
  smsDisplay: "847-874-5972",
  smsE164: "+18478745972",
  email: "support@junkyardgold.com",
  street: "2727 75th St W",
  city: "Bradenton",
  state: "FL",
  zip: "34209",
  warranty: "3 months",
  warrantyAdj: "3-month",
  hours: "Mon–Fri 10:00 AM – 6:00 PM ET", // calls
  textHours: "7 days a week",
  contactHours: "Calls Mon–Fri 10 AM – 6 PM ET · Texts 7 days a week",
  deliveryDays: "5–7 days",
  replacementDays: 90,
  homeDeliveryFee: "$200–$500", // set by the price of the part
  coverage: "Lower 48 states", // no Alaska or Hawaii
  // Engines & transmissions available through our vendor network (what we can source, not what is listed online)
  networkSize: "100K+",
  founded: 2022,
  // Parts sold since founding (owner figure)
  soldSince: "100K+",
} as const;

export const ADDRESS_LINE = `${BUSINESS.street}, ${BUSINESS.city}, ${BUSINESS.state} ${BUSINESS.zip}`;

export const SMS_HREF = `sms:${BUSINESS.smsE164}`;
export const TEL_HREF = `tel:${BUSINESS.phoneE164}`;

export function smsWithBody(body: string) {
  // "?&body=" works on both iOS and Android
  return `${SMS_HREF}?&body=${encodeURIComponent(body)}`;
}

export const siteUrl = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export type Delivery = "shop" | "home";
export const parseDelivery = (v: unknown): Delivery => (v === "home" ? "home" : "shop");
export const deliveryLine = (d: Delivery) => (d === "home" ? `Home delivery (${BUSINESS.homeDeliveryFee} based on the part price, confirmed by text before it ships)` : "Free delivery to repair shop");

/** True during phone hours: Mon–Fri, 10:00–18:00 Florida (Eastern) time. */
export function isOpenNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
  const day = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  return day !== "Sat" && day !== "Sun" && hour >= 10 && hour < 18;
}

/** True when staff answer texts: every day, 10:00–18:00 Florida (Eastern) time. */
export function isTextingNow(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(now));
  return hour >= 10 && hour < 18;
}
