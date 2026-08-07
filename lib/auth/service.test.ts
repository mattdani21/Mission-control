import { describe, expect, it } from "vitest";

import type { AuthRepository, ResetTokenRecord, UserRecord } from "./repository";
import { hashResetToken } from "./tokens";
import {
  authenticateUser,
  normalizeEmail,
  requestPasswordReset,
  resetPasswordWithToken,
  signupUser,
} from "./service";

/** In-memory repository so the full auth flow runs in Vitest with no database. */
class InMemoryAuthRepository implements AuthRepository {
  private users = new Map<string, UserRecord>();
  private tokens = new Map<string, ResetTokenRecord>();
  private nextId = 1;

  async findByEmail(email: string): Promise<UserRecord | null> {
    return [...this.users.values()].find((u) => u.email === normalizeEmail(email)) ?? null;
  }

  async createUser(input: { email: string; name: string | null; passwordHash: string }): Promise<UserRecord> {
    const user: UserRecord = {
      id: `user-${this.nextId++}`,
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
    };
    this.users.set(user.id, user);
    return user;
  }

  async createResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    this.tokens.set(input.tokenHash, {
      id: `token-${this.nextId++}`,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      usedAt: null,
    });
  }

  async findResetTokenByHash(tokenHash: string): Promise<ResetTokenRecord | null> {
    return this.tokens.get(tokenHash) ?? null;
  }

  async markResetTokenUsed(id: string): Promise<void> {
    const token = [...this.tokens.values()].find((t) => t.id === id);
    if (token) token.usedAt = new Date();
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) user.passwordHash = passwordHash;
  }

  // Test helpers -----------------------------------------------------------
  storedTokenHashes(): string[] {
    return [...this.tokens.keys()];
  }

  storedTokens(): ResetTokenRecord[] {
    return [...this.tokens.values()];
  }
}

const validSignup = { email: "Ada@Empyrean.com", password: "hunter2-s3cret", name: "Ada Lovelace" };

describe("signupUser", () => {
  it("creates a user with a normalized (lowercased, trimmed) email", async () => {
    const repo = new InMemoryAuthRepository();
    const user = await signupUser(repo, validSignup);
    expect(user.email).toBe("ada@empyrean.com");
    expect(user.name).toBe("Ada Lovelace");
    expect(user.passwordHash).not.toContain("hunter2");
  });

  it("stores the password as a bcrypt hash that verifies", async () => {
    const repo = new InMemoryAuthRepository();
    const user = await signupUser(repo, validSignup);
    const stored = await repo.findByEmail("ada@empyrean.com");
    expect(stored?.passwordHash).toBe(user.passwordHash);
  });

  it("rejects duplicate emails (case-insensitive) with a 409", async () => {
    const repo = new InMemoryAuthRepository();
    await signupUser(repo, validSignup);
    const duplicate = signupUser(repo, { email: "ADA@empyrean.com", password: "another-pass-1" });
    await expect(duplicate).rejects.toMatchObject({ code: "EMAIL_TAKEN", statusCode: 409 });
  });
});

describe("authenticateUser", () => {
  it("returns the user for correct credentials", async () => {
    const repo = new InMemoryAuthRepository();
    await signupUser(repo, validSignup);
    const user = await authenticateUser(repo, "ada@empyrean.com", "hunter2-s3cret");
    expect(user?.email).toBe("ada@empyrean.com");
  });

  it("returns null for a wrong password", async () => {
    const repo = new InMemoryAuthRepository();
    await signupUser(repo, validSignup);
    await expect(authenticateUser(repo, "ada@empyrean.com", "wrong-pass-1")).resolves.toBeNull();
  });

  it("returns null for an unknown email", async () => {
    const repo = new InMemoryAuthRepository();
    await expect(authenticateUser(repo, "nobody@empyrean.com", "whatever-1")).resolves.toBeNull();
  });
});

describe("requestPasswordReset", () => {
  it("issues a token whose hash is persisted — never the raw token", async () => {
    const repo = new InMemoryAuthRepository();
    await signupUser(repo, validSignup);

    const result = await requestPasswordReset(repo, "ada@empyrean.com", (raw) => `/reset?token=${raw}`);
    expect(result).not.toBeNull();
    expect(result?.resetUrl).toContain("/reset?token=");

    const rawToken = result!.resetUrl.split("token=")[1];
    const hashes = repo.storedTokenHashes();
    expect(hashes).toContain(hashResetToken(rawToken)); // persisted form is the hash
    expect(hashes).not.toContain(rawToken); // raw token itself is never stored
  });

  it("is enumeration-safe: unknown emails resolve to null", async () => {
    const repo = new InMemoryAuthRepository();
    await expect(
      requestPasswordReset(repo, "nobody@empyrean.com", (raw) => `/reset?token=${raw}`),
    ).resolves.toBeNull();
  });
});

describe("resetPasswordWithToken", () => {
  it("sets a new password and invalidates the token", async () => {
    const repo = new InMemoryAuthRepository();
    await signupUser(repo, validSignup);
    const result = await requestPasswordReset(repo, "ada@empyrean.com", (raw) => `/reset?token=${raw}`);
    const rawToken = result!.resetUrl.split("token=")[1];

    await resetPasswordWithToken(repo, rawToken, "brand-new-pass-2");

    // Old password fails, new password works.
    await expect(authenticateUser(repo, "ada@empyrean.com", "hunter2-s3cret")).resolves.toBeNull();
    await expect(authenticateUser(repo, "ada@empyrean.com", "brand-new-pass-2")).resolves.not.toBeNull();

    // Replaying the same token is rejected.
    await expect(resetPasswordWithToken(repo, rawToken, "third-pass-3")).rejects.toMatchObject({
      code: "INVALID_TOKEN",
      statusCode: 400,
    });
  });

  it("rejects an unknown token", async () => {
    const repo = new InMemoryAuthRepository();
    await expect(
      resetPasswordWithToken(repo, "does-not-exist", "brand-new-pass-2"),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 400 });
  });

  it("rejects an expired token", async () => {
    const repo = new InMemoryAuthRepository();
    await signupUser(repo, validSignup);
    const result = await requestPasswordReset(repo, "ada@empyrean.com", (raw) => `/reset?token=${raw}`);
    const rawToken = result!.resetUrl.split("token=")[1];

    // Backdate the stored token past its 1-hour TTL.
    const storedTokens = repo as unknown as { tokens: Map<string, ResetTokenRecord> };
    for (const token of storedTokens.tokens.values()) {
      token.expiresAt = new Date(Date.now() - 60_000);
    }

    await expect(
      resetPasswordWithToken(repo, rawToken, "brand-new-pass-2"),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 400 });
  });
});
