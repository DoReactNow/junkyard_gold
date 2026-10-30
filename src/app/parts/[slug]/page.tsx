import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { money, warrantyAdj } from "@/lib/inventory";
import { catalogPath } from "@/lib/catalog";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import { PageShell } from "@/components/site-chrome";
import { PartCard, partImages } from "@/components/part-card";
import { VinCheck } from "@/components/vin-check";
import { CameraIcon, ChatIcon, PhoneIcon, ShieldIcon, TruckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const part = await db.part.findUnique({ where: { slug: (await params).slug } });
  if (!part) return {};
  return {
    title: part.title,
    description: `${part.title}${part.mileage ? `, ${part.mileage.toLocaleString()} miles` : ""}. ${money(part.price)} with a ${warrantyAdj(part.warranty)} warranty from ${BUSINESS.name} in Bradenton, FL.`,
  };
}

export default async function PartPage({ params }: { params: Params }) {
  const part = await db.part.findUnique({ where: { slug: (await params).slug } });
  if (!part) notFound();

  const siblings = await db.part.findMany({
    where: { status: "available", year: part.year, make: part.make, model: part.model, partType: part.partType, NOT: { id: part.id } },
    orderBy: { price: "asc" },
    take: 6,
  });
  const sold = part.status !== "available";
  const images = partImages(part);
  const kind = part.partType === "Engine" ? "used-engines" : part.partType === "Transmission" ? "used-transmissions" : null;
  const name = `${part.year} ${part.make} ${part.model} ${part.partType}`;
  const smsBody = `Hi, I'm interested in the ${name} (stock ${part.stockNo || part.slug}). Can you send photos? My VIN is: `;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.title,
    sku: part.stockNo || part.slug,
    itemCondition: "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: part.price,
      priceCurrency: "USD",
      availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="border-b border-line bg-white">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 py-3.5 text-[13px] text-steel md:px-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">Home</Link>
          {(kind
            ? [
                { name: `${part.partType}s`, href: catalogPath(kind) },
                { name: part.make, href: catalogPath(kind, part.make) },
                { name: part.model, href: catalogPath(kind, part.make, part.model) },
                { name: String(part.year), href: catalogPath(kind, part.make, part.model, part.year) },
              ]
            : [
                { name: "Other parts", href: "/parts?type=Other" },
                { name: `${part.year} ${part.make} ${part.model}`, href: `/parts?year=${part.year}&make=${encodeURIComponent(part.make)}&model=${encodeURIComponent(part.model)}` },
              ]
          ).map((c) => (
            <span key={c.href} className="flex items-center gap-1.5">
              <span className="text-line">/</span>
              <Link href={c.href} className="hover:text-ink">{c.name}</Link>
            </span>
          ))}
        </nav>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className={`relative overflow-hidden rounded-3xl border border-line shadow-card ${images.kind === "illustration" ? "bg-ink" : "bg-white"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images.files[0]} alt={images.kind === "own" ? part.title : `Example ${part.partType.toLowerCase()} photo`} className="aspect-[4/3] w-full object-contain p-6" />
            {images.kind !== "own" && (
              <span className="absolute left-4 top-4 rounded-full bg-ink/90 px-3 py-1.5 text-[12px] font-semibold text-gold-light">
                {images.kind === "example" ? "Example photo" : "Illustration"}
              </span>
            )}
          </div>
          {images.files.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.files.slice(1, 5).map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f} src={f} alt="" loading="lazy" className="aspect-square w-full rounded-xl border border-line bg-white object-contain p-1.5" />
              ))}
            </div>
          )}
          <a href={smsWithBody(smsBody)} className="mt-4 flex items-center gap-4 rounded-2xl bg-ink p-5 text-white transition hover:bg-ink-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-2"><CameraIcon /></span>
            <span className="text-[14.5px] text-white/75">
              <b className="block text-white">See this exact unit before you buy</b>
              Text us and we&apos;ll send real photos of it.
            </span>
            <span className="ml-auto text-gold-2" aria-hidden>→</span>
          </a>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-gold-light">Used {part.partType.toLowerCase()}</span>
            <span className="rounded-full border border-line bg-white px-3 py-1 text-[12px] font-medium text-steel">Stock {part.stockNo || "—"}</span>
            {sold ? (
              <span className="rounded-full bg-bad px-3 py-1 text-[12px] font-bold text-white">Sold</span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-ok/10 px-3 py-1 text-[12px] font-semibold text-ok">
                <span className="size-1.5 rounded-full bg-ok" /> Available
              </span>
            )}
          </div>
          <h1 className="mt-4 font-display text-[2.2rem] font-bold leading-[1.08] sm:text-[2.6rem]">{name}</h1>
          {part.spec && <p className="mt-2 text-[17px] text-steel">{part.spec}</p>}

          <div className="card mt-7 p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-display text-5xl font-bold leading-none">{money(part.price)}</div>
                <div className="mt-2 text-[14px] text-steel">Includes a {warrantyAdj(part.warranty)} warranty · freight quoted to your ZIP</div>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
              {[
                ["Mileage", part.mileage ? `${part.mileage.toLocaleString()} mi` : "Ask us"],
                ["Warranty", part.warranty],
                ["Condition", part.condition],
                ["Ships to", "All 50 states"],
              ].map(([k, v]) => (
                <div key={k} className="bg-white px-4 py-3">
                  <dt className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-steel">{k}</dt>
                  <dd className="mt-0.5 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            {!sold && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <form action="/api/checkout" method="post">
                  <input type="hidden" name="slug" value={part.slug} />
                  <button className="btn-gold !h-14 w-full text-base">Buy now · {money(part.price)}</button>
                </form>
                <a href={smsWithBody(smsBody)} className="btn-dark !h-14 w-full text-base">
                  <ChatIcon /> Text about this part
                </a>
              </div>
            )}
            <a href={TEL_HREF} className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-ink/80 hover:text-gold-dark">
              <PhoneIcon /> Prefer to talk? Call {BUSINESS.phoneDisplay}
            </a>
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            <li className="flex gap-3 rounded-xl border border-line bg-white p-4 text-[14px]">
              <ShieldIcon className="size-5 shrink-0 text-gold-dark" />
              <span><b className="block">{warrantyAdj(part.warranty)} warranty</b><span className="text-steel">Covered against defects. </span><Link href="/warranty" className="font-medium underline decoration-gold underline-offset-2">Details</Link></span>
            </li>
            <li className="flex gap-3 rounded-xl border border-line bg-white p-4 text-[14px]">
              <TruckIcon className="size-5 shrink-0 text-gold-dark" />
              <span><b className="block">Freight to your door</b><span className="text-steel">Home or shop, all 50 states. </span><Link href="/shipping-returns" className="font-medium underline decoration-gold underline-offset-2">Shipping</Link></span>
            </li>
          </ul>

          <div className="card mt-6 p-6">
            <div className="eyebrow">Will it fit?</div>
            <h2 className="mt-1 font-display text-xl font-bold">Check your VIN against this unit</h2>
            <p className="mb-4 mt-1 text-sm text-steel">We decode your VIN and compare it with this {part.partType.toLowerCase()}.</p>
            <VinCheck partType={part.partType} productSlug={part.slug} />
          </div>
          {part.description && <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-ink/80">{part.description}</p>}
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="border-t border-line bg-sand/50">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
            <div className="eyebrow">More options</div>
            <h2 className="mt-2 font-display text-3xl font-bold">More {part.year} {part.make} {part.model} {part.partType.toLowerCase()}s</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((p) => <PartCard key={p.id} part={p} />)}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}
