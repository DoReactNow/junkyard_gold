// Every US-market vehicle for the Year → Make → Model finder, so customers can find their
// vehicle even when we have nothing listed for it (they then get a price range + "text us").
// Models come from the free NHTSA vPIC database (cached for a month) merged with our own listings.
import { db } from "./db";
import { normMake } from "./inventory";
import { titleMake } from "./vin";

/** [make, first year, last year] for the US market. EV-only brands are left out (no engines). */
const US_MAKES: [string, number, number?][] = [
  ["Acura", 1986], ["Alfa Romeo", 1980], ["Aston Martin", 1980], ["Audi", 1980], ["Bentley", 1980], ["BMW", 1980],
  ["Buick", 1980], ["Cadillac", 1980], ["Chevrolet", 1980], ["Chrysler", 1980], ["Daewoo", 1999, 2002], ["Dodge", 1980],
  ["Eagle", 1988, 1998], ["Ferrari", 1980], ["Fiat", 1980], ["Ford", 1980], ["Freightliner", 1980], ["Genesis", 2017],
  ["Geo", 1989, 1997], ["GMC", 1980], ["Hino", 1980], ["Honda", 1980], ["Hummer", 1992, 2010], ["Hyundai", 1986],
  ["Infiniti", 1990], ["International", 1980], ["Isuzu", 1981], ["Jaguar", 1980], ["Jeep", 1980], ["Kenworth", 1980],
  ["Kia", 1994], ["Lamborghini", 1980], ["Land Rover", 1987], ["Lexus", 1990], ["Lincoln", 1980], ["Mack", 1980],
  ["Maserati", 1980], ["Mazda", 1980], ["Mercedes-Benz", 1980], ["Mercury", 1980, 2011], ["Mini", 2002],
  ["Mitsubishi", 1983], ["Nissan", 1983], ["Oldsmobile", 1980, 2004], ["Peterbilt", 1980], ["Plymouth", 1980, 2001],
  ["Pontiac", 1980, 2010], ["Porsche", 1980], ["Ram", 2011], ["Saab", 1980, 2011], ["Saturn", 1991, 2010],
  ["Scion", 2004, 2016], ["Smart", 2008, 2019], ["Subaru", 1980], ["Suzuki", 1985, 2013], ["Toyota", 1980],
  ["Volkswagen", 1980], ["Volvo", 1980], ["Western Star", 1980],
];

export const FIRST_YEAR = 1980;
export const lastYear = () => new Date().getFullYear() + 1;

export function finderYears() {
  const out: string[] = [];
  for (let y = lastYear(); y >= FIRST_YEAR; y--) out.push(String(y));
  return out;
}

export function makesForYear(year: number) {
  return US_MAKES.filter(([, from, to]) => year >= from && year <= (to ?? lastYear())).map(([m]) => m);
}

const VPIC_TYPES = ["passenger car", "truck", "multipurpose passenger vehicle (mpv)"];
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function vpicModels(make: string, year: number): Promise<string[]> {
  const lists = await Promise.all(
    VPIC_TYPES.map(async (t) => {
      try {
        const res = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/${encodeURIComponent(t)}?format=json`,
          { next: { revalidate: 60 * 60 * 24 * 30 }, signal: AbortSignal.timeout(8000) },
        );
        if (!res.ok) return [];
        const json = (await res.json()) as { Results?: { Model_Name: string }[] };
        return (json.Results ?? []).map((r) => r.Model_Name.trim());
      } catch {
        return [];
      }
    }),
  );
  // drop kit-car / chassis oddities like "'34" or "Bus Chassis"
  return lists.flat().filter((m) => /^[A-Za-z0-9]/.test(m) && !/chassis|military|incomplete|motorhome/i.test(m));
}

export type FinderModel = { name: string; inStock: boolean };

/**
 * Models for a make and year: NHTSA's list plus anything we have listed (our naming wins where
 * they're the same model, e.g. "F150" vs "F-150", so the search finds our listings).
 */
export async function modelsForYear(make: string, year: number, partWhere: object): Promise<FinderModel[]> {
  const [official, ours] = await Promise.all([
    vpicModels(make, year),
    db.part.findMany({
      where: { status: "available", year, ...makeWhere(make), ...partWhere },
      distinct: ["model"],
      select: { model: true },
    }),
  ]);
  const byKey = new Map<string, FinderModel>();
  for (const m of official) if (!byKey.has(key(m))) byKey.set(key(m), { name: m, inStock: false });
  for (const { model } of ours) {
    const k = key(normMake(make) === "ram" ? model.replace(/^ram\s*/i, "") : model);
    // merge "F150" into "F-150", "Silverado 1500" into "Silverado", etc.
    const near = [...byKey.keys()].find((x) => x === k || (x.length >= 3 && (k.startsWith(x) || x.startsWith(k))));
    if (near) byKey.set(near, { name: byKey.get(near)!.name, inStock: true });
    else byKey.set(k, { name: model, inStock: true });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}

/** Listing filter for a make the customer picked. Ram trucks are listed under Dodge in older sheets. */
export function makeWhere(make: string) {
  const m = { equals: titleMake(make), mode: "insensitive" as const };
  if (normMake(make) === "ram") return { OR: [{ make: m }, { make: { equals: "Dodge", mode: "insensitive" as const }, model: { startsWith: "Ram", mode: "insensitive" as const } }] };
  return { make: m };
}

/** Makes we have something listed for, in a given year (marks "in stock" in the finder). */
export async function stockedMakes(year: number, partWhere: object) {
  const rows = await db.part.findMany({ where: { status: "available", year, ...partWhere }, distinct: ["make"], select: { make: true } });
  return new Set(rows.map((r) => normMake(r.make)));
}

/** Does a listing's model belong to the model a customer picked? ("F-150" ↔ "F150", "Silverado" ↔ "Silverado 1500") */
export function modelMatches(listing: string, picked: string) {
  const a = key(listing);
  const b = key(picked);
  if (!a || !b) return false;
  return a === b || (b.length >= 3 && (a.startsWith(b) || b.startsWith(a)));
}
