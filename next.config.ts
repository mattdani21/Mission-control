import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output so the production image only ships the server + static
  // assets (Dockerfile copies .next/standalone → node server.js).
  output: "standalone",
};

export default nextConfig;
