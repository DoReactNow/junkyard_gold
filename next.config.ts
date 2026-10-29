import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname) },
  // the yearly sales sheet is uploaded through a server action
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  // Docker image for the VPS (see Dockerfile)
  output: "standalone",
  // v1 addresses → v2 pages, so old links and bookmarks keep working
  async redirects() {
    const r = (source: string, destination: string) => ({ source, destination, permanent: true });
    return [
      r("/used-engines", "/parts?type=Engine"),
      r("/used-engines.html", "/parts?type=Engine"),
      r("/used-transmissions", "/parts?type=Transmission"),
      r("/used-transmissions.html", "/parts?type=Transmission"),
      r("/about", "/#how"),
      r("/about.html", "/#how"),
      r("/faq", "/#faq"),
      r("/faq.html", "/#faq"),
      r("/index.html", "/"),
      r("/admin.html", "/admin"),
      r("/:page(contact|privacy|terms|warranty).html", "/:page"),
    ];
  },
};

export default nextConfig;
