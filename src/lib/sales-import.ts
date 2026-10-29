import { createHash } from "crypto";
import { readSheet } from "read-excel-file/node";
import { parseCsv } from "./import-parts";
import { titleMake } from "./vin";

/**
 * Turns the yearly sales sheet (columns: Car / Truck, Part, Specification, Total Sales Amount,
 * Vendor Price) into website listings. Vendor prices are only used to fill in a missing sale
 * price and are never stored or shown.
 */

export const LIST_MARKUP_WHEN_NO_SALE = 1.4; // median sale ÷ vendor price in the 2025-26 sheet
export const MIN_OTHER_PART_PRICE = 300;
export const MIN_MARGIN = 300; // list price is at least vendor cost + this // smaller parts aren't listed online
export const MAX_MILES = 130_000;

/** Reads an uploaded .xlsx or .csv into rows keyed by snake_case header. */
export async function readTable(fileName: string, data: Buffer): Promise<Record<string, string>[]> {
  if (!/\.xlsx$/i.test(fileName)) return parseCsv(data.toString("utf8"));
  const sheet = await readSheet(data);
  const [header, ...rest] = sheet;
  if (!header) return [];
  const keys = header.map((h) => String(h ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  return rest.map((r) =>
    Object.fromEntries(
      keys.map((k, i) => {
        const v = r[i];
        return [k, v == null ? "" : v instanceof Date ? "" : String(v).trim()];
      }),
    ),
  );
}

export function isSalesSheet(rows: Record<string, string>[]) {
  const first = rows[0];
  return Boolean(first && "car_truck" in first && "part" in first);
}

// ---------- vehicle ----------

const MAKE_ALIASES: Record<string, string> = {
  chevy: "Chevrolet", vw: "Volkswagen", volkswagon: "Volkswagen", volkswagenn: "Volkswagen",
  mercedes: "Mercedes-Benz", "mercedes-benz": "Mercedes-Benz", benz: "Mercedes-Benz", mb: "Mercedes-Benz",
  infinite: "Infiniti", infinity: "Infiniti", frht: "Freightliner", landrover: "Land Rover", land: "Land Rover",
  alfa: "Alfa Romeo", aston: "Aston Martin",
};
// Makes we list. Anything else (typos, "To", unreadable) is skipped and reported.
const KNOWN_MAKES = new Set(
  ("Acura Alfa-Romeo Aston-Martin Audi BMW Buick Cadillac Chevrolet Chrysler Daewoo Datsun Dodge Eagle Fiat Ford " +
    "Freightliner Genesis Geo GMC Hino Honda Hummer Hyundai Infiniti International Isuzu Jaguar Jeep Kia Land-Rover Lexus " +
    "Lincoln Mazda Mercedes-Benz Mercury Mini Mitsubishi Nissan Oldsmobile Peterbilt Kenworth Plymouth Pontiac Porsche Ram Saab " +
    "Saturn Scion Smart Subaru Suzuki Tesla Toyota Volkswagen Volvo Mack").split(" ").map((m) => m.replace("-", " ")),
);

export type Vehicle = { year: number; make: string; model: string };

export function parseVehicle(raw: string): Vehicle | null {
  let s = raw.replace(/[​-‍﻿]/g, "").replace(/\s+/g, " ").trim();
  if (/&/.test(s)) return null; // two vehicles in one cell
  const m = s.match(/^((?:19|20)\d{2})\s*[-\s]\s*(.+)$/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  s = m[2];
  // drop customer VINs (full or partial) and anything after them
  s = s.replace(/[/|]?\s*\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-HJ-NPR-Z0-9]{11,17}\b.*$/i, "");
  s = s.replace(/\((?:19|20)\d{2}[^)]*\)/g, ""); // "(1999 Up)", "(1988-2001)"
  s = s.replace(/[/|\\~].*$/, "").replace(/[\s,-]+$/, "").trim();
  if (!s || /\b(19|20)\d{2}\b/.test(s)) return null; // a second year = two vehicles

  // "Ford-Crown Victoria", "Landrover-Range Rover"
  const words = s.replace(/^([A-Za-z]+)-(?=[A-Za-z])/, "$1 ").split(" ");
  let makeKey = words[0].toLowerCase();
  let restStart = 1;
  const two = `${makeKey} ${(words[1] || "").toLowerCase()}`;
  if (["land rover", "alfa romeo", "aston martin", "mercedes benz"].includes(two)) {
    makeKey = two.replace(" benz", "-benz");
    restStart = 2;
  }
  const make = MAKE_ALIASES[makeKey] || titleMake(makeKey);
  if (!KNOWN_MAKES.has(make.replace("-", " "))) return null;

  let model = words.slice(restStart).join(" ");
  model = model.replace(/^Truck\s*-\s*/i, "").replace(/^Van\s*-\s*/i, "").replace(/\s+Series\b/i, "");
  model = model.replace(/\s+(Engine|Transmission)\b.*$/i, ""); // "Sierra 1500 Engine 5.3L, …"
  const paren = model.match(/^\(([^)]+)\)$/); // "(Town Car)"
  model = paren ? paren[1] : model.replace(/\([^)]*\)?/g, ""); // drop notes like "(JDM)", "(except XL)"
  model = model.split(",")[0].replace(/\s+/g, " ").replace(/[\s,.-]+$/, "").trim();
  if (make === "Dodge" && /^\d{4}$/.test(model)) model = `Ram ${model}`;
  if (!model) return null;
  return { year, make, model };
}

