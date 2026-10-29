import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const parts = await db.part.findMany({ where: { status: "available" }, select: { slug: true, updatedAt: true } });
  const pages = ["", "/parts?type=Engine", "/parts?type=Transmission", "/parts?type=Other", "/warranty", "/shipping-returns", "/contact", "/privacy", "/terms"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...parts.map((p) => ({ url: `${base}/parts/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
