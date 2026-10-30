import { NextResponse } from "next/server";
import { typeWhere, normMake } from "@/lib/inventory";
import { specsFor } from "@/lib/specs";
import { finderYears, makesForYear, modelsForYear, stockedMakes } from "@/lib/vehicles";

export type FinderOption = { name: string; inStock: boolean; group?: string };

/** Year → Make → Model → Spec options: every US-market vehicle, flagged where we have listings. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const part = typeWhere(sp.get("type"));
  const year = parseInt(sp.get("year") || "", 10);
  const make = sp.get("make");
  const model = sp.get("model");
  const type = sp.get("type");
  let out: FinderOption[];
  if (year && make && model && type) out = specsFor(year, make, model, type).map((s) => ({ name: s, inStock: false }));
  else if (!year) out = finderYears().map((y) => ({ name: y, inStock: false }));
  else if (!make) {
    const stocked = await stockedMakes(year, part);
    out = makesForYear(year).map((m) => ({ name: m, inStock: stocked.has(normMake(m)) || (normMake(m) === "ram" && stocked.has("dodge")) }));
  } else out = await modelsForYear(make, year, part);
  return NextResponse.json(out, { headers: { "Cache-Control": "public, max-age=3600" } });
}
