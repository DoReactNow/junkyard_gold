// RingCentral REST API: JWT sign-in, sending SMS, and the webhook subscription for incoming texts.
// Docs: developers.ringcentral.com/guide/authentication/jwt-flow, /messaging/sms/sending-sms,
//       /notifications/webhooks/creating-webhooks, /notifications/event-filters/instant-message
import { siteUrl } from "./business";

const server = () => (process.env.RINGCENTRAL_SERVER || "https://platform.ringcentral.com").replace(/\/$/, "");

export const ringCentralConfigured = () =>
  Boolean(
    process.env.RINGCENTRAL_CLIENT_ID &&
      process.env.RINGCENTRAL_CLIENT_SECRET &&
      process.env.RINGCENTRAL_JWT &&
      process.env.RINGCENTRAL_FROM_NUMBER,
  );

let token: { value: string; expiresAt: number } | null = null;

async function accessToken() {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const basic = Buffer.from(`${process.env.RINGCENTRAL_CLIENT_ID}:${process.env.RINGCENTRAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${server()}/restapi/oauth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: process.env.RINGCENTRAL_JWT! }),
  });
  if (!res.ok) throw new Error(`RingCentral sign-in failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return token.value;
}

async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${server()}/restapi/v1.0${path}`, {
    method: init.method || "GET",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", Accept: "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401) token = null;
  if (!res.ok) throw new Error(`RingCentral ${init.method || "GET"} ${path} failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

/** Sends one SMS from RINGCENTRAL_FROM_NUMBER (must be an SMS-enabled number on the signed-in extension). */
export async function rcSendSms(to: string, text: string) {
  const msg = await api<{ id: number | string; messageStatus?: string }>("/account/~/extension/~/sms", {
    method: "POST",
    body: { from: { phoneNumber: process.env.RINGCENTRAL_FROM_NUMBER }, to: [{ phoneNumber: to }], text },
  });
  return String(msg.id);
}

/** Message text, for notifications that arrive without `subject`. */
export async function rcMessageText(id: string) {
  const msg = await api<{ subject?: string }>(`/account/~/extension/~/message-store/${encodeURIComponent(id)}`);
  return msg.subject || "";
}

export const webhookUrl = () => `${siteUrl()}/api/sms/inbound`;
const EVENT_FILTER = "/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS";
const WEEK = 7 * 24 * 3600;

type Subscription = { id: string; status: string; expirationTime: string; deliveryMode?: { address?: string } };

/**
 * Makes sure RingCentral posts incoming texts to /api/sms/inbound: creates the webhook
 * subscription if missing and renews it before it expires. Safe to run repeatedly.
 */
export async function ensureInboundSubscription(): Promise<string> {
  if (!ringCentralConfigured()) return "RingCentral not configured";
  if (!siteUrl().startsWith("https://")) return "SITE_URL must be https for webhooks";
  const list = await api<{ records: Subscription[] }>("/subscription");
  const mine = list.records.find((s) => s.deliveryMode?.address === webhookUrl() && s.status === "Active");
  if (mine) {
    const left = new Date(mine.expirationTime).getTime() - Date.now();
    if (left > 2 * 24 * 3600 * 1000) return `subscription ${mine.id} ok`;
    await api(`/subscription/${mine.id}/renew`, { method: "POST" });
    return `subscription ${mine.id} renewed`;
  }
  const created = await api<Subscription>("/subscription", {
    method: "POST",
    body: {
      eventFilters: [EVENT_FILTER],
      deliveryMode: { transportType: "WebHook", address: webhookUrl(), verificationToken: process.env.RINGCENTRAL_WEBHOOK_TOKEN || undefined },
      expiresIn: WEEK,
    },
  });
  return `subscription ${created.id} created`;
}
