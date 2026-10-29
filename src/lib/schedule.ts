// Time helpers in Florida (Eastern) time, without a date library.
const TZ = "America/New_York";

/** Automatic texts (instant reply and follow-ups) only go out 10:00–19:59 Eastern, any day. */
export const TEXT_WINDOW = { start: 10, end: 20 };

function etParts(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second };
}

/** The UTC instant for a wall-clock time in Eastern (handles daylight saving). */
function etToUtc(y: number, m: number, d: number, h: number) {
  const guess = Date.UTC(y, m - 1, d, h);
  const p = etParts(new Date(guess));
  const offset = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - guess; // ET wall clock minus UTC
  return new Date(guess - offset);
}

export const inTextWindow = (d = new Date()) => {
  const h = etParts(d).h;
  return h >= TEXT_WINDOW.start && h < TEXT_WINDOW.end;
};

/** `d` if it's inside the texting window, otherwise the next 10:00 AM Eastern. */
export function nextTextWindow(d = new Date()): Date {
  if (inTextWindow(d)) return d;
  const p = etParts(d);
  const today = etToUtc(p.y, p.m, p.d, TEXT_WINDOW.start);
  if (p.h < TEXT_WINDOW.start) return today;
  const t = etParts(new Date(today.getTime() + 26 * 3600 * 1000)); // a day later, safe across DST changes
  return etToUtc(t.y, t.m, t.d, TEXT_WINDOW.start);
}
