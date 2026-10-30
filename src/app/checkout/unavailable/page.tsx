import Link from "next/link";
import { PageShell } from "@/components/site-chrome";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";

export const metadata = { title: "Checkout" };

export default async function Page({ searchParams }: { searchParams: Promise<{ slug?: string; reason?: string }> }) {
  const sp = await searchParams;
  const sold = sp.reason === "sold";
  return (
    <PageShell>
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-4xl font-bold">{sold ? "This part just sold" : "Let's finish your order by text"}</h1>
        <p className="mt-4 text-lg text-steel">
          {sold
            ? "Someone beat you to it, but we likely have another one. Text us your VIN and we'll find you the next best unit."
            : "Online checkout isn't switched on yet. Text or call us and we'll send you a secure payment link right away."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={smsWithBody(sp.slug ? `Hi, I'd like to buy ${sp.slug}. My VIN is: ` : "Hi, I need a part. My VIN is: ")} className="btn-gold">
            Text {BUSINESS.smsDisplay}
          </a>
          <a href={TEL_HREF} className="btn-dark">Call us</a>
          <Link href="/parts" className="btn-ghost">Browse parts</Link>
        </div>
      </section>
    </PageShell>
  );
}
