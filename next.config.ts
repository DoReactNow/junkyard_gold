import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname) },
  // the yearly sales sheet is uploaded through a server action
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  // Docker image for the VPS (see Dockerfile)
  output: "standalone",
  // don't advertise the framework in every response
  poweredByHeader: false,
  // Security headers on every response. No full Content-Security-Policy yet (Google Tag Manager loads
  // third-party scripts); frame-ancestors only stops other sites from framing these pages.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
        ],
      },
      // Photos and brand files aren't content-hashed, so a week (not a year) lets a replaced file show up.
      ...["/img/:path*", "/brand/:path*"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      })),
    ];
  },
  // v1 addresses → v2 pages, so old links and bookmarks keep working
  async redirects() {
    const r = (source: string, destination: string) => ({ source, destination, permanent: true });
    return [
      r("/used-engines.html", "/used-engines"),
      r("/used-transmissions.html", "/used-transmissions"),
      r("/about.html", "/about"),
      r("/faq.html", "/faq"),
      r("/index.html", "/"),
      r("/admin.html", "/admin"),
      r("/:page(contact|privacy|terms|warranty).html", "/:page"),
    ];
  },
};

export default nextConfig;
