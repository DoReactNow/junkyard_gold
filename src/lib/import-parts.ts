import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { slugify } from "./inventory";
import { titleMake } from "./vin";

/** Minimal RFC-4180 CSV parser (quoted fields, commas and newlines inside quotes). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"));
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const PART_TYPES: Record<string, string> = {
  engine: "Engine", motor: "Engine",
  transmission: "Transmission", trans: "Transmission", transaxle: "Transmission",
};

function pick(row: Record<string, string>, ...keys: string[]) {
  for (const k of keys) if (row[k]) return row[k];
  return "";
}

export type ImportResult = { created: number; updated: number; skipped: { line: number; reason: string }[] };

/**
 * Columns (header names are case-insensitive): part_type, year, make, model, spec, price,
 * mileage, stock_no, warranty, condition, description, image_url, status.
 * Rows with a stock_no that already exists are updated; everything else is added.
 */
export async function importParts(rows: Record<string, string>[]): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: [] };
  // Load existing keys once so a 2,000+ row sheet doesn't need thousands of lookups.
  const existing = await db.part.findMany({ select: { id: true, slug: true, stockNo: true } });
  const byStock = new Map(existing.filter((p) => p.stockNo).map((p) => [p.stockNo!, p.id]));
  const slugs = new Set(existing.map((p) => p.slug));
  const creates: Prisma.PartCreateManyInput[] = [];
  const updates: Prisma.PrismaPromise<unknown>[] = [];

  for (const [i, row] of rows.entries()) {
    const line = i + 2;
    const rawType = pick(row, "part_type", "part", "type");
    const partType = PART_TYPES[rawType.toLowerCase()] || (rawType ? rawType.replace(/\b\w/g, (c) => c.toUpperCase()) : "");
    const year = parseInt(pick(row, "year"), 10);
    const make = titleMake(pick(row, "make"));
    const model = pick(row, "model");
    const price = Math.round(parseFloat(pick(row, "price", "sale_price", "sold_price").replace(/[$,]/g, "")));
    if (!partType || !year || !make || !model) { result.skipped.push({ line, reason: "needs part_type, year, make and model" }); continue; }
    if (!price || price < 1) { result.skipped.push({ line, reason: "missing price" }); continue; }

    const spec = pick(row, "spec", "option", "engine", "description_short");
    const mileage = parseInt(pick(row, "mileage", "miles").replace(/[,\s]/g, ""), 10) || null;
    const stockNo = pick(row, "stock_no", "stock", "sku") || null;
    const title = `${year} ${make} ${model} Used ${partType}${spec ? ` ${spec}` : ""}`;
    const data = {
      partType, year, make, model, spec, title, price, mileage,
      warranty: pick(row, "warranty") || "3 months",
      condition: pick(row, "condition") || "Used, tested",
      description: pick(row, "description", "notes"),
      imageUrl: pick(row, "image_url", "photo") || null,
      status: (pick(row, "status") || "available").toLowerCase(),
    };

    const id = stockNo ? byStock.get(stockNo) : undefined;
    if (id === "pending") { result.skipped.push({ line, reason: `stock number ${stockNo} appears twice in this file` }); continue; }
    if (id) {
      updates.push(db.part.update({ where: { id }, data }));
      result.updated++;
    } else {
      const base = slugify(`${title}${mileage ? ` ${mileage}mi` : ""}`);
      let slug = base;
      for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
      slugs.add(slug);
      if (stockNo) byStock.set(stockNo, "pending"); // same stock number twice in one file: first row wins
      creates.push({ ...data, slug, stockNo });
      result.created++;
    }
  }

  for (let i = 0; i < creates.length; i += 500) await db.part.createMany({ data: creates.slice(i, i + 500) });
  for (let i = 0; i < updates.length; i += 200) await db.$transaction(updates.slice(i, i + 200));
  return result;
}
