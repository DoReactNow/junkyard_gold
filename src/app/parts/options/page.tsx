import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import { partImages } from "@/components/part-card";
import { PageHero, PageShell } from "@/components/site-chrome";
import { QuoteForm } from "@/components/quote-form";
import { Stage } from "@/components/stage";
import { UnitPicker } from "@/components/unit-picker";
import { VinCheck } from "@/components/vin-check";
import { CameraIcon, ChatIcon, CheckIcon, PhoneIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { specsFor } from "@/lib/specs";
import { unitOptions, unitRef } from "@/lib/unit-options";

export const dynamic = "force-dynamic";

type SP = Promise<{ year?: string; make?: string; model?: string; type?: string; spec?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  return {
    title: `${[sp.year, sp.make, sp.model].filter(Boolean).join(" ")} Used ${sp.type || "Part"} Options`,
    robots: { index: false },
  };
}

const INCLUDED: [string, string][] = [
  ["Matched to your VIN", "A specialist checks your VIN before anything ships"],
  ["Real photos on request", "Text us and see the actual unit"],
  [`${BUSINESS.warrantyAdj} warranty`, "Replacement or refund on a defective part"],
  ["Return freight covered", "If it's the wrong part or defective"],
  ["14-day returns", "Changed your mind? Uninstalled parts can come back"],
  ["Shipped nationwide", "By freight to your home or shop, in all 50 states"],
];

const STEPS: [string, string][] = [
  ["Pick your unit", "Choose the mileage and price that suit your budget."],
  ["We confirm the fit", "We check your VIN and tell you the freight cost and actual miles."],
  ["We pull and ship it", "Most orders ship in 1–3 business days on a pallet."],
  ["It arrives", "Usually 3–7 business days later, with tracking by text."],
];

export default async function OptionsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const year = parseInt(sp.year || "", 10);
  const { make, model, type, spec } = sp;
  const results = `/parts?${new URLSearchParams({ ...(type ? { type } : {}), ...(sp.year ? { year: sp.year } : {}), ...(make ? { make } : {}), ...(model ? { model } : {}) })}`;
  if (!year || !make || !model || !type || !spec) redirect(results);
  const specs = specsFor(year, make, model, type);
  if (!specs.includes(spec)) redirect(results);

  const vehicle = { year, make, model, partType: type, spec };
  const options = await unitOptions(vehicle);
  const ref = unitRef(vehicle);
  const images = partImages({ imageUrl: null, partType: type, make, model, spec });
  const name = `${year} ${make} ${model}`;
  const partWord = type.toLowerCase();
  const specHref = (s: string) => `/parts/options?${new URLSearchParams({ year: String(year), make, model, type, spec: s })}`;
  const others = specs.filter((s) => s !== spec);
  const sms = `Hi, I need a used ${partWord} for a ${name}, ${spec}. My VIN is: `;

  return (
    <PageShell>
      <PageHero crumbs={[{ name: "Home", href: "/" }, { name: "Parts", href: "/parts" }]} eyebrow="Your match" title={`${name} used ${partWord}`}>
        <b className="text-white">{spec}</b>
      </PageHero>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <div className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <Stage
            src={images.files[0]}
            alt={`Example used ${partWord} photo`}
            gold
            eager
            className="aspect-[4/3] rounded-[24px] shadow-lift"
            imgClassName="p-8"
            label={images.kind === "example" ? "Example photo" : "Illustration"}
          />
          <a href={smsWithBody(sms)} className="flex items-center gap-4 rounded-2xl bg-ink p-5 text-white transition hover:bg-ink-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-2"><CameraIcon /></span>
            <span className="text-[14px] text-white/70">
              <b className="block text-white">See your unit before you buy</b>
              Text us and we&apos;ll send real photos.
            </span>
            <span className="ml-auto text-gold-2" aria-hidden>→</span>
          </a>
          <div className="card p-5 sm:p-6">
            <h2 className="font-serif text-[1.7rem] leading-none">Included with every unit</h2>
            <ul className="mt-4 divide-y divide-line">
              {INCLUDED.map(([title, text]) => (
                <li key={title} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ok/10 text-ok"><CheckIcon className="size-3" /></span>
                  <span className="text-[14px]"><b className="block font-semibold">{title}</b><span className="text-steel">{text}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="order-first min-w-0 space-y-5 lg:order-none">
          <div className="card p-5 sm:p-7">
            {options ? (
              <UnitPicker vehicle={vehicle} options={options} unitRef={ref} />
            ) : (
              <div>
                <div className="eyebrow">Priced by a specialist</div>
                <h2 className="font-serif mt-2 text-[2.2rem] leading-none">We&apos;ll text you three options</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-steel">This one needs a specialist&apos;s price. Send your VIN and we&apos;ll reply with mileage and price options from our {BUSINESS.networkSize} network.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={smsWithBody(sms)} className="btn-gold"><ChatIcon /> Text {BUSINESS.phoneDisplay}</a>
                  <a href={TEL_HREF} className="btn-ghost"><PhoneIcon /> Call for a quote</a>
                </div>
                <div className="mt-7 border-t border-line pt-6">
                  <QuoteForm defaultVin={`${name} ${spec}`} defaultPartType={type} />
                </div>
              </div>
            )}
          </div>

          <div className="card p-5 sm:p-7">
            <div className="eyebrow">Free fit check</div>
            <h2 className="font-serif mb-4 mt-1 text-[1.9rem] leading-none">Make sure it fits your vehicle</h2>
            <VinCheck partType={type} />
          </div>

          {others.length > 0 && (
            <div className="card p-5 sm:p-7">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">Different spec on your {name}?</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {others.map((s) => (
                  <Link key={s} href={specHref(s)} className="rounded-full border border-line bg-white px-3.5 py-2 text-[13.5px] font-medium transition hover:border-gold hover:bg-gold-light/15">{s}</Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-[14px]">
              <ShieldIcon className="size-5 shrink-0 text-gold-dark" />
              <span><b className="block">{BUSINESS.warrantyAdj} warranty</b><Link href="/warranty" className="font-medium underline decoration-gold underline-offset-2">What&apos;s covered</Link></span>
            </div>
            <div className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-[14px]">
              <TruckIcon className="size-5 shrink-0 text-gold-dark" />
              <span><b className="block">Freight and returns</b><Link href="/shipping-returns" className="font-medium underline decoration-gold underline-offset-2">How it works</Link></span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-sand/50">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
          <div className="eyebrow">After you order</div>
          <h2 className="font-serif mt-2 text-[2.2rem] leading-none">From your order to your door</h2>
          <ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="card p-5">
                <span className="font-serif text-[2rem] leading-none text-gold-dark">{i + 1}</span>
                <b className="mt-2 block">{title}</b>
                <p className="mt-1 text-[14px] leading-relaxed text-steel">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </PageShell>
  );
}
