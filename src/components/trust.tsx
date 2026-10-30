import { BUSINESS, isOpenNow } from "@/lib/business";
import { money } from "@/lib/inventory";
import { cutout, pickPhotos } from "@/lib/photos";
import type { SalesSummary } from "@/lib/sales-import";
import { Reveal } from "./reveal";

/** "Open now · until 6 PM ET" / "Closed · opens Mon 10 AM ET", from the real business hours. */
export function OpenStatus({ className = "" }: { className?: string }) {
  const now = new Date();
  const open = isOpenNow(now);
  let label = "Phones open until 6 PM ET · Texts 7 days";
  if (!open) {
    // step forward to the next opening hour
    let t = new Date(Math.ceil(now.getTime() / 3_600_000) * 3_600_000);
    for (let i = 0; i < 24 * 8 && !isOpenNow(t); i++) t = new Date(t.getTime() + 3_600_000);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { timeZone: "America/New_York" });
    const tomorrow = new Date(now.getTime() + 86_400_000);
    const day = fmt(t) === fmt(now) ? "today" : fmt(t) === fmt(tomorrow) ? "tomorrow" : t.toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "long" });
    label = `Phones open ${day} at 10 AM ET · Texts 7 days`;
  }
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`size-2 rounded-full ${open ? "bg-[#3ecf7a] shadow-[0_0_0_3px_rgb(62_207_122/0.25)]" : "bg-white/35"}`} />
      {label}
    </span>
  );
}

function soldPhoto(s: SalesSummary["sold"][number]) {
  const m = pickPhotos({ make: s.make, model: s.model, partType: s.partType, spec: s.spec });
  if (m.files.length && (m.level === "exact" || m.level === "family")) return cutout(m.files[0]);
  return null;
}

