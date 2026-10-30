import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { CameraIcon, ChatIcon, CheckIcon, ReturnIcon, SearchIcon, ShieldIcon, TruckIcon } from "./icons";

const ASSURANCES = [
  { i: <TruckIcon className="size-5" />, t: "Free delivery to shops", d: `Usually ${BUSINESS.deliveryDays}`, href: "/shipping-returns" },
  { i: <ReturnIcon className="size-5" />, t: `${BUSINESS.replacementDays}-day replacement`, d: "Pickup and new unit at our cost", href: "/shipping-returns#replacement" },
  { i: <ShieldIcon className="size-5" />, t: `${BUSINESS.warrantyAdj} warranty`, d: "In writing, on every part", href: "/warranty" },
  { i: <ChatIcon className="size-5" />, t: `Texts ${BUSINESS.textHours}`, d: BUSINESS.smsDisplay, href: "/contact" },
];

/** The four promises a buyer checks first, linked to the policy behind each. */
export function AssuranceStrip() {
  return (
    <section className="border-b border-line bg-white" aria-label="What comes with every order">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-line md:grid-cols-4">
        {ASSURANCES.map((a) => (
          <li key={a.t} className="bg-white">
            <Link href={a.href} className="flex h-full items-center gap-3 px-4 py-4 transition hover:bg-paper md:px-6">
              <span className="hidden size-10 shrink-0 place-items-center rounded-full border border-gold/40 text-gold-dark sm:grid">{a.i}</span>
              <span className="min-w-0 text-[13px] text-steel">
                <b className="block text-[14px] font-semibold text-ink">{a.t}</b>
                {a.d}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Shop versus home delivery, side by side. */
export function DeliveryChoices() {
  const rows: [string, string, string][] = [
    ["Cost", "Free", `${BUSINESS.homeDeliveryFee}, based on the part price`],
    ["Delivery time", `Usually ${BUSINESS.deliveryDays}`, `Usually ${BUSINESS.deliveryDays}`],
    ["Coverage", BUSINESS.coverage, BUSINESS.coverage],
    ["Tracking", "By text", "By text"],
  ];
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {(["Repair shop", "Home"] as const).map((title, c) => (
        <div key={title} className={c === 0 ? "rounded-[24px] bg-ink p-6 text-white sm:p-8" : "card rounded-[24px] p-6 sm:p-8"}>
          <h3 className="font-serif text-[2.1rem] leading-none">{title}</h3>
          <dl className={`mt-6 divide-y ${c === 0 ? "divide-white/10" : "divide-line"}`}>
            {rows.map((r) => (
              <div key={r[0]} className="flex justify-between gap-6 py-3 text-[14.5px]">
                <dt className={c === 0 ? "text-white/55" : "text-steel"}>{r[0]}</dt>
                <dd className="text-right font-medium">{r[c + 1]}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

const BUY_STEPS = [
  { i: <SearchIcon className="size-5" />, t: "Find your exact spec", d: "Choose year, make, model, part and spec. Each priced option shows its mileage and warranty." },
  { i: <CheckIcon className="size-5" />, t: "Check the fit for free", d: "Enter your VIN on the product page. A specialist checks it again before anything ships." },
  { i: <CameraIcon className="size-5" />, t: "See real photos", d: "Text us your unit's reference and we'll send photos before you pay." },
  { i: <TruckIcon className="size-5" />, t: "Pick where it goes", d: `Free to your repair shop, or to your home for ${BUSINESS.homeDeliveryFee}. Usually delivered in ${BUSINESS.deliveryDays}.` },
];

/** Answers "can I do this without calling?" on the homepage. */
export function BuyOnline() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="max-w-2xl">
          <div className="eyebrow">No phone call needed</div>
          <h2 className="font-serif mt-3 text-[2.8rem] leading-[1.02] sm:text-[3.4rem]">Everything you need to decide is right here.</h2>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUY_STEPS.map((s) => (
            <li key={s.t} className="card p-6">
              <span className="grid size-10 place-items-center rounded-full bg-ink text-gold-2">{s.i}</span>
              <h3 className="mt-4 text-[17px] font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-steel">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
