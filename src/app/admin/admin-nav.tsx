import Link from "next/link";
import { logout } from "./actions";
import { smsLive } from "@/lib/sms";
import { paymentsLive } from "@/lib/payments";

export function AdminNav({ active }: { active: "inbox" | "parts" }) {
  const ai = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  const pill = (on: boolean, label: string) => (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${on ? "bg-ok/20 text-ok" : "bg-white/10 text-white/60"}`}>
      {label}: {on ? "live" : "demo"}
    </span>
  );
  return (
    <header className="flex flex-wrap items-center gap-4 bg-ink px-4 py-3 text-white">
      <span className="font-display text-xl font-bold uppercase">Junkyard <span className="text-gold">Gold</span></span>
      <nav className="flex gap-1 text-sm">
        <Link href="/admin" className={`rounded px-3 py-1.5 ${active === "inbox" ? "bg-white/15" : "hover:bg-white/10"}`}>Inbox</Link>
        <Link href="/admin/parts" className={`rounded px-3 py-1.5 ${active === "parts" ? "bg-white/15" : "hover:bg-white/10"}`}>Inventory</Link>
        <Link href="/" className="rounded px-3 py-1.5 hover:bg-white/10" target="_blank">View site ↗</Link>
      </nav>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {pill(smsLive(), "SMS")}
        {pill(ai, "AI")}
        {pill(paymentsLive(), "Payments")}
        <form action={logout}><button className="ml-2 text-sm text-white/70 hover:text-white">Sign out</button></form>
      </div>
    </header>
  );
}
