export const BUSINESS = {
  name: "Junkyard Gold",
  domain: "junkyardgold.com",
  phoneDisplay: "904-481-5300",
  phoneE164: "+19044815300",
  email: "support@junkyardgold.com",
  street: "2727 75th St W",
  city: "Bradenton",
  state: "FL",
  zip: "34209",
  warranty: "3 months",
  warrantyAdj: "3-month",
  hours: "Mon–Fri 10:00 AM – 6:00 PM ET",
  // Engines & transmissions available through our vendor network (what we can source, not what is listed online)
  networkSize: "100K+",
  founded: 2022,
  // Parts sold since founding (owner figure)
  soldSince: "100K+",
} as const;

export const ADDRESS_LINE = `${BUSINESS.street}, ${BUSINESS.city}, ${BUSINESS.state} ${BUSINESS.zip}`;

export const SMS_HREF = `sms:${BUSINESS.phoneE164}`;
export const TEL_HREF = `tel:${BUSINESS.phoneE164}`;

export function smsWithBody(body: string) {
  // "?&body=" works on both iOS and Android
  return `${SMS_HREF}?&body=${encodeURIComponent(body)}`;
}

export const siteUrl = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** True during business hours: Mon–Fri, 10:00–18:00 Florida (Eastern) time. */
export function isOpenNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
  const day = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  return day !== "Sat" && day !== "Sun" && hour >= 10 && hour < 18;
}
