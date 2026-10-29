// Usage:
//   npm run import -- data/my-parts.csv            (inventory template format)
//   npm run import -- "Vehicle Specification Sales.xlsx"   (yearly sales sheet: Car / Truck, Part, ...)
//   add --dry-run to preview without changing the database
//   add --replace to mark every listing that is NOT in this file as sold (start fresh)
import { readFileSync } from "fs";
import { importParts } from "../src/lib/import-parts";
import { convertSalesRows, isSalesSheet, readTable } from "../src/lib/sales-import";
import { db } from "../src/lib/db";

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const dry = args.includes("--dry-run");
  const replace = args.includes("--replace");
  if (!file) {
    console.error("Usage: npm run import -- <file.csv|file.xlsx> [--dry-run] [--replace]");
    process.exit(1);
  }

  let rows = await readTable(file, readFileSync(file));
  if (isSalesSheet(rows)) {
    const res = convertSalesRows(rows);
    console.log(
      `Sales sheet: ${res.stats.rows} sales → ${res.stats.listings} listings ` +
        `(${res.stats.mergedDuplicates} repeat sales merged, ${res.stats.pricedFromVendor} priced from vendor cost, ${res.skipped.length} rows skipped)`,
    );
    for (const s of res.skipped) console.log(`  skipped${s.line ? ` line ${s.line}` : ""}: ${s.reason}`);
    rows = res.listings;
  }

  if (dry) {
    console.log("\nFirst 15 listings:");
    for (const r of rows.slice(0, 15)) console.log(`  ${r.stock_no} ${r.year} ${r.make} ${r.model} ${r.part_type} | ${r.spec} | $${r.price} | ${r.mileage} mi`);
    return;
  }

  const res = await importParts(rows);
  console.log(`Added ${res.created}, updated ${res.updated}, skipped ${res.skipped.length}`);
  for (const s of res.skipped) console.log(`  line ${s.line}: ${s.reason}`);

  if (replace) {
    const keep = rows.map((r) => r.stock_no).filter(Boolean);
    const gone = await db.part.updateMany({ where: { stockNo: { notIn: keep }, status: "available" }, data: { status: "sold" } });
    console.log(`Marked ${gone.count} listings not in this file as sold`);
  }
  await db.$disconnect();
}

main();