/** Real sales from the yearly sheet: totals, top makes and a scrolling strip of sold units. */
export function SoldShowcase({ summary }: { summary: SalesSummary }) {
  // Rotate through makes (at most 2 of the same model) so the strip shows the range of what we sell
  const withImg = summary.sold.map((s) => ({ ...s, img: soldPhoto(s) })).filter((s) => s.img);
  const perModel = new Map<string, number>();
  const byMake = new Map<string, typeof withImg>();
  for (const s of withImg) {
    const k = `${s.make}|${s.model}|${s.partType}`;
    if ((perModel.get(k) ?? 0) >= 2) continue;
    perModel.set(k, (perModel.get(k) ?? 0) + 1);
    byMake.set(s.make, [...(byMake.get(s.make) ?? []), s]);
  }
  const queues = [...byMake.values()];
  const items: typeof withImg = [];
  while (items.length < 28 && queues.some((q) => q.length)) for (const q of queues) if (q.length && items.length < 28) items.push(q.shift()!);
  const top = summary.byMake.slice(0, 6);
  const max = top[0]?.count ?? 1;
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_15%_10%,rgb(201_150_47/0.14),transparent_70%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-14 pt-24 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <div className="text-[12px] font-medium uppercase tracking-[0.22em] text-gold-2">Our track record</div>
          <h2 className="font-serif mt-4 text-[2.8rem] leading-[1.02] sm:text-[3.8rem]">
            <span className="text-gold-grad">{BUSINESS.soldSince}</span> parts sold and shipped since {BUSINESS.founded}.
          </h2>
          <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-white/60">
            Every one matched to a VIN, crated on a pallet and delivered to a driveway or a repair shop. Here&apos;s a
            look at some of what customers have bought from us recently.
          </p>
          <dl className="mt-10 grid max-w-lg grid-cols-2 gap-6">
            <div className="border-l border-gold/40 pl-5">
              <dt className="text-[12px] uppercase tracking-[0.14em] text-white/45">In business since</dt>
              <dd className="font-serif mt-1 text-[2.6rem] leading-none">{BUSINESS.founded}</dd>
            </div>
            <div className="border-l border-gold/40 pl-5">
              <dt className="text-[12px] uppercase tracking-[0.14em] text-white/45">We deliver to</dt>
              <dd className="font-serif mt-1 text-[2.6rem] leading-none">48 states</dd>
            </div>
          </dl>
        </Reveal>
        <Reveal delay={120} className="self-end">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">Most-requested makes</h3>
              <span className="text-[12px] text-white/40">share of recent orders</span>
            </div>
            <ul className="mt-5 space-y-3.5">
              {top.map((m) => (
                <li key={m.make}>
                  <div className="text-[14px]">{m.make}</div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full bg-gold-grad" style={{ width: `${Math.max(6, (m.count / max) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      {items.length > 0 && (
        <div className="relative pb-24" aria-label="Parts we sold recently">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />
          <div className="marquee flex w-max gap-4 [animation-duration:110s]">
            {[...items, ...items].map((s, i) => (
              <div key={i} aria-hidden={i >= items.length || undefined} className="w-[250px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <div className="stage aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.img!} alt="" loading="lazy" className="relative z-10 h-full w-full object-contain p-5" />
                </div>
                <div className="p-4">
                  <div className="truncate text-[14px] font-semibold">{s.year} {s.make} {s.model}</div>
                  <div className="truncate text-[12.5px] text-white/50">{s.partType}{s.spec ? ` · ${s.spec}` : ""}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-[#3ecf7a]/12 px-2.5 py-0.5 text-[11px] font-semibold text-[#6fe0a0]">Sold</span>
                    <span className="font-serif text-[22px] leading-none text-gold-light">{money(s.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** Circular warranty seal with the JG monogram. */
export function GuaranteeSeal({ className = "" }: { className?: string }) {
  const text = `Est. ${BUSINESS.founded}  ·  ${BUSINESS.warrantyAdj} warranty  ·  VIN matched  ·  Photos first  ·  `.toUpperCase();
  return (
    <div className={`relative aspect-square ${className}`}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="seal-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6dd8f" />
            <stop offset="0.45" stopColor="#c9962f" />
            <stop offset="0.6" stopColor="#f3e3b3" />
            <stop offset="1" stopColor="#9a7220" />
          </linearGradient>
          <path id="seal-p" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <circle cx="100" cy="100" r="96" fill="#0b0b0c" stroke="url(#seal-g)" strokeWidth="2" />
        <circle cx="100" cy="100" r="64" fill="none" stroke="url(#seal-g)" strokeWidth="1" strokeDasharray="2 3" />
        <text fill="url(#seal-g)" fontSize="12" fontWeight="600" fontFamily="var(--font-inter), sans-serif">
          {/* textLength = circumference, so the words wrap the ring exactly once */}
          <textPath href="#seal-p" textLength="488" lengthAdjust="spacing">{text}</textPath>
        </text>
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/jg-mark-sm.png" alt="" className="absolute left-1/2 top-1/2 w-[44%] -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}

const ROWS: [string, string, string, string][] = [
  ["Price", "Fair used pricing, quoted upfront", "Low, but you pull it yourself", "Highest: new or remanufactured"],
  ["Matched to your VIN", "Yes, every order", "Up to you", "Yes"],
  ["Photos of the actual unit", "Yes, before you pay", "Rarely", "Not applicable"],
  ["Warranty", `${BUSINESS.warrantyAdj}, in writing`, "Often sold as-is", "Yes"],
  ["Delivered", `Free to shops, in ${BUSINESS.deliveryDays}, lower 48 states`, "Usually pickup only", "Through your shop"],
  ["A specialist who answers", BUSINESS.contactHours, "Counter service", "Parts counter"],
];

export function Comparison() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <Reveal className="max-w-2xl">
          <div className="eyebrow">How we compare</div>
          <h2 className="font-serif mt-3 text-[2.8rem] leading-[1.02] sm:text-[3.4rem]">The value of used, without the usual risk.</h2>
        </Reveal>
        <Reveal delay={100} className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[720px] overflow-hidden rounded-[24px] bg-white text-left shadow-card">
            <thead>
              <tr className="text-[13px]">
                <th className="w-[24%] p-5 font-medium text-steel"> </th>
                <th className="w-[28%] bg-ink p-5 text-white">
                  <span className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/jg-mark-sm.png" alt="" className="h-6 w-auto" />
                    <span className="font-semibold">Junkyard Gold</span>
                  </span>
                </th>
                <th className="w-[24%] p-5 font-semibold">Self-service salvage yard</th>
                <th className="w-[24%] p-5 font-semibold">Dealership</th>
              </tr>
            </thead>
            <tbody className="text-[14.5px]">
              {ROWS.map(([k, us, yard, dealer], i) => (
                <tr key={k} className="border-t border-line">
                  <th className="p-5 font-medium text-steel">{k}</th>
                  <td className={`bg-ink p-5 font-medium text-white ${i === ROWS.length - 1 ? "rounded-b-none" : ""}`}>
                    <span className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold-grad text-[11px] font-bold text-ink">✓</span>
                      {us}
                    </span>
                  </td>
                  <td className="p-5 text-ink/70">{yard}</td>
                  <td className="p-5 text-ink/70">{dealer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
