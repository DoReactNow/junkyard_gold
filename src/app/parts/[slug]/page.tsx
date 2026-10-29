import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/inventory";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import { PageShell } from "@/components/site-chrome";
import { PartCard, partImage } from "@/components/part-card";
import { VinCheck } from "@/components/vin-check";
import { CameraIcon, ChatIcon, PhoneIcon, ShieldIcon, TruckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const part = await db.part.findUnique({ where: { slug: (await params).slug } });
  if (!part) return {};
  return {
    title: part.title,
    description: `${part.title}${part.mileage ? `, ${part.mileage.toLocaleString()} miles` : ""}. ${money(part.price)} with a ${part.warranty} warranty from ${BUSINESS.name} in Bradenton, FL.`,
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
      <div className="mx-auto max-w-6xl px-4 pt-6 text-sm text-steel">
        <Link href="/" className="hover:text-ink">Home</Link> /{" "}
        <Link href={`/parts?type=${part.partType === "Engine" || part.partType === "Transmission" ? part.partType : "Other"}`} className="hover:text-ink">{part.partType}s</Link> /{" "}
        <Link href={`/parts?year=${part.year}&make=${encodeURIComponent(part.make)}&model=${encodeURIComponent(part.model)}`} className="hover:text-ink">
          {part.year} {part.make} {part.model}
        </Link>
      </div>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-xl border border-line bg-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={partImage(part)} alt={part.title} className="aspect-[4/3] w-full object-cover" />
            {!part.imageUrl && (
              <span className="absolute left-3 top-3 rounded bg-white/90 px-2 py-1 text-xs font-semibold">Illustration</span>
            )}
          </div>
          <a href={smsWithBody(smsBody)} className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-white p-4 hover:border-gold">
            <CameraIcon className="size-6 text-gold-dark" />
            <span className="text-sm">
              <b>Want to see this exact unit?</b> Text us and we&apos;ll send real photos before you buy.
            </span>
          </a>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
            Used {part.partType} · Stock {part.stockNo || "—"}
          </span>
          <h1 className="mt-1 font-display text-4xl font-bold uppercase leading-tight">{name}</h1>
          {part.spec && <p className="mt-1 text-lg text-steel">{part.spec}</p>}

          <div className="mt-5 flex items-end gap-4">
            <div className="font-display text-5xl font-bold">{money(part.price)}</div>
            {sold && <span className="mb-2 rounded bg-bad px-2 py-1 text-xs font-bold uppercase text-white">Sold</span>}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line text-sm sm:grid-cols-4">
            {[
              ["Mileage", part.mileage ? `${part.mileage.toLocaleString()} mi` : "Ask us"],
              ["Warranty", part.warranty],
              ["Condition", part.condition],
              ["Ships to", "All 50 states"],
            ].map(([k, v]) => (
              <div key={k} className="bg-white p-3">
                <dt className="text-xs uppercase text-steel">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {!sold && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <form action="/api/checkout" method="post">
                <input type="hidden" name="slug" value={part.slug} />
                <button className="btn-gold w-full text-base">Buy Now · {money(part.price)}</button>
              </form>
              <a href={smsWithBody(smsBody)} className="btn-dark w-full text-base">
                <ChatIcon /> Text About This Part
              </a>
            </div>
          )}
          <a href={TEL_HREF} className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold hover:text-gold-dark">
            <PhoneIcon /> Or call {BUSINESS.phoneDisplay}
          </a>

          <div className="mt-6 rounded-lg border border-line bg-white p-5">
            <h2 className="font-display text-xl font-semibold uppercase">Will it fit? Check your VIN</h2>
            <p className="mb-3 text-sm text-steel">We decode your VIN and compare it with this unit.</p>
            <VinCheck partType={part.partType} productSlug={part.slug} />
          </div>

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3"><ShieldIcon className="size-5 shrink-0 text-gold-dark" /> {part.warranty} warranty against defects. <Link href="/warranty" className="underline">Details</Link></li>
            <li className="flex gap-3"><TruckIcon className="size-5 shrink-0 text-gold-dark" /> Freight shipping to your door or shop, quoted to your ZIP. <Link href="/shipping-returns" className="underline">Shipping &amp; returns</Link></li>
          </ul>
          {part.description && <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink/80">{part.description}</p>}
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <h2 className="font-display text-2xl font-semibold uppercase">More {part.year} {part.make} {part.model} {part.partType.toLowerCase()}s</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((p) => <PartCard key={p.id} part={p} />)}
          </div>
        </section>
      )}
    </PageShell>
  );
}
