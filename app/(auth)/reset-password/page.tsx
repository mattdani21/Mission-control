import Link from "next/link";

import { ResetPasswordForm } from "./reset-password-form";

export const dynamic = "force-dynamic";

// Server wrapper that reads the one-time token from the URL and hands it to
// the client form. Keeps useSearchParams out of the client tree (no Suspense
// ceremony) and lets the form treat the token as a hidden field.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold tracking-tight">Invalid reset link</h1>
          <p className="mt-2 text-sm text-zinc-400">
            This link is missing its token. Request a new one below.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-block rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300"
          >
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return <ResetPasswordForm initialToken={token} />;
}
