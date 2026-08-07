import { webcrypto } from "node:crypto";

// Runs before any test module is imported — required so NextAuth's config
// (which reads AUTH_SECRET at module scope) is initialized with a secret.
process.env.AUTH_SECRET =
  process.env.AUTH_SECRET ??
  "vitest-only-secret-that-is-long-enough-for-authjs-hs256-signing-0123456789";

// Node 18 lacks the global Web Crypto that Auth.js uses for token/CSRF
// operations; expose the Node implementation.
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as unknown as typeof globalThis.crypto;
}
