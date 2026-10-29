"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";

const TYPES = [
  { value: "Engine", label: "Engine" },
  { value: "Transmission", label: "Transmission" },
  { value: "Other", label: "Other parts" },
];

async function load(params: Record<string, string>) {
  const res = await fetch(`/api/finder?${new URLSearchParams(params)}`);
  return res.ok ? ((await res.json()) as string[]) : [];
}

export function PartFinder() {
  const router = useRouter();
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
    return () => { live = false; };
  }, [type]);

  function pickType(t: string) {
    setType(t); setYear(""); setMake(""); setModel(""); setMakes([]); setModels([]);
  }
  async function pickYear(y: string) {
    setYear(y); setMake(""); setModel(""); setModels([]);
    setMakes(y ? await load({ type, year: y }) : []);
  }
  async function pickMake(m: string) {
    setMake(m); setModel("");
    setModels(m ? await load({ type, year, make: m }) : []);
  }

  function go() {
    const q = new URLSearchParams({ type, year, make, ...(model ? { model } : {}) });
    router.push(`/parts?${q}`);
  }

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg bg-paper p-1">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => pickType(t.value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${type === t.value ? "bg-ink text-white" : "text-ink/70 hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select aria-label="Year" className="field" value={year} onChange={(e) => pickYear(e.target.value)}>
          <option value="">Year</option>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select aria-label="Make" className="field" value={make} disabled={!year} onChange={(e) => pickMake(e.target.value)}>
          <option value="">{year ? "Make" : "Pick year first"}</option>
          {makes.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select aria-label="Model" className="field" value={model} disabled={!make} onChange={(e) => setModel(e.target.value)}>
          <option value="">{make ? "Model (any)" : "Pick make first"}</option>
          {models.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <button type="button" onClick={go} disabled={!year || !make} className="btn-dark mt-3 w-full">
        <SearchIcon /> Show Matching Parts
      </button>
    </div>
  );
}