// ---------- part ----------

const ENGINE_WORDS = /^(certified\s+)?(engine|motor)(\s+assembly|\s+\(jdm\)|\s+with turbo)?$/i;
const TRANS_WORDS = /^(certified\s+)?transmission(\s+with torque converter)?$/i;
const COMBO = /^(certified\s+)?engine\s*(&|and|\/|\+|,|\n)\s*transmissi?on$/i;
const TRANS_TCASE = /^transmission\s*(&|and|\/|\+|with|\n)?\s*transfer case$/i;
const ACRONYMS = new Set(["AC", "A/C", "ECU", "TCM", "PCM", "ECM", "ABS", "JDM", "EGR"]);

const PART_ALIASES: [RegExp, string | null][] = [
  [/^tran?s?mi?s+i[oó]n( assembly| jdm)?$/i, "Transmission"],
  [/^engine red sport 400$/i, "Engine"],
  [/\b(core|reman|remanufactured|dropout)\b/i, null], // cores don't run; reman is a different product
  [/cylinder head/i, "Cylinder Head"],
  [/fuse box/i, "Fuse Box"],
  [/^rear axle assy/i, "Rear Axle Assembly"],
  [/^diff?ren?tial/i, "Differential"],
  [/^harness$/i, "Wiring Harness"],
  [/^engine computer/i, "Engine Computer"],
  [/^transmission computer/i, "Transmission Computer"],
];

