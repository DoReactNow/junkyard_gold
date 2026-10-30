"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";

type Option = { name: string; inStock: boolean };

const TYPES = [
  { value: "Engine", label: "Engine" },
  { value: "Transmission", label: "Transmission" },
  { value: "Other", label: "Other part" },
];

async function load(params: Record<string, string>): Promise<Option[]> {
  const res = await fetch(`/api/finder?${new URLSearchParams(params)}`);
  return res.ok ? res.json() : [];
}

const label = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-steel";

/**
 * Part → Year → Make → Model, covering every US-market vehicle. Submitting opens the search
 * results: listed parts with prices, or a price range and "text us" when nothing is listed.
 */
export function VehicleFields({
  layout = "row",
  defaultType = "Engine",
  initial,
}: {
  layout?: "row" | "stacked";
  defaultType?: string;
  initial?: { year?: string; make?: string; model?: string };
}) {
  const router = useRouter();
  const [type, setType] = useState(defaultType);
  const [years, setYears] = useState<Option[]>([]);
  const [makes, setMakes] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [year, setYear] = useState(initial?.year ?? "");
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [loading, setLoading] = useState<"" | "makes" | "models">("");

  useEffect(() => {
    let live = true;
    load({}).then((v) => live && setYears(v));
    // pre-fill the vehicle that was just searched
    if (initial?.year) load({ type: defaultType, year: initial.year }).then((v) => live && setMakes(v));
    if (initial?.year && initial.make) load({ type: defaultType, year: initial.year, make: initial.make }).then((v) => live && setModels(v));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pickYear(y: string) {
    setYear(y);
    setMake("");
    setModel("");
    setModels([]);
    setMakes([]);
    if (!y) return;
    setLoading("makes");
    setMakes(await load({ type, year: y }));
    setLoading("");
  }
  async function pickMake(m: string) {
    setMake(m);
    setModel("");
    setModels([]);
    if (!m) return;
    setLoading("models");
    setModels(await load({ type, year, make: m }));
    setLoading("");
  }
  async function pickType(t: string) {
    setType(t);
    if (year) {
      setMakes(await load({ type: t, year }));
      if (make) setModels(await load({ type: t, year, make }));
    }
  }
  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!year || !make) return;
    router.push(`/parts?${new URLSearchParams({ type, year, make, ...(model ? { model } : {}) })}`);
  }

  const row = layout === "row";
  return (
    <form onSubmit={go} className={row ? "grid gap-3 md:grid-cols-[1.1fr_0.8fr_1fr_1.1fr_auto] md:items-end" : "grid gap-3.5"}>
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
          {years.map((y) => <option key={y.name} value={y.name}>{y.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={label}>Make</span>
        <select className="field" value={make} disabled={!year || loading === "makes"} onChange={(e) => pickMake(e.target.value)}>
          <option value="">{loading === "makes" ? "Loading…" : "Make"}</option>
          {makes.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={label}>Model</span>
        <select className="field" value={model} disabled={!make || loading === "models"} onChange={(e) => setModel(e.target.value)}>
          <option value="">{loading === "models" ? "Loading…" : make ? "Any model" : "Model"}</option>
          {models.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>
      </label>
      <button disabled={!year || !make} className={`btn-gold !h-12 ${row ? "md:!px-7" : "mt-1 w-full"}`}>
        <SearchIcon /> Find parts
      </button>
    </form>
  );
}
