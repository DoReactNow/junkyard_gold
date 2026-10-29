import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "jg_admin";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s === "change-me-too") {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set in production");
    return "dev-only-secret";
  }
  return s;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || (process.env.NODE_ENV === "production" && expected === "change-me")) return false;
  const a = Buffer.from(sign(input));
  const b = Buffer.from(sign(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
