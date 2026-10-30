import Link from "next/link";
import { db } from "@/lib/db";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import { MAIN_TYPES, money, partUrl } from "@/lib/inventory";
import { catalogPath, makesFor } from "@/lib/catalog";
import { cutout, pickPhotos } from "@/lib/photos";
import { PageShell } from "@/components/site-chrome";
import { HeroSearch } from "@/components/hero-search";
import { QuoteForm } from "@/components/quote-form";
import { PartCard } from "@/components/part-card";
import { Stage } from "@/components/stage";
import { Reveal } from "@/components/reveal";
import { Comparison, GuaranteeSeal, SoldShowcase } from "@/components/trust";
import { AssuranceStrip, BuyOnline, DeliveryChoices } from "@/components/assurance";
import { GUIDES } from "@/lib/guides";
import { salesSummary } from "@/lib/site-data";
import { CameraIcon, ChatIcon, PhoneIcon, ReturnIcon, SearchIcon, ShieldIcon, TruckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const STEPS = [
  { t: "Send your VIN", d: "Text it or enter it above. Your VIN tells us exactly which engine and transmission your vehicle left the factory with." },
  { t: "Get matched options", d: "A parts specialist texts you the units that fit, with price, mileage and warranty for each, usually within minutes." },
  { t: "See the actual part", d: "Ask for photos of the exact unit before you pay. You know precisely what's on the truck." },
  { t: "Delivered to you", d: `Strapped to a pallet and shipped by freight, usually in ${BUSINESS.deliveryDays}. Free to your repair shop, or to your home for ${BUSINESS.homeDeliveryFee}.` },
];

const PROMISES = [
  { i: <SearchIcon className="size-5" />, t: "VIN-matched", d: "Engine code, drivetrain and options checked against your VIN before anything ships." },
  { i: <CameraIcon className="size-5" />, t: "Photos before you pay", d: "Real photos of the exact unit, sent to your phone on request." },
  { i: <ShieldIcon className="size-5" />, t: `${BUSINESS.warrantyAdj} warranty`, d: "Every used part is covered against defects, in writing." },
  { i: <TruckIcon className="size-5" />, t: "Free delivery to shops", d: `Palletized, strapped and wrapped, usually delivered in ${BUSINESS.deliveryDays}. Home delivery is ${BUSINESS.homeDeliveryFee}.` },
  { i: <ChatIcon className="size-5" />, t: "A real specialist", d: `${BUSINESS.contactHours}. No ticket queues.` },
  { i: <ReturnIcon className="size-5" />, t: `${BUSINESS.replacementDays}-day replacement`, d: "A problem with the part? We pick it up and send a replacement at our cost." },
];

const FAQ = [
  { q: "Do I need my VIN?", a: "It's the fastest way to get the right part. If you don't have it, text us the year, make, model and engine size and we'll work from that." },
  { q: "What warranty do I get?", a: `Every used part comes with a ${BUSINESS.warrantyAdj} warranty against defects. See the warranty page for the details.` },
  { q: "How does shipping work?", a: `Engines and transmissions ship on a pallet by freight carrier, usually in ${BUSINESS.deliveryDays}. Delivery to a repair shop is free. Home delivery is ${BUSINESS.homeDeliveryFee}, based on the part price. We deliver to the lower 48 states.` },
  { q: "Can I see photos first?", a: "Yes. Ask for photos of the exact unit by text and we'll send them before you buy." },
  { q: "What if there's a problem?", a: `We match every order to your VIN before it ships. If there's a problem within ${BUSINESS.replacementDays} days, we pick up the part and send a replacement at our cost, or refund you if we don't have one.` },
];

export default async function Home() {
  const [featured, counts, engineMakes, transMakes, sales] = await Promise.all([
    db.part.findMany({
      where: { status: "available", partType: { in: MAIN_TYPES } },
      orderBy: [{ year: "desc" }, { price: "asc" }],
      distinct: ["make", "model", "partType"],
      take: 300,
    }),
    db.part.groupBy({ by: ["partType"], where: { status: "available" }, _count: true, _min: { price: true } }),
    makesFor("used-engines"),
    makesFor("used-transmissions"),
    salesSummary(),
  ]);
  const stat = (t: string) => counts.find((c) => c.partType === t);
  const engines = stat("Engine");
  const trans = stat("Transmission");
    const makes = [...new Map([...engineMakes, ...transMakes].map((m) => [m.slug, m])).values()].sort((a, b) => b.count - a.count);

  // Lead with listings photographed as the same model, at typical prices, one per make
  const withPhoto = featured.filter((p) => pickPhotos(p).level === "exact");
  const typical = withPhoto.filter((p) => p.price >= 800 && p.price <= 3500 && p.year >= 2008);
  const pick = (type: string) => {
    const seen = new Set<string>();
    return typical.filter((p) => p.partType === type && !seen.has(p.make) && seen.add(p.make));
  };
  const [eng, tra] = [pick("Engine"), pick("Transmission")];
  const popular = Array.from({ length: 4 }, (_, i) => [eng[i], tra[i]]).flat().filter((p) => p !== undefined);
  const hero = withPhoto.find((p) => p.partType === "Engine" && p.make === "Ford" && /f150/i.test(p.model)) ?? eng[0] ?? withPhoto[0];
  const heroImg = hero ? cutout(pickPhotos(hero).files[0]) : "/img/parts-cut/ford-f150-engine-1.webp";
  // Hand-picked, sharpest photos for the large showcase spots
  const transImg = "/img/parts-cut/any-aisin-transmission-3.webp";
  const promiseImg = "/img/parts-cut/any-zf-transmission-2.webp";

  return (
    <PageShell>
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_75%_35%,rgb(201_150_47/0.16),transparent_70%)]" />
        <div className="grain pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid items-center gap-6 pb-10 pt-14 lg:grid-cols-[1fr_1.05fr] lg:pb-14 lg:pt-20">
            <div className="relative z-10 min-w-0">
              <div className="flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.22em] text-gold-2">
                <span className="h-px w-8 bg-gold-2" /> Est. {BUSINESS.founded} · Bradenton, Florida
              </div>
              <h1 className="font-serif mt-6 text-[3.4rem] leading-[0.98] sm:text-[4.6rem] lg:text-[5.6rem]">
                Used engines,
                <br />
                <em className="text-gold-grad">done right.</em>
              </h1>
              <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-white/65">
                {BUSINESS.networkSize} quality used engines and transmissions for every make, matched to your VIN, backed by a{" "}
                {BUSINESS.warrantyAdj} warranty, with photos of the exact unit before you pay.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href={smsWithBody("Hi, I need a part. My VIN is: ")} className="btn-gold !h-[54px] !px-7 text-[15.5px]">
                  <ChatIcon /> Text your VIN
                </a>
                <a href={TEL_HREF} className="btn-outline-light !h-[54px] !px-7 text-[15.5px]">
                  <PhoneIcon /> {BUSINESS.phoneDisplay}
                </a>
              </div>
            </div>

            <div className="relative min-w-0">
              <div className="pointer-events-none absolute inset-x-[10%] bottom-[7%] h-[12%] rounded-[50%] bg-black/80 blur-2xl" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 size-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/20 blur-[90px]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImg}
                alt={hero ? `${hero.year} ${hero.make} ${hero.model} engine` : "Used engine"}
                className="floaty relative mx-auto w-full max-w-[620px] drop-shadow-[0_40px_50px_rgb(0_0_0/0.7)]"
                fetchPriority="high"
              />
              {hero && (
                <Link
                  href={partUrl(hero)}
                  className="absolute bottom-[6%] right-0 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/55 py-2.5 pl-3 pr-4 backdrop-blur-md transition hover:border-gold/50 sm:right-6"
                >
                  <span className="size-2 rounded-full bg-ok shadow-[0_0_0_4px_rgb(31_122_74/0.25)]" />
                  <span>
                    <span className="block text-[13px] font-semibold">{hero.year} {hero.make} {hero.model} engine</span>
                    <span className="block text-[12px] text-white/55">{money(hero.price)} · {hero.mileage?.toLocaleString()} mi</span>
                  </span>
                </Link>
              )}
            </div>
          </div>

          <div className="relative z-10 pb-10 lg:pb-14">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ───────── PROOF STRIP ───────── */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 md:grid-cols-4 md:divide-x md:divide-line md:px-6">
          {[
            [BUSINESS.soldSince, `parts sold since ${BUSINESS.founded}`],
            ["All makes", "cars, SUVs to heavy-duty trucks"],
            [`${BUSINESS.replacementDays} days`, "pickup and replacement at our cost"],
            ["Free", "delivery to repair shops"],
          ].map(([n, t]) => (
            <div key={t} className="px-2 py-8 md:px-8">
              <div className="font-serif text-[2.7rem] leading-none">{n}</div>
              <div className="mt-2 text-[13.5px] text-steel">{t}</div>
            </div>
          ))}
        </div>
      </section>

      <AssuranceStrip />

      {/* ───────── CATEGORIES ───────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 md:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="eyebrow">Shop the catalog</div>
            <h2 className="font-serif mt-3 text-[2.8rem] leading-[1.02] sm:text-[3.6rem]">Powertrains for the vehicles people actually drive.</h2>
          </div>
          <p className="max-w-sm text-[15.5px] leading-relaxed text-steel">
            Daily drivers, work trucks and performance cars. Browse by make, or let us match it to your VIN.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {(
            [
              ["used-engines", "Used engines", engines, heroImg],
              ["used-transmissions", "Used transmissions", trans, transImg],
            ] as const
          ).map(([kind, label, s, img], i) => (
            <Reveal key={kind} delay={i * 120}>
              <Link href={catalogPath(kind)} className="group block overflow-hidden rounded-[28px] bg-ink text-white shadow-lift">
                <Stage src={img} gold className="aspect-[16/10]" imgClassName="p-10 transition duration-700 group-hover:scale-[1.05]" />
                <div className="flex items-end justify-between gap-4 border-t border-white/10 p-7">
                  <div>
                    <h3 className="font-serif text-[2.2rem] leading-none">{label}</h3>
                    <p className="mt-2 text-[14px] text-white/55">
                      Every make and model · from {s?._min.price ? money(s._min.price) : "—"}
                    </p>
                  </div>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full border border-white/15 text-gold-2 transition group-hover:border-gold group-hover:bg-gold-grad group-hover:text-ink" aria-hidden>
                    →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── MAKES MARQUEE ───────── */}
      <section className="overflow-hidden py-14" aria-label="Makes we carry">
        <div className="marquee flex w-max gap-3">
          {[...makes, ...makes].map((m, i) => (
            <Link
              key={`${m.slug}-${i}`}
              href={catalogPath(engineMakes.some((e) => e.slug === m.slug) ? "used-engines" : "used-transmissions", m.name)}
              className="flex items-center gap-3 rounded-full border border-line bg-white px-5 py-3 text-[15px] font-medium shadow-card transition hover:border-gold"
              tabIndex={i >= makes.length ? -1 : undefined}
              aria-hidden={i >= makes.length ? true : undefined}
            >
              {m.name}
              <span className="text-[12px] text-steel">{m.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────── FEATURED ───────── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">From our listings</div>
            <h2 className="font-serif mt-3 text-[2.6rem] leading-none sm:text-[3.2rem]">Popular vehicles</h2>
          </div>
          <div className="flex gap-2">
            <Link href="/used-engines" className="btn-ghost !h-11 text-sm">All engines</Link>
            <Link href="/used-transmissions" className="btn-ghost !h-11 text-sm">All transmissions</Link>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 80}>
              <PartCard part={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {sales && <SoldShowcase summary={sales} />}

      <BuyOnline />

      {/* ───────── PROMISE ───────── */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-24 md:px-6 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <Stage src={promiseImg} gold className="aspect-square rounded-[32px] shadow-lift" imgClassName="p-14" />
          </Reveal>
          <Reveal delay={120}>
            <div className="eyebrow">The Junkyard Gold standard</div>
            <h2 className="font-serif mt-3 text-[2.8rem] leading-[1.02] sm:text-[3.4rem]">Buying a used engine shouldn&apos;t feel like a gamble.</h2>
            <p className="mt-5 max-w-lg text-[16.5px] leading-relaxed text-steel">
              You&apos;re spending real money on a part you can&apos;t inspect yourself. So we match it to your VIN, show you
              the actual unit, put the warranty in writing, and answer the phone.
            </p>
            <ul className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {PROMISES.map((x) => (
                <li key={x.t} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/40 text-gold-dark">{x.i}</span>
                  <div>
                    <h3 className="font-semibold">{x.t}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-steel">{x.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ───────── PROCESS ───────── */}
      <section id="how" className="relative scroll-mt-28 overflow-hidden bg-ink text-white">
        <div className="grain pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-24 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="lg:sticky lg:top-36 lg:self-start">
            <div className="text-[12px] font-medium uppercase tracking-[0.22em] text-gold-2">How it works</div>
            <h2 className="font-serif mt-4 text-[2.8rem] leading-[1.02] sm:text-[3.6rem]">
              From your VIN to your driveway, <em className="text-gold-grad">in four steps.</em>
            </h2>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/60">
              No guesswork and no runaround. One specialist handles your order from the first text to delivery.
            </p>
            <a href={smsWithBody("Hi, I need a part. My VIN is: ")} className="btn-gold mt-9"><ChatIcon /> Start with your VIN</a>
          </Reveal>
          <ol className="divide-y divide-white/10 border-y border-white/10">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.t} delay={i * 90} className="grid grid-cols-[72px_1fr] gap-4 py-9 sm:grid-cols-[96px_1fr]">
                <span className="font-serif text-[3.2rem] leading-none text-gold-2/90">0{i + 1}</span>
                <div>
                  <h3 className="text-[21px] font-semibold tracking-tight">{s.t}</h3>
                  <p className="mt-2 max-w-md text-[15.5px] leading-relaxed text-white/60">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <Reveal className="max-w-2xl">
            <div className="eyebrow">Delivery</div>
            <h2 className="font-serif mt-3 text-[2.8rem] leading-[1.02] sm:text-[3.4rem]">Know where it&apos;s going and what it costs.</h2>
          </Reveal>
          <div className="mt-10"><DeliveryChoices /></div>
        </div>
      </section>

      <Comparison />

      {/* ───────── GUARANTEE ───────── */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="mx-auto w-full max-w-[340px]">
            <GuaranteeSeal className="drop-shadow-[0_30px_40px_rgb(0_0_0/0.25)]" />
          </Reveal>
          <Reveal delay={120}>
            <div className="eyebrow">Our written guarantee</div>
            <h2 className="font-serif mt-3 text-[2.8rem] leading-[1.02] sm:text-[3.4rem]">
              The right part, as described, <em className="text-gold-grad">or we make it right.</em>
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {[
                ["Matched to your VIN", "We confirm engine code, drivetrain and options against your VIN before anything ships."],
                [`${BUSINESS.warrantyAdj} warranty`, "Covered against defects from the day it arrives. The terms are written down, not promised over the phone."],
                [`${BUSINESS.replacementDays}-day replacement`, "If there's a problem with the part, we pick it up and send a replacement at our cost."],
              ].map(([t, d], i) => (
                <div key={t} className="border-t border-gold/40 pt-5">
                  <div className="font-serif text-[1.9rem] leading-none text-gold-dark">0{i + 1}</div>
                  <h3 className="mt-3 font-semibold">{t}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-steel">{d}</p>
                </div>
              ))}
            </div>
            <Link href="/warranty" className="mt-9 inline-flex items-center gap-2 text-[15px] font-semibold underline decoration-gold underline-offset-4 hover:text-gold-dark">
              Read the full warranty →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ───────── SHOP BY MAKE ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <Reveal className="max-w-2xl">
          <div className="eyebrow">Shop by make</div>
          <h2 className="font-serif mt-3 text-[2.8rem] leading-[1.02] sm:text-[3.4rem]">Go straight to your vehicle.</h2>
        </Reveal>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {engineMakes.slice(0, 16).map((m) => {
            const t = transMakes.find((x) => x.slug === m.slug);
            return (
              <li key={m.slug} className="card p-5">
                <h3 className="text-[17px] font-semibold">{m.name}</h3>
                <Link href={catalogPath("used-engines", m.name)} className="mt-3 flex justify-between gap-3 text-[14px] text-steel hover:text-ink">
                  Engines <span>from <b className="font-semibold text-ink">{money(m.from)}</b></span>
                </Link>
                {t && (
                  <Link href={catalogPath("used-transmissions", m.name)} className="mt-1.5 flex justify-between gap-3 text-[14px] text-steel hover:text-ink">
                    Transmissions <span>from <b className="font-semibold text-ink">{money(t.from)}</b></span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────── GUIDES ───────── */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Before you buy</div>
              <h2 className="font-serif mt-3 text-[2.8rem] leading-[1.02] sm:text-[3.4rem]">Know what you&apos;re buying.</h2>
            </div>
            <Link href="/guides" className="btn-ghost !h-11 text-sm">All guides</Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {GUIDES.slice(0, 3).map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="card flex flex-col p-6 transition hover:-translate-y-0.5 hover:border-gold/60">
                <span className="eyebrow">{g.eyebrow} · {g.minutes} min read</span>
                <span className="mt-3 text-[18px] font-semibold leading-snug">{g.title}</span>
                <span className="mt-2 text-[14.5px] leading-relaxed text-steel">{g.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── QUOTE + FAQ ───────── */}
      <section id="quote" className="scroll-mt-28 bg-paper">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-24 md:px-6 lg:grid-cols-[1.05fr_1fr]">
          <Reveal>
            <div className="card relative overflow-hidden rounded-[28px] p-7 sm:p-10">
              <div className="absolute inset-x-0 top-0 h-1 bg-gold-grad" />
              <div className="eyebrow">Free quote · no obligation</div>
              <h2 className="font-serif mt-3 text-[2.4rem] leading-none">Get your options by text</h2>
              <p className="mb-8 mt-3 text-[15px] text-steel">
                Tell us what you need. A specialist texts you matching parts with prices, mileage and photos.
              </p>
              <QuoteForm />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div id="faq" className="scroll-mt-28">
              <div className="eyebrow">Questions</div>
              <h2 className="font-serif mt-3 text-[2.4rem] leading-none">Straight answers</h2>
              <div className="mt-8 divide-y divide-line border-y border-line">
                {FAQ.map((f) => (
                  <details key={f.q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-gold-dark transition group-open:rotate-45 group-open:border-gold">+</span>
                    </summary>
                    <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-steel">{f.a}</p>
                  </details>
                ))}
              </div>
              <Link href="/faq" className="mt-5 inline-flex font-semibold underline decoration-gold underline-offset-4 hover:text-gold-dark">See all questions →</Link>
              <div className="mt-8 flex items-center gap-4 rounded-2xl bg-ink p-5 text-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/jg-mark-sm.png" alt="" className="h-9 w-auto" />
                <div className="mr-auto">
                  <div className="font-semibold">Talk to a parts specialist</div>
                  <div className="text-sm text-white/55">{BUSINESS.contactHours}</div>
                </div>
                <a href={TEL_HREF} className="btn-gold !h-11 text-sm"><PhoneIcon /> Call</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
