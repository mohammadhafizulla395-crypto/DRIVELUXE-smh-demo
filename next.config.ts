import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai"],
};

export default nextConfig;
