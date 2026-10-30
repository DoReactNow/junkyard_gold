import Link from "next/link";
import { PageHero, PageShell } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";
import { GUIDES } from "@/lib/guides";

export const metadata = {
  title: "Guides",
  description: "Practical guides from Junkyard Gold: installing a used engine or transmission and finding your engine code from your VIN.",
};

export default function Page() {
  return (
    <PageShell>
      <PageHero crumbs={[{ name: "Home", href: "/" }, { name: "Guides", href: "/guides" }]} eyebrow="Guides" title={<>Know what you&apos;re <span className="text-gold-grad">buying.</span></>}>
        Practical advice for getting the right part and installing it so it lasts.
      </PageHero>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-3 md:px-6">
        {GUIDES.map((g, i) => (
          <Reveal key={g.slug} delay={i * 90}>
            <Link href={`/guides/${g.slug}`} className="card group flex h-full flex-col rounded-[24px] p-7 transition hover:-translate-y-1 hover:shadow-lift">
              <div className="eyebrow">{g.eyebrow} · {g.minutes} min read</div>
              <h2 className="font-serif mt-4 text-[2rem] leading-[1.05]">{g.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-steel">{g.description}</p>
              <span className="mt-auto pt-6 text-[15px] font-semibold group-hover:text-gold-dark">Read the guide →</span>
            </Link>
          </Reveal>
        ))}
      </section>
    </PageShell>
  );
}
