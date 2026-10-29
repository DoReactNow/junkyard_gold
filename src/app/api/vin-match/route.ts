import { NextResponse } from "next/server";
import { findMatches } from "@/lib/inventory";
import { cleanVin, decodeVin, isVin } from "@/lib/vin";
import { estimatePrice } from "@/lib/estimate";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const vin = cleanVin(sp.get("vin"));
  if (!isVin(vin)) return NextResponse.json({ vehicle: null, matches: [], error: "A VIN is 17 letters and numbers (no I, O or Q)." }, { status: 400 });

  const vehicle = await decodeVin(vin).catch(() => null);
  if (!vehicle) return NextResponse.json({ vehicle: null, matches: [], error: "We couldn't decode that VIN. Double-check it, or text it to us." });

  const type = sp.get("type") || undefined;
  const matches = await findMatches({ vehicle, partType: type, limit: 8 });
  const estimates = [];
  if (!matches.length && vehicle.year) {
    for (const t of type && type !== "Other" ? [type] : ["Engine", "Transmission"]) {
      const e = await estimatePrice({ partType: t, year: vehicle.year, make: vehicle.make, model: vehicle.model });
      if (e) estimates.push({ partType: t, low: e.low, high: e.high });
    }
  }
  return NextResponse.json({
    estimates,
    vehicle: { summary: vehicle.summary, drive: vehicle.drive, transmission: vehicle.transmission },
    matches: matches.map(({ part: p, score }) => ({
      slug: p.slug, partType: p.partType, title: p.title, spec: p.spec, price: p.price, mileage: p.mileage, score,
    })),
  });
}
