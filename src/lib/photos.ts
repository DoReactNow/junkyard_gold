// Matches listings to the product photos in /public/img/parts (carried over from v1).
// These are photos of similar units, not the exact part for sale, so pages label them "Example photo".
import manifest from "@/data/photos.json";

type PhotoRow = { f: string; mk: string; md: string; part: string; label: string; fam: boolean };
type Group = { mk: string; md: string; label: string; part: string; fam: boolean; files: string[] };

const MAKE_ALIASES: Record<string, string> = { chevy: "chevrolet", ram: "dodge", "mercedes-benz": "mercedes", vw: "volkswagen" };
const GM = new Set(["chevrolet", "gmc", "pontiac", "buick", "cadillac", "hummer", "saturn", "oldsmobile"]);

const canonMake = (m: string) => {
  const k = m.toLowerCase().replace(/[^a-z-]/g, "");
  return MAKE_ALIASES[k] || k;
};
const modelKey = (s: string) =>
  s.toLowerCase().replace(/&/g, " ").replace(/\b(and|truck|super|duty)\b/g, " ").replace(/[^a-z0-9]/g, "");
const keysMatch = (a: string, b: string) => {
  if (!a || !b) return false;
  if (a.length < 3 || b.length < 3) return a === b;
  return a.includes(b) || b.includes(a);
};
// v1 files family photos (e.g. "4L60E", "Coyote") under the brand group
const famGroup = (mk: string) =>
  GM.has(mk) ? "gm"
  : ["ford", "lincoln", "mercury"].includes(mk) ? "ford"
  : ["dodge", "chrysler", "jeep"].includes(mk) ? "dodge"
  : ["toyota", "scion", "lexus"].includes(mk) ? "toyota"
  : ["honda", "acura"].includes(mk) ? "honda"
  : mk;

const groups: Group[] = (() => {
  const byId = new Map<string, Group>();
  for (const p of manifest as PhotoRow[]) {
    const id = `${p.mk}|${p.md || p.label}|${p.part}|${p.fam}`;
    if (!byId.has(id)) byId.set(id, { mk: p.mk, md: p.md, label: p.label, part: p.part, fam: p.fam, files: [] });
    byId.get(id)!.files.push(`/img/parts/${p.f}`);
  }
  return [...byId.values()];
})();

export type PhotoMatch = { files: string[]; level: "exact" | "make" | "family" | "generic" | "none" };

function photoPart(partType: string) {
  if (partType === "Engine" || partType === "Engine & Transmission") return "engine";
  if (partType === "Transmission" || partType === "Transmission & Transfer Case") return "transmission";
  return null;
}

/** Best example photos for a listing: same model > same make > engine/gearbox family > generic. */
export function pickPhotos(p: { make: string; model: string; partType: string; spec?: string }): PhotoMatch {
  const part = photoPart(p.partType);
  if (!part) return { files: [], level: "none" };
  const mk = canonMake(p.make);
  const key = modelKey(p.model);

  const own = groups.filter((g) => !g.fam && g.mk === mk && g.part === part);
  const exact = own.filter((g) => keysMatch(key, modelKey(g.md)));
  if (exact.length) return { files: exact.sort((a, b) => b.files.length - a.files.length)[0].files, level: "exact" };

  // A transmission/engine code in the spec ("4L60E", "Coyote") beats a same-make photo of another model
  const words = (p.spec || "").toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean);
  const famHit = groups.find((g) => g.fam && g.part === part && words.includes(g.label.split(" ")[0].toLowerCase()));
  if (famHit) return { files: famHit.files, level: "family" };

  if (own.length) return { files: own.sort((a, b) => b.files.length - a.files.length || a.md.localeCompare(b.md))[0].files, level: "make" };
  const fam = groups.find((g) => g.fam && g.part === part && g.mk === famGroup(mk));
  if (fam) return { files: fam.files, level: "family" };
  const any = groups.find((g) => g.fam && g.part === part && g.mk === "any");
  if (any) return { files: any.files, level: "generic" };
  return { files: [], level: "none" };
}

/** The background-free version of a product photo (made by scripts/cutout-photos.py). */
export const cutout = (src: string) => src.replace(/^\/img\/parts\/(.+)\.jpe?g$/i, "/img/parts-cut/$1.webp");
