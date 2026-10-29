import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { money } from "@/lib/inventory";
import { payLink } from "@/lib/payments";
import { smsLive } from "@/lib/sms";
import { AdminNav } from "./admin-nav";
import { Composer, AutoRefresh, LeadStatus } from "./inbox-client";
import { simulateInbound } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox", robots: { index: false } };

function ago(d: Date) {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function Inbox({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireAdmin();
  const { c } = await searchParams;

  const convos = await db.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 }, leads: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const activeId = c || convos[0]?.id;
  const active = activeId
    ? await db.conversation.findUnique({
        where: { id: activeId },
        include: { messages: { orderBy: { createdAt: "asc" } }, leads: { orderBy: { createdAt: "desc" } } },
      })
    : null;
  if (active?.unread) await db.conversation.update({ where: { id: active.id }, data: { unread: false } });

  const suggestedIds: string[] = active?.aiDraftParts ? JSON.parse(active.aiDraftParts) : [];
  const suggested = suggestedIds.length ? await db.part.findMany({ where: { id: { in: suggestedIds } } }) : [];
  const demo = !smsLive();

  return (
    <div className="flex h-screen flex-col bg-paper">
      <AdminNav active="inbox" />
      <AutoRefresh />
      <div className="grid min-h-0 flex-1 md:grid-cols-[320px_1fr] lg:grid-cols-[340px_1fr_300px]">
        {/* Conversation list */}
        <aside className="min-h-0 overflow-y-auto border-r border-line bg-white">
          {demo && (
            <form action={simulateInbound} className="space-y-2 border-b border-line bg-gold/10 p-3">
              <div className="text-xs font-semibold uppercase text-gold-dark">Demo: simulate a customer text</div>
              <input name="phone" className="field !py-1.5 text-sm" placeholder="Customer phone, e.g. 941-555-0199" defaultValue="(941) 726-0142" />
              <input name="body" className="field !py-1.5 text-sm" placeholder="Message" defaultValue="Hi do you have a motor for 2013 sonata? vin 5NPEB4AC6DH512345" />
              <button className="btn-dark w-full !py-1.5 text-sm">Receive text</button>
            </form>
          )}
          {convos.length === 0 && <p className="p-6 text-sm text-steel">No conversations yet. Leads from the website and incoming texts show up here.</p>}
          <ul>
            {convos.map((cv) => {
              const last = cv.messages[0];
              return (
                <li key={cv.id}>
                  <Link
                    href={`/admin?c=${cv.id}`}
                    className={`block border-b border-line px-4 py-3 hover:bg-paper ${cv.id === activeId ? "bg-gold/10" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {cv.unread && cv.id !== activeId && <span className="size-2 shrink-0 rounded-full bg-gold" />}
                      <span className="truncate font-semibold">{cv.name || formatPhone(cv.phone)}</span>
                      <span className="ml-auto shrink-0 text-xs text-steel">{ago(cv.lastMessageAt)}</span>
                    </div>
                    <div className="truncate text-xs text-steel">{cv.vehicle || "Vehicle unknown"}{cv.partType ? ` · ${cv.partType}` : ""}</div>
                    {last && <div className="mt-0.5 truncate text-sm text-ink/75">{last.direction === "out" ? "You: " : ""}{last.body}</div>}
                    {cv.aiDraft && <div className="mt-1 inline-block rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gold">Draft ready</div>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Thread */}
        <section className="flex min-h-0 flex-col">
          {!active ? (
            <div className="grid flex-1 place-items-center text-steel">Select a conversation</div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line bg-white px-5 py-3">
                <div>
                  <div className="font-semibold">{active.name || "Unknown name"} · {formatPhone(active.phone)}</div>
                  <div className="text-xs text-steel">{active.vehicle || "Vehicle unknown"}{active.vin ? ` · VIN ${active.vin}` : ""}</div>
                </div>
                {active.optedOut && <span className="rounded bg-bad px-2 py-0.5 text-xs font-bold text-white">OPTED OUT</span>}
                <a href={`tel:${active.phone}`} className="btn-ghost ml-auto !px-3 !py-1.5 text-sm">Call</a>
              </div>
              {/* column-reverse keeps the newest message in view */}
              <div className="flex flex-1 flex-col-reverse overflow-y-auto px-5 py-4">
                <div className="space-y-3">
                {active.messages.map((m) =>
                  m.direction === "note" ? (
                    <div key={m.id} className="mx-auto max-w-lg whitespace-pre-line rounded-md border border-dashed border-line bg-white px-3 py-2 text-xs text-steel">
                      {m.body}
                    </div>
                  ) : (
                    <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.direction === "out" ? "rounded-br-sm bg-ink text-white" : "rounded-bl-sm bg-white shadow-sm"}`}>
                        <div className="whitespace-pre-line">{m.body}</div>
                        <div className={`mt-1 text-[10px] ${m.direction === "out" ? "text-white/50" : "text-steel"}`}>
                          {m.author === "auto" ? "Auto-reply · " : m.author === "staff" ? "Staff · " : ""}
                          {m.createdAt.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
                          {m.status === "simulated" && " · simulated (no SMS sent)"}
                          {m.status === "failed" && " · FAILED"}
                        </div>
                      </div>
                    </div>
                  ),
                )}
                </div>
              </div>
              <Composer
                key={active.id}
                conversationId={active.id}
                draft={active.aiDraft || ""}
                draftNote={active.aiDraftNote || ""}
                disabled={active.optedOut}
                quickParts={suggested.map((p) => ({
                  label: `${p.year} ${p.make} ${p.model} ${p.partType} – ${money(p.price)}`,
                  payText: `Here's a secure link to buy the ${p.year} ${p.make} ${p.model} ${p.partType} (${money(p.price)}): ${payLink(p)}`,
                }))}
              />
            </>
          )}
        </section>

        {/* Lead details */}
        {active && (
          <aside className="hidden min-h-0 overflow-y-auto border-l border-line bg-white p-4 lg:block">
            <h2 className="font-display text-lg uppercase">Lead</h2>
            {active.leads[0] ? (
              <dl className="mt-2 space-y-2 text-sm">
                <div><dt className="text-xs uppercase text-steel">Status</dt><dd><LeadStatus conversationId={active.id} status={active.leads[0].status} /></dd></div>
                <div><dt className="text-xs uppercase text-steel">Needs</dt><dd>{active.leads[0].partType || "—"}</dd></div>
                <div><dt className="text-xs uppercase text-steel">Notes</dt><dd>{active.leads[0].notes || "—"}</dd></div>
                <div><dt className="text-xs uppercase text-steel">From page</dt><dd className="break-all">{active.leads[0].sourcePage || "—"}</dd></div>
                {active.leads[0].gclid && <div><dt className="text-xs uppercase text-steel">Google Ads click</dt><dd className="break-all text-xs">{active.leads[0].gclid}</dd></div>}
                <div><dt className="text-xs uppercase text-steel">Requests</dt><dd>{active.leads.length}</dd></div>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-steel">Came in by text (no web form).</p>
            )}
            <h2 className="mt-6 font-display text-lg uppercase">AI suggested units</h2>
            {suggested.length === 0 ? (
              <p className="mt-2 text-sm text-steel">None in stock matched. Check partner yards.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {suggested.map((p) => (
                  <li key={p.id} className="rounded-md border border-line p-2.5 text-sm">
                    <a href={`/parts/${p.slug}`} target="_blank" className="font-semibold hover:text-gold-dark">
                      {p.year} {p.make} {p.model} {p.partType}
                    </a>
                    <div className="text-xs text-steel">{p.spec} · {p.mileage?.toLocaleString() ?? "?"} mi · {p.stockNo}</div>
                    <div className="font-display text-lg">{money(p.price)}</div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
