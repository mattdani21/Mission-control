import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    // Automatic JSX runtime (react/jsx-runtime) — no React-in-scope needed.
    jsx: "automatic",
  },
  resolve: {
    alias: {
      // next-auth imports "next/server" without an extension; Vite's Node
      // resolver needs the explicit .js entry (Next's own bundler handles it).
      "next/server": "next/server.js",
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    server: {
      deps: {
        // Inline next-auth so its "next/server" import is rewritten by the
        // alias above (externalized deps bypass Vite's resolver).
        inline: ["next-auth"],
      },
    },
  },
});
