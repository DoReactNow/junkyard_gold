import { db } from "./db";
import { normMake } from "./inventory";

export type Estimate = { low: number; high: number; basis: string };

function quantile(sorted: number[], q: number) {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  return sorted[lo] + (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) * (pos - lo);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Approximate price range for a part we don't have listed, from what similar parts sold for
 * (every listing, sold or not). Tries the closest match first and widens until it has enough
 * data. Returns null when there is nothing comparable — then staff quote by phone.
 */
export async function estimatePrice(q: { partType: string; year?: number | null; make?: string; model?: string }): Promise<Estimate | null> {
  const wantType = q.partType.trim();
  if (!wantType || wantType === "Other") return null;
  const rows = await db.part.findMany({
    where: { partType: { contains: wantType, mode: "insensitive" } },
    select: { price: true, year: true, make: true, model: true, partType: true },
  });
  const sameType = rows.filter((r) => r.partType.toLowerCase() === wantType.toLowerCase());
  if (!sameType.length) return null;

  const make = q.make ? normMake(q.make) : "";
  const model = q.model ? norm(q.model) : "";
  const near = (r: { year: number }, span: number) => !q.year || Math.abs(r.year - q.year) <= span;
  const sameModel = (r: { model: string }) => {
    const m = norm(r.model);
    return Boolean(model) && (m === model || m.includes(model) || model.includes(m));
  };

  const vehicle = [q.make, q.model].filter(Boolean).join(" ") || "vehicles";
  const tiers: [string, (r: (typeof rows)[number]) => boolean, number][] = [
    [`${vehicle} ${wantType.toLowerCase()}s near that year`, (r) => normMake(r.make) === make && sameModel(r) && near(r, 3), 2],
    [`${q.make || ""} ${wantType.toLowerCase()}s near that year`.trim(), (r) => normMake(r.make) === make && near(r, 5), 3],
    [`${wantType.toLowerCase()}s for vehicles that age`, (r) => near(r, 5), 5],
    [`${wantType.toLowerCase()}s we've sold`, () => true, 3],
  ];

  for (const [basis, test, min] of tiers) {
    const prices = sameType.filter(test).map((r) => r.price).sort((a, b) => a - b);
    if (prices.length < min) continue;
    let low = quantile(prices, 0.25);
    let high = quantile(prices, 0.75);
    if (high - low < low * 0.2) {
      // too few or too similar data points: show a sensible ±15% band
      const mid = (low + high) / 2;
      low = mid * 0.85;
      high = mid * 1.15;
    }
    return { low: Math.floor(low / 50) * 50, high: Math.ceil(high / 50) * 50, basis };
  }
  return null;
}

export const estimateText = (e: Estimate) => `$${e.low.toLocaleString("en-US")}–$${e.high.toLocaleString("en-US")}`;
