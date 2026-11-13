// One spelling and one URL per vehicle model. Sales sheets spell the same model several ways
// ("F-150", "F150", "Truck F150", "Van E150", "E250 Van", "TRUCK SIERRA 1500"), and each spelling
// used to become its own catalog page. normalizeModel() is applied on import and when catalog pages
// are built; modelSlug() is the one URL segment every spelling shares.
import { slugify } from "./inventory";

/** Spellings no rule can fix: `${make}|${model}` in lowercase → the model name. */
const FIXES: Record<string, string> = {
  "ford|f250 super duty glenview": "F250 Super Duty",
  "ford|truck 150": "F150",
  "dodge|truck 1500": "Ram 1500",
  "hino|truck 338": "338",
  "subaru|cross trek": "Crosstrek",
  "buick|le sabre": "LeSabre",
};

/** "TRUCK SIERRA 1500" / "truck f350 super duty" → "Truck Sierra 1500" / "Truck F350 Super Duty". */
function fixCase(s: string) {
  if (!s.includes(" ") || (s !== s.toUpperCase() && s !== s.toLowerCase())) return s;
  return s
    .split(" ")
    .map((w) => (/\d/.test(w) || (s === s.toUpperCase() && w.length <= 2) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

export function normalizeModel(make: string, model: string) {
  let s = model.replace(/\s+/g, " ").trim();
  const fixed = FIXES[`${make}|${s}`.toLowerCase()];
  if (fixed) return fixed;
  s = fixCase(s);
  // "Truck F150", "Van Express 1500", "Truck Silverado 1500": a body-style word in front of a named model.
  // Kept when the rest is only a number ("Van 3500"), or when it is the whole name (Nissan "Truck").
  s = s.replace(/^(Truck|Van)\s+(?=[A-Za-z])/i, "");
  // "E250 Van", "Express 1500 Van", "Safari Van" (but not "1500 Van", where the number is the model).
  if (/^[A-Za-z]/.test(s)) s = s.replace(/\s+Van$/i, "");
  return FIXES[`${make}|${s}`.toLowerCase()] ?? s;
}

/** URL segment for a model. Joins a lone letter to its number ("f-150" → "f150", "325-i" → "325i"). */
export function modelSlug(make: string, model: string) {
  return slugify(normalizeModel(make, model))
    .replace(/(^|-)([a-z])-(\d)/g, "$1$2$3")
    .replace(/(\d)-([a-z])(?=-|$)/g, "$1$2");
}
