"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";
import { VinCheck } from "./vin-check";

const TYPES = [
  { value: "Engine", label: "Engine" },
  { value: "Transmission", label: "Transmission" },
  { value: "Other", label: "Other part" },
];

async function load(params: Record<string, string>) {
  const res = await fetch(`/api/finder?${new URLSearchParams(params)}`);
  return res.ok ? ((await res.json()) as string[]) : [];
}

const label = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-steel";

/** The docked search bar under the home-page hero: by vehicle, or by VIN. */
export function HeroSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<"vehicle" | "vin">("vehicle");
  const [type, setType] = useState("Engine");
  const [years, setYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  useEffect(() => {
    let live = true;
    load({ type }).then((v) => live && setYears(v));
    return () => {
      live = false;
    };
  }, [type]);

  function pickType(t: string) {
    setType(t);
    setYear("");
    setMake("");
    setModel("");
    setMakes([]);
    setModels([]);
  }
  async function pickYear(y: string) {
    setYear(y);
    setMake("");
    setModel("");
    setModels([]);
    setMakes(y ? await load({ type, year: y }) : []);
  }
  async function pickMake(m: string) {
    setMake(m);
    setModel("");
    setModels(m ? await load({ type, year, make: m }) : []);
  }
  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!year || !make) return;
    router.push(`/parts?${new URLSearchParams({ type, year, make, ...(model ? { model } : {}) })}`);
  }

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
          <span className="ml-auto hidden text-[13px] text-steel md:block">Every order is matched to your VIN before it ships.</span>
        </div>

        {mode === "vehicle" ? (
          <form onSubmit={go} className="grid gap-3 md:grid-cols-[1.15fr_0.8fr_1fr_1fr_auto] md:items-end">
            <label className="block">
              <span className={label}>Part</span>
              <select className="field" value={type} onChange={(e) => pickType(e.target.value)}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={label}>Year</span>
              <select className="field" value={year} onChange={(e) => pickYear(e.target.value)}>
                <option value="">Year</option>
                {years.map((y) => <option key={y}>{y}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={label}>Make</span>
              <select className="field" value={make} disabled={!year} onChange={(e) => pickMake(e.target.value)}>
                <option value="">Make</option>
                {makes.map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={label}>Model</span>
              <select className="field" value={model} disabled={!make} onChange={(e) => setModel(e.target.value)}>
                <option value="">{make ? "Any model" : "Model"}</option>
                {models.map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>
            <button disabled={!year || !make} className="btn-gold !h-12 md:!px-7">
              <SearchIcon /> Find parts
            </button>
          </form>
        ) : (
          <VinCheck />
        )}
      </div>
    </div>
  );
}
