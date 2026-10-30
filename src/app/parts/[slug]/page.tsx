import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartCard, partImages } from "@/components/part-card";
import { ProductView } from "@/components/product-view";
import { PageShell } from "@/components/site-chrome";
import { SoldShowcase } from "@/components/trust";
import { BUSINESS } from "@/lib/business";
import { db } from "@/lib/db";
import { money, warrantyAdj } from "@/lib/inventory";
import { salesSummary } from "@/lib/site-data";
import { listedOptions } from "@/lib/unit-options";

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

  const [siblings, sales] = await Promise.all([
    db.part.findMany({
      where: { status: "available", year: part.year, make: part.make, model: part.model, partType: part.partType, NOT: { id: part.id } },
      orderBy: { price: "asc" },
      take: 6,
    }),
    salesSummary(),
  ]);
  const sold = part.status !== "available";

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
