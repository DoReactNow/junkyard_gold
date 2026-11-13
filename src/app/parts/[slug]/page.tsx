import type { Part } from "@prisma/client";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PartCard, partImages } from "@/components/part-card";
import { ProductView } from "@/components/product-view";
import { PageShell } from "@/components/site-chrome";
import { SoldShowcase } from "@/components/trust";
import { BUSINESS, siteUrl } from "@/lib/business";
import { catalogPath, type Kind } from "@/lib/catalog";
import { normalizeModel } from "@/lib/models";
import { db } from "@/lib/db";
import { money, partUrl, warrantyAdj } from "@/lib/inventory";
import { salesSummary } from "@/lib/site-data";
import { listedOptions } from "@/lib/unit-options";
import { stripVinSlug } from "@/lib/vin";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const part = await db.part.findUnique({ where: { slug: (await params).slug } });
  if (!part) return {};
  // Full spec titles run past 100 characters; search results show about 60.
  const miles = part.mileage ? `, ${Math.round(part.mileage / 1000)}K Miles` : "";
  const name = `${part.year} ${part.make} ${part.model} Used ${part.partType}`;
  const tail = ` ${money(part.price)} with a ${warrantyAdj(part.warranty)} warranty from ${BUSINESS.name}.`;
  const spec = part.title.length + tail.length <= 158 ? part.title : `${part.title.slice(0, 154 - tail.length).replace(/\s+\S*$/, "")}…`;
  return {
    title: `${name}${miles}`,
    description: `${spec}.${tail}`,
    alternates: { canonical: `/parts/${part.slug}` },
  };
}

/** "3 months" → 3 MON, "1 year" → 12 MON (schema.org QuantitativeValue, UN/CEFACT unit code). */
function warrantyMonths(w: string) {
  const n = parseInt(w, 10);
  if (!n) return null;
  return /year/i.test(w) ? n * 12 : n;
}

/**
 * Product + BreadcrumbList structured data. Only the business's own photos go in `image`: the
 * example photos show a different unit. No shippingDetails yet: delivery is free to repair shops
 * only and home delivery is quoted by text, which Google's shipping fields can't express honestly.
 */
function productJsonLd(part: Part, sold: boolean) {
  const base = siteUrl();
  const url = `${base}${partUrl(part)}`;
  const model = normalizeModel(part.make, part.model);
  const kind: Kind | null = part.partType === "Engine" ? "used-engines" : part.partType === "Transmission" ? "used-transmissions" : null;
  const images = partImages(part);
  const months = warrantyMonths(part.warranty);
  const miles = part.mileage ? `${part.mileage.toLocaleString("en-US")} miles, ` : "";
  const description =
    part.description ||
    `Used ${part.partType.toLowerCase()} for a ${part.year} ${part.make} ${model}${part.spec ? `, ${part.spec}` : ""}. ` +
      `${miles}matched to your VIN before it ships, with a ${warrantyAdj(part.warranty)} warranty.`;
  const crumbs = [
    { name: "Home", href: "/" },
    ...(kind
      ? [
          { name: `${part.partType}s`, href: catalogPath(kind) },
          { name: part.make, href: catalogPath(kind, part.make) },
          { name: model, href: catalogPath(kind, part.make, part.model) },
        ]
      : [{ name: "Parts", href: "/parts" }]),
    { name: part.title, href: partUrl(part) },
  ];
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: part.title,
      description,
      url,
      sku: part.stockNo || part.slug,
      category: `Vehicle Parts & Accessories > ${part.partType}s`,
      brand: { "@type": "Brand", name: part.make },
      itemCondition: "https://schema.org/UsedCondition",
      ...(images.kind === "own" ? { image: images.files.map((f) => (f.startsWith("http") ? f : `${base}${f}`)) } : {}),
      isAccessoryOrSparePartFor: {
        "@type": "Car",
        name: `${part.year} ${part.make} ${model}`,
        brand: { "@type": "Brand", name: part.make },
        model,
        vehicleModelDate: String(part.year),
      },
      ...(part.mileage
        ? { additionalProperty: [{ "@type": "PropertyValue", name: "Mileage", value: part.mileage, unitCode: "SMI" }] }
        : {}),
      offers: {
        "@type": "Offer",
        url,
        price: part.price,
        priceCurrency: "USD",
        availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        itemCondition: "https://schema.org/UsedCondition",
        seller: { "@id": `${base}/#business` },
        ...(months
          ? { warranty: { "@type": "WarrantyPromise", durationOfWarranty: { "@type": "QuantitativeValue", value: months, unitCode: "MON" } } }
          : {}),
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "US",
          returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
          merchantReturnLink: `${base}/shipping-returns`,
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${base}${c.href}` })),
    },
  ];
}

/** Old listing URLs carried a VIN from the sales sheet; send them to the cleaned slug (suffix allowed for collisions). */
async function vinFreeSlug(slug: string) {
  const clean = stripVinSlug(slug);
  if (clean === slug || !clean) return null;
  const hit =
    (await db.part.findUnique({ where: { slug: clean }, select: { slug: true } })) ??
    (await db.part.findFirst({ where: { slug: { startsWith: `${clean}-` } }, select: { slug: true }, orderBy: { createdAt: "asc" } }));
  return hit?.slug ?? null;
}

export default async function PartPage({ params }: { params: Params }) {
  const { slug } = await params;
  const part = await db.part.findUnique({ where: { slug } });
  if (!part) {
    const target = await vinFreeSlug(slug);
    if (target) permanentRedirect(`/parts/${target}`);
    notFound();
  }

  const [siblings, sales] = await Promise.all([
    db.part.findMany({
      where: { status: "available", year: part.year, make: part.make, model: part.model, partType: part.partType, NOT: { id: part.id } },
      orderBy: { price: "asc" },
      take: 6,
    }),
    salesSummary(),
  ]);
  const sold = part.status !== "available";

  const jsonLd = productJsonLd(part, sold);

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView
        year={part.year}
        make={part.make}
        model={part.model}
        partType={part.partType}
        spec={part.spec}
        unitRef={part.stockNo || part.slug}
        options={sold ? null : listedOptions(part)}
        checkout={{ slug: part.slug }}
        images={partImages(part)}
        condition={part.condition}
        description={part.description}
        productSlug={part.slug}
        notice={sold ? "This unit has sold. We can usually source another one, so send us your VIN." : undefined}
        proof={sales ? <SoldShowcase summary={sales} /> : undefined}
        more={siblings.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{siblings.map((p) => <PartCard key={p.id} part={p} />)}</div> : undefined}
      />
    </PageShell>
  );
}
