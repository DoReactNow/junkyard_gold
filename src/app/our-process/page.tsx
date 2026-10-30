import Link from "next/link";
import { PageHero, PageShell } from "@/components/site-chrome";
import { Reveal } from "@/components/reveal";
import { Stage } from "@/components/stage";
import { BUSINESS, smsWithBody } from "@/lib/business";
import { ChatIcon } from "@/components/icons";

export const metadata = {
  title: "Our process",
  description: "How Junkyard Gold gets you the right used engine or transmission: VIN match, photos before you pay, freight delivery and a written warranty.",
};

const STEPS = [
  { t: "You send your VIN", d: "Text it, call, or enter it on the site. Your VIN tells us exactly which engine and transmission your vehicle left the factory with, down to the engine code and drivetrain." },
  { t: "We match it to the right unit", d: "A parts specialist checks the VIN against our listings and our supplier network, and finds the units that fit." },
  { t: "You get options by text", d: "Price, mileage and warranty for each matching unit, side by side, so you can choose with the facts in front of you." },
  { t: "You see the actual part", d: "Ask for photos of the exact unit before you pay. If it isn't what you expected, you don't buy it." },
  { t: "We crate and ship it", d: `The part is strapped to a pallet and wrapped, then shipped by freight carrier: free to your repair shop, or to your home by quote. It usually arrives in ${BUSINESS.deliveryDays}, with tracking by text.` },
  { t: "You're covered after delivery", d: `A ${BUSINESS.warrantyAdj} warranty against defects, in writing. If there's a problem within ${BUSINESS.replacementDays} days, we pick up the part and send a replacement at our cost, or refund you if we don't have one.` },
];

export default function Page() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ name: "Home", href: "/" }, { name: "Our process", href: "/our-process" }]}
        eyebrow="Our process"
        title={<>Six steps between your VIN and <span className="text-gold-grad">a running vehicle.</span></>}
      >
        No guesswork, no runaround. One specialist handles your order from the first text to delivery.
      </PageHero>
      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-20 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ol className="divide-y divide-line border-y border-line">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.t} delay={i * 60} className="grid grid-cols-[72px_1fr] gap-4 py-9 sm:grid-cols-[96px_1fr]">
              <span className="font-serif text-[3.2rem] leading-none text-gold-dark">0{i + 1}</span>
              <div>
                <h2 className="text-[21px] font-semibold tracking-tight">{s.t}</h2>
                <p className="mt-2 max-w-xl text-[15.5px] leading-relaxed text-steel">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <div className="space-y-6 lg:sticky lg:top-32 lg:self-start">
          <Stage src="/img/parts-cut/any-zf-transmission-2.webp" gold className="aspect-[4/3] rounded-[28px] shadow-lift" imgClassName="p-10" />
          <div className="rounded-[24px] bg-ink p-7 text-white">
            <div className="font-serif text-[2rem] leading-none">Start with your VIN</div>
            <p className="mt-2 text-sm text-white/60">Text it to {BUSINESS.smsDisplay}. {BUSINESS.contactHours}.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={smsWithBody("Hi, I need a part. My VIN is: ")} className="btn-gold"><ChatIcon /> Text your VIN</a>
              <Link href="/warranty" className="btn-outline-light">Read the warranty</Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
