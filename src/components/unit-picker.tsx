"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BUSINESS, TEL_HREF, smsWithBody, type Delivery } from "@/lib/business";
import type { UnitOption } from "@/lib/unit-options";
import { CheckIcon, ChatIcon, PhoneIcon, ShieldIcon, TruckIcon } from "./icons";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const num = "font-display font-bold tabular-nums tracking-tight";

/** The priced units for a part, with a buy bar that follows once the main button scrolls away. */
export function UnitPicker({
  name,
  spec,
  options,
  unitRef,
  checkout,
  delivery,
}: {
  name: string;
  spec: string;
  options: UnitOption[];
  unitRef: string;
  checkout: Record<string, string>; // the server works out the price from these and the tier
  delivery: string;
}) {
  const [tier, setTier] = useState(options[0].tier);
  const [dest, setDest] = useState<Delivery>("shop");
  const [stuck, setStuck] = useState(false);
  const buy = useRef<HTMLFormElement>(null);
  const formId = useId();
  const unit = options.find((o) => o.tier === tier) ?? options[0];
  const miles = unit.miles ? `${unit.miles.toLocaleString()} miles` : "Mileage on request";
  const sms = `Hi, I'm interested in the ${name}${spec ? `, ${spec}` : ""}, ${miles} at ${usd(unit.price)} (ref ${unitRef}), ${dest === "home" ? "home delivery to ZIP:" : "delivery to my repair shop."} My VIN is: `;

  useEffect(() => {
    const el = buy.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">{options.length > 1 ? "Choose your unit" : "Your unit"}</h2>
        <span className="text-[12.5px] text-steel">Ref <b className="font-semibold text-ink">{unitRef}</b></span>
      </div>
      <div className={`mt-4 grid gap-3 ${options.length === 3 ? "sm:grid-cols-3" : options.length === 2 ? "sm:grid-cols-2" : ""}`} role="radiogroup" aria-label="Choose your unit">
        {options.map((o) => {
          const on = o.tier === tier;
          return (
            <button
              key={o.tier}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTier(o.tier)}
              className={`relative rounded-2xl border p-4 pt-5 text-left transition ${on ? "border-gold bg-gold-light/15 shadow-[0_0_0_1px_var(--color-gold)]" : "border-line bg-white hover:border-ink/30"}`}
            >
              {options.length > 1 && (
                <span className={`absolute -top-2.5 left-3 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${on ? "bg-ink text-gold-light" : "bg-sand text-steel"}`}>
                  {o.label}
                </span>
              )}
              {on && (
                <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-ink text-gold-light">
                  <CheckIcon className="size-3" />
                </span>
              )}
              <span className={`${num} block text-[1.75rem] leading-none`}>{usd(o.price)}</span>
              <span className="mt-2 block text-[13.5px] text-steel">
                {o.miles ? <><b className="font-semibold text-ink">{o.miles.toLocaleString()}</b> miles</> : "Mileage on request"}
              </span>
              <span className="mt-0.5 block text-[13px] text-steel">{BUSINESS.warrantyAdj} warranty</span>
            </button>
          );
        })}
      </div>

      <fieldset className="mt-5">
        <legend className="text-[13px] font-bold uppercase tracking-[0.14em]">Deliver to</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {([
            ["shop", "Repair shop", "Free", "Free to your shop in the lower 48 states"],
            ["home", "Home", "By quote", "We text you the delivery quote before it ships"],
          ] as const).map(([value, title, cost, text]) => (
            <label key={value} className={`cursor-pointer rounded-xl border p-3.5 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${dest === value ? "border-gold bg-gold-light/15 shadow-[0_0_0_1px_var(--color-gold)]" : "border-line bg-white hover:border-ink/30"}`}>
              <input type="radio" name="deliver-to" value={value} checked={dest === value} onChange={() => setDest(value)} className="sr-only" />
              <span className="flex items-baseline justify-between gap-3 text-[14px] font-semibold">{title}<span className={value === "shop" ? "text-ok" : "text-steel"}>{cost}</span></span>
              <span className="mt-0.5 block text-[13px] text-steel">{text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
        <div className="flex gap-3 bg-white p-3.5">
          <TruckIcon className="size-5 shrink-0 text-gold-dark" />
          <div>
            <dt className="text-[13.5px] font-semibold">Estimated delivery: {delivery}</dt>
            <dd className="mt-0.5 text-[13px] text-steel">Usually {BUSINESS.deliveryDays} from your order</dd>
          </div>
        </div>
        <div className="flex gap-3 bg-white p-3.5">
          <ShieldIcon className="size-5 shrink-0 text-gold-dark" />
          <div>
            <dt className="text-[13.5px] font-semibold">{BUSINESS.warrantyAdj} warranty included</dt>
            <dd className="mt-0.5 text-[13px] text-steel">{BUSINESS.replacementDays}-day pickup and replacement at our cost</dd>
          </div>
        </div>
      </dl>

      <form ref={buy} id={formId} action="/api/checkout" method="post" className="mt-5">
        {Object.entries(checkout).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <input type="hidden" name="tier" value={unit.tier} />
        <input type="hidden" name="delivery" value={dest} />
        <button className="btn-gold !h-[60px] w-full justify-between !px-6 text-[17px]">
          <span>Buy this unit</span>
          <span className={`${num} text-[1.4rem]`}>{usd(unit.price)} →</span>
        </button>
      </form>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <a href={smsWithBody(sms)} className="btn-dark w-full"><ChatIcon /> Text us about this unit</a>
        <a href={TEL_HREF} className="btn-ghost w-full"><PhoneIcon /> Call {BUSINESS.phoneDisplay}</a>
      </div>

      <div aria-hidden={!stuck} className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 text-white backdrop-blur transition-transform duration-300 ${stuck ? "translate-y-0" : "invisible translate-y-full"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold">{name}</div>
            <div className="truncate text-[12.5px] text-white/60">{miles} · {BUSINESS.warrantyAdj} warranty</div>
          </div>
          <button form={formId} tabIndex={stuck ? 0 : -1} className="btn-gold !h-11 shrink-0 text-[15px]">
            Buy <span className={`${num} ml-0.5`}>{usd(unit.price)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
