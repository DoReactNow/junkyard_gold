"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";
import { Picker } from "./picker";

type Option = { name: string; inStock: boolean; group?: string };

const TYPES = [
  { value: "Engine", label: "Engine" },
  { value: "Transmission", label: "Transmission" },
  { value: "Other", label: "Other part" },
];

async function load(params: Record<string, string>): Promise<Option[]> {
  const res = await fetch(`/api/finder?${new URLSearchParams(params)}`);
  return res.ok ? res.json() : [];
}

const UNSURE = "__unsure";
const NOT_LISTED = "__not_listed";
const opts = (list: Option[]) => list.map((o) => ({ value: o.name, label: o.name, group: o.group }));

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
  const [next, setNext] = useState("");
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
    setNext("make");
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
    setNext("model");
    setLoading("models");
    setModels(await load({ year, make: m }));
    setLoading("");
  }
  function pickModel(m: string) {
    setModel(m);
    if (!type) setNext("type");
    loadSpecs(year, make, m, type);
  }
  function pickType(t: string) {
    setType(t);
    setNext("spec");
    loadSpecs(year, make, model, t);
  }
  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    const q = { type, year, make, ...(model === NOT_LISTED ? {} : { model }) };
    if (spec && spec !== UNSURE) router.push(`/parts/options?${new URLSearchParams({ ...q, spec })}`);
    else router.push(`/parts?${new URLSearchParams(q)}`);
  }

  const hasSpecs = specs.length > 0;
  const ready = Boolean(year && make && model && type && loading !== "specs" && (spec || !hasSpecs));
  const specHint = loading === "specs" ? "Loading…" : !model || !type ? "Spec" : hasSpecs ? "Select spec" : "We'll match it by VIN";
  const field = (name: string) => ({ autoOpen: next === name, onOpened: () => setNext("") });
  const row = layout === "row";
  return (
    <form onSubmit={go} className={row ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-[0.72fr_1fr_1.1fr_0.95fr_1.55fr_auto] lg:items-end" : "grid gap-3.5"}>
      <Picker label="Year" placeholder="Year" value={year} options={opts(years)} onChange={pickYear} />
      <Picker label="Make" placeholder={loading === "makes" ? "Loading…" : "Make"} value={make} options={opts(makes)} disabled={!year || loading === "makes"} onChange={pickMake} {...field("make")} />
      <Picker
        label="Model"
        placeholder={loading === "models" ? "Loading…" : "Model"}
        value={model === NOT_LISTED ? "My model isn't listed" : model}
        options={models.length ? [...opts(models), { value: NOT_LISTED, label: "My model isn't listed", group: "Can't find it?" }] : []}
        disabled={!make || loading === "models"}
        onChange={pickModel}
        {...field("model")}
      />
      <Picker label="Part" placeholder="Part" value={type} options={TYPES} disabled={!model} onChange={pickType} {...field("type")} />
      <Picker
        label="Specs"
        placeholder={specHint}
        value={spec === UNSURE ? "Not sure, match it by my VIN" : spec}
        options={hasSpecs ? [...opts(specs), { value: UNSURE, label: "Not sure, match it by my VIN", group: "Can't tell?" }] : []}
        disabled={!hasSpecs}
        onChange={setSpec}
        {...field("spec")}
      />
      <button
        disabled={!ready}
        className={`btn !h-[50px] rounded-xl ${ready ? "bg-gold-grad text-ink shadow-[0_8px_20px_-10px_rgb(201_150_47/0.9)] hover:brightness-105" : "bg-sand text-steel disabled:opacity-100"} ${row ? "sm:col-span-2 lg:col-span-1 lg:!px-7" : "mt-1 w-full"}`}
      >
        <SearchIcon /> Find parts
      </button>
    </form>
  );
}
