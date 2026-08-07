import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server binds to :3000 by default; the container healthcheck probes
  // /api/healthz (added in the M1 health-endpoint task).
};

export default nextConfig;
