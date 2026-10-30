import Link from "next/link";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import { catalogPath } from "@/lib/catalog";
import { deliveryWindow, specFacts, vinMark } from "@/lib/spec-sheet";
import type { UnitOption } from "@/lib/unit-options";
import { ProductGallery } from "./product-gallery";
import { QuoteForm } from "./quote-form";
import { UnitPicker } from "./unit-picker";
import { VinCheck } from "./vin-check";
import { CameraIcon, ChatIcon, CheckIcon, PhoneIcon, ReturnIcon, SearchIcon, ShieldIcon, TruckIcon } from "./icons";

export type ProductViewProps = {
  year: number;
  make: string;
  model: string;
  partType: string;
  spec: string;
  unitRef: string;
  options: UnitOption[] | null; // null: priced by a specialist
  checkout: Record<string, string>;
  images: { files: string[]; kind: "own" | "example" | "illustration" };
  condition?: string;
  description?: string;
  productSlug?: string; // lets the VIN check compare against this listing
  notice?: string;
  sameYears?: number[];
  otherSpecs?: { label: string; href: string }[];
  more?: React.ReactNode; // other units for this vehicle
  proof?: React.ReactNode;
};

const INCLUDED: [string, string][] = [
  ["Matched to your VIN", "A specialist checks your VIN before anything ships"],
  ["Photos before you pay", "Text us and we'll send real photos of your unit"],
  [`${BUSINESS.warrantyAdj} warranty`, "Against internal defects, in writing"],
  [`${BUSINESS.replacementDays}-day replacement`, "A problem with the part? We pick it up and send a replacement at our cost, or refund you if we don't have one"],
  ["Free delivery to shops", `Home delivery is ${BUSINESS.homeDeliveryFee}, based on the part price`],
  [`Delivered in ${BUSINESS.deliveryDays}`, "By freight, to the lower 48 states"],
];

const STEPS: [string, string][] = [
  ["You order", "Pick your unit, choose shop or home delivery and send us your VIN."],
  ["VIN check", "A specialist matches your VIN to the part. For home delivery, we also text you the cost to your ZIP."],
  ["Photos", "Ask for real photos of your unit by text at any point before you pay."],
  ["Packed", "Your part is prepared and strapped to a pallet."],
  ["On its way", "A freight carrier takes it to your shop or home. Tracking comes by text."],
  ["Delivered", `Usually ${BUSINESS.deliveryDays} from your order. Check it over before you sign.`],
];

function faqs(word: string): { q: string; a: string; href: string; link: string }[] {
  return [
    { q: `Will this ${word} fit my vehicle?`, a: `We match every order to your VIN, not just the year and model, before it ships. Use the free check on this page, or text your VIN to ${BUSINESS.smsDisplay}.`, href: "/our-process", link: "How we match parts" },
    { q: "Can I see photos before I buy?", a: "Yes. Text us and we'll send real photos of your unit before you pay. The photos on this page are examples unless they're labeled otherwise.", href: "/our-process", link: "Our process" },
    { q: "What does the warranty cover?", a: `For ${BUSINESS.warranty} from the day you receive it, we cover internal mechanical defects that keep the part from working as designed. Labor, towing, fluids and bolt-on accessories aren't covered.`, href: "/warranty", link: "Full warranty" },
    { q: "How do I keep the warranty valid?", a: "Have a qualified mechanic install the part, replace the fluids and filters at installation and keep the receipts. Don't take the part apart without our written approval.", href: "/warranty", link: "Warranty requirements" },
    { q: "How much is delivery, and how long does it take?", a: `Delivery to a repair shop address is free. Home delivery is ${BUSINESS.homeDeliveryFee}, based on the part price, and we text you the exact cost before it ships. We don't deliver to Alaska or Hawaii. Delivery usually takes ${BUSINESS.deliveryDays}. We ship every order and don't offer pickup.`, href: "/shipping-returns", link: "Shipping details" },
    { q: "What should I do on delivery day?", a: "Inspect the shipment when it arrives and note any visible damage on the delivery receipt before you sign.", href: "/shipping-returns", link: "Shipping details" },
    { q: "What if there's a problem with it?", a: `Tell us within ${BUSINESS.replacementDays} days of delivery. We pick up the part and send you a replacement at our cost. If we don't have a replacement, we refund you.`, href: "/shipping-returns", link: "Return policy" },
    { q: "What if I change my mind?", a: "All sales are final unless something goes wrong with the part. We don't offer change-of-mind returns, so check the fit and ask for photos before you pay.", href: "/shipping-returns", link: "Return policy" },
    { q: `What comes with the ${word}?`, a: "What's attached can vary by donor vehicle, so text us your unit's reference and we'll confirm it before you pay.", href: "/contact", link: "Contact us" },
  ];
}

