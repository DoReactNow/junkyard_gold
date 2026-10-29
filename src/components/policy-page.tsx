import { PageShell } from "./site-chrome";

export function PolicyPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <PageShell>
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">{title}</h1>
          {intro && <p className="mt-3 text-white/70">{intro}</p>}
        </div>
        <div className="stripe h-1.5" />
      </section>
      <article className="prose-jg mx-auto max-w-3xl px-4 py-10">{children}</article>
    </PageShell>
  );
}
