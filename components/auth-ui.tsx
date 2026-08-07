import type { ReactNode } from "react";

// Shared visual primitives for the auth pages — matches the landing page's
// dark zinc aesthetic. Pure presentational; safe to import from client pages.

export const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none";

export const buttonClass =
  "w-full rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-300 disabled:opacity-50";

export const errorClass = "mt-2 text-sm text-red-400";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12 text-zinc-100">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-zinc-400">{subtitle}</p> : null}
        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-6">{children}</div>
      </div>
    </main>
  );
}
