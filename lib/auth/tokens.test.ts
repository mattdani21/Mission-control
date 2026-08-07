import { describe, expect, it } from "vitest";

import { generateResetToken, hashResetToken } from "./tokens";

describe("reset tokens", () => {
  it("generates a raw token plus its hash", () => {
    const { rawToken, tokenHash } = generateResetToken();
    expect(rawToken).toHaveLength(43); // 32 random bytes, base64url
    expect(tokenHash).toBe(hashResetToken(rawToken));
  });

  it("never exposes the raw token in the hash", () => {
    const { rawToken, tokenHash } = generateResetToken();
    expect(tokenHash).not.toContain(rawToken);
  });

  it("generates unique tokens per call", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.rawToken).not.toBe(b.rawToken);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it("hashes deterministically for the same raw token", () => {
    expect(hashResetToken("abc")).toBe(hashResetToken("abc"));
  });
});
