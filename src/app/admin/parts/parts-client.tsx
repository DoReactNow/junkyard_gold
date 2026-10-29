"use client";

import { useActionState, useTransition } from "react";
import { setPartStatus, uploadCsv } from "../actions";

export function CsvUpload() {
  const [state, action, pending] = useActionState(uploadCsv, null);
  return (
    <form action={action} className="space-y-2">
      <input name="file" type="file" accept=".csv,.xlsx,text/csv" className="block w-full text-sm" />
      <label className="flex items-start gap-2 text-xs text-steel">
        <input type="checkbox" name="replace" className="mt-0.5 accent-gold" />
        This is my complete list: mark listings that aren&apos;t in this file as sold
      </label>
      <button className="btn-gold w-full !py-2 text-sm" disabled={pending}>{pending ? "Importing…" : "Import"}</button>
      {state?.message && <p className="text-sm">{state.message}</p>}
      {state?.skipped?.map((s) => (
        <p key={`${s.line}-${s.reason}`} className="text-xs text-bad">{s.line ? `Line ${s.line}: ` : ""}{s.reason}</p>
      ))}
    </form>
  );
}

export function StatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => setPartStatus(id, e.target.value))}
      className="field !w-32 !py-1 text-sm"
    >
      <option value="available">available</option>
      <option value="reserved">reserved</option>
      <option value="sold">sold</option>
    </select>
  );
}
