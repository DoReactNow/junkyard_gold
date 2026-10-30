import Link from "next/link";
import { PageHero, PageShell } from "@/components/site-chrome";
import { BUSINESS, smsWithBody } from "@/lib/business";
import { ChatIcon } from "@/components/icons";

export const metadata = {
  title: "Warranty",
  description: `Every used part comes with a ${BUSINESS.warrantyAdj} warranty and ${BUSINESS.replacementDays}-day pickup and replacement at our cost.`,
};

const COLS: [string, string[]][] = [
  ["What's covered", [
    "Internal mechanical defects that keep the part from working as designed",
    "Engines: block, heads, crankshaft and internal moving parts",
    "Transmissions: case and internal components",
    "Pickup and replacement freight on a covered part",
  ]],
  ["What's not covered", [
    "Labor, towing, fluids, rental cars or other costs of installing or removing the part",
    "Damage from improper installation, overheating, lack of oil or fluid, or racing and commercial abuse",
    "Bolt-on accessories such as sensors, belts, hoses, gaskets and seals",
    "Parts taken apart or modified without our written approval",
  ]],
  ["Keep your warranty valid", [
    "Have the part installed by a qualified mechanic",
    "Replace the oil, filter and coolant (engines) or fluid and filter (transmissions) at installation, and keep the receipts",
    "Check and replace the radiator, thermostat, water pump and torque converter where needed",
  ]],
];

export default function Page() {
  return (
    <PageShell>
      <PageHero
        crumbs={[{ name: "Home", href: "/" }, { name: "Warranty", href: "/warranty" }]}
        eyebrow="Warranty"
        title={<>{BUSINESS.warranty} included. <span className="text-gold-grad">In writing.</span></>}
      >
        Every used part from {BUSINESS.name} is covered for {BUSINESS.warranty} from the day you receive it.
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-5 lg:grid-cols-3">
          {COLS.map(([title, items]) => (
            <div key={title} className="card p-6 sm:p-7">
              <h2 className="text-[19px] font-semibold">{title}</h2>
              <ul className="mt-4 list-disc space-y-2.5 pl-5 text-[14.5px] leading-relaxed text-steel marker:text-gold">
                {items.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-6 lg:grid-cols-2">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.2em] text-gold-2">If there&apos;s a problem</div>
            <h2 className="font-serif mt-3 text-[2.4rem] leading-[1.03]">We pick it up and send a replacement.</h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/60">
              Tell us within {BUSINESS.replacementDays} days of delivery, with your order reference and what&apos;s wrong. Pickup and the replacement unit are at our cost. If we don&apos;t have a replacement, we refund you.
            </p>
            <Link href="/shipping-returns#replacement" className="mt-5 inline-flex font-semibold text-gold-light underline underline-offset-4">How replacement works →</Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="font-serif text-[2.1rem] leading-none">Need more coverage?</h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-white/60">Call {BUSINESS.phoneDisplay} or text {BUSINESS.smsDisplay} and a specialist can talk it through.</p>
            <a href={smsWithBody("Hi, I have a question about the warranty: ")} className="btn-gold mt-5"><ChatIcon /> Text us</a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
