import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PartCard, partImages } from "@/components/part-card";
import { ProductView } from "@/components/product-view";
import { PageShell } from "@/components/site-chrome";
import { SoldShowcase } from "@/components/trust";
import { db } from "@/lib/db";
import { typeWhere } from "@/lib/inventory";
import { salesSummary } from "@/lib/site-data";
import { specsFor, yearsWithSpec } from "@/lib/specs";
import { unitOptions, unitRef } from "@/lib/unit-options";
import { makeWhere, modelMatches } from "@/lib/vehicles";

export const dynamic = "force-dynamic";

type SP = Promise<{ year?: string; make?: string; model?: string; type?: string; spec?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  return {
    title: `${[sp.year, sp.make, sp.model].filter(Boolean).join(" ")} Used ${sp.type || "Part"} Options`,
    robots: { index: false },
  };
}

export default async function OptionsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const year = parseInt(sp.year || "", 10);
  const { make, model, type, spec } = sp;
  const results = `/parts?${new URLSearchParams({ ...(type ? { type } : {}), ...(sp.year ? { year: sp.year } : {}), ...(make ? { make } : {}), ...(model ? { model } : {}) })}`;
  if (!year || !make || !model || !type || !spec) redirect(results);
  const specs = specsFor(year, make, model, type);
  if (!specs.includes(spec)) redirect(results);

  const vehicle = { year, make, model, partType: type, spec };
  const [options, sales, nearby] = await Promise.all([
    unitOptions(vehicle),
    salesSummary(),
    db.part.findMany({
      where: { status: "available", ...typeWhere(type), ...makeWhere(make), year: { gte: year - 3, lte: year + 3 } },
      orderBy: { price: "asc" },
      take: 200,
    }),
  ]);
  const listed = nearby.filter((p) => modelMatches(p.model, model)).slice(0, 3);
  const specHref = (s: string) => `/parts/options?${new URLSearchParams({ year: String(year), make, model, type, spec: s })}`;

  return (
    <PageShell>
      <ProductView
        {...vehicle}
        unitRef={unitRef(vehicle)}
        options={options}
        checkout={{ year: String(year), make, model, partType: type, spec }}
        images={partImages({ imageUrl: null, partType: type, make, model, spec })}
        sameYears={yearsWithSpec(make, model, type, spec)}
        otherSpecs={specs.filter((s) => s !== spec).map((s) => ({ label: s, href: specHref(s) }))}
        proof={sales ? <SoldShowcase summary={sales} /> : undefined}
        more={listed.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{listed.map((p) => <PartCard key={p.id} part={p} />)}</div> : undefined}
      />
    </PageShell>
  );
}
