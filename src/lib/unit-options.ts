import { db } from "./db";
import { makeWhere, modelMatches } from "./vehicles";
import { listPrice, mileBand, milesFor, stockNoFor } from "./sales-import";

export type Vehicle = { year: number; make: string; model: string; partType: string; spec: string };
export type UnitOption = { tier: number; label: string; price: number; miles: number };

// Price step between the three options, from the base price of the highest-mileage unit
export const TIER_MARKUPS = [1, 1.06, 1.15];
const TIER_LABELS = ["Best value", "Mid miles", "Lowest miles"];

const median = (xs: number[]) => {
  const a = [...xs].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
};
const litres = (s: string) => s.match(/\d+\.\d(?=\s*L)/i)?.[0];

/**
 * Base price from what we've listed: same model and engine size, then same model, then same make.
 * Null when we have too little to go on (rare or high-end makes), and staff quote by text instead.
 */
async function basePrice(v: Vehicle) {
  const rows = await db.part.findMany({
    where: { partType: v.partType, year: { gte: v.year - 5, lte: v.year + 5 }, ...makeWhere(v.make) },
    select: { price: true, year: true, model: true, spec: true },
  });
  const model = rows.filter((r) => Math.abs(r.year - v.year) <= 3 && modelMatches(r.model, v.model));
  const size = litres(v.spec);
  const sameSize = size ? model.filter((r) => litres(r.spec) === size) : [];
  if (sameSize.length) return median(sameSize.map((r) => r.price));
  if (model.length >= 2) return median(model.map((r) => r.price));
  if (rows.length >= 3) return median(rows.map((r) => r.price));
  return null;
}

/** Three high-to-low mileage figures inside the owner's band for this model year. */
function tierMiles(v: Vehicle) {
  const [lo, hi] = mileBand(v.year);
  const mid = milesFor(v.year, `${v.year}|${v.make}|${v.model}|${v.spec}`);
  const step = Math.max(5000, Math.round((mid * 0.18) / 1000) * 1000);
  const centre = Math.min(hi - step, Math.max(lo + step, mid));
  return [centre + step, centre, centre - step];
}

/**
 * Options for a listed part: the listing itself, then lower-mileage units at the same price steps.
 * Steps shrink to stay inside the model year's mileage band; too little room leaves fewer options.
 */
export function listedOptions(part: { year: number; price: number; mileage: number | null }): UnitOption[] {
  const miles = part.mileage;
  if (!miles) return [{ tier: 0, label: TIER_LABELS[0], price: part.price, miles: 0 }];
  const [lo] = mileBand(part.year);
  const step = Math.min(Math.max(5000, Math.round((miles * 0.18) / 1000) * 1000), Math.floor((miles - lo) / 2000) * 1000);
  if (step < 3000) return [{ tier: 0, label: TIER_LABELS[0], price: part.price, miles }];
  return TIER_MARKUPS.map((m, tier) => ({
    tier,
    label: TIER_LABELS[tier],
    price: tier ? listPrice(part.price * m) : part.price,
    miles: miles - step * tier,
  }));
}

export const unitRef = (v: Vehicle) => stockNoFor(`${v.year}|${v.make}|${v.model}|${v.partType}|${v.spec}`);

export async function unitOptions(v: Vehicle): Promise<UnitOption[] | null> {
  const base = await basePrice(v);
  if (!base) return null;
  const miles = tierMiles(v);
  return TIER_MARKUPS.map((m, tier) => ({ tier, label: TIER_LABELS[tier], price: listPrice(base * m), miles: miles[tier] }));
}
