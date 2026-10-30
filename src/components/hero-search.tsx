"use client";

import { useState } from "react";
import { VinCheck } from "./vin-check";
import { VehicleFields } from "./vehicle-fields";

/** The docked search bar under the home-page hero: by vehicle, or by VIN. */
export function HeroSearch() {
  const [mode, setMode] = useState<"vehicle" | "vin">("vehicle");

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-1.5 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] backdrop-blur-xl">
      <div className="rounded-[18px] bg-white p-4 text-ink sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["vehicle", "vin"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-2 text-[13.5px] font-semibold transition ${mode === m ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
            >
              {m === "vehicle" ? "Search by vehicle" : "Search by VIN"}
            </button>
          ))}
          <span className="ml-auto hidden text-[13px] text-steel md:block">Every make and model · matched to your VIN before it ships</span>
        </div>
        {mode === "vehicle" ? <VehicleFields /> : <VinCheck />}
      </div>
    </div>
  );
}
