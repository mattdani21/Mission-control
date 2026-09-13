import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Standalone output so the production image only ships the server + static
  // assets (Dockerfile copies .next/standalone → node server.js).
  output: "standalone",
};

const sentryAuth = process.env.SENTRY_AUTH_TOKEN;

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: sentryAuth,
  // Tunnel client events through this origin so prod CSP `connect-src 'self'`
  // still allows Sentry without widening the policy to *.sentry.io.
  tunnelRoute: "/monitoring",
  silent: true,
  telemetry: false,
  sourcemaps: {
    disable: !sentryAuth,
    deleteSourcemapsAfterUpload: true,
  },
  widenClientFileUpload: Boolean(sentryAuth),
});
