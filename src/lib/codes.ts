// Pages for a specific engine or transmission: /used-engines/code/lmg, /used-transmissions/code/4l60e.
// Built only from data we have: the codes in our own listings' specs, and the vehicles that list the
// same code in src/data/specs.json. A code gets a page only when enough units are listed.
import data from "@/data/specs.json";
import { db } from "./db";
import { KINDS, type Kind } from "./catalog";

/** Fewer listed units than this: no page (404), so every code page has real inventory on it. */
export const MIN_CODE_LISTINGS = 3;

// Transmission model codes: 4L60E, 6R80, 5R110W, 4R70W …
const TRANS_CODE = /\b(\d[A-Z]\d{2,3}[A-Z]{0,2})\b/i;
// GM engine RPO codes as the specs write them: "5.3L, VIN 0 (8th digit), opt LMG"
const ENGINE_CODE = /\bopt\.?\s*(L[A-Z0-9]{2})\b/i;

export function codeOf(kind: Kind, spec: string) {
  const m = spec.match(kind === "used-engines" ? ENGINE_CODE : TRANS_CODE);
  return m ? m[1].toUpperCase() : null;
}

export const codePath = (kind: Kind, code: string) => `/${kind}/code/${code.toLowerCase()}`;

export type CodeFacet = { code: string; count: number; from: number; to: number; size: string | null };

const SIZE = /\b(\d\.\d)L\b/i;

/** Every code with at least MIN_CODE_LISTINGS listed units, most units first. */
export async function codesFor(kind: Kind): Promise<CodeFacet[]> {
  const rows = await db.part.findMany({ where: { status: "available", partType: KINDS[kind].partType }, select: { spec: true, price: true } });
  const by = new Map<string, { count: number; from: number; to: number; sizes: Map<string, number> }>();
  for (const r of rows) {
    const code = codeOf(kind, r.spec);
    if (!code) continue;
    const f = by.get(code) ?? by.set(code, { count: 0, from: r.price, to: r.price, sizes: new Map() }).get(code)!;
    f.count++;
    f.from = Math.min(f.from, r.price);
    f.to = Math.max(f.to, r.price);
    const size = r.spec.match(SIZE)?.[1];
    if (size) f.sizes.set(size, (f.sizes.get(size) ?? 0) + 1);
  }
  return [...by.entries()]
    .filter(([, f]) => f.count >= MIN_CODE_LISTINGS)
    .map(([code, f]) => ({ code, count: f.count, from: f.from, to: f.to, size: [...f.sizes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

export async function listingsForCode(kind: Kind, code: string) {
  const rows = await db.part.findMany({
    where: { status: "available", partType: KINDS[kind].partType, spec: { contains: code, mode: "insensitive" } },
    orderBy: [{ price: "asc" }],
  });
  return rows.filter((p) => codeOf(kind, p.spec) === code);
}

type Entry = { e?: string[]; t?: string[] };
const SPECS = data as Record<string, Record<string, Record<string, Entry>>>;
const vehicleCache = new Map<string, { make: string; model: string; from: number; to: number }[]>();

/** Vehicles that list this code in the spec data, with their model-year range. */
export function vehiclesWithCode(kind: Kind, code: string) {
  const key = `${kind}|${code}`;
  const hit = vehicleCache.get(key);
  if (hit) return hit;
  const slot = kind === "used-engines" ? "e" : "t";
  const by = new Map<string, { make: string; model: string; from: number; to: number }>();
  for (const [y, makes] of Object.entries(SPECS)) {
    const year = Number(y);
    for (const [make, models] of Object.entries(makes)) {
      for (const [model, entry] of Object.entries(models)) {
        if (!(entry[slot] ?? []).some((s) => codeOf(kind, s) === code)) continue;
        const k = `${make}|${model}`;
        const v = by.get(k);
        if (!v) by.set(k, { make, model, from: year, to: year });
        else {
          v.from = Math.min(v.from, year);
          v.to = Math.max(v.to, year);
        }
      }
    }
  }
  const out = [...by.values()].sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model, "en", { numeric: true }));
  vehicleCache.set(key, out);
  return out;
}
