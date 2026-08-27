import { CalendarRange, Github, Layers, Send, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-9 overflow-hidden px-6 py-20 sm:gap-10 sm:py-24">
      {/* Soft accent aurora behind the hero — decoration only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-140px] h-[340px] w-[560px] -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] blur-[110px]"
      />

      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.35),0_2px_12px_rgba(154,123,47,0.4)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/envogue-logo.jpg" alt="Envogue" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="bg-gradient-to-b from-ink to-dim bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Mission Control
          </h1>
          <p className="text-[13px] leading-relaxed text-mut sm:text-sm">
            Empyrean Consult · plan the year · capture the market · publish everywhere
          </p>
        </div>
      </div>

      <p className="max-w-xl text-center text-base leading-relaxed text-mut text-pretty">
        The marketing-operations hub for the Dance Countdown season: plan capture windows, brief
        campaigns once, co-write copy with AI, generate hero looks, and schedule sends — with a
        human approval gate on everything that ships.
      </p>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CalendarRange, title: "Capture calendar", sub: "Matric 2026 · July · Met" },
          { icon: Layers, title: "Pipeline", sub: "Winner → Test map → Post ready" },
          { icon: Sparkles, title: "AI copy + images", sub: "DeepSeek · Gemini" },
          { icon: Send, title: "Scheduled sends", sub: "Email queue with webhook events" },
        ].map((f) => (
          <div
            key={f.title}
            className="mc-card group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_16px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-accent-soft text-accent-ink transition-colors duration-200 group-hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]">
              <f.icon size={15} strokeWidth={1.75} />
            </div>
            <div className="text-[13px] font-semibold text-ink">{f.title}</div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-mut">{f.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="/signup"
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-[#14100a] shadow-[0_2px_10px_color-mix(in_srgb,var(--accent)_40%,transparent)] transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
        >
          Get started
        </a>
        <a
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line px-6 py-2.5 text-sm text-mut transition-all duration-200 hover:border-dim hover:bg-surface-2 hover:text-ink active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
        >
          Sign in
        </a>
        <a
          href="https://github.com/mattdani21/Mission-control"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line px-6 py-2.5 text-sm text-mut transition-all duration-200 hover:border-dim hover:bg-surface-2 hover:text-ink active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
        >
          <Github size={14} aria-hidden />
          View the runbook
        </a>
      </div>

      <p className="max-w-md text-center text-[11px] leading-relaxed text-dim">
        Pilot build for the Envogue owner — Dance Countdown 2026. Human-in-the-loop: AI drafts, a human approves, only
        then it posts.
      </p>
    </main>
  );
}
