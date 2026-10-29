"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateDraft, sendReply, setLeadStatus } from "./actions";

/** Re-fetches the inbox every 8 seconds so new texts and drafts appear without reloading. */
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 8000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}

export function Composer({
  conversationId,
  draft,
  draftNote,
  disabled,
  quickParts,
}: {
  conversationId: string;
  draft: string;
  draftNote: string;
  disabled: boolean;
  quickParts: { label: string; payText: string }[];
}) {
  const [text, setText] = useState(draft);
  const [dirty, setDirty] = useState(false);
  const [seenDraft, setSeenDraft] = useState(draft);
  const [result, setResult] = useState("");
  const [pending, start] = useTransition();

  // A fresh AI draft replaces the text box unless staff already started typing.
  // (The parent keys this component by conversation, so switching threads resets it.)
  if (draft !== seenDraft) {
    setSeenDraft(draft);
    if (!dirty) setText(draft);
  }

  function send() {
    start(async () => {
      const res = await sendReply(conversationId, text);
      if ("error" in res) setResult(res.error ?? "");
      else {
        setResult(res.status === "simulated" ? "Saved (demo mode: no real SMS sent)" : res.status === "failed" ? "Send FAILED, check RingCentral" : "Sent ✓");
        setDirty(false);
        setText("");
      }
    });
  }

  function regenerate() {
    setDirty(false);
    start(async () => {
      setResult("Drafting…");
      await regenerateDraft(conversationId);
      setResult("");
    });
  }

  return (
    <div className="border-t border-line bg-white p-4">
      {draft && !dirty && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="rounded bg-ink px-1.5 py-0.5 font-semibold uppercase text-gold">AI draft</span>
          <span className="text-steel">Review and edit before sending.{draftNote ? ` Note: ${draftNote}` : ""}</span>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => {
          setDirty(true);
          setText(e.target.value);
        }}
        rows={5}
        disabled={disabled}
        className="field resize-y font-[inherit]"
        placeholder={disabled ? "Customer opted out (STOP). You can't text them." : "Type a reply…"}
      />
      <div className="mt-1 text-right text-[11px] text-steel">{text.length} characters · ~{Math.max(1, Math.ceil(text.length / 153))} SMS</div>
      {quickParts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {quickParts.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setDirty(true);
                setText((t) => `${t}${t ? "\n" : ""}${p.payText}`);
              }}
              className="rounded-full border border-line px-3 py-1 text-xs hover:border-gold"
            >
              + Pay link: {p.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={send} disabled={pending || disabled || !text.trim()} className="btn-gold !py-2">
          Send text
        </button>
        <button onClick={regenerate} disabled={pending || disabled} className="btn-ghost !py-2">
          {draft ? "Redo AI draft" : "Write AI draft"}
        </button>
        {result && <span className="text-sm text-steel">{result}</span>}
      </div>
    </div>
  );
}

const STATUSES = ["new", "quoted", "won", "lost"];

export function LeadStatus({ conversationId, status }: { conversationId: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => setLeadStatus(conversationId, e.target.value))}
      className="field !py-1 text-sm"
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
