// Reads what a spec line actually states ("3.6L, 6 cylinder, VIN G, 8th digit") into labelled facts.
// Anything the line doesn't say is left out rather than guessed.

export type VinMark = { code: string; positions: number[] };

export function vinMark(spec: string): VinMark | null {
  const m = spec.match(/\bVIN\s+([A-Z0-9]{1,2})\b[\s,(]*(\d{1,2})(?:st|nd|rd|th)(?:\s*(?:and|&)\s*(\d{1,2})(?:st|nd|rd|th))?\s+digit/i);
  if (!m) return null;
  const positions = [Number(m[2]), ...(m[3] ? [Number(m[3])] : [])].filter((p) => p >= 1 && p <= 17);
  if (!positions.length || m[1].length !== positions.length) return null;
  return { code: m[1].toUpperCase(), positions };
}

const first = (spec: string, list: [RegExp, string][]) => list.find(([re]) => re.test(spec))?.[1];

export function specFacts(spec: string, partType: string): [string, string][] {
  const facts: [string, string | undefined][] = [
    ["Transmission type", partType === "Transmission" ? first(spec, [[/\bCVT\b/, "CVT"], [/\bAT\b|automatic/i, "Automatic"], [/\bMT\b|manual/i, "Manual"]]) : undefined],
    ["Speeds", spec.match(/\b(\d{1,2})[\s-]*speed/i)?.[1]],
    ["Engine size", spec.match(/\b\d{1,2}\.\d(?=\s*L\b)/i)?.[0]?.concat("L")],
    ["Cylinders", spec.match(/\b(\d{1,2})\s*cyl(?:inder)?\b/i)?.[1]],
    ["Aspiration", first(spec, [[/twin[\s-]*turbo/i, "Twin turbo"], [/turbo diesel|turbo/i, "Turbocharged"], [/supercharged/i, "Supercharged"], [/naturally aspirated/i, "Naturally aspirated"]])],
    ["Fuel", first(spec, [[/plug-?in|phev/i, "Plug-in hybrid"], [/hybrid/i, "Hybrid"], [/diesel/i, "Diesel"], [/flex/i, "Flex fuel"], [/electric/i, "Electric"], [/gasoline/i, "Gasoline"]])],
    ["Drivetrain", first(spec, [[/\bAWD\b/i, "AWD"], [/\bFWD\b/i, "FWD"], [/\bRWD\b/i, "RWD"], [/\b4x4\b|\b4WD\b/i, "4x4"], [/\b4x2\b|\b2WD\b/i, "2WD"]])],
    ["Part ID", spec.match(/\bID\s+([A-Z0-9-]{3,})/i)?.[1]],
  ];
  return facts.filter((f): f is [string, string] => Boolean(f[1]));
}

/** Days from now, moved to Monday if it lands on a weekend (freight doesn't deliver then). */
function deliveryDay(from: Date, days: number) {
  let d = new Date(from.getTime() + days * 86_400_000);
  const weekday = () => d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" });
  while (weekday() === "Sat" || weekday() === "Sun") d = new Date(d.getTime() + 86_400_000);
  return d;
}

/** From the shipping policy: delivered in 5–7 days. */
export function deliveryWindow(now = new Date()) {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" });
  const [a, b] = [fmt(deliveryDay(now, 5)), fmt(deliveryDay(now, 7))];
  return a === b ? a : `${a} – ${b}`;
}
