import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/inventory";
import { AdminNav } from "../admin-nav";
import { CsvUpload, StatusSelect } from "./parts-client";
import { updatePrice } from "../actions";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // the yearly sales-sheet upload runs here
export const metadata = { title: "Inventory", robots: { index: false } };

export default async function PartsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdmin();
  const { q = "", status = "available" } = await searchParams;
  const words = q.trim().split(/\s+/).filter(Boolean);
  const parts = await db.part.findMany({
    where: {
      ...(status !== "all" ? { status } : {}),
      AND: words.map((w) => ({
        OR: [{ make: { contains: w, mode: "insensitive" as const } }, { model: { contains: w, mode: "insensitive" as const } }, { partType: { contains: w, mode: "insensitive" as const } }, { stockNo: { contains: w, mode: "insensitive" as const } }, { spec: { contains: w, mode: "insensitive" as const } }, ...(Number(w) ? [{ year: Number(w) }] : [])],
      })),
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
  });
  const counts = await db.part.groupBy({ by: ["status"], _count: true });

  return (
    <div className="min-h-screen bg-paper">
      <AdminNav active="parts" />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-4 md:grid-cols-[1fr_380px]">
          <div>
            <h1 className="font-display text-3xl uppercase">Inventory</h1>
            <p className="text-sm text-steel">
              {counts.map((c) => `${c._count} ${c.status}`).join(" · ") || "No parts yet"}
            </p>
            <form className="mt-4 flex gap-2">
              <input name="q" defaultValue={q} className="field" placeholder="Search: 2014 F150 engine, JG-1001…" />
              <select name="status" defaultValue={status} className="field !w-36">
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
                <option value="all">All</option>
              </select>
              <button className="btn-dark !py-2">Search</button>
            </form>
          </div>
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="font-semibold">Import spreadsheet (.xlsx or .csv)</h2>
            <p className="mb-3 text-xs text-steel">
              Upload your yearly <b>sales sheet</b> as is (Car / Truck, Part, Specification, Total Sales Amount, Vendor
              Price): prices and miles are set automatically and vendor prices are never shown. Or use the{" "}
              <a href="/parts-template.csv" className="underline">inventory template</a>. Re-uploading updates existing listings.
            </p>
            <CsvUpload />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase text-steel">
              <tr>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Part</th>
                <th className="px-3 py-2">Miles</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-3 py-2 font-mono text-xs">{p.stockNo || "—"}</td>
                  <td className="px-3 py-2">
                    <Link href={`/parts/${p.slug}`} target="_blank" className="font-semibold hover:text-gold-dark">
                      {p.year} {p.make} {p.model} {p.partType}
                    </Link>
                    <div className="text-xs text-steel">{p.spec}</div>
                  </td>
                  <td className="px-3 py-2">{p.mileage?.toLocaleString() ?? "—"}</td>
                  <td className="px-3 py-2">
                    <form action={updatePrice} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={p.id} />
                      <input name="price" type="number" defaultValue={p.price} className="field !w-24 !px-2 !py-1" aria-label={`Price, now ${money(p.price)}`} />
                      <button className="text-xs text-steel hover:text-ink">Save</button>
                    </form>
                  </td>
                  <td className="px-3 py-2"><StatusSelect id={p.id} status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {parts.length === 0 && <p className="p-6 text-center text-sm text-steel">No parts match.</p>}
        </div>
      </div>
    </div>
  );
}