export function normalizePart(raw: string): string | null {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return null;
  for (const [rx, name] of PART_ALIASES) if (rx.test(s)) return name;
  if (ENGINE_WORDS.test(s)) return "Engine";
  if (TRANS_WORDS.test(s)) return "Transmission";
  if (COMBO.test(raw.trim().replace(/[ \t]+/g, " ")) || /^transmission\s*(&|and|\/)?\s*engine$/i.test(s)) return "Engine & Transmission";
  if (TRANS_TCASE.test(s)) return "Transmission & Transfer Case";
  // Packages with several items (harness, computer, bumper + hood, …) don't make good listings
  const plain = raw.replace(/\bA\/C\b/gi, "AC");
  if (/[\n,&+]|\band\b|\/|\bwith\b/i.test(plain) || /^\d/.test(s)) return null;
  if (/\$|:/.test(s)) return null;
  return s
    .split(" ")
    .map((w) => (ACRONYMS.has(w.toUpperCase()) ? (w.toUpperCase() === "AC" ? "A/C" : w.toUpperCase()) : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

export function cleanSpec(raw: string) {
  let s = raw.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean).join(" / ");
  s = s.replace(/\s+/g, " ").trim();
  if (/^\(([^()]*)\)$/.test(s)) s = s.slice(1, -1); // "(3.7L, VIN K, 8th digit)"
  s = s.replace(/^[:\-,\s]+/, "").replace(/\s*,\s*$/, "");
  if (/^(na|n\/a|none|-)$/i.test(s)) return "";
  // A bare number like "6.2" means engine size
  if (/^\d\.\d$/.test(s)) s = `${s}L`;
  return s;
}

// ---------- miles & price ----------

function unitHash(key: string) {
  return parseInt(createHash("sha1").update(key).digest("hex").slice(0, 8), 16) / 0xffffffff;
}

/**
 * Owner's rule: 2015–2025 → 10k–80k, 2000–2014 → 70k–110k, older → 80k–130k (never above 130k).
 * Newer vehicles sit toward the low end of their band; a stable per-listing offset spreads them out.
 */
export function milesFor(year: number, key: string) {
  const [lo, hi, newest, span] =
    year >= 2015 ? [10_000, 80_000, 2026, 11] : year >= 2000 ? [70_000, 110_000, 2014, 14] : [80_000, 130_000, 1999, 30];
  const age = Math.min(1, Math.max(0, (newest - year) / span));
  const miles = lo + (hi - lo) * (0.75 * age + 0.25 * unitHash(key));
  return Math.min(MAX_MILES, Math.round(miles / 1000) * 1000);
}

function money(v: string): number | null {
  if (!v || /cad|\+/i.test(v)) return null; // Canadian-dollar and split amounts aren't comparable
  const n = parseFloat(v.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function median(xs: number[]) {
  const a = [...xs].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

/** $1,697.91 → $1,699 */
export function listPrice(n: number) {
  return Math.max(9, Math.round(n / 10) * 10 - 1);
}

export function stockNoFor(key: string) {
  return `JG-${createHash("sha1").update(key).digest("hex").slice(0, 6).toUpperCase()}`;
}

// ---------- conversion ----------

export type ConvertResult = {
  listings: Record<string, string>[];
  skipped: { line: number; reason: string }[];
  stats: { rows: number; listings: number; mergedDuplicates: number; pricedFromVendor: number; raisedToFloor: number };
};

export function convertSalesRows(rows: Record<string, string>[]): ConvertResult {
  type Acc = { v: Vehicle; partType: string; spec: string; sales: number[]; vendor: number[] };
  const groups = new Map<string, Acc>();
  const skipped: ConvertResult["skipped"] = [];
  let used = 0;

  rows.forEach((r, i) => {
    const line = i + 2;
    if (!Object.values(r).some(Boolean)) return;
    const v = parseVehicle(r.car_truck || "");
    if (!v) return void skipped.push({ line, reason: `can't read year/make/model from "${(r.car_truck || "").slice(0, 40)}"` });
    const partType = normalizePart(r.part || "");
    if (!partType) return void skipped.push({ line, reason: `part "${(r.part || "").replace(/\s+/g, " ").slice(0, 40)}" is a multi-item package or blank` });
    const spec = cleanSpec(r.specification || "");
    const key = [v.year, v.make, v.model, partType, spec].join("|").toLowerCase();
    const g = groups.get(key) ?? { v, partType, spec, sales: [], vendor: [] };
    const sale = money(r.total_sales_amount || "");
    const vendor = money(r.vendor_price || "");
    if (sale) g.sales.push(sale);
    if (vendor) g.vendor.push(vendor);
    groups.set(key, g);
    used++;
  });

  const listings: Record<string, string>[] = [];
  let pricedFromVendor = 0;
  let raisedToFloor = 0;
  for (const [key, g] of groups) {
    let price: number | null = null;
    if (g.sales.length) price = median(g.sales);
    else if (g.vendor.length) {
      price = median(g.vendor) * LIST_MARKUP_WHEN_NO_SALE;
      pricedFromVendor++;
    }
    // Owner's rule (same as v1): never list below vendor cost + $300
    if (price && g.vendor.length) {
      const floor = median(g.vendor) + MIN_MARGIN;
      if (price < floor) {
        price = floor;
        raisedToFloor++;
      }
    }
    if (!price) {
      skipped.push({ line: 0, reason: `${g.v.year} ${g.v.make} ${g.v.model} ${g.partType}: no usable price` });
      continue;
    }
    const isMain = g.partType === "Engine" || g.partType === "Transmission" || g.partType === "Engine & Transmission";
    if (!isMain && price < MIN_OTHER_PART_PRICE) continue;
    listings.push({
      part_type: g.partType,
      year: String(g.v.year),
      make: g.v.make,
      model: g.v.model,
      spec: g.spec,
      price: String(listPrice(price)),
      mileage: String(milesFor(g.v.year, key)),
      stock_no: stockNoFor(key),
      warranty: "3 months",
      condition: "Used OEM",
      status: "available",
    });
  }
  return {
    listings,
    skipped,
    stats: { rows: used, listings: listings.length, mergedDuplicates: used - groups.size, pricedFromVendor, raisedToFloor },
  };
}
