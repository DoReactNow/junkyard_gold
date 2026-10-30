import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, PageShell } from "@/components/site-chrome";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import { GUIDES } from "@/lib/guides";
import { ChatIcon, PhoneIcon } from "@/components/icons";

type P = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: P) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  return g ? { title: g.title, description: g.description } : {};
}

export default async function Page({ params }: P) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  const others = GUIDES.filter((x) => x.slug !== g.slug);
  return (
    <PageShell>
      <PageHero
        crumbs={[{ name: "Home", href: "/" }, { name: "Guides", href: "/guides" }, { name: g.title, href: `/guides/${g.slug}` }]}
        eyebrow={`${g.eyebrow} · ${g.minutes} min read`}
        title={g.title}
      >
        {g.description}
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1fr_320px]">
        <article className="prose-jg card rounded-[28px] px-6 py-10 sm:px-12 sm:py-12">{g.body}</article>
        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-[22px] bg-ink p-6 text-white">
            <div className="font-serif text-[1.7rem] leading-none">Need the right part?</div>
            <p className="mt-2 text-sm leading-relaxed text-white/60">Text your VIN and a specialist will match it for you. {BUSINESS.hours}.</p>
            <a href={smsWithBody("Hi, I need a part. My VIN is: ")} className="btn-gold mt-5 w-full text-sm"><ChatIcon /> Text your VIN</a>
            <a href={TEL_HREF} className="btn-outline-light mt-2 w-full text-sm"><PhoneIcon /> {BUSINESS.phoneDisplay}</a>
          </div>
          <div className="card p-6">
            <div className="eyebrow">More guides</div>
            <ul className="mt-3 space-y-3">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/guides/${o.slug}`} className="font-semibold leading-snug hover:text-gold-dark">{o.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
