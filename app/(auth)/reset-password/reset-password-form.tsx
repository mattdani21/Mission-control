"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthCard, buttonClass, errorClass, inputClass } from "../../../components/auth-ui";

export function ResetPasswordForm({ initialToken }: { initialToken: string }) {
  const router = useRouter();
  const [token] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not reset your password.");
        return;
      }
      setMessage(data.message ?? "Password updated.");
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Could not reset your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Use a password you don't use anywhere else.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-zinc-400">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            placeholder="8+ characters, with letters and numbers"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm text-zinc-400">
            Confirm new password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className={inputClass}
            placeholder="Repeat your new password"
          />
        </div>
        {error ? <p className={errorClass}>{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-zinc-300">{message}</p> : null}
        <button type="submit" disabled={submitting} className={buttonClass}>
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-400">
        <Link href="/login" className="hover:text-zinc-200">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
