import Link from "next/link";
import { db } from "@/lib/db";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import { MAIN_TYPES, money, partUrl } from "@/lib/inventory";
import { catalogPath, makesFor } from "@/lib/catalog";
import { pickPhotos } from "@/lib/photos";
import { PageShell } from "@/components/site-chrome";
import { PartFinder } from "@/components/part-finder";
import { VinCheck } from "@/components/vin-check";
import { QuoteForm } from "@/components/quote-form";
import { PartCard } from "@/components/part-card";
import { CameraIcon, ChatIcon, CheckIcon, PhoneIcon, ReturnIcon, SearchIcon, ShieldIcon, TruckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const STEPS = [
  { t: "Send your VIN", d: "Text it or enter it here. Your VIN tells us exactly which engine and transmission your vehicle came with." },
  { t: "Get matched options", d: "A parts specialist texts you the units that fit, with price, mileage and warranty for each, usually within minutes." },
  { t: "See the actual part", d: "Ask for photos of the exact unit before you pay. You know what you're getting before it ships." },
  { t: "Delivered to you", d: "Pay securely, and we ship it palletized by freight to your door or repair shop, anywhere in the US." },
];

const PROMISES = [
  { i: <SearchIcon className="size-5" />, t: "VIN-matched, every time", d: "We check every order against your VIN before it ships, so you get the right engine code, drivetrain and options." },
  { i: <CameraIcon className="size-5" />, t: "Photos before you pay", d: "Ask and we'll text you photos of the exact unit. No surprises when the truck shows up." },
  { i: <ShieldIcon className="size-5" />, t: `${BUSINESS.warrantyAdj} warranty`, d: "Every used part we sell is covered against defects. Clear terms, in writing." },
  { i: <TruckIcon className="size-5" />, t: "Freight to your door", d: "Strapped and wrapped on a pallet, shipped to a home or shop in all 50 states, with tracking by text." },
  { i: <ChatIcon className="size-5" />, t: "A real person on the phone", d: `Talk or text with a parts specialist, ${BUSINESS.hours}. No ticket queues.` },
  { i: <ReturnIcon className="size-5" />, t: "We make it right", d: "Wrong part or defective under warranty? We exchange it or refund you, return freight included." },
];

const FAQ = [
  { q: "Do I need my VIN?", a: "It's the fastest way to get the right part. If you don't have it, text us the year, make, model and engine size and we'll work from that." },
  { q: "What warranty do I get?", a: `Every used part comes with a ${BUSINESS.warrantyAdj} warranty against defects. See the warranty page for the details.` },
  { q: "How does shipping work?", a: "Engines and transmissions ship on a pallet by freight carrier to homes and repair shops. We confirm the shipping cost to your ZIP with your quote, before you pay." },
  { q: "Can I see photos first?", a: "Yes. Ask for photos of the exact unit by text and we'll send them before you buy." },
  { q: "What if it doesn't fit?", a: "We match every order to your VIN before it ships. If we send the wrong part, we'll make it right with an exchange or refund." },
];

export default async function Home() {
  const [featured, counts, engineMakes, transMakes] = await Promise.all([
    db.part.findMany({
      where: { status: "available", partType: { in: MAIN_TYPES } },
      orderBy: [{ year: "desc" }, { price: "asc" }],
      distinct: ["make", "model", "partType"],
      take: 300,
    }),
    db.part.groupBy({ by: ["partType"], where: { status: "available" }, _count: true, _min: { price: true } }),
    makesFor("used-engines"),
    makesFor("used-transmissions"),
  ]);
  const stat = (t: string) => counts.find((c) => c.partType === t);
  const engines = stat("Engine");
  const trans = stat("Transmission");
  const total = counts.reduce((n, c) => n + c._count, 0);
  const makeCount = new Set([...engineMakes, ...transMakes].map((m) => m.slug)).size;

  // Lead with listings that have a photo of the same model
  const withPhoto = featured.filter((p) => pickPhotos(p).level === "exact");
  // Typical prices, one per make, alternating engines and transmissions
  const typical = withPhoto.filter((p) => p.price >= 800 && p.price <= 3500 && p.year >= 2008);
  const pick = (type: string) => {
    const seen = new Set<string>();
    return typical.filter((p) => p.partType === type && !seen.has(p.make) && seen.add(p.make));
  };
  const [eng, tra] = [pick("Engine"), pick("Transmission")];
  const popular = Array.from({ length: 4 }, (_, i) => [eng[i], tra[i]]).flat().filter((p) => p !== undefined);
  const heroPart =
    withPhoto.find((p) => p.partType === "Engine" && p.price >= 1200 && p.price <= 3000 && p.year <= 2020) ??
    withPhoto[0] ?? popular[0];
  const heroPhoto = heroPart ? pickPhotos(heroPart).files[0] : null;
  const gallery = withPhoto.slice(0, 4).map((p) => pickPhotos(p).files[0]);

  return (
    <PageShell>
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -left-40 top-20 size-[560px] rounded-full bg-gold/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 -top-32 size-[480px] rounded-full bg-gold/[0.07] blur-[100px]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-12 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-[12.5px] font-medium text-gold-light">
              <span className="size-1.5 rounded-full bg-gold-2 shadow-[0_0_0_3px_rgb(230_189_92/0.25)]" />
              {total.toLocaleString()} engines &amp; transmissions listed
            </div>
            <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.02] sm:text-6xl lg:text-[4.1rem]">
              Used engines &amp; transmissions, <span className="text-gold-grad">matched to your VIN.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/70">
              Quality used powertrains with a {BUSINESS.warrantyAdj} warranty, photos of the exact unit before you pay,
              and freight delivery to your door or shop. From Bradenton, Florida, to all 50 states.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={smsWithBody("Hi, I need a part. My VIN is: ")} className="btn-gold !h-[52px] !px-6 text-base">
                <ChatIcon /> Text your VIN
              </a>
              <a href={TEL_HREF} className="btn-outline-light !h-[52px] !px-6 text-base">
                <PhoneIcon /> {BUSINESS.phoneDisplay}
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-white/65">
              {["VIN-matched before shipping", "Photos before you pay", "Real people, not bots"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckIcon className="size-4 text-gold-2" /> {t}
                </li>
              ))}
            </ul>
            <dl className="mt-12 grid max-w-xl grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-6">
              {[
                ["Engines from", engines?._min.price ? money(engines._min.price) : "—"],
                ["Transmissions from", trans?._min.price ? money(trans._min.price) : "—"],
                ["Makes covered", String(makeCount)],
              ].map(([k, v], i) => (
                <div key={k} className={i ? "pl-4 sm:pl-6" : ""}>
                  <dt className="text-[12px] uppercase tracking-[0.12em] text-white/45">{k}</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-gold-light sm:text-3xl">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-w-0">
            {heroPart && heroPhoto && (
              <Link
                href={partUrl(heroPart)}
                className="absolute -top-8 right-0 z-10 hidden w-52 rotate-[2deg] overflow-hidden rounded-2xl bg-white text-ink shadow-lift transition hover:rotate-0 xl:block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroPhoto} alt="" className="aspect-[4/3] w-full object-contain p-2" />
                <div className="border-t border-line px-3.5 py-2.5">
                  <div className="truncate text-[12.5px] font-semibold">{heroPart.year} {heroPart.make} {heroPart.model} {heroPart.partType}</div>
                  <div className="text-[12px] text-steel">{money(heroPart.price)} · {heroPart.mileage?.toLocaleString()} mi</div>
                </div>
              </Link>
            )}
            <div className="relative rounded-3xl bg-white p-6 text-ink shadow-lift sm:p-7 xl:mr-28 xl:mt-24">
              <div className="eyebrow">Find your part</div>
              <h2 className="mt-1.5 font-display text-2xl font-bold">What are you driving?</h2>
              <p className="mb-5 mt-1 text-sm text-steel">Choose your vehicle, or check by VIN below.</p>
              <PartFinder />
              <div className="my-5 flex items-center gap-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-steel">
                <span className="h-px flex-1 bg-line" /> or check by VIN <span className="h-px flex-1 bg-line" />
              </div>
              <VinCheck />
            </div>
          </div>
        </div>
        <div className="hairline-gold" />
      </section>

      {/* ───────── ASSURANCES ───────── */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-x-6 gap-y-6 px-4 py-9 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
          {[
            { i: <ShieldIcon />, t: `${BUSINESS.warrantyAdj} warranty`, d: "On every used part" },
            { i: <SearchIcon className="size-5" />, t: "VIN-matched", d: "Checked before it ships" },
            { i: <CameraIcon />, t: "Real photos first", d: "Of the exact unit" },
            { i: <TruckIcon />, t: "Ships nationwide", d: "Freight to your door or shop" },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-gold-2">{x.i}</span>
              <div>
                <div className="font-semibold">{x.t}</div>
                <div className="text-sm text-steel">{x.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── SHOP BY MAKE ───────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 md:px-6">
        <div className="max-w-2xl">
          <div className="eyebrow">Shop by make</div>
          <h2 className="mt-2 font-display text-4xl font-bold sm:text-[2.75rem]">Parts for {makeCount} makes, from daily drivers to work trucks.</h2>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {([["used-engines", "Used engines", engineMakes, engines?._count ?? 0], ["used-transmissions", "Used transmissions", transMakes, trans?._count ?? 0]] as const).map(([kind, label, list, n]) => (
            <div key={kind} className="card p-6 sm:p-7">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl font-bold">
                  <Link href={catalogPath(kind)} className="hover:text-gold-dark">{label}</Link>
                </h3>
                <span className="text-sm text-steel">{n.toLocaleString()} listed</span>
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {list.slice(0, 12).map((m) => (
                  <li key={m.slug}>
                    <Link href={catalogPath(kind, m.name)} className="group flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[14px] transition hover:border-gold hover:bg-paper">
                      <span className="font-medium">{m.name}</span>
                      <span className="text-[12px] text-steel group-hover:text-gold-dark">{m.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={catalogPath(kind)} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-gold-dark">
                All {list.length} makes <span aria-hidden>→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── POPULAR PARTS ───────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Available now</div>
            <h2 className="mt-2 font-display text-4xl font-bold sm:text-[2.75rem]">Popular engines &amp; transmissions</h2>
          </div>
          <div className="flex gap-2">
            <Link href="/used-engines" className="btn-ghost !h-11 text-sm">All engines</Link>
            <Link href="/used-transmissions" className="btn-ghost !h-11 text-sm">All transmissions</Link>
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((p) => <PartCard key={p.id} part={p} />)}
        </div>
      </section>

      {/* ───────── HOW IT WORKS ───────── */}
      <section id="how" className="relative scroll-mt-28 overflow-hidden bg-ink text-white">
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="max-w-2xl">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-2">How it works</div>
            <h2 className="mt-2 font-display text-4xl font-bold sm:text-[2.75rem]">From your VIN to your driveway in four steps.</h2>
          </div>
          <ol className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((s, i) => (
              <li key={s.t} className="relative">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-full border border-gold/40 font-display text-lg font-bold text-gold-light">{i + 1}</span>
                  {i < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-gradient-to-r from-gold/40 to-transparent lg:block" />}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/60">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mr-auto">
              <div className="font-semibold">Have your VIN handy?</div>
              <div className="text-sm text-white/60">Text it to {BUSINESS.phoneDisplay} and a specialist will reply with options.</div>
            </div>
            <a href={smsWithBody("Hi, I need a part. My VIN is: ")} className="btn-gold"><ChatIcon /> Text your VIN</a>
          </div>
        </div>
      </section>

      {/* ───────── WHY US ───────── */}
      <section className="bg-sand/60">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 md:px-6 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <div className="eyebrow">Why Junkyard Gold</div>
            <h2 className="mt-2 font-display text-4xl font-bold sm:text-[2.75rem]">Buying a used engine shouldn&apos;t feel like a gamble.</h2>
            <p className="mt-5 max-w-lg text-[16.5px] leading-relaxed text-ink/70">
              You&apos;re about to spend real money on a part you can&apos;t inspect yourself. So we match it to your VIN,
              show you the actual unit, put the warranty in writing, and pick up the phone when you call.
            </p>
            {gallery.length === 4 && (
              <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
                {gallery.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" loading="lazy" className="aspect-square w-full rounded-2xl border border-line bg-white object-contain p-3" />
                ))}
              </div>
            )}
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {PROMISES.map((x) => (
              <li key={x.t} className="card p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-ink text-gold-2">{x.i}</span>
                <h3 className="mt-4 text-[17px] font-semibold">{x.t}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-steel">{x.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── QUOTE + FAQ ───────── */}
      <section id="quote" className="mx-auto grid max-w-7xl scroll-mt-28 gap-12 px-4 py-20 md:px-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="card relative overflow-hidden p-7 sm:p-9">
          <div className="absolute inset-x-0 top-0 h-1 bg-gold-grad" />
          <div className="eyebrow">Free quote · no obligation</div>
          <h2 className="mt-2 font-display text-3xl font-bold">Get your options by text</h2>
          <p className="mb-7 mt-2 text-[15px] text-steel">
            Tell us what you need. A specialist texts you matching parts with prices, mileage and photos.
          </p>
          <QuoteForm />
        </div>
        <div id="faq" className="scroll-mt-28">
          <div className="eyebrow">Questions</div>
          <h2 className="mt-2 font-display text-3xl font-bold">Straight answers</h2>
          <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-6 py-5 open:bg-paper/60">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-gold-dark transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-steel">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-ink p-5 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/jg-mark-sm.png" alt="" className="h-9 w-auto" />
            <div className="mr-auto">
              <div className="font-semibold">Talk to a parts specialist</div>
              <div className="text-sm text-white/60">{BUSINESS.hours}</div>
            </div>
            <a href={TEL_HREF} className="btn-gold !h-11 text-sm"><PhoneIcon /> Call</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
