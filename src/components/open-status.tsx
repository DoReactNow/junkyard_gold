"use client";

import { useEffect, useState } from "react";
import { CLOSE_HOUR, OPEN_HOUR, isOpenNow } from "@/lib/business";

const hour12 = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;

/** "Phones open until 7 PM ET" / "Phones open tomorrow at 10 AM ET", from the visitor's clock (pages are cached, so not the server's). */
function label(now: Date) {
  if (isOpenNow(now)) return { open: true, text: `Phones open until ${hour12(CLOSE_HOUR)} ET · Texts 7 days` };
  // step forward to the next opening hour
  let t = new Date(Math.ceil(now.getTime() / 3_600_000) * 3_600_000);
  for (let i = 0; i < 24 * 8 && !isOpenNow(t); i++) t = new Date(t.getTime() + 3_600_000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { timeZone: "America/New_York" });
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const day = fmt(t) === fmt(now) ? "today" : fmt(t) === fmt(tomorrow) ? "tomorrow" : t.toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "long" });
  return { open: false, text: `Phones open ${day} at ${hour12(OPEN_HOUR)} ET · Texts 7 days` };
}

export function OpenStatus({ className = "" }: { className?: string }) {
  const [state, setState] = useState<{ open: boolean; text: string } | null>(null);
  useEffect(() => {
    const tick = () => setState(label(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`size-2 rounded-full ${state?.open ? "bg-[#3ecf7a] shadow-[0_0_0_3px_rgb(62_207_122/0.25)]" : "bg-white/35"}`} />
      {state?.text ?? `Calls Mon–Fri ${hour12(OPEN_HOUR)}–${hour12(CLOSE_HOUR)} ET · Texts 7 days`}
    </span>
  );
}
