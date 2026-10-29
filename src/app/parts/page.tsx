import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { typeWhere } from "@/lib/inventory";
import { BUSINESS, SMS_HREF, smsWithBody } from "@/lib/business";
import { estimatePrice } from "@/lib/estimate";
import { PageShell } from "@/components/site-chrome";
import { PartCard } from "@/components/part-card";
import { PartFinder } from "@/components/part-finder";

export const dynamic = "force-dynamic";

type SP = Promise<{ type?: string; year?: string; make?: string; model?: string; page?: string }>;

const LABEL: Record<string, string> = { Engine: "Used Engines", Transmission: "Used Transmissions", Other: "Other Used Parts" };
const PER_PAGE = 24;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const what = LABEL[sp.type || ""] || "Used Parts";
  const veh = [sp.year, sp.make, sp.model].filter(Boolean).join(" ");
  return { title: veh ? `${veh} ${what}` : what };
}

export default async function PartsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const where = {
    status: "available",
    ...typeWhere(sp.type),
    ...(sp.year ? { year: parseInt(sp.year, 10) || undefined } : {}),
    ...(sp.make ? { make: sp.make } : {}),
    ...(sp.model ? { model: sp.model } : {}),
  };
  const [parts, total] = await Promise.all([
    db.part.findMany({ where, orderBy: [{ year: "desc" }, { make: "asc" }, { price: "asc" }], take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    db.part.count({ where }),
  ]);
  const veh = [sp.year, sp.make, sp.model].filter(Boolean).join(" ");
  const estimate =
    parts.length === 0 && sp.year && sp.make && sp.type && sp.type !== "Other"
      ? await estimatePrice({ partType: sp.type, year: parseInt(sp.year, 10), make: sp.make, model: sp.model })
      : null;
  const heading = `${veh ? `${veh} ` : ""}${LABEL[sp.type || ""] || "Used Parts"}`;
  const pages = Math.ceil(total / PER_PAGE);
  const pageHref = (n: number) => `/parts?${new URLSearchParams({ ...sp, page: String(n) } as Record<string, string>)}`;

  return (
    <PageShell>
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-gold">Home</Link> / <span>Parts</span>
          </nav>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase sm:text-5xl">{heading}</h1>
          <p className="mt-2 text-white/70">
            {total} available · 3-month warranty on every part · real photos by text
          </p>
        </div>
        <div className="stripe h-1.5" />
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-5">
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-3 font-display text-lg uppercase">Change vehicle</h2>
            <PartFinder />
          </div>
          <div className="rounded-lg bg-gold p-4">
            <div className="font-display text-lg font-semibold uppercase">Not finding it?</div>
            <p className="mt-1 text-sm">Text us your VIN. We check the whole yard and our partner yards, not just what&apos;s listed here.</p>
            <a href={smsWithBody(`Hi, I'm looking for a ${heading}. My VIN is: `)} className="btn-dark mt-3 w-full !py-2.5 text-sm">
              Text Your VIN
            </a>
          </div>
        </aside>

        <div>
          {parts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-white p-10 text-center">
              <h2 className="font-display text-2xl uppercase">Nothing listed for that yet</h2>
              <p className="mt-2 text-steel">Stock changes daily and not everything is online.</p>
              {estimate && (
                <p className="mx-auto mt-4 max-w-md rounded-md bg-paper p-3 text-sm">
                  A used {sp.type?.toLowerCase()} for a {veh} usually runs about{" "}
                  <b>${estimate.low.toLocaleString()}–${estimate.high.toLocaleString()}</b>. Text or call {BUSINESS.phoneDisplay} for
                  your exact quote.
                </p>
              )}
              <a href={SMS_HREF} className="btn-gold mt-4">Text us your VIN</a>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {parts.map((p) => <PartCard key={p.id} part={p} />)}
            </div>
          )}
          {pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {page > 1 && <Link href={pageHref(page - 1)} className="btn-ghost !py-2 text-sm">← Previous</Link>}
              <span className="px-3 py-2 text-sm text-steel">Page {page} of {pages}</span>
              {page < pages && <Link href={pageHref(page + 1)} className="btn-ghost !py-2 text-sm">Next →</Link>}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
