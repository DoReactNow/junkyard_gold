import Link from "next/link";
import { PageHero, PageShell } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";
import { GuaranteeSeal } from "@/components/trust";
import { ADDRESS_LINE, BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import { ChatIcon, PhoneIcon } from "@/components/icons";

export const metadata = {
  title: "About us",
  description: `${BUSINESS.name} supplies quality used engines and transmissions from Bradenton, Florida to all 50 states.`,
};

export default function Page() {
  const facts = [
    [String(BUSINESS.founded), "founded in Bradenton, Florida"],
    [BUSINESS.soldSince, `parts sold since ${BUSINESS.founded}`],
    ["50", "states we deliver to"],
    [BUSINESS.warrantyAdj, "warranty on every used part"],
  ];
  return (
    <PageShell>
      <PageHero
        crumbs={[{ name: "Home", href: "/" }, { name: "About us", href: "/about" }]}
        eyebrow="About Junkyard Gold"
        title={<>Used parts, sold <span className="text-gold-grad">the right way.</span></>}
      >
        Since {BUSINESS.founded}, a used engine and transmission supplier in Bradenton, Florida, shipping to drivers and repair shops across the country.
      </PageHero>
      <section className="mx-auto grid max-w-7xl gap-16 px-4 py-20 md:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <Reveal className="prose-jg max-w-2xl">
          <h2>Why we do it this way</h2>
          <p>
            Replacing an engine or a transmission is one of the biggest repair bills a driver faces, and buying used often feels
            like a gamble: unclear fitment, no photos, a warranty nobody honors. We started {BUSINESS.name} in {BUSINESS.founded} to take the gamble out.
          </p>
          <p>
            Every order starts with your VIN, so the part matches the engine code and drivetrain your vehicle left the factory
            with. You can see photos of the actual unit before you pay. It ships crated on a pallet to your driveway or your shop,
            and it&apos;s covered by a {BUSINESS.warrantyAdj} warranty that&apos;s written down.
          </p>
          <h2>A network behind every quote</h2>
          <p>
            Our own listings are just the start. We source from a network of {BUSINESS.networkSize} engines and transmissions, so
            when a part isn&apos;t listed online, a specialist can usually still find it, quote it and ship it.
          </p>
          <h2>Talk to a real person</h2>
          <p>
            Call {BUSINESS.phoneDisplay} or text {BUSINESS.smsDisplay}, {BUSINESS.hours}. You&apos;ll reach a parts specialist, not a ticket queue. Our
            office is at {ADDRESS_LINE}. We ship every order; we don&apos;t offer pickup.
          </p>
        </Reveal>
        <Reveal delay={120} className="mx-auto w-full max-w-[360px]">
          <GuaranteeSeal className="drop-shadow-[0_30px_40px_rgb(0_0_0/0.25)]" />
        </Reveal>
      </section>
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 md:grid-cols-4 md:divide-x md:divide-line md:px-6">
          {facts.map(([n, t]) => (
            <div key={t} className="px-2 py-10 md:px-8">
              <div className="font-serif text-[2.7rem] leading-none">{n}</div>
              <div className="mt-2 text-[13.5px] text-steel">{t}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-16 md:px-6">
        <h2 className="font-serif text-[2.4rem] leading-none">
          Have a question? <em className="text-gold-grad">Ask us.</em>
        </h2>
        <div className="flex flex-wrap gap-3">
          <a href={smsWithBody("Hi, I have a question: ")} className="btn-gold"><ChatIcon /> Text us</a>
          <a href={TEL_HREF} className="btn-dark"><PhoneIcon /> Call {BUSINESS.phoneDisplay}</a>
          <Link href="/our-process" className="btn-ghost">How it works</Link>
        </div>
      </section>
    </PageShell>
  );
}
