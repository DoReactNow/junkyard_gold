"use client";

import { useState } from "react";
import { BUSINESS, TEL_HREF, smsWithBody } from "@/lib/business";
import type { UnitOption, Vehicle } from "@/lib/unit-options";
import { CheckIcon, ChatIcon, PhoneIcon } from "./icons";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/** The three priced units for a vehicle and spec. The server recalculates the price at checkout. */
export function UnitPicker({ vehicle, options, unitRef }: { vehicle: Vehicle; options: UnitOption[]; unitRef: string }) {
  const [tier, setTier] = useState(0);
  const unit = options[tier];
  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.partType.toLowerCase()}`;
  const sms = `Hi, I'm interested in the ${name}, ${vehicle.spec}, ${unit.miles.toLocaleString()} miles at ${usd(unit.price)} (ref ${unitRef}). My VIN is: `;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">Choose your unit</h2>
        <span className="text-[12.5px] text-steel">Ref <b className="font-semibold text-ink">{unitRef}</b></span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Choose your unit">
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
              <span className={`absolute -top-2.5 left-3 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${on ? "bg-ink text-gold-light" : "bg-sand text-steel"}`}>
                {o.label}
              </span>
              {on && (
                <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-ink text-gold-light">
                  <CheckIcon className="size-3" />
                </span>
              )}
              <span className="font-serif block text-[2.1rem] leading-none">{usd(o.price)}</span>
              <span className="mt-2 block text-[13.5px] text-steel">
                <b className="font-semibold text-ink">{o.miles.toLocaleString()}</b> miles
              </span>
              <span className="mt-0.5 block text-[13px] text-steel">{BUSINESS.warrantyAdj} warranty</span>
            </button>
          );
        })}
      </div>

      <form action="/api/checkout" method="post" className="mt-5">
        <input type="hidden" name="year" value={vehicle.year} />
        <input type="hidden" name="make" value={vehicle.make} />
        <input type="hidden" name="model" value={vehicle.model} />
        <input type="hidden" name="partType" value={vehicle.partType} />
        <input type="hidden" name="spec" value={vehicle.spec} />
        <input type="hidden" name="tier" value={unit.tier} />
        <button className="btn-gold !h-[60px] w-full justify-between !px-6 text-[17px]">
          <span>Buy this unit</span>
          <span className="font-serif text-[1.7rem]">{usd(unit.price)} →</span>
        </button>
      </form>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <a href={smsWithBody(sms)} className="btn-dark w-full"><ChatIcon /> Text us about this unit</a>
        <a href={TEL_HREF} className="btn-ghost w-full"><PhoneIcon /> Call {BUSINESS.phoneDisplay}</a>
      </div>
      <p className="mt-3 text-center text-[13px] text-steel">Freight is quoted to your ZIP before the part ships.</p>
    </div>
  );
}
