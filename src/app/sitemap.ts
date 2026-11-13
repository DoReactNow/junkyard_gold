import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/business";
import { KINDS, allCatalogPaths, type Kind } from "@/lib/catalog";
import { codePath, codesFor } from "@/lib/codes";
import { GUIDES } from "@/lib/guides";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const parts = await db.part.findMany({ where: { status: "available" }, select: { slug: true, updatedAt: true } });
  const pages = ["", "/parts", "/about", "/our-process", "/guides", ...GUIDES.map((g) => `/guides/${g.slug}`), "/warranty", "/shipping-returns", "/faq", "/repair-shops", "/contact", "/privacy", "/terms"];
  const catalog = await allCatalogPaths();
  const codes: { path: string; lastModified?: Date }[] = [];
  for (const kind of Object.keys(KINDS) as Kind[]) {
    const list = await codesFor(kind);
    if (!list.length) continue;
    const newest = list.reduce((d, c) => (c.updated > d ? c.updated : d), list[0].updated);
    codes.push({ path: `/${kind}/code`, lastModified: newest }, ...list.map((c) => ({ path: codePath(kind, c.code), lastModified: c.updated })));
  }
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...[...catalog, ...codes].map((p) => ({ url: `${base}${p.path}`, ...(p.lastModified ? { lastModified: p.lastModified } : {}) })),
    ...parts.map((p) => ({ url: `${base}/parts/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
