import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BUSINESS, siteUrl, smsWithBody } from "@/lib/business";
import { KINDS, catalogPath, modelsFor, type Kind } from "@/lib/catalog";
import { codePath, codesFor, listingsForCode, vehiclesWithCode } from "@/lib/codes";
import { money, partUrl } from "@/lib/inventory";
import { AssuranceStrip } from "./assurance";
import { ChatIcon } from "./icons";
import { PartCard } from "./part-card";
import { PageHero, PageShell } from "./site-chrome";

const label = (kind: Kind, code: string, size: string | null) => (kind === "used-engines" ? `GM ${size ? `${size}L ` : ""}${code}` : code);

async function resolveCode(kind: Kind, raw: string) {
  const code = raw.toUpperCase();
  const facet = (await codesFor(kind)).find((c) => c.code === code);
  if (!facet) notFound();
  if (raw !== code.toLowerCase()) permanentRedirect(codePath(kind, code));
  return facet;
}

export async function codeMetadata(kind: Kind, raw: string): Promise<Metadata> {
  const f = await resolveCode(kind, raw);
  const k = KINDS[kind];
  const name = label(kind, f.code, f.size);
  return {
    title: `Used ${name} ${k.plural} for Sale from ${money(f.from)}`,
    description: `${f.count} used ${name} ${k.singular}s listed from ${money(f.from)}, VIN-matched before shipping, with a ${BUSINESS.warrantyAdj} warranty. Free delivery to repair shops in the lower 48.`,
    alternates: { canonical: codePath(kind, f.code) },
  };
}

export async function CodePage({ kind, code: raw }: { kind: Kind; code: string }) {
  const f = await resolveCode(kind, raw);
  const k = KINDS[kind];
  const engine = kind === "used-engines";
  const name = label(kind, f.code, f.size);
  const listings = await listingsForCode(kind, f.code);
  const vehicles = vehiclesWithCode(kind, f.code);
  // Link a vehicle only when its catalog page exists (it has listings); otherwise plain text.
  const pages = new Set(
    (await Promise.all([...new Set(vehicles.map((v) => v.make))].map(async (make) => (await modelsFor(kind, make)).map((m) => catalogPath(kind, make, m.name))))).flat(),
  );
  const crumbs = [
    { name: "Home", href: "/" },
    { name: `Used ${k.plural}`, href: catalogPath(kind) },
    { name: engine ? "By engine code" : "By transmission model", href: `/${kind}/code` },
    { name: f.code, href: codePath(kind, f.code) },
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
      itemListElement: listings.slice(0, 24).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${siteUrl()}${partUrl(p)}`, name: p.title })),
    },
  ];

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero crumbs={crumbs} eyebrow={engine ? "Used engines by engine code" : "Used transmissions by model"} title={<>Used {name} {k.plural.toLowerCase()} <span className="text-gold-grad">for sale</span></>}>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
          <span><b className="text-white">{f.count}</b> listed online</span>
          <span>{money(f.from)}{f.to > f.from ? ` – ${money(f.to)}` : ""}</span>
          <span>{BUSINESS.warrantyAdj} warranty</span>
          <span>Free delivery to shops</span>
        </div>
      </PageHero>

      <AssuranceStrip />

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <p className="max-w-3xl text-[16.5px] leading-relaxed text-ink/75">
          {engine
            ? `${f.code} is GM's option code for this ${f.size ? `${f.size}-liter ` : ""}engine. It's printed on the Service Parts Identification label (usually in the glove box), and the 8th character of the VIN narrows it down. Send us your VIN and we confirm the exact engine before anything ships.`
            : `The ${f.code} comes in several versions (2WD or 4WD, different bell housings and gear ratios), so the model name alone isn't enough. Send us your VIN and we match the exact ${f.code} your vehicle needs before it ships.`}
        </p>

        <section className="mt-10">
          <h2 className="font-serif text-[2rem] leading-none">{f.code} {k.plural.toLowerCase()} listed now</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.slice(0, 24).map((p) => <PartCard key={p.id} part={p} />)}
          </div>
        </section>

        {vehicles.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-[2rem] leading-none">Vehicles with the {f.code}</h2>
            <p className="mt-3 max-w-3xl text-[15px] text-steel">From our fitment data. It isn&apos;t a complete list, so if your vehicle isn&apos;t here, send your VIN.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <li key={`${v.make}|${v.model}`}>
                  {pages.has(catalogPath(kind, v.make, v.model)) ? (
                    <Link href={catalogPath(kind, v.make, v.model)} className="block rounded-xl border border-line bg-white px-4 py-3 text-sm transition hover:border-gold/60">
                      <span className="font-semibold">{v.make} {v.model}</span>{" "}
                      <span className="text-steel">{v.from === v.to ? v.from : `${v.from}–${v.to}`}</span>
                    </Link>
                  ) : (
                    <span className="block rounded-xl border border-line/70 px-4 py-3 text-sm">
                      <span className="font-semibold">{v.make} {v.model}</span>{" "}
                      <span className="text-steel">{v.from === v.to ? v.from : `${v.from}–${v.to}`}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 max-w-xl rounded-2xl bg-ink p-6 text-white">
          <div className="font-display text-xl font-bold">Need a different {f.code}?</div>
          <p className="mt-1 text-sm text-white/65">We check our supplier network for units not listed here.</p>
          <a href={smsWithBody(`Hi, I need a used ${f.code} ${k.singular}. My VIN is: `)} className="btn-gold mt-4 text-sm">
            <ChatIcon /> Text {BUSINESS.smsDisplay}
          </a>
        </div>
      </div>
    </PageShell>
  );
}

/** Links to every code page, for the hub pages and the /code index. */
export async function CodeLinks({ kind, title }: { kind: Kind; title?: string }) {
  const codes = await codesFor(kind);
  if (!codes.length) return null;
  const engine = kind === "used-engines";
  return (
    <section className="mt-10">
      <h2 className="font-serif text-[2rem] leading-none">{title ?? (engine ? "Shop by GM engine code" : "Shop by transmission model")}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {codes.map((c) => (
          <li key={c.code}>
            <Link href={codePath(kind, c.code)} className="block rounded-xl border border-line bg-white px-4 py-3 text-sm shadow-card transition hover:-translate-y-0.5 hover:border-gold/60">
              <span className="block font-semibold">{label(kind, c.code, c.size)}</span>
              <span className="mt-0.5 block text-xs text-steel">{c.count} available · from <span className="font-semibold text-ink">{money(c.from)}</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function CodeIndexPage({ kind }: { kind: Kind }) {
  const k = KINDS[kind];
  const engine = kind === "used-engines";
  const title = engine ? `Used ${k.plural} by GM engine code` : `Used ${k.plural} by transmission model`;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: `Used ${k.plural}`, href: catalogPath(kind) },
    { name: engine ? "By engine code" : "By transmission model", href: `/${kind}/code` },
  ];
  return (
    <PageShell>
      <PageHero crumbs={crumbs} eyebrow={`Used ${k.plural.toLowerCase()}`} title={<>{title}</>} />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <p className="max-w-3xl text-[16.5px] leading-relaxed text-ink/75">
          {engine
            ? "Know your GM engine's option code (LMG, LC9, L83 …)? Pick it below to see the units we have listed. Not sure? Text us your VIN."
            : "Know your transmission model (4L60E, 6R80, 4R70W …)? Pick it below to see the units we have listed. Not sure? Text us your VIN."}
        </p>
        <CodeLinks kind={kind} title={engine ? "Engine codes" : "Transmission models"} />
      </div>
    </PageShell>
  );
}
