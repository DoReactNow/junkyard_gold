"use client";

import { useEffect, useRef, useState } from "react";
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

const UNSURE = "__unsure";

/**
 * Year → Make → Model → Part → Spec, covering every US-market vehicle. A spec opens its three priced
 * options; with no spec to pick (or "not sure") the search results offer a price range and "text us".
 */
export function VehicleFields({
  layout = "row",
  defaultType = "",
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
  const [specs, setSpecs] = useState<Option[]>([]);
  const [year, setYear] = useState(initial?.year ?? "");
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [spec, setSpec] = useState("");
  const [loading, setLoading] = useState<"" | "makes" | "models" | "specs">("");
  const specRequest = useRef(0);

  useEffect(() => {
    let live = true;
    load({}).then((v) => live && setYears(v));
    // pre-fill the vehicle that was just searched
    if (initial?.year) load({ year: initial.year }).then((v) => live && setMakes(v));
    if (initial?.year && initial.make) load({ year: initial.year, make: initial.make }).then((v) => live && setModels(v));
    if (initial?.year && initial.make && initial.model && defaultType) loadSpecs(initial.year, initial.make, initial.model, defaultType);
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSpecs(y: string, mk: string, md: string, t: string) {
    const request = ++specRequest.current;
    setSpec("");
    setSpecs([]);
    if (!y || !mk || !md || !t) return;
    setLoading("specs");
    const list = await load({ year: y, make: mk, model: md, type: t });
    if (request !== specRequest.current) return; // a newer pick took over
    setSpecs(list);
    if (list.length === 1) setSpec(list[0].name);
    setLoading("");
  }
  async function pickYear(y: string) {
    setYear(y);
    setMake("");
    setModel("");
    setModels([]);
    setMakes([]);
    loadSpecs("", "", "", "");
    if (!y) return;
    setLoading("makes");
    setMakes(await load({ year: y }));
    setLoading("");
  }
  async function pickMake(m: string) {
    setMake(m);
    setModel("");
    setModels([]);
    loadSpecs("", "", "", "");
    if (!m) return;
    setLoading("models");
    setModels(await load({ year, make: m }));
    setLoading("");
  }
  function pickModel(m: string) {
    setModel(m);
    loadSpecs(year, make, m, type);
  }
  function pickType(t: string) {
    setType(t);
    loadSpecs(year, make, model, t);
  }
  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    const q = { type, year, make, model };
    if (spec && spec !== UNSURE) router.push(`/parts/options?${new URLSearchParams({ ...q, spec })}`);
    else router.push(`/parts?${new URLSearchParams(q)}`);
  }

  const hasSpecs = specs.length > 0;
  const ready = Boolean(year && make && model && type && loading !== "specs" && (spec || !hasSpecs));
  const specHint = loading === "specs" ? "Loading…" : !model || !type ? "Spec" : hasSpecs ? "Select spec" : "We'll match it by VIN";
  const row = layout === "row";
  return (
    <form onSubmit={go} className={row ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-[0.75fr_1fr_1.1fr_1fr_1.6fr_auto] lg:items-end" : "grid gap-3.5"}>
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
        <select className="field" value={model} disabled={!make || loading === "models"} onChange={(e) => pickModel(e.target.value)}>
          <option value="">{loading === "models" ? "Loading…" : "Model"}</option>
          {models.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={label}>Part</span>
        <select className="field" value={type} disabled={!model} onChange={(e) => pickType(e.target.value)}>
          <option value="">Part</option>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
      <label className="block min-w-0">
        <span className={label}>Specs</span>
        <select className="field" value={spec} disabled={!hasSpecs} onChange={(e) => setSpec(e.target.value)}>
          <option value="">{specHint}</option>
          {specs.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          {hasSpecs && <option value={UNSURE}>Not sure, match it by my VIN</option>}
        </select>
      </label>
      <button disabled={!ready} className={`btn-gold !h-12 ${row ? "sm:col-span-2 lg:col-span-1 lg:!px-7" : "mt-1 w-full"}`}>
        <SearchIcon /> Find parts
      </button>
    </form>
  );
}
