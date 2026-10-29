import { BUSINESS } from "./business";

const OWN_NUMBERS = [BUSINESS.phoneE164.slice(2)];

/** Valid US/CA mobile-style number -> E.164 ("+1XXXXXXXXXX"), otherwise null. */
export function normalizePhone(input: string | null | undefined): string | null {
  let d = (input || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length !== 10) return null;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(d)) return null; // NANP area code + exchange
  if (/^(\d)\1{9}$/.test(d)) return null; // 2222222222
  if (d.slice(3, 6) === "555") return null; // fictional numbers
  if ("01234567890123456789".includes(d) || "98765432109876543210".includes(d)) return null;
  if (OWN_NUMBERS.includes(d)) return null;
  return `+1${d}`;
}

export function formatPhone(e164: string) {
  const d = e164.replace(/\D/g, "").slice(-10);
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
