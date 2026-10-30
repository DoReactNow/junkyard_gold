"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, SearchIcon } from "./icons";

export type PickerOption = { value: string; label: string; group?: string };

const SEARCH_FROM = 9; // shorter lists don't need a search box

/** Branded dropdown with type-to-search. Its list renders on <body> so no panel can clip it. */
export function Picker({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
  autoOpen = false,
  onOpened,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  autoOpen?: boolean; // open as soon as there's something to pick (the previous step just finished)
  onOpened?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<React.CSSProperties>({});
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const searchable = options.length >= SEARCH_FROM;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const place = useCallback(() => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const margin = 12;
    const width = Math.min(Math.max(r.width, 260), window.innerWidth - margin * 2);
    const left = Math.max(margin, Math.min(r.left, window.innerWidth - width - margin));
    const below = window.innerHeight - r.bottom - margin;
    const above = r.top - margin;
    const up = below < 260 && above > below;
    setBox({
      position: "fixed",
      left,
      width,
      maxHeight: Math.min(380, (up ? above : below) - 6),
      ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
    });
  }, []);

  function show() {
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
    onOpened?.();
  }
  function choose(o: PickerOption) {
    setOpen(false);
    onChange(o.value);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening follows data that arrives from the previous step
    if (autoOpen && !disabled && options.length) show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, disabled, options.length]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    // don't pop the keyboard up over the list on a phone
    if (searchable && window.matchMedia("(pointer: fine)").matches) search.current?.focus({ preventScroll: true });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place, searchable]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !trigger.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  useEffect(() => {
    // move the list only; scrollIntoView could also scroll the page behind it
    const list = panel.current?.querySelector("ul");
    const row = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!open || !list || !row) return;
    const top = row.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    if (top < list.scrollTop) list.scrollTop = top - 28;
    else if (top + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + row.offsetHeight - list.clientHeight;
  }, [open, active, box]);

  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") trigger.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + shown.length) % Math.max(1, shown.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) choose(shown[active]);
    }
  }

  const selected = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-steel">{label}</span>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={`flex h-[50px] w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-left text-[15px] transition ${
          open ? "border-gold ring-4 ring-gold/15" : "border-line hover:border-ink/30"
        } disabled:cursor-not-allowed disabled:border-line/70 disabled:bg-white disabled:text-steel/45 disabled:hover:border-line/70`}
      >
        <span className={`truncate ${selected ? "font-medium text-ink" : ""}`}>{selected || placeholder}</span>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`size-4 shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div ref={panel} style={box} onKeyDown={onKey} className="z-[100] flex flex-col overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-[0_24px_60px_-18px_rgb(0_0_0/0.45)]">
            {searchable && (
              <div className="flex items-center gap-2 border-b border-line px-3.5">
                <SearchIcon className="size-4 shrink-0 text-steel" />
                <input
                  ref={search}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  placeholder={`Search ${label.toLowerCase()}`}
                  aria-label={`Search ${label.toLowerCase()}`}
                  className="h-11 w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-steel/70"
                />
              </div>
            )}
            <ul id={listId} role="listbox" aria-label={label} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
              {shown.map((o, i) => (
                <li key={o.value} role="presentation">
                  {o.group && o.group !== shown[i - 1]?.group && (
                    <div className="px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-steel first:pt-1.5">{o.group}</div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    data-active={i === active}
                    onClick={() => choose(o)}
                    onMouseMove={() => setActive(i)}
                    className={`flex w-full items-start justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[14.5px] leading-snug ${i === active ? "bg-gold-light/30" : ""} ${o.value === value ? "font-semibold" : ""}`}
                  >
                    <span className="min-w-0">{o.label}</span>
                    {o.value === value && <CheckIcon className="mt-0.5 size-4 shrink-0 text-gold-dark" />}
                  </button>
                </li>
              ))}
              {shown.length === 0 && <li className="px-2.5 py-4 text-center text-sm text-steel">No match for &ldquo;{query}&rdquo;</li>}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
