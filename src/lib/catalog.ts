// Search-friendly catalog pages: /used-engines/[make]/[model]/[year] and the same for transmissions.
// Every page is built from the live listings, so new uploads (sales sheet or vendor lists) add pages automatically.
import { db } from "./db";
import { slugify } from "./inventory";
import { modelSlug, normalizeModel } from "./models";

export const KINDS = {
  "used-engines": { partType: "Engine", plural: "Engines", singular: "engine" },
  "used-transmissions": { partType: "Transmission", plural: "Transmissions", singular: "transmission" },
} as const;
export type Kind = keyof typeof KINDS;

export const catalogPath = (kind: Kind, make?: string, model?: string, year?: number) =>
  "/" + [kind, make && slugify(make), make && model && modelSlug(make, model), year && String(year)].filter(Boolean).join("/");

/**
 * One catalog page. `names` are the spellings stored on listings that the page covers (query with them);
 * `aliases` are the URL slugs those spellings used to have, which now redirect to `slug`.
 */
export type Facet = { name: string; slug: string; count: number; from: number; names: string[]; aliases: string[] };

const avail = (kind: Kind) => ({ status: "available", partType: KINDS[kind].partType });
const ci = (value: string) => ({ equals: value, mode: "insensitive" as const });

/**
 * Groups rows by URL slug, so spellings of one name share one page. The page is named after the
 * spelling with the most listings.
 */
function mergeBySlug(
  rows: { name: string; count: number; from: number }[],
  slugOf: (name: string) => string = slugify,
  display: (name: string) => string = (n) => n,
): Facet[] {
  const bySlug = new Map<string, Facet & { best: number }>();
  for (const r of rows) {
    const slug = slugOf(r.name);
    const f = bySlug.get(slug) ?? bySlug.set(slug, { name: display(r.name), slug, count: 0, from: r.from, names: [], aliases: [], best: -1 }).get(slug)!;
    if (r.count > f.best) { f.name = display(r.name); f.best = r.count; }
    f.count += r.count;
    f.from = Math.min(f.from, r.from);
    f.names.push(r.name);
    const old = slugify(r.name);
    if (old !== slug && !f.aliases.includes(old)) f.aliases.push(old);
  }
  return [...bySlug.values()].map(({ name, slug, count, from, names, aliases }) => ({ name, slug, count, from, names, aliases }));
}

export async function makesFor(kind: Kind): Promise<Facet[]> {
  const rows = await db.part.groupBy({ by: ["make"], where: avail(kind), _count: true, _min: { price: true } });
  return mergeBySlug(rows.map((r) => ({ name: r.make, count: r._count, from: r._min.price ?? 0 })))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function modelsFor(kind: Kind, make: string): Promise<Facet[]> {
  const rows = await db.part.groupBy({ by: ["model"], where: { ...avail(kind), make: ci(make) }, _count: true, _min: { price: true } });
  return mergeBySlug(
    rows.map((r) => ({ name: r.model, count: r._count, from: r._min.price ?? 0 })),
    (m) => modelSlug(make, m),
    (m) => normalizeModel(make, m),
  ).sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}

/** `models` are the spellings a model page covers (Facet.names). */
const modelWhere = (models: string[]) => ({ model: { in: models } });

export async function yearsFor(kind: Kind, make: string, models: string[]): Promise<Facet[]> {
  const rows = await db.part.groupBy({ by: ["year"], where: { ...avail(kind), make: ci(make), ...modelWhere(models) }, _count: true, _min: { price: true } });
  return rows
    .map((r) => ({ name: String(r.year), slug: String(r.year), count: r._count, from: r._min.price ?? 0, names: [String(r.year)], aliases: [] }))
    .sort((a, b) => Number(b.name) - Number(a.name));
}

/** Slug in the URL → the make/model stored on listings (null = no page). Old model slugs match by alias. */
export async function resolveMake(kind: Kind, slug: string) {
  return (await makesFor(kind)).find((m) => m.slug === slug) ?? null;
}
export async function resolveModel(kind: Kind, make: string, slug: string) {
  const models = await modelsFor(kind, make);
  return models.find((m) => m.slug === slug) ?? models.find((m) => m.aliases.includes(slug)) ?? null;
}

export function listingsFor(kind: Kind, f: { make?: string; models?: string[]; year?: number }, take = 24) {
  return db.part.findMany({
    where: { ...avail(kind), ...(f.make ? { make: ci(f.make) } : {}), ...(f.models ? modelWhere(f.models) : {}), ...(f.year ? { year: f.year } : {}) },
    orderBy: [{ year: "desc" }, { price: "asc" }],
    take,
  });
}

/**
 * Minimum listings for a catalog page to be indexed. Year and model pages with only one or two units are
 * near-copies of each other and of the product page, so they stay live for shoppers but are noindex,follow
 * and left out of the sitemap. Hubs and make pages are always indexed.
 */
export const MIN_INDEXABLE = { model: 2, year: 3 } as const;

export function isIndexable(level: "hub" | "make" | "model" | "year", count: number) {
  return level === "hub" || level === "make" || count >= MIN_INDEXABLE[level];
}

/** Every indexable catalog URL, for the sitemap. */
export async function allCatalogPaths() {
  const out: string[] = [];
  for (const kind of Object.keys(KINDS) as Kind[]) {
    out.push(catalogPath(kind));
    const rows = await db.part.groupBy({ by: ["make", "model", "year"], where: avail(kind), _count: true });
    // Counts per URL, so names that differ only in capitalization add up on the page they share.
    const makes = new Set<string>();
    const models = new Map<string, number>();
    const years = new Map<string, number>();
    for (const r of rows) {
      makes.add(catalogPath(kind, r.make));
      const m = catalogPath(kind, r.make, r.model);
      models.set(m, (models.get(m) ?? 0) + r._count);
      const y = catalogPath(kind, r.make, r.model, r.year);
      years.set(y, (years.get(y) ?? 0) + r._count);
    }
    out.push(...makes);
    for (const [path, n] of models) if (isIndexable("model", n)) out.push(path);
    for (const [path, n] of years) if (isIndexable("year", n)) out.push(path);
  }
  return out;
}
