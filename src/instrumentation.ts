// Runs once when the server starts. On the VPS the app is one long-running container, so a simple
// in-process timer sends queued texts (instant replies after hours, follow-ups) every minute and keeps
// the RingCentral webhook subscription alive.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.DISABLE_WORKER === "1") return;
  const g = globalThis as unknown as { __jgWorker?: boolean };
  if (g.__jgWorker) return; // dev hot reload
  g.__jgWorker = true;

  const { processDueTexts } = await import("./lib/sms");
  const { ensureInboundSubscription } = await import("./lib/ringcentral");
  const { noteInbound, pollInbound } = await import("./lib/inbound");

  const tick = () => processDueTexts().catch((e) => console.error("text queue failed", e));
  setInterval(tick, 60_000);
  setTimeout(tick, 10_000);

  const keepSubscription = () =>
    ensureInboundSubscription()
      .then((r) => {
        console.log(`[ringcentral] ${r}`);
        noteInbound({ webhook: r, webhookError: "" });
      })
      .catch((e) => {
        console.error("[ringcentral] subscription check failed", e);
        noteInbound({ webhookError: String(e instanceof Error ? e.message : e).slice(0, 400) });
      });
  setInterval(keepSubscription, 3600_000);
  setTimeout(keepSubscription, 30_000);

  const poll = () =>
    pollInbound()
      .then(() => noteInbound({ pollError: "", polledAt: new Date().toISOString() }))
      .catch((e) => {
        console.error("[ringcentral] inbound check failed", e);
        noteInbound({ pollError: String(e instanceof Error ? e.message : e).slice(0, 400) });
      });
  setInterval(poll, 60_000);
  setTimeout(poll, 45_000);
}
