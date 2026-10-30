import { PageHero, PageShell } from "./site-chrome";

export function PolicyPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <PageShell>
      <PageHero crumbs={[{ name: "Home", href: "/" }, { name: title, href: "#" }]} eyebrow="Junkyard Gold" title={title}>
        {intro}
      </PageHero>
      <div className="bg-paper">
        <article className="prose-jg card mx-auto -mt-px max-w-3xl px-6 py-10 sm:my-12 sm:px-12 sm:py-12">{children}</article>
      </div>
    </PageShell>
  );
}
