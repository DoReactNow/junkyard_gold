import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { money, typeWhere } from "@/lib/inventory";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import { makeWhere, modelMatches } from "@/lib/vehicles";
import { QuoteForm } from "@/components/quote-form";
import { ChatIcon, PhoneIcon } from "@/components/icons";
import { estimatePrice } from "@/lib/estimate";
import { PageHero, PageShell } from "@/components/site-chrome";
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
  const year = parseInt(sp.year || "", 10) || undefined;
  const base = { status: "available", ...typeWhere(sp.type), ...(sp.make ? makeWhere(sp.make) : {}) };

  // Customers pick models from the full US list ("F-150"); listings may say "F150", so match loosely.
  const pool = await db.part.findMany({
    where: { ...base, ...(year ? { year } : {}) },
    orderBy: [{ year: "desc" }, { make: "asc" }, { price: "asc" }],
    take: sp.make ? 2000 : undefined,
    ...(sp.make ? {} : { skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
  });
  const matched = sp.model ? pool.filter((p) => modelMatches(p.model, sp.model!)) : pool;
  const total = sp.make ? matched.length : await db.part.count({ where: { ...base, ...(year ? { year } : {}) } });
  const parts = sp.make ? matched.slice((page - 1) * PER_PAGE, page * PER_PAGE) : matched;

  const veh = [sp.year, sp.make, sp.model].filter(Boolean).join(" ");
  const partWord = sp.type === "Other" ? "part" : (sp.type || "part").toLowerCase();
  // Nothing for that exact year: same make/model in nearby years, and an estimated price range
  const nearby =
    parts.length === 0 && sp.make && sp.model && year
      ? (await db.part.findMany({ where: { ...base, year: { gte: year - 3, lte: year + 3 } }, orderBy: { price: "asc" }, take: 400 }))
          .filter((p) => modelMatches(p.model, sp.model!))
          .sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))
          .slice(0, 3)
      : [];
  const estimate =
    parts.length === 0 && year && sp.make && sp.type && sp.type !== "Other"
      ? await estimatePrice({ partType: sp.type, year, make: sp.make, model: sp.model })
      : null;
  const heading = `${veh ? `${veh} ` : ""}${LABEL[sp.type || ""] || "Used Parts"}`;
  const pages = Math.ceil(total / PER_PAGE);
  const pageHref = (n: number) => `/parts?${new URLSearchParams({ ...sp, page: String(n) } as Record<string, string>)}`;
  const smsText = `Hi, I need a used ${partWord} for a ${veh || "my vehicle"}. My VIN is: `;

  return (
    <PageShell>
      <PageHero crumbs={[{ name: "Home", href: "/" }, { name: "Parts", href: "/parts" }]} eyebrow="Search results" title={heading}>
        {total > 0 ? (
          <>
            <b className="text-white">{total.toLocaleString()}</b> listed online · more sourced daily from our {BUSINESS.networkSize} network · {BUSINESS.warrantyAdj} warranty
          </>
        ) : (
          <>Available through our supplier network of {BUSINESS.networkSize} engines and transmissions · {BUSINESS.warrantyAdj} warranty</>
        )}
      </PageHero>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <div className="card p-6">
            <div className="eyebrow">Search</div>
            <h2 className="font-serif mb-5 mt-1 text-[1.75rem] leading-none">Change vehicle</h2>
            <PartFinder stacked defaultType={sp.type === "Transmission" || sp.type === "Other" ? sp.type : "Engine"} initial={{ year: sp.year, make: sp.make, model: sp.model }} />
          </div>
          <div className="rounded-[22px] bg-ink p-6 text-white">
            <div className="font-serif text-[1.6rem] leading-none">Not finding it?</div>
            <p className="mt-2 text-sm leading-relaxed text-white/60">Text us your VIN. We check our whole supplier network, not just what&apos;s listed here.</p>
            <a href={smsWithBody(smsText)} className="btn-gold mt-5 w-full text-sm">
              <ChatIcon /> Text your VIN
            </a>
          </div>
        </aside>

        <div className="min-w-0">
          {parts.length === 0 ? (
            <div className="space-y-8">
              <div className="overflow-hidden rounded-[28px] bg-ink text-white shadow-lift">
                <div className="relative p-7 sm:p-10">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_90%_0%,rgb(201_150_47/0.18),transparent_70%)]" />
                  <div className="relative">
                    <div className="text-[12px] font-medium uppercase tracking-[0.22em] text-gold-2">We can source this</div>
                    <h2 className="font-serif mt-3 text-[2.4rem] leading-[1.02] sm:text-[3rem]">
                      {veh ? <>Your {veh} {partWord},<br /></> : null}
                      <em className="text-gold-grad">quoted by text in minutes.</em>
                    </h2>
                    <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-white/65">
                      It isn&apos;t listed online right now, but we source from a network of {BUSINESS.networkSize} engines and
                      transmissions. Send your VIN and a specialist will text you real options with exact prices.
                    </p>
                    {estimate && (
                      <div className="mt-7 inline-flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">Typical price</span>
                        <span className="font-serif text-[2.2rem] leading-none text-gold-light">
                          {money(estimate.low)}–{money(estimate.high)}
                        </span>
                        <span className="text-[12.5px] text-white/45">estimate from similar parts we&apos;ve sold</span>
                      </div>
                    )}
                    <div className="mt-7 flex flex-wrap gap-3">
                      <a href={smsWithBody(smsText)} className="btn-gold !h-[52px] !px-6"><ChatIcon /> Text {BUSINESS.smsDisplay}</a>
                      <a href={TEL_HREF} className="btn-outline-light !h-[52px] !px-6"><PhoneIcon /> Call for a quote</a>
                    </div>
                  </div>
                </div>
              </div>

              {nearby.length > 0 && (
                <div>
                  <h3 className="font-serif text-[1.8rem] leading-none">Same model, nearby years</h3>
                  <p className="mt-2 text-sm text-steel">These may or may not fit your {sp.year}. We&apos;ll confirm by VIN before anything ships.</p>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {nearby.map((p) => <PartCard key={p.id} part={p} />)}
                  </div>
                </div>
              )}

              <div className="card rounded-[28px] p-7 sm:p-9">
                <div className="eyebrow">Free quote · no obligation</div>
                <h3 className="font-serif mb-6 mt-2 text-[2rem] leading-none">Or have us text you</h3>
                <QuoteForm defaultVin={veh} defaultPartType={sp.type === "Transmission" || sp.type === "Other" ? sp.type : "Engine"} />
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {parts.map((p) => <PartCard key={p.id} part={p} />)}
            </div>
          )}
          {pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && <Link href={pageHref(page - 1)} className="btn-ghost !h-11 text-sm">← Previous</Link>}
              <span className="px-3 text-sm text-steel">Page {page} of {pages}</span>
              {page < pages && <Link href={pageHref(page + 1)} className="btn-ghost !h-11 text-sm">Next →</Link>}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
