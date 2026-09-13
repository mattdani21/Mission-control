"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0b] px-6 py-20 text-[#f5f5f7]">
        <main className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-3 text-sm text-[#a1a1a6]">
            The error has been recorded. Try again, or return to the landing page.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-[#d4a44c] px-5 py-2 text-sm font-semibold text-[#14100a]"
            >
              Try again
            </button>
            <Link href="/" className="rounded-xl border border-white/10 px-5 py-2 text-sm text-[#a1a1a6]">
              Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
