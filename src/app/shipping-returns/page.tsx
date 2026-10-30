import Link from "next/link";
import { DeliveryChoices } from "@/components/assurance";
import { PageHero, PageShell } from "@/components/site-chrome";
import { BUSINESS, smsWithBody } from "@/lib/business";
import { ChatIcon } from "@/components/icons";

export const metadata = {
  title: "Shipping & Returns",
  description: `Free delivery to repair shops, home delivery available, usually in ${BUSINESS.deliveryDays}. ${BUSINESS.replacementDays}-day pickup and replacement at our cost.`,
};

const REPLACE = [
  ["Tell us", `Text ${BUSINESS.smsDisplay} or email ${BUSINESS.email} within ${BUSINESS.replacementDays} days of delivery, with your order reference and what's wrong.`],
  ["We pick it up", "We arrange the freight pickup at our cost. Please don't send anything back before we've set it up."],
  ["We send a replacement", "An equivalent unit ships to you at our cost. If we don't have a replacement, we refund you."],
];

export default function Page() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ name: "Home", href: "/" }, { name: "Shipping & Returns", href: "/shipping-returns" }]}
        eyebrow="Shipping & returns"
        title={<>Delivered in {BUSINESS.deliveryDays}. <span className="text-gold-grad">Covered for {BUSINESS.replacementDays} days.</span></>}
      >
        Free delivery to repair shops, home delivery available, and pickup and replacement at our cost if there&apos;s a problem.
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="font-serif text-[2.6rem] leading-none">Delivery</h2>
        <div className="mt-8"><DeliveryChoices /></div>
        <div className="prose-jg mt-10 max-w-3xl">
          <p>Engines and transmissions ship on a pallet by freight carrier. You&apos;ll get tracking by text. We ship every order and don&apos;t offer pickup.</p>
          <p>Choose shop or home delivery when you order. Home delivery is quoted by text before the part ships.</p>
          <p>We deliver to all 50 states. Free shop delivery covers the lower 48 states; delivery to Alaska and Hawaii is quoted by text.</p>
          <p><b>On delivery day:</b> inspect the shipment and note any visible damage on the delivery receipt before you sign.</p>
        </div>
      </section>

      <section id="replacement" className="scroll-mt-28 bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="text-[12px] font-medium uppercase tracking-[0.2em] text-gold-2">{BUSINESS.replacementDays}-day replacement</div>
          <h2 className="font-serif mt-3 text-[2.6rem] leading-[1.03] sm:text-[3.2rem]">A problem with the part? We handle the freight both ways.</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {REPLACE.map(([t, d], i) => (
              <li key={t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <span className="font-serif text-[2.4rem] leading-none text-gold-2">0{i + 1}</span>
                <h3 className="mt-3 text-[18px] font-semibold">{t}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/60">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[14.5px] text-white/60">
            Labor, towing and fluids aren&apos;t included. <Link href="/warranty" className="font-medium text-white underline decoration-gold underline-offset-2">See what the warranty covers</Link>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="prose-jg max-w-3xl">
          <h2>All sales are final</h2>
          <p>We don&apos;t offer change-of-mind returns. All sales are final unless something goes wrong with the part, so check the fit and ask for photos before you pay.</p>
        </div>
        <a href={smsWithBody("Hi, I have a question about delivery: ")} className="btn-gold mt-6"><ChatIcon /> Text {BUSINESS.smsDisplay}</a>
      </section>
    </PageShell>
  );
}
