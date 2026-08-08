import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashes a password and verifies the correct one", async () => {
    const hash = await hashPassword("hunter2-s3cret");
    expect(hash).not.toBe("hunter2-s3cret");
    await expect(verifyPassword("hunter2-s3cret", hash)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("hunter2-s3cret");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("never stores the plaintext", async () => {
    const hash = await hashPassword("hunter2-s3cret");
    expect(hash).not.toContain("hunter2");
  });

  it("produces distinct hashes for the same password (salting)", async () => {
    const [a, b] = await Promise.all([hashPassword("same-pass-123"), hashPassword("same-pass-123")]);
    expect(a).not.toBe(b);
  });
});
