import { NextResponse } from "next/server";
import { finderOptions } from "@/lib/inventory";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const year = parseInt(sp.get("year") || "", 10) || undefined;
  const values = await finderOptions({
    partType: sp.get("type") || undefined,
    year,
    make: year ? sp.get("make") || undefined : undefined,
  });
  return NextResponse.json(values);
}
