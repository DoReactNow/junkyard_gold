// Engine and transmission specs per vehicle, for the last step of the finder.
// Built by scripts/build-specs.py. Spec wording only: prices come from our own sales (lib/unit-options.ts).
import data from "@/data/specs.json";

type Entry = { e?: string[]; t?: string[] };
const SPECS = data as Record<string, Record<string, Record<string, Entry>>>;

const key = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

function modelsOf(make: string, year: number) {
  const makes = SPECS[String(year)];
  if (!makes) return {};
  const found = Object.keys(makes).find((m) => key(m) === key(make));
  return found ? makes[found] : {};
}

/** Model names we have specs for, so the finder offers them under the same spelling. */
export function specModels(make: string, year: number) {
  return Object.keys(modelsOf(make, year));
}

/** Every model we have specs for under a make, in any year. */
export function allSpecModels(make: string) {
  return [...new Set(Object.keys(SPECS).flatMap((y) => specModels(make, Number(y))))];
}

/** Model years that list this exact spec for the same make, model and part. */
export function yearsWithSpec(make: string, model: string, partType: string, spec: string) {
  return Object.keys(SPECS)
    .filter((y) => specsFor(Number(y), make, model, partType).includes(spec))
    .map(Number)
    .sort((a, b) => a - b);
}

/** Specs for a vehicle. An exact model wins; otherwise close names ("Silverado" ↔ "Silverado 1500") are combined. */
export function specsFor(year: number, make: string, model: string, partType: string): string[] {
  const slot = partType === "Engine" ? "e" : partType === "Transmission" ? "t" : null;
  if (!slot) return [];
  const models = modelsOf(make, year);
  const want = key(model.replace(/^ram\s+/i, ""));
  const names = Object.keys(models);
  const exact = names.filter((n) => key(n) === want || key(n) === key(model));
  const near = want.length >= 3 ? names.filter((n) => key(n).startsWith(want) || want.startsWith(key(n))) : [];
  const picked = exact.length ? exact : near;
  return [...new Set(picked.flatMap((n) => models[n][slot] ?? []))].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}
