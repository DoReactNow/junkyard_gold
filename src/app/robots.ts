import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/business";

// Built per request so it always uses the runtime SITE_URL.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/checkout"] }], sitemap: `${siteUrl()}/sitemap.xml` };
}
