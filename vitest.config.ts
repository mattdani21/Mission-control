import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    // Automatic JSX runtime (react/jsx-runtime) — no React-in-scope needed.
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
  },
});
