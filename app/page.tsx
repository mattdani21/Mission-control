import { CalendarRange, Layers, Send, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-20">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(154,123,47,0.4)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/envogue-logo.jpg" alt="Envogue" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Envogue — Mission Control
          </h1>
          <p className="text-sm text-mut">Empyrean Consult · plan the year · capture the market · publish everywhere</p>
        </div>
      </div>

      <p className="max-w-xl text-center text-base leading-relaxed text-mut">
        The marketing-operations hub for the Dance Countdown season: plan capture windows, brief
        campaigns once, co-write copy with AI, generate hero looks, and schedule sends — with a
        human approval gate on everything that ships.
      </p>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CalendarRange, title: "Capture calendar", sub: "Matric 2026 · July · Met" },
          { icon: Layers, title: "Pipeline", sub: "Concept → Post ready" },
          { icon: Sparkles, title: "AI copy + images", sub: "DeepSeek · Gemini" },
          { icon: Send, title: "Scheduled sends", sub: "Email queue with webhook events" },
        ].map((f) => (
          <div key={f.title} className="mc-card p-4">
            <f.icon size={16} className="mb-2 text-accent-ink" />
            <div className="text-[13px] font-semibold text-ink">{f.title}</div>
            <div className="text-[11px] text-mut">{f.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="/signup"
          className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-[#14100a] shadow-[0_2px_10px_color-mix(in_srgb,var(--accent)_40%,transparent)] transition-all hover:-translate-y-px hover:brightness-110"
        >
          Get started
        </a>
        <a
          href="/login"
          className="rounded-xl border border-line px-6 py-2.5 text-sm text-mut transition-colors hover:border-dim hover:text-ink"
        >
          Sign in
        </a>
        <a
          href="https://github.com/mattdani21/Mission-control"
          className="rounded-xl border border-line px-6 py-2.5 text-sm text-mut transition-colors hover:border-dim hover:text-ink"
        >
          View the runbook
        </a>
      </div>

      <p className="text-center text-[11px] text-dim">
        Pilot build for the Envogue owner — Dance Countdown 2026. Human-in-the-loop: AI drafts, a human approves, only
        then it posts.
      </p>
    </main>
  );
}