function VinDiagram({ code, positions }: { code: string; positions: number[] }) {
  return (
    <ol className="grid grid-cols-[repeat(17,minmax(0,1fr))] gap-0.5 sm:gap-1" aria-label={`VIN character ${positions.join(" and ")} should read ${code}`}>
      {Array.from({ length: 17 }, (_, i) => {
        const hit = positions.indexOf(i + 1);
        return (
          <li key={i} className={`grid aspect-[3/4] place-items-center rounded text-[10px] font-semibold tabular-nums sm:rounded-md sm:text-[13px] ${hit >= 0 ? "bg-gold-grad text-ink" : "bg-white/[0.07] text-white/35"}`}>
            {hit >= 0 ? code[hit] : i + 1}
          </li>
        );
      })}
    </ol>
  );
}

function Rows({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <div>
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-2">{title}</h3>
      <dl className="mt-3 divide-y divide-white/10 border-t border-white/10">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-5 py-3 text-[14px]">
            <dt className="text-white/50">{k}</dt>
            <dd className="text-right font-medium text-white/90">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The product page: one layout for listed parts and for units we source to order. */
export function ProductView(p: ProductViewProps) {
  const word = p.partType.toLowerCase();
  const name = `${p.year} ${p.make} ${p.model} used ${word}`;
  const vehicle = `${p.year} ${p.make} ${p.model}`;
  const kind = p.partType === "Engine" ? "used-engines" : p.partType === "Transmission" ? "used-transmissions" : null;
  const delivery = deliveryWindow();
  const facts = specFacts(p.spec, p.partType);
  const mark = vinMark(p.spec);
  const sms = `Hi, I need a used ${word} for a ${vehicle}${p.spec ? `, ${p.spec}` : ""} (ref ${p.unitRef}). My VIN is: `;
  const label = p.images.kind === "example" ? "Example photo" : p.images.kind === "illustration" ? "Illustration" : undefined;
  const crumbs = kind
    ? [
        { name: `${p.partType}s`, href: catalogPath(kind) },
        { name: p.make, href: catalogPath(kind, p.make) },
        { name: p.model, href: catalogPath(kind, p.make, p.model) },
      ]
    : [{ name: "Parts", href: "/parts" }];

  return (
    <>
      <div className="border-b border-line bg-white">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 py-3.5 text-[13px] text-steel md:px-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">Home</Link>
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-1.5">
              <span className="text-line">/</span>
              <Link href={c.href} className="hover:text-ink">{c.name}</Link>
            </span>
          ))}
          <span className="text-line">/</span>
          <span className="text-ink">{p.year}</span>
        </nav>
      </div>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 md:py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <ProductGallery files={p.images.files} alt={p.images.kind === "own" ? name : `Example used ${word} photo`} label={label} />
          <a href={smsWithBody(sms)} className="flex items-center gap-4 rounded-2xl bg-ink p-5 text-white transition hover:bg-ink-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-2"><CameraIcon /></span>
            <span className="text-[14px] text-white/70">
              <b className="block text-white">See your unit before you buy</b>
              Text us and we&apos;ll send real photos.
            </span>
            <span className="ml-auto text-gold-2" aria-hidden>→</span>
          </a>
          <div className="card p-5 sm:p-6">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">Included with every unit</h2>
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
          <header>
            <h1 className="font-serif text-[2.5rem] leading-[1.03] sm:text-[3.2rem]">{name}</h1>
            {p.spec && <p className="mt-2 text-[16px] font-medium text-steel">{p.spec}</p>}
          </header>
          {p.notice && <p className="rounded-xl border border-bad/30 bg-bad/5 px-4 py-3 text-[14px] font-medium text-bad">{p.notice}</p>}

          <div className="card p-5 sm:p-7">
            {p.options ? (
              <UnitPicker name={name} spec={p.spec} options={p.options} unitRef={p.unitRef} checkout={p.checkout} delivery={delivery} />
            ) : (
              <div>
                <div className="eyebrow">Priced by a specialist</div>
                <h2 className="font-serif mt-2 text-[2.2rem] leading-none">We&apos;ll text you your options</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-steel">Send your VIN and we&apos;ll reply with mileage and price options from our {BUSINESS.networkSize} network.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={smsWithBody(sms)} className="btn-gold"><ChatIcon /> Text {BUSINESS.smsDisplay}</a>
                  <a href={TEL_HREF} className="btn-ghost"><PhoneIcon /> Call {BUSINESS.phoneDisplay}</a>
                </div>
                <div className="mt-7 border-t border-line pt-6">
                  <QuoteForm defaultVin={`${vehicle} ${p.spec}`.trim()} defaultPartType={p.partType === "Engine" || p.partType === "Transmission" ? p.partType : "Other"} />
                </div>
              </div>
            )}
          </div>

          <div className="card p-5 sm:p-7">
            <div className="eyebrow">Free fit check</div>
            <h2 className="font-serif mb-4 mt-1 text-[1.9rem] leading-none">Make sure it fits your vehicle</h2>
            <VinCheck partType={p.partType} productSlug={p.productSlug} />
          </div>

          {p.otherSpecs && p.otherSpecs.length > 0 && (
            <div className="card p-5 sm:p-7">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">Different spec on your {vehicle}?</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.otherSpecs.map((s) => (
                  <Link key={s.href} href={s.href} className="rounded-full border border-line bg-white px-3.5 py-2 text-[13.5px] font-medium transition hover:border-gold hover:bg-gold-light/15">{s.label}</Link>
                ))}
              </div>
            </div>
          )}
          {p.description && <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/80">{p.description}</p>}
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="text-[12px] font-medium uppercase tracking-[0.2em] text-gold-2">The spec sheet</div>
          <h2 className="font-serif mt-3 text-[2.4rem] leading-[1.03] sm:text-[3.2rem]">Everything about this {word}</h2>
          {mark && (
            <div className="mt-8 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <h3 className="text-[15px] font-semibold">Match it to your VIN</h3>
              <div className="mt-4"><VinDiagram {...mark} /></div>
              <p className="mt-4 text-[14px] leading-relaxed text-white/60">
                Character {mark.positions.join(" and ")} of your VIN should read <b className="text-gold-light">{mark.code}</b>. We check this before anything ships.
              </p>
            </div>
          )}
          <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <Rows
              title={`The ${word}`}
              rows={[
                ...facts,
                ...(mark ? ([["VIN code", `${mark.code} · digit ${mark.positions.join(" & ")}`]] as [string, string][]) : []),
                ...(p.spec ? ([["Factory spec", p.spec]] as [string, string][]) : []),
              ]}
            />
            <Rows
              title="Your vehicle and unit"
              rows={[
                ["Vehicle", vehicle],
                ...(p.sameYears && p.sameYears.length > 1 ? ([["Same spec listed for", p.sameYears.join(", ")]] as [string, string][]) : []),
                ["Condition", p.condition || "Used OEM"],
                ["Warranty", `${BUSINESS.warrantyAdj}, parts`],
                ["Replacement", `${BUSINESS.replacementDays} days, at our cost`],
                ["Reference", p.unitRef],
              ]}
            />
            <Rows
              title="Shipping"
              rows={[
                ["Method", "Freight, on a pallet"],
                ["Delivers to", BUSINESS.coverage],
                ["Repair shop delivery", "Free"],
                ["Home delivery", `${BUSINESS.homeDeliveryFee}, based on part price`],
                ["Estimated delivery", delivery],
                ["Tracking", "By text"],
              ]}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="eyebrow">Once you order</div>
        <h2 className="font-serif mt-2 text-[2.4rem] leading-[1.03] sm:text-[3.2rem]">What happens next</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="card flex gap-4 p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[14px] font-bold tabular-nums text-gold-light">{i + 1}</span>
              <span>
                <b className="block">{title}</b>
                <span className="mt-1 block text-[14px] leading-relaxed text-steel">{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            [<ShieldIcon key="s" className="size-5 shrink-0 text-gold-dark" />, "Warranty terms", "/warranty"],
            [<TruckIcon key="t" className="size-5 shrink-0 text-gold-dark" />, "Shipping policy", "/shipping-returns"],
            [<ReturnIcon key="r" className="size-5 shrink-0 text-gold-dark" />, "Return policy", "/shipping-returns"],
          ].map(([icon, text, href]) => (
            <Link key={text as string} href={href as string} className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 text-[14px] font-semibold transition hover:border-gold">
              {icon} {text} <span className="ml-auto text-gold-dark" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>

      {p.proof}

      <section className="border-t border-line bg-sand/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <div className="eyebrow">Straight answers</div>
            <h2 className="font-serif mt-2 text-[2.4rem] leading-[1.03] sm:text-[3.2rem]">What buyers ask first</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-steel">Each answer comes from our published policies. Need something else? {BUSINESS.contactHours}.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={smsWithBody(sms)} className="btn-dark"><ChatIcon /> Text {BUSINESS.smsDisplay}</a>
              <a href={TEL_HREF} className="btn-ghost"><PhoneIcon /> Call {BUSINESS.phoneDisplay}</a>
            </div>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {faqs(word).map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16.5px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-gold-dark transition group-open:rotate-45 group-open:border-gold">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-steel">
                  {f.a} <Link href={f.href} className="font-medium text-ink underline decoration-gold underline-offset-2">{f.link}</Link>
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {p.more && (
        <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="eyebrow">More options</div>
          <h2 className="font-serif mt-2 text-[2.4rem] leading-[1.03] sm:text-[3.2rem]">Not quite this one?</h2>
          <div className="mt-8">{p.more}</div>
          {kind && (
            <Link href={catalogPath(kind, p.make, p.model)} className="btn-ghost mt-8"><SearchIcon /> See every {p.make} {p.model} {word}</Link>
          )}
        </section>
      )}
    </>
  );
}
