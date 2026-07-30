import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Directory-style export (out/method/index.html) so nested routes are served
  // as index documents.
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    // Static export cannot use the Next.js image optimiser.
    unoptimized: true,
  },
};

export default nextConfig;
