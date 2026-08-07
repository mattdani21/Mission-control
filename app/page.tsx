export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-6 text-zinc-100">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Mission Control</h1>
      <p className="max-w-md text-center text-zinc-400">
        A single home base for marketing operations: brief a campaign once, co-write copy with AI,
        and send across email and social.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="https://github.com/mattdani21/Mission-control"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          View the runbook
        </a>
        <a
          href="/login"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          Sign in
        </a>
        <a
          href="/signup"
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-300"
        >
          Get started
        </a>
      </div>
    </main>
  );
}
