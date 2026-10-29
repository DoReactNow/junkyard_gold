import Link from "next/link";
import { db } from "@/lib/db";
import { BUSINESS, SMS_HREF, TEL_HREF, smsWithBody } from "@/lib/business";
import { MAIN_TYPES, money } from "@/lib/inventory";
import { PageShell } from "@/components/site-chrome";
import { PartFinder } from "@/components/part-finder";
import { VinCheck } from "@/components/vin-check";
import { QuoteForm } from "@/components/quote-form";
import { PartCard } from "@/components/part-card";
import { CameraIcon, ChatIcon, PhoneIcon, PinIcon, ReturnIcon, ShieldIcon, TruckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", t: "Send your VIN", d: "Text it, or use the form. Your VIN tells us the exact engine and transmission your vehicle left the factory with." },
  { n: "02", t: "Get options by text", d: "A specialist texts you what fits: price, mileage and warranty for each unit, usually within minutes during business hours." },
  { n: "03", t: "See the real part", d: "Ask for photos of the exact unit before you pay. No stock photos, no surprises." },
  { n: "04", t: "Delivered to you", d: "Pay securely online. We ship it palletized by freight to your door or your repair shop, anywhere in the US." },
];

const FAQ = [
  { q: "Do I need my VIN?", a: "It's the fastest way to get the right part. If you don't have it, text us the year, make, model and engine size and we'll work from that." },
  { q: "What warranty do I get?", a: `Every used part comes with a ${BUSINESS.warrantyAdj} warranty against defects. See the warranty page for the details.` },
  { q: "Do you ship?", a: "Yes. We ship engines and transmissions on a pallet by freight carrier to homes and repair shops. We'll confirm the shipping cost to your ZIP with your quote." },
  { q: "Can I see photos first?", a: "Absolutely. Ask for photos of the exact unit by text and we'll send them before you buy." },
  { q: "What if it doesn't fit?", a: "We match every order to your VIN before it ships. If we send the wrong part, we'll make it right with an exchange or refund." },
];

export default async function Home() {
  const [featured, counts] = await Promise.all([
    db.part.findMany({ where: { status: "available", partType: { in: MAIN_TYPES } }, orderBy: [{ year: "desc" }, { price: "asc" }], distinct: ["make", "model", "partType"], take: 8 }),
    db.part.groupBy({ by: ["partType"], where: { status: "available" }, _count: true, _min: { price: true } }),
  ]);
  const stat = (t: string) => counts.find((c) => c.partType === t);
  const engines = stat("Engine");
  const trans = stat("Transmission");

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
              <PinIcon className="size-3.5" /> Bradenton, Florida · Ships nationwide
            </span>
            <h1 className="mt-5 font-display text-[2.35rem] font-bold uppercase leading-[1.04] sm:text-6xl">
              Used engines &amp; transmissions. <span className="text-gold">Text your VIN.</span> Get options in minutes.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Tested parts, real photos of the exact unit before you buy, and a {BUSINESS.warrantyAdj} warranty on everything
              we sell.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={smsWithBody("Hi, I need a part. My VIN is: ")} className="btn-gold text-base">
                <ChatIcon /> Text {BUSINESS.phoneDisplay}
              </a>
              <a href={TEL_HREF} className="btn border border-white/25 text-base text-white hover:border-gold">
                <PhoneIcon /> Call Us
              </a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-3 border-t border-white/10 pt-6">
              <div>
                <dt className="text-xs uppercase text-white/50">Engines from</dt>
                <dd className="font-display text-2xl font-semibold text-gold sm:text-3xl">{engines?._min.price ? money(engines._min.price) : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-white/50">Transmissions from</dt>
                <dd className="font-display text-2xl font-semibold text-gold sm:text-3xl">{trans?._min.price ? money(trans._min.price) : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-white/50">Warranty</dt>
                <dd className="font-display text-2xl font-semibold text-gold sm:text-3xl">3 mo.</dd>
              </div>
            </dl>
          </div>

          <div className="min-w-0 rounded-xl bg-white p-5 text-ink shadow-2xl sm:p-6">
            <h2 className="font-display text-2xl font-semibold uppercase">Find your part</h2>
            <p className="mb-4 text-sm text-steel">Pick your vehicle, or check by VIN below.</p>
            <PartFinder />
            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase text-steel">
              <span className="h-px flex-1 bg-line" /> or check by VIN <span className="h-px flex-1 bg-line" />
            </div>
            <VinCheck />
          </div>
        </div>
        <div className="stripe h-2" />
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: <ShieldIcon />, t: `${BUSINESS.warrantyAdj} warranty`, d: "On every used part we sell" },
            { i: <CameraIcon />, t: "Real photos first", d: "Of the exact unit, before you pay" },
            { i: <TruckIcon />, t: "Ships nationwide", d: "Palletized freight to your door or shop" },
            { i: <ReturnIcon />, t: "VIN-matched", d: "Wrong part? We make it right" },
          ].map((x) => (
            <div key={x.t} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-gold/15 text-gold-dark">{x.i}</span>
              <div>
                <div className="font-semibold">{x.t}</div>
                <div className="text-sm text-steel">{x.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INVENTORY */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Available now</span>
            <h2 className="font-display text-4xl font-semibold uppercase">Popular engines &amp; transmissions</h2>
          </div>
          <div className="flex gap-2">
            <Link href="/parts?type=Engine" className="btn-ghost !py-2 text-sm">All engines ({engines?._count ?? 0})</Link>
            <Link href="/parts?type=Transmission" className="btn-ghost !py-2 text-sm">All transmissions ({trans?._count ?? 0})</Link>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => <PartCard key={p.id} part={p} />)}
        </div>
        <p className="mt-6 text-center text-sm text-steel">
          Don&apos;t see yours? Our stock changes every day, and we source from partner yards.{" "}
          <a href={SMS_HREF} className="font-semibold text-ink underline">Text us your VIN</a>.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="scroll-mt-28 bg-ink-2 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <span className="text-xs font-semibold uppercase tracking-wide text-gold">How it works</span>
          <h2 className="font-display text-4xl font-semibold uppercase">From VIN to your driveway</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <div className="font-display text-4xl font-bold text-gold">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE + FAQ */}
      <section id="quote" className="mx-auto grid max-w-6xl scroll-mt-28 gap-10 px-4 py-14 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Free quote · no obligation</span>
          <h2 className="font-display text-3xl font-semibold uppercase">Get options by text</h2>
          <p className="mb-5 mt-1 text-sm text-steel">
            Tell us what you need. We&apos;ll text you matching parts with prices, mileage and photos.
          </p>
          <QuoteForm />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Questions</span>
          <h2 className="font-display text-3xl font-semibold uppercase">Straight answers</h2>
          <div className="mt-4 divide-y divide-line rounded-lg border border-line bg-white">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                  {f.q}
                  <span className="text-gold-dark transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-steel">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 rounded-lg bg-gold p-5">
            <div className="font-display text-xl font-semibold uppercase">Talk to a specialist</div>
            <p className="mt-1 text-sm">Call or text {BUSINESS.phoneDisplay} · {BUSINESS.hours}</p>
            <a href={SMS_HREF} className="mt-3 inline-block text-sm font-semibold underline">
              Text us your VIN →
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
