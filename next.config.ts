import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The project sits outside a git repo root, so pin the workspace explicitly
  // rather than letting Turbopack infer it from an unrelated lockfile.
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
