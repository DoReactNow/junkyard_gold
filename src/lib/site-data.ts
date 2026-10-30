import { db } from "./db";
import type { SalesSummary } from "./sales-import";

/** The sales summary from the last sales-sheet upload, or null if none was uploaded yet. */
export async function salesSummary(): Promise<SalesSummary | null> {
  const row = await db.siteData.findUnique({ where: { key: "sales" } }).catch(() => null);
  return (row?.value as SalesSummary | undefined) ?? null;
}

/** 2828 → "2,800+" */
export function roundedPlus(n: number) {
  const step = n >= 1000 ? 100 : n >= 100 ? 50 : 10;
  return `${(Math.floor(n / step) * step).toLocaleString("en-US")}+`;
}
