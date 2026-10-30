// Search-friendly catalog pages: /used-engines/[make]/[model]/[year] and the same for transmissions.
// Every page is built from the live listings, so new uploads (sales sheet or vendor lists) add pages automatically.
import { db } from "./db";
import { slugify } from "./inventory";

export const KINDS = {
  "used-engines": { partType: "Engine", plural: "Engines", singular: "engine" },
  "used-transmissions": { partType: "Transmission", plural: "Transmissions", singular: "transmission" },
} as const;
export type Kind = keyof typeof KINDS;

export const catalogPath = (kind: Kind, make?: string, model?: string, year?: number) =>
  "/" + [kind, make && slugify(make), model && slugify(model), year && String(year)].filter(Boolean).join("/");

export type Facet = { name: string; slug: string; count: number; from: number };

const avail = (kind: Kind) => ({ status: "available", partType: KINDS[kind].partType });
const ci = (value: string) => ({ equals: value, mode: "insensitive" as const });

/** Groups rows by URL slug, so names that differ only in capitalization share one page. */
function mergeBySlug(rows: { name: string; count: number; from: number }[]): Facet[] {
  const bySlug = new Map<string, Facet & { best: number }>();
  for (const r of rows) {
    const slug = slugify(r.name);
    const f = bySlug.get(slug);
    if (!f) bySlug.set(slug, { name: r.name, slug, count: r.count, from: r.from, best: r.count });
    else {
      if (r.count > f.best) { f.name = r.name; f.best = r.count; }
      f.count += r.count;
      f.from = Math.min(f.from, r.from);
    }
  }
  return [...bySlug.values()].map(({ name, slug, count, from }) => ({ name, slug, count, from }));
}

export async function makesFor(kind: Kind): Promise<Facet[]> {
  const rows = await db.part.groupBy({ by: ["make"], where: avail(kind), _count: true, _min: { price: true } });
  return mergeBySlug(rows.map((r) => ({ name: r.make, count: r._count, from: r._min.price ?? 0 })))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function modelsFor(kind: Kind, make: string): Promise<Facet[]> {
  const rows = await db.part.groupBy({ by: ["model"], where: { ...avail(kind), make: ci(make) }, _count: true, _min: { price: true } });
  return mergeBySlug(rows.map((r) => ({ name: r.model, count: r._count, from: r._min.price ?? 0 })))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}

export async function yearsFor(kind: Kind, make: string, model: string): Promise<Facet[]> {
  const rows = await db.part.groupBy({ by: ["year"], where: { ...avail(kind), make: ci(make), model: ci(model) }, _count: true, _min: { price: true } });
  return rows
    .map((r) => ({ name: String(r.year), slug: String(r.year), count: r._count, from: r._min.price ?? 0 }))
    .sort((a, b) => Number(b.name) - Number(a.name));
}

/** Slug in the URL → the make/model name stored on listings (null = no page). */
export async function resolveMake(kind: Kind, slug: string) {
  return (await makesFor(kind)).find((m) => m.slug === slug) ?? null;
}
export async function resolveModel(kind: Kind, make: string, slug: string) {
  return (await modelsFor(kind, make)).find((m) => m.slug === slug) ?? null;
}

export function listingsFor(kind: Kind, f: { make?: string; model?: string; year?: number }, take = 24) {
  return db.part.findMany({
    where: { ...avail(kind), ...(f.make ? { make: ci(f.make) } : {}), ...(f.model ? { model: ci(f.model) } : {}), ...(f.year ? { year: f.year } : {}) },
    orderBy: [{ year: "desc" }, { price: "asc" }],
    take,
  });
}

/** Every catalog URL, for the sitemap. */
export async function allCatalogPaths() {
  const out: string[] = [];
  for (const kind of Object.keys(KINDS) as Kind[]) {
    out.push(catalogPath(kind));
    const rows = await db.part.findMany({ where: avail(kind), distinct: ["make", "model", "year"], select: { make: true, model: true, year: true } });
    const seen = new Set<string>();
    for (const r of rows) {
      for (const p of [catalogPath(kind, r.make), catalogPath(kind, r.make, r.model), catalogPath(kind, r.make, r.model, r.year)]) {
        if (!seen.has(p)) {
          seen.add(p);
          out.push(p);
        }
      }
    }
  }
  return out;
}
