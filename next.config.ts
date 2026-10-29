import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname) },
  // the yearly sales sheet is uploaded through a server action
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
};

export default nextConfig;
