"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { Logo } from "@/components/site-chrome";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4">
      <form action={action} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <Logo />
        <h1 className="mt-5 font-display text-2xl uppercase">Staff inbox</h1>
        <input name="password" type="password" required autoFocus placeholder="Password" className="field mt-4" />
        {state?.error && <p className="mt-2 text-sm text-bad">{state.error}</p>}
        <button className="btn-gold mt-4 w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
