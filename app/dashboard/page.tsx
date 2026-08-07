import { redirect } from "next/navigation";

import { auth } from "../../auth";
import { LogoutButton } from "../../components/logout-button";

export const dynamic = "force-dynamic";

// Protected page: requires a valid Auth.js session. Unauthenticated visitors
// are bounced to /login before any dashboard content renders.
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const name = session.user.name;
  const email = session.user.email;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-6 text-zinc-100">
      <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
      <p className="max-w-md text-center text-zinc-400">
        {name ? (
          <>
            Signed in as <span className="text-zinc-200">{name}</span>{" "}
          </>
        ) : null}
        <span className="font-mono text-sm text-zinc-300">{email}</span>
      </p>
      <LogoutButton />
    </main>
  );
}
