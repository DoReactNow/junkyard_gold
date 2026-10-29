import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Used by the deploy pipeline: 200 only when the app and its database both answer. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
