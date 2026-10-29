"use client";

import { useState } from "react";
import { BUSINESS } from "@/lib/business";
import { CheckIcon } from "./icons";

const TYPES = ["Engine", "Transmission", "Other"] as const;

export function QuoteForm({
  defaultVin = "",
  defaultPartType = "Engine",
  partSlug,
  dark = false,
  submitLabel = "Text Me My Options",
}: {
  defaultVin?: string;
  defaultPartType?: string;
  partSlug?: string;
  dark?: boolean;
  submitLabel?: string;
}) {
  const [partType, setPartType] = useState(defaultPartType);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (!fd.get("smsConsent")) {
      setError("Please tick the box so we're allowed to text you your options.");
      return;
    }
    setState("sending");
    const params = new URLSearchParams(window.location.search);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          vinOrVehicle: fd.get("vinOrVehicle"),
          partType,
          notes: fd.get("notes"),
          smsConsent: true,
          partSlug,
          sourcePage: window.location.pathname,
          gclid: params.get("gclid") || undefined,
          website: fd.get("website"), // honeypot
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setState("done");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const label = dark ? "text-white/80" : "text-ink/80";

  if (state === "done") {
    return (
      <div className={`rounded-lg p-6 text-center ${dark ? "bg-white/5 text-white" : "bg-white"}`}>
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-ok text-white">
          <CheckIcon className="size-6" />
        </div>
        <h3 className="mt-3 font-display text-2xl uppercase">Request received</h3>
        <p className={`mt-2 text-sm ${dark ? "text-white/75" : "text-steel"}`}>
          Check your phone. We just sent you a text, and a parts specialist will reply with options during
          business hours ({BUSINESS.hours}). Questions? Call {BUSINESS.phoneDisplay}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={`mb-1 block text-xs font-semibold uppercase ${label}`}>Your name</span>
          <input name="name" required autoComplete="name" className="field" placeholder="First name" />
        </label>
        <label className="block">
          <span className={`mb-1 block text-xs font-semibold uppercase ${label}`}>Mobile number</span>
          <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" className="field" placeholder="(941) 000-0000" />
        </label>
      </div>
      <label className="block">
        <span className={`mb-1 block text-xs font-semibold uppercase ${label}`}>VIN, or year / make / model</span>
        <input
          name="vinOrVehicle"
          defaultValue={defaultVin}
          className="field font-mono uppercase placeholder:font-sans placeholder:normal-case"
          placeholder="17-digit VIN or e.g. 2014 Ford F150 5.0L"
        />
      </label>
      <div>
        <span className={`mb-1 block text-xs font-semibold uppercase ${label}`}>I need a</span>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPartType(t)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                partType === t
                  ? "border-gold bg-gold text-ink"
                  : dark
                    ? "border-white/25 text-white/85 hover:border-gold"
                    : "border-line bg-white hover:border-ink"
              }`}
            >
              {t === "Other" ? "Other part" : t}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className={`mb-1 block text-xs font-semibold uppercase ${label}`}>Anything else? (optional)</span>
        <input name="notes" className="field" placeholder="ZIP code for shipping, drivetrain, part number…" />
      </label>
      <label className={`flex items-start gap-2.5 text-xs leading-snug ${dark ? "text-white/65" : "text-steel"}`}>
        <input type="checkbox" name="smsConsent" className="mt-0.5 size-4 shrink-0 accent-gold" />
        <span>
          I agree to receive text messages from {BUSINESS.name} about my parts request. Message frequency varies.
          Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help. See our{" "}
          <a href="/terms" className="underline">SMS policy</a> and <a href="/privacy" className="underline">privacy policy</a>.
        </span>
      </label>
      {error && <p className="text-sm font-medium text-bad">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="btn-gold w-full text-base">
        {state === "sending" ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
