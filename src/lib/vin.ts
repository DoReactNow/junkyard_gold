// VIN decoding through the free NHTSA vPIC API (no key needed).
// https://vpic.nhtsa.dot.gov/api/

export type DecodedVehicle = {
  vin: string;
  year: number | null;
  make: string;
  model: string;
  trim: string;
  displacementL: string; // "2.4"
  cylinders: string;
  fuel: string;
  drive: string;
  transmission: string;
  engineCode: string;
  summary: string; // "2012 Hyundai Sonata · 2.4L 4-cyl"
};

const VIN_RX = /^[A-HJ-NPR-Z0-9]{17}$/;

export function cleanVin(v: string | null | undefined) {
  return (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isVin(v: string) {
  return VIN_RX.test(v);
}

/** Pulls the first VIN-looking token out of free text (e.g. an incoming SMS). */
export function findVinInText(text: string): string | null {
  const m = text.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
  return m ? m[0] : null;
}

const MAKE_FIX: Record<string, string> = {
  CHEVROLET: "Chevrolet",
  GMC: "GMC",
  BMW: "BMW",
  RAM: "Ram",
  MINI: "Mini",
  "MERCEDES-BENZ": "Mercedes-Benz",
};

export function titleMake(make: string) {
  const up = make.trim().toUpperCase();
  if (MAKE_FIX[up]) return MAKE_FIX[up];
  return up.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
}

export async function decodeVin(rawVin: string): Promise<DecodedVehicle | null> {
  const vin = cleanVin(rawVin);
  if (!isVin(vin)) return null;
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`,
    { headers: { Accept: "application/json" }, next: { revalidate: 60 * 60 * 24 * 30 } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { Results?: Record<string, string>[] };
  const r = json.Results?.[0];
  if (!r || !r.Make) return null;

  const year = parseInt(r.ModelYear, 10) || null;
  const make = titleMake(r.Make);
  const disp = r.DisplacementL ? (Math.round(parseFloat(r.DisplacementL) * 10) / 10).toFixed(1) : "";
  const engineBits = [
    disp ? `${disp}L` : "",
    r.EngineCylinders ? `${r.EngineCylinders}-cyl` : "",
    /yes/i.test(r.Turbo || "") ? "turbo" : "",
    /diesel/i.test(r.FuelTypePrimary || "") ? "diesel" : "",
  ].filter(Boolean);

  return {
    vin,
    year,
    make,
    model: (r.Model || "").trim(),
    trim: (r.Trim || r.Series || "").trim(),
    displacementL: disp,
    cylinders: r.EngineCylinders || "",
    fuel: r.FuelTypePrimary || "",
    drive: r.DriveType || "",
    transmission: [r.TransmissionStyle, r.TransmissionSpeeds ? `${r.TransmissionSpeeds}-speed` : ""]
      .filter(Boolean)
      .join(" "),
    engineCode: r.EngineModel || "",
    summary: [[year, make, r.Model].filter(Boolean).join(" "), engineBits.join(" ")].filter(Boolean).join(" · "),
  };
}
