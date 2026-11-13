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
  hours: "Mon–Fri 10:00 AM – 7:00 PM ET", // calls
  textHours: "7 days a week",
  contactHours: "Calls Mon–Fri 10 AM – 7 PM ET · Texts 7 days a week",
  deliveryDays: "5–7 days",
  replacementDays: 90,
  coverage: "All 50 states",
  freeDeliveryArea: "lower 48 states", // Alaska and Hawaii shop delivery is quoted
  // Engines & transmissions available through our vendor network (what we can source, not what is listed online).
  // Always word it as a network ("from a network of 100K+"), never as our own stock, so it can't be read as
  // the same claim as soldSince.
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

// Production builds fall back to the live domain: robots.txt is prerendered at build time, when SITE_URL
// isn't set, and once shipped "Sitemap: http://localhost:3000/sitemap.xml" to search engines.
const DEFAULT_SITE_URL = process.env.NODE_ENV === "production" ? "https://junkyardgold.com" : "http://localhost:3000";
export const siteUrl = () => (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");

/**
 * Google review link from the Business Profile ("Ask for reviews" → share link). Review requests stay
 * off until it's set (REVIEW_URL on the server, from the GitHub repository variable of the same name).
 */
export const reviewUrl = () => process.env.REVIEW_URL?.trim() || null;

export type Delivery = "shop" | "home";
export const parseDelivery = (v: unknown): Delivery => (v === "home" ? "home" : "shop");
export const deliveryLine = (d: Delivery) => (d === "home" ? "Home delivery (quoted by text before it ships)" : "Free delivery to repair shop");

/** Staff hours in Florida (Eastern) time, 24-hour clock: 10 AM to 7 PM. */
export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 19;

/** True during phone hours: Mon–Fri, 10:00–19:00 Florida (Eastern) time. */
export function isOpenNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
  const day = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  return day !== "Sat" && day !== "Sun" && hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}

/** True when staff answer texts: every day, 10:00–19:00 Florida (Eastern) time. */
export function isTextingNow(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(now));
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}
