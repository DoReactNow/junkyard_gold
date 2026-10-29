import type { Part } from "@prisma/client";
import { db } from "./db";
import type { DecodedVehicle } from "./vin";

const MAKE_ALIASES: Record<string, string> = { chevy: "chevrolet", vw: "volkswagen", "mercedes": "mercedes-benz" };

export function normMake(m: string) {
  const k = m.trim().toLowerCase();
  return MAKE_ALIASES[k] || k;
}

function normModel(m: string) {
  return m.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

export type Match = { part: Part; score: number; reasons: string[] };

export const MAIN_TYPES = ["Engine", "Transmission"];

/** Prisma filter for a part-type filter value; "Other" means anything but engines/transmissions. */
export function typeWhere(type?: string | null) {
  if (!type) return {};
  if (type === "Other") return { partType: { notIn: MAIN_TYPES } };
  return { partType: type };
}

/**
 * Finds available units that fit a vehicle. Year + make + model must match; engine size
 * (when both sides know it) raises or lowers the score. Staff still confirm fitment by VIN.
 */
export async function findMatches(opts: {
  year?: number | null;
  make?: string;
  model?: string;
  partType?: string | null;
  vehicle?: DecodedVehicle | null;
  limit?: number;
}): Promise<Match[]> {
  const year = opts.vehicle?.year ?? opts.year ?? null;
  const make = opts.vehicle?.make ?? opts.make ?? "";
  const model = opts.vehicle?.model ?? opts.model ?? "";
  if (!year || !make) return [];

  const candidates = await db.part.findMany({
    where: {
      status: "available",
      year,
      ...typeWhere(opts.partType),
    },
    orderBy: { price: "asc" },
    take: 400,
  });

  const wantMake = normMake(make);
  const wantModel = normModel(model);
  const disp = opts.vehicle?.displacementL;

  const out: Match[] = [];
  for (const part of candidates) {
    if (normMake(part.make) !== wantMake) continue;
    const pm = normModel(part.model);
    if (wantModel && !(pm === wantModel || pm.includes(wantModel) || wantModel.includes(pm))) continue;

    let score = 50;
    const reasons = ["year, make and model match"];
    if (disp && part.partType === "Engine") {
      if (part.spec.includes(`${disp}L`)) {
        score += 40;
        reasons.push(`${disp}L engine size matches`);
      } else if (/\d\.\dL/.test(part.spec)) {
        continue; // engine size differs from the VIN
      }
    }
    if (score > 0) out.push({ part, score, reasons });
  }
  out.sort((a, b) => b.score - a.score || a.part.price - b.part.price);
  return out.slice(0, opts.limit ?? 6);
}

/** Distinct values for the Year → Make → Model → Part finder. */
export async function finderOptions(q: { partType?: string; year?: number; make?: string }) {
  const where = {
    status: "available",
    ...typeWhere(q.partType),
    ...(q.year ? { year: q.year } : {}),
  };
  if (!q.year) {
    const rows = await db.part.findMany({ where, distinct: ["year"], select: { year: true }, orderBy: { year: "desc" } });
    return rows.map((r) => String(r.year));
  }
  if (!q.make) {
    const rows = await db.part.findMany({ where, distinct: ["make"], select: { make: true }, orderBy: { make: "asc" } });
    return rows.map((r) => r.make);
  }
  const rows = await db.part.findMany({
    where: { ...where, make: q.make },
    distinct: ["model"],
    select: { model: true },
    orderBy: { model: "asc" },
  });
  return rows.map((r) => r.model);
}

export function partUrl(p: Pick<Part, "slug">) {
  return `/parts/${p.slug}`;
}

export function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

export function partLine(p: Part) {
  const bits = [`${p.year} ${p.make} ${p.model} ${p.partType}`, p.spec, p.mileage ? `${p.mileage.toLocaleString()} mi` : ""]
    .filter(Boolean)
    .join(" · ");
  return `${bits} — ${money(p.price)}`;
}
