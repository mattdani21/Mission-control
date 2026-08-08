"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthCard, buttonClass, errorClass, inputClass } from "../../../components/auth-ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    setDevResetUrl(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        devResetUrl?: string | null;
      };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setMessage(data.message ?? "If an account exists, a reset link has been sent.");
      // Shown only when the API explicitly returns it (non-production builds).
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a link to set a new one.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-zinc-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            placeholder="you@empyrean.com"
          />
        </div>
        {error ? <p className={errorClass}>{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-zinc-300">{message}</p> : null}
        {devResetUrl ? (
          <p className="mt-2 break-all text-xs text-zinc-500">
            Local dev reset link: <a href={devResetUrl} className="text-zinc-400 underline">{devResetUrl}</a>
          </p>
        ) : null}
        <button type="submit" disabled={submitting} className={buttonClass}>
          {submitting ? "Sending…" : "Send reset link"}
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
