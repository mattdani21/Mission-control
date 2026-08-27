import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "./validation";

describe("auth validation schemas", () => {
  it("accepts a valid signup payload", () => {
    const result = signupSchema.safeParse({
      email: "  Ada@Empyrean.com  ",
      name: "  Ada Lovelace ",
      password: "hunter2-s3cret",
    });
    expect(result.success).toBe(true);
  });

  it("signup trims name and email", () => {
    const result = signupSchema.safeParse({
      email: "  ada@empyrean.com  ",
      name: "  Ada Lovelace  ",
      password: "hunter2-s3cret",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ada@empyrean.com");
      expect(result.data.name).toBe("Ada Lovelace");
    }
  });

  it("signup strips markup and control chars from name", () => {
    const result = signupSchema.safeParse({
      email: "xss@empyrean.co.za",
      name: "<script>alert(1)</script>\u0000Gary",
      password: "Valid1pass",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("scriptalert(1)/scriptGary");
  });

  it("rejects a malformed signup email", () => {
    const result = signupSchema.safeParse({ email: "not-an-email", password: "hunter2-s3cret" });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short signup password", () => {
    const result = signupSchema.safeParse({ email: "ada@empyrean.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a letter or without a number", () => {
    expect(signupSchema.safeParse({ email: "a@b.com", password: "12345678" }).success).toBe(false);
    expect(signupSchema.safeParse({ email: "a@b.com", password: "abcdefgh" }).success).toBe(false);
  });

  it("accepts valid login credentials", () => {
    expect(loginSchema.safeParse({ email: "ada@empyrean.com", password: "hunter2-s3cret" }).success).toBe(true);
  });

  it("rejects login without a password", () => {
    expect(loginSchema.safeParse({ email: "ada@empyrean.com", password: "" }).success).toBe(false);
  });

  it("validates forgot-password emails", () => {
    expect(forgotPasswordSchema.safeParse({ email: "ada@empyrean.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });

  it("validates reset payloads (token required, password rules enforced)", () => {
    expect(
      resetPasswordSchema.safeParse({ token: "tok", password: "hunter2-s3cret" }).success,
    ).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "", password: "hunter2-s3cret" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "tok", password: "short" }).success).toBe(false);
  });
});
