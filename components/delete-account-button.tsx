"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function DeleteAccountButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (busy) return;
    const confirmed = window.confirm(
      "Permanently delete this account, its campaigns, scheduled sends and AI usage? This cannot be undone.",
    );
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Request failed (${response.status})`);
      }
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the account.");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={busy}
        className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
      >
        {busy ? "Deleting…" : "Delete account"}
      </button>
      {error ? <span className="max-w-[16rem] text-right text-[11px] text-red-400">{error}</span> : null}
    </span>
  );
}
