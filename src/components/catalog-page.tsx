import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BUSINESS, siteUrl, smsWithBody } from "@/lib/business";
import { KINDS, catalogPath, listingsFor, makesFor, modelsFor, resolveMake, resolveModel, yearsFor, type Facet, type Kind } from "@/lib/catalog";
import { money, partUrl } from "@/lib/inventory";
import { PageShell } from "./site-chrome";
import { PartCard } from "./part-card";
import { VinCheck } from "./vin-check";
import { ChatIcon } from "./icons";

type Params = { make?: string; model?: string; year?: string };

/** Looks up what the URL points at; notFound() for slugs with no listings. */
async function resolve(kind: Kind, p: Params) {
  const make = p.make ? await resolveMake(kind, p.make) : null;
  if (p.make && !make) notFound();
  const model = make && p.model ? await resolveModel(kind, make.name, p.model) : null;
  if (p.model && !model) notFound();
  const year = p.year ? Number(p.year) : undefined;
  if (p.year && (!/^(19|20)\d{2}$/.test(p.year) || !model)) notFound();
  if (year && model && !(await yearsFor(kind, make!.name, model.name)).some((y) => y.name === p.year)) notFound();
  return { make, model, year };
}

function heading(kind: Kind, r: Awaited<ReturnType<typeof resolve>>) {
  const k = KINDS[kind];
  const vehicle = [r.year, r.make?.name, r.model?.name].filter(Boolean).join(" ");
  return { vehicle, title: vehicle ? `Used ${vehicle} ${k.plural}` : `Used ${k.plural}` };
}

export async function catalogMetadata(kind: Kind, p: Params): Promise<Metadata> {
  const r = await resolve(kind, p);
  const k = KINDS[kind];
  const { vehicle, title } = heading(kind, r);
  const facet = r.year
    ? (await yearsFor(kind, r.make!.name, r.model!.name)).find((y) => y.name === String(r.year))
    : (r.model ?? r.make);
  const from = facet ? ` from ${money(facet.from)}` : "";
  return {
    title: `${title} for Sale${from}`,
    description: `${vehicle ? `${vehicle} used ${k.singular}s` : `Used ${k.singular}s`}${from}, VIN-matched, with a ${BUSINESS.warrantyAdj} warranty and real photos before you buy. Shipped nationwide from ${BUSINESS.name}, Bradenton FL.`,
    alternates: { canonical: catalogPath(kind, r.make?.name, r.model?.name, r.year) },
  };
}

