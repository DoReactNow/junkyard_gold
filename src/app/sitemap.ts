import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/business";
import { allCatalogPaths } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const parts = await db.part.findMany({ where: { status: "available" }, select: { slug: true, updatedAt: true } });
  const pages = ["", "/parts?type=Other", "/warranty", "/shipping-returns", "/contact", "/privacy", "/terms"];
  const catalog = await allCatalogPaths();
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...catalog.map((p) => ({ url: `${base}${p}` })),
    ...parts.map((p) => ({ url: `${base}/parts/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
