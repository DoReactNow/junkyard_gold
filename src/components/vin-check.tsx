"use client";

import { useState } from "react";
import Link from "next/link";
import { QuoteForm } from "./quote-form";
import { CheckIcon } from "./icons";
import { BUSINESS } from "@/lib/business";

type Result = {
  vehicle: { summary: string; drive: string; transmission: string } | null;
  matches: { slug: string; partType: string; title: string; spec: string; price: number; mileage: number | null; score: number }[];
  estimates?: { partType: string; low: number; high: number }[];
  error?: string;
};

export function VinCheck({ partType, productSlug }: { partType?: string; productSlug?: string }) {
  const [vin, setVin] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const q = new URLSearchParams({ vin, ...(partType ? { type: partType } : {}) });
    const res = await fetch(`/api/vin-match?${q}`);
    setResult(await res.json());
    setBusy(false);
  }

  const fitsThis = productSlug && result?.matches.some((m) => m.slug === productSlug && m.score >= 50);
  const others = result?.matches.filter((m) => m.slug !== productSlug) ?? [];

  return (
    <div>
      <form onSubmit={check} className="flex gap-2">
        <input
          value={vin}
          onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17))}
          className="field font-mono uppercase placeholder:font-sans placeholder:normal-case"
          placeholder="Enter your 17-digit VIN"
          aria-label="VIN"
        />
        <button className="btn-gold shrink-0" disabled={vin.length !== 17 || busy}>
          {busy ? "Checking…" : "Check VIN"}
        </button>
      </form>
      <p className="mt-1.5 text-xs text-steel">Your VIN is on the driver-side dashboard, door jamb, registration or insurance card.</p>

      {result && (
        <div className="mt-4 rounded-lg border border-line bg-white p-4" aria-live="polite">
          {result.error || !result.vehicle ? (
            <p className="text-sm text-bad">{result.error || "We couldn't read that VIN. Double-check it, or text it to us."}</p>
          ) : (
            <>
              <div className="text-xs font-semibold uppercase text-steel">Your vehicle</div>
              <div className="font-semibold">{result.vehicle.summary}</div>

              {productSlug && (
                <div className={`mt-3 flex items-start gap-2 rounded-md p-3 text-sm ${fitsThis ? "bg-ok/10 text-ok" : "bg-gold/15 text-ink"}`}>
                  {fitsThis ? <CheckIcon className="mt-0.5 size-4 shrink-0" /> : null}
                  <span>
                    {fitsThis
                      ? "Looks like a match for your vehicle. A specialist double-checks every order by VIN before it ships."
                      : "We can't confirm this unit fits from the VIN alone. Leave your number and a specialist will text you the right one."}
                  </span>
                </div>
              )}

              {others.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase text-steel">
                    {productSlug ? "Other units that match your VIN" : "Listed for your vehicle"}
                  </div>
                  <ul className="mt-2 divide-y divide-line">
                    {others.map((m) => (
                      <li key={m.slug}>
                        <Link href={`/parts/${m.slug}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-gold-dark">
                          <span className="text-sm">
                            <b>{m.partType}</b> · {m.spec || m.title}
                            {m.mileage ? ` · ${m.mileage.toLocaleString()} mi` : ""}
                          </span>
                          <span className="font-display text-lg font-semibold">${m.price.toLocaleString()}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!productSlug && others.length === 0 && (
                <div className="mt-3 text-sm text-steel">
                  <p>Nothing listed online for this exact vehicle yet, but our yard and partner network change daily.</p>
                  {result.estimates && result.estimates.length > 0 && (
                    <ul className="mt-3 space-y-1.5 rounded-md bg-paper p-3 text-ink">
                      {result.estimates.map((e) => (
                        <li key={e.partType} className="flex justify-between gap-3">
                          <span>Approx. price, used {e.partType.toLowerCase()}</span>
                          <b className="whitespace-nowrap">${e.low.toLocaleString()}–${e.high.toLocaleString()}</b>
                        </li>
                      ))}
                      <li className="pt-1 text-xs text-steel">Estimate from similar parts we&apos;ve sold. Text {BUSINESS.smsDisplay} or call {BUSINESS.phoneDisplay} for your exact quote.</li>
                    </ul>
                  )}
                </div>
              )}

              <div className="mt-4 border-t border-line pt-4">
                <div className="mb-3 text-sm font-semibold">Get options, prices and real photos by text:</div>
                <QuoteForm defaultVin={vin} defaultPartType={partType || "Engine"} partSlug={productSlug} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