function FacetLinks({ title, items, href }: { title: string; items: Facet[]; href: (f: Facet) => string }) {
  if (!items.length) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold uppercase">{title}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((f) => (
          <li key={f.slug}>
            <Link href={href(f)} className="block rounded-md border border-line bg-white px-3 py-2.5 text-sm hover:border-gold">
              <span className="block truncate font-semibold">{f.name}</span>
              <span className="block text-xs text-steel">{f.count} available · from {money(f.from)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function CatalogPage({ kind, params }: { kind: Kind; params: Params }) {
  const r = await resolve(kind, params);
  const k = KINDS[kind];
  const { vehicle, title } = heading(kind, r);
  const f = { make: r.make?.name, model: r.model?.name, year: r.year };

  const [listings, makes, models, years] = await Promise.all([
    listingsFor(kind, f),
    r.make ? Promise.resolve([]) : makesFor(kind),
    r.make && !r.model ? modelsFor(kind, r.make.name) : Promise.resolve([]),
    r.model && !r.year ? yearsFor(kind, r.make!.name, r.model.name) : Promise.resolve([]),
  ]);
  const facets = r.year ? null : r.model ? years : r.make ? models : makes;
  const total = r.year
    ? (await yearsFor(kind, r.make!.name, r.model!.name)).find((y) => y.name === String(r.year))!.count
    : (facets ?? []).reduce((n, x) => n + x.count, 0);
  const from = Math.min(...listings.map((p) => p.price), ...(facets ?? []).map((x) => x.from));
  const allHref = `/parts?${new URLSearchParams({ type: k.partType, ...(f.year ? { year: String(f.year) } : {}), ...(f.make ? { make: f.make } : {}), ...(f.model ? { model: f.model } : {}) })}`;

  const crumbs = [
    { name: "Home", href: "/" },
    { name: `Used ${k.plural}`, href: catalogPath(kind) },
    ...(r.make ? [{ name: r.make.name, href: catalogPath(kind, r.make.name) }] : []),
    ...(r.model ? [{ name: r.model.name, href: catalogPath(kind, r.make!.name, r.model.name) }] : []),
    ...(r.year ? [{ name: String(r.year), href: catalogPath(kind, r.make!.name, r.model!.name, r.year) }] : []),
  ];
  const what = vehicle ? `${vehicle} ${k.singular}` : `${k.singular}`;
  const faq = [
    {
      q: `Will a used ${what} fit my vehicle?`,
      a: `Enter or text us your VIN. We decode it and match the ${k.singular} to your exact engine size, drivetrain and options before anything ships.`,
    },
    {
      q: `How much is a used ${what}?`,
      a: `Our used ${what}s start at ${money(from)}. Each listing shows the price, mileage and the ${BUSINESS.warrantyAdj} warranty. Shipping is quoted to your ZIP code.`,
    },
    { q: "Can I see the actual part?", a: "Yes. Text us and we'll send photos of the exact unit before you pay." },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${siteUrl()}${c.href}` })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: listings.slice(0, 12).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${siteUrl()}${partUrl(p)}`, name: p.title })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
    },
  ];

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <nav className="flex flex-wrap gap-1 text-sm text-white/60" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={c.href}>
                {i > 0 && " / "}
                {i < crumbs.length - 1 ? <Link href={c.href} className="hover:text-gold">{c.name}</Link> : <span className="text-white/85">{c.name}</span>}
              </span>
            ))}
          </nav>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase sm:text-5xl">{title} for Sale</h1>
          <p className="mt-2 text-white/75">
            {total.toLocaleString()} available · from {money(from)} · {BUSINESS.warrantyAdj} warranty · ships to all 50 states
          </p>
        </div>
        <div className="stripe h-1.5" />
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <p className="max-w-3xl leading-relaxed text-ink/80">
            {vehicle
              ? `Looking for a used ${what}? Every ${k.singular} below is matched to your VIN before it ships, comes with a ${BUSINESS.warrantyAdj} warranty, and we'll text you photos of the exact unit before you pay. Prices start at ${money(from)}.`
              : `Tested used ${k.singular}s for cars, trucks and SUVs, shipped by freight to your door or repair shop. Pick your make below, or check your VIN to see what fits. Every ${k.singular} carries a ${BUSINESS.warrantyAdj} warranty.`}
          </p>

          {facets && (
            <FacetLinks
              title={r.model ? `${r.make!.name} ${r.model.name} ${k.plural} by year` : r.make ? `${r.make.name} ${k.plural} by model` : `Used ${k.plural} by make`}
              items={facets}
              href={(x) => (r.model ? catalogPath(kind, r.make!.name, r.model.name, Number(x.name)) : r.make ? catalogPath(kind, r.make.name, x.name) : catalogPath(kind, x.name))}
            />
          )}

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold uppercase">{vehicle ? `${vehicle} ${k.plural}` : `Latest ${k.plural}`}</h2>
              {total > listings.length && <Link href={allHref} className="text-sm font-semibold underline">See all {total.toLocaleString()} →</Link>}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((p) => <PartCard key={p.id} part={p} />)}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold uppercase">Questions</h2>
            <div className="mt-3 divide-y divide-line rounded-lg border border-line bg-white">
              {faq.map((x) => (
                <div key={x.q} className="p-4">
                  <h3 className="font-semibold">{x.q}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-steel">{x.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="font-display text-lg uppercase">Check your VIN</h2>
            <p className="mb-3 text-sm text-steel">See which {k.singular}s fit your vehicle.</p>
            <VinCheck partType={k.partType} />
          </div>
          <div className="rounded-lg bg-gold p-4">
            <div className="font-display text-lg font-semibold uppercase">Not finding it?</div>
            <p className="mt-1 text-sm">We check our partner network for anything not listed here.</p>
            <a href={smsWithBody(`Hi, I need a used ${what}. My VIN is: `)} className="btn-dark mt-3 w-full !py-2.5 text-sm">
              <ChatIcon /> Text {BUSINESS.phoneDisplay}
            </a>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
