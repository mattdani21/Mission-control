"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Moon, Sun } from "lucide-react";

import {
  CHANNELS,
  STAGES,
  type BrandFilter,
  type GalleryItem,
  type PipeCard,
  type QueueEntry,
  type TimeScale,
} from "../../lib/mission-data";
import { SLOTS, SLOT_IDS, type SlotConfig, type SlotId } from "../../lib/slots";
import { LogoutButton } from "../logout-button";
import { createCampaign, scheduleSend, streamDraft, tomorrowNineSast } from "./api";
import { GenerateModal } from "./generate-modal";
import { KpiGrid } from "./kpi-grid";
import { CaptureCalendar, Gallery, Pipeline, TimeContext } from "./sections";
import { StrategyGrounding } from "./strategy-grounding";

type ActiveSlot = "all" | SlotId;

interface MissionControlProps {
  userName: string | null;
  userEmail: string | null;
  initialCampaigns: Array<{ id: string; title: string; brief: string; channel: string; status: string }>;
}

function buildPipeline(
  cfg: SlotConfig,
  initialCampaigns: MissionControlProps["initialCampaigns"],
): Record<string, PipeCard[]> {
  const draftCards: PipeCard[] = initialCampaigns.map((c) => ({
    title: c.title,
    sub: c.status === "draft" ? "draft · awaiting human editor" : c.status,
    tag: "ai",
    brand: "env",
  }));
  return {
    ...cfg.pipe,
    Draft: [...draftCards, ...(cfg.pipe.Draft ?? [])],
  };
}

function unionBy<T>(arrays: T[][], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const arr of arrays) {
    for (const item of arr) {
      const k = key(item);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(item);
      }
    }
  }
  return out;
}

/** ALL view: one headline KPI card per brand — honest portfolio, no invented sums. */
function portfolioGoals(): Record<TimeScale, import("../../lib/mission-data").Goal[]> {
  const cards = SLOT_IDS.map((sid) => {
    const headline = SLOTS[sid].goals.year[0]!;
    return { label: SLOTS[sid].label, value: headline.value, sub: headline.label, tone: headline.tone };
  });
  return { year: cards, quarter: cards, month: cards, week: cards, day: cards };
}

/** ALL view: merged capture calendar (dedup by label). */
function portfolioWindows() {
  return unionBy(SLOT_IDS.map((sid) => SLOTS[sid].windows), (w) => w.label);
}

function portfolioCamps() {
  return unionBy(SLOT_IDS.map((sid) => SLOTS[sid].camps), (c) => c.label);
}

function portfolioPipe(): Record<string, PipeCard[]> {
  const stages = ["Concept", "Draft", "Editor", "Approval", "Post ready"] as const;
  const merged: Record<string, PipeCard[]> = {};
  for (const stage of stages) {
    merged[stage] = unionBy(
      SLOT_IDS.map((sid) => SLOTS[sid].pipe[stage] ?? []),
      (c) => `${c.title}::${c.brand}`,
    );
  }
  return merged;
}

/** Resolve the active view: a brand's full platform, or the merged ALL view. */
function makeView(pick: ActiveSlot): SlotConfig {
  if (pick !== "all") return SLOTS[pick];
  return {
    ...SLOTS.envogue,
    label: "ALL",
    brandName: "All companies",
    logo: "/assets/all-logo.png",
    tagline: "Empyrean · full portfolio · every brand, same machine",
    composerDefault: "Portfolio view — pick a brand to compose for that brand.",
    timeContext: {
      year: "All companies · 12-month horizon",
      quarter: "Q4 · all brands",
      month: "Sep · all brands",
      week: "This week · all brands",
      day: "Today · all brands",
    },
    calHint: { year: "All companies", quarter: "Q4", month: "Sep", week: "Wk 1", day: "today" },
    goals: portfolioGoals(),
    windows: portfolioWindows(),
    camps: portfolioCamps(),
    pipe: portfolioPipe(),
    queue: unionBy(SLOT_IDS.map((sid) => SLOTS[sid].queue), (q) => `${q.tm}::${q.pt}::${q.tx}`),
    captionBank: SLOTS.envogue.captionBank,
    gallery: unionBy(SLOT_IDS.map((sid) => SLOTS[sid].gallery), (g) => g.key),
  };
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export default function MissionControl({ userName, userEmail, initialCampaigns }: MissionControlProps) {
  const [activeSlot, setActiveSlot] = useState<ActiveSlot>(() => {
    if (typeof window === "undefined") return "envogue";
    const saved = window.localStorage.getItem("mc-slot");
    return saved && (["all", ...SLOT_IDS] as string[]).includes(saved) ? (saved as ActiveSlot) : "envogue";
  });
  const [slotMenuOpen, setSlotMenuOpen] = useState(false);
  const isAll = activeSlot === "all";

  const view: SlotConfig = useMemo(() => makeView(activeSlot), [activeSlot]);

  const [scale, setScale] = useState<TimeScale>("year");
  const [brand, setBrand] = useState<BrandFilter>("all");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [panelOpen, setPanelOpen] = useState(true);

  const [composer, setComposer] = useState(view.composerDefault);
  const [targets, setTargets] = useState<string[]>(["IG Feed", "Reels", "TikTok", "Pinterest"]);
  const [recipient, setRecipient] = useState("");
  const [postState, setPostState] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [schedBusy, setSchedBusy] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>(view.queue);
  const [pipeline, setPipeline] = useState<Record<string, PipeCard[]>>(() => buildPipeline(view, initialCampaigns));
  const [gallery, setGallery] = useState<GalleryItem[]>(view.gallery);

  // Editor modal state.
  const [modal, setModal] = useState<{ item: GalleryItem; caption: string; stage: string; approved: boolean; posted: boolean } | null>(null);

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("mc-theme");
    const next: "dark" | "light" = saved === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
  }, []);

  const toggleTheme = () => {
    const next: "dark" | "light" = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    window.localStorage.setItem("mc-theme", next);
  };

  const toggleTarget = (channel: string) => {
    setTargets((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]));
  };

  const goals = useMemo(() => view.goals[scale], [view, scale]);

  const switchSlot = (pick: ActiveSlot) => {
    if (pick === activeSlot) return;
    window.localStorage.setItem("mc-slot", pick);
    setActiveSlot(pick);
    setSlotMenuOpen(false);
    setScale("year");
    setBrand("all");
    setModal(null);
    setGenerateOpen(false);
    const next = makeView(pick);
    setComposer(next.composerDefault);
    setQueue(next.queue);
    setGallery(next.gallery);
    setPipeline(buildPipeline(next, initialCampaigns));
    setPostState("");
  };

  useEffect(() => {
    if (!slotMenuOpen) return;
    // Listen on 'click', not 'mousedown': mousedown closes the menu and
    // unmounts the item buttons BEFORE their click can fire — the classic
    // 'toggle does nothing' bug. The menu + trigger stopPropagation on
    // click, so only true outside clicks reach the document listener.
    const onDocClick = () => setSlotMenuOpen(false);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [slotMenuOpen]);

  /* ── AI-adapt: real streaming call to POST /api/ai/draft ── */
  const handleAiAdapt = useCallback(async () => {
    if (aiBusy || !composer.trim()) return;
    setAiBusy(true);
    setPostState("");
    const prompt = `Adapt this marketing copy for ${targets.join(", ") || "social"}: keep the brand voice (clear, confident, human) and produce a sharp, platform-appropriate version.\n\n${composer}`;
    abortRef.current = new AbortController();
    let accumulated = "";
    try {
      setComposer("");
      await streamDraft(
        prompt,
        (delta) => {
          accumulated += delta;
          setComposer(accumulated);
          const el = composerRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        },
        abortRef.current.signal,
      );
      setPostState(`adapted for ${targets.length} platform${targets.length > 1 ? "s" : ""} ✓`);
    } catch (err) {
      setComposer((prev) => prev || accumulated);
      setPostState(err instanceof Error ? err.message : "AI draft failed");
    } finally {
      setAiBusy(false);
      abortRef.current = null;
    }
  }, [aiBusy, composer, targets]);

  /* ── Send to Draft: persists a real campaign row ── */
  const handleSendToDraft = useCallback(async () => {
    if (!composer.trim()) {
      setPostState("Write something first.");
      return;
    }
    const title = composer.trim().split("\n")[0]!.slice(0, 120);
    const channelMap: Record<string, string> = {
      "IG Feed": "ig",
      Reels: "ig",
      TikTok: "tiktok",
      Pinterest: "pinterest",
      "Meta Ads": "meta",
      Email: "email",
      WhatsApp: "whatsapp",
    };
    const channel = channelMap[targets[0] ?? ""] ?? "multi";
    try {
      const campaign = await createCampaign({ title, brief: composer.trim(), channel });
      setPostState("sent to Draft (pipeline) · campaign saved ✓");
      setPipeline((prev) => ({
        ...prev,
        Draft: [
          { title, sub: "AI draft → awaiting human editor", tag: "ai", brand: "env" },
          ...(prev.Draft ?? []),
        ],
      }));
      setQueue((prev) => [
        { tm: nowTime(), pt: (targets[0] ?? "IG").slice(0, 3).toUpperCase(), tx: composer.trim().slice(0, 58) },
        ...prev,
      ]);
      return campaign;
    } catch (err) {
      setPostState(err instanceof Error ? err.message : "Could not save campaign");
      return null;
    }
  }, [composer, targets]);

  /* ── Schedule: enqueues a real scheduled send (dev-mode offline) ── */
  const handleSchedule = useCallback(async () => {
    if (schedBusy) return;
    if (!composer.trim()) {
      setPostState("Write something first.");
      return;
    }
    if (!recipient.trim()) {
      setPostState("Add a recipient email to schedule a send.");
      return;
    }
    setSchedBusy(true);
    setPostState("");
    try {
      const subject = composer.trim().split("\n")[0]!.slice(0, 120);
      const html = composer
        .trim()
        .split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("");
      const scheduled = await scheduleSend({
        to: recipient.trim(),
        subject,
        html,
        scheduledFor: tomorrowNineSast(),
      });
      setPostState(`scheduled · ${new Date(scheduled.scheduledFor).toLocaleString()} ✓`);
    } catch (err) {
      setPostState(err instanceof Error ? err.message : "Could not schedule send");
    } finally {
      setSchedBusy(false);
    }
  }, [schedBusy, composer, recipient]);

  /* ── Generate: opens the Gemini pop-out (prompt → preview → add to gallery) ── */

  /* ── Pipeline: click to advance a card ── */
  const handleAdvance = useCallback(
    (stage: string, title: string) => {
      setPipeline((prev) => {
        const idx = STAGES.indexOf(stage as (typeof STAGES)[number]);
        if (idx < 0 || idx >= STAGES.length - 1) return prev;
        const nextStage = STAGES[idx + 1]!;
        const card = (prev[stage] ?? []).find((c) => c.title === title);
        if (!card) return prev;
        return {
          ...prev,
          [stage]: (prev[stage] ?? []).filter((c) => c.title !== title),
          [nextStage]: [...(prev[nextStage] ?? []), card],
        };
      });
    },
    [],
  );

  /* ── Editor modal actions ── */
  const closeModal = () => setModal(null);

  const approveModal = () => {
    setModal((prev) => (prev ? { ...prev, approved: true, stage: "Approval → Post ready" } : prev));
  };

  const postModal = () => {
    setModal((prev) => {
      if (!prev) return prev;
      setQueue((q) => [
        {
          tm: nowTime(),
          pt: "LIVE",
          tx: prev.caption.slice(0, 58),
        },
        ...q,
      ]);
      setPostState("posted ✓");
      return { ...prev, posted: true, stage: "Posted ✓" };
    });
  };

  const captionBank = view.captionBank;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-7">
      {/* ── header ── */}
      <header className="mc-header">
        <div className="flex min-w-0 items-center gap-[11px]">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-white shadow-[0_2px_8px_rgba(154,123,47,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={view.logo} alt={view.brandName} className="h-full w-full object-contain" />
          </div>
          <div className={panelOpen ? "min-w-0" : "hidden min-w-0"}>
            <h1 className="text-[16px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[19px]">
              Marketing Mission Control
            </h1>
            <span className="mt-0.5 block truncate text-[11.5px] text-mut">
              {view.tagline} · {userName ? `${userName} · ` : ""}
              <span className="font-mono text-[11px] text-mut">{userEmail}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
            aria-label={panelOpen ? "Collapse top panel" : "Expand top panel"}
            title={panelOpen ? "Collapse panel" : "Expand panel"}
            className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-mut transition-transform hover:scale-105 hover:text-ink"
          >
            {panelOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {panelOpen ? (
            <>
              <div className="relative" role="group" aria-label="Company">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlotMenuOpen((v) => !v);
                  }}
                  aria-expanded={slotMenuOpen}
                  aria-haspopup="menu"
                  className="flex h-[34px] cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[11px] font-semibold text-mut transition-colors hover:text-ink"
                  title="Toggle companies"
                >
                  <span className="text-accent-ink">{isAll ? "All companies" : `Full platform as ${view.brandName}`}</span>
                  <ChevronDown size={13} className={`transition-transform ${slotMenuOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {slotMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-line bg-surface-solid p-1.5 shadow-[var(--shadow-hover)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className={`block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-colors hover:bg-surface-2 ${
                        isAll ? "bg-surface-2 text-ink" : "text-mut"
                      }`}
                      onClick={() => switchSlot("all")}
                    >
                      All companies
                      <span className="block text-[10px] font-normal text-dim">full portfolio view</span>
                    </button>
                    {SLOT_IDS.map((sid) => (
                      <button
                        key={sid}
                        type="button"
                        role="menuitem"
                        className={`block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-colors hover:bg-surface-2 ${
                          activeSlot === sid ? "bg-surface-2 text-ink" : "text-mut"
                        }`}
                        onClick={() => switchSlot(sid)}
                      >
                        {SLOTS[sid].label}
                        <span className="block text-[10px] font-normal text-dim">
                          full platform as {SLOTS[sid].brandName}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="seg" role="group" aria-label="Brand filter">
                <button type="button" className={brand === "all" ? "on" : ""} onClick={() => setBrand("all")}>
                  ALL
                </button>
                <button type="button" className={brand === "env" ? "on" : ""} onClick={() => setBrand("env")}>
                  CLIENT
                </button>
                <button type="button" className={brand === "brand" ? "on" : ""} onClick={() => setBrand("brand")}>
                  PERSONAL
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-[5px]" aria-hidden>
                <span className="plat"><i className="ig" />IG</span>
                <span className="plat"><i className="tk" />TikTok</span>
                <span className="plat"><i className="pin" />Pin</span>
                <span className="plat"><i className="fb" />Meta</span>
                <span className="plat"><i className="em" />Mail</span>
                <span className="plat"><i className="wa" />WA</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-mut transition-transform hover:scale-105 hover:text-ink"
                title="Toggle appearance"
                aria-label="Toggle light or dark theme"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <LogoutButton />
            </>
          ) : null}
        </div>
      </header>

      {/* ── time horizon ── */}
      <div className="mb-4 mt-[18px] flex flex-wrap items-center justify-between gap-3">
        <div className="seg max-w-full overflow-x-auto" role="group" aria-label="Time horizon">
          {(["year", "quarter", "month", "week", "day"] as TimeScale[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`${scale === s ? "on" : ""} !px-3 !py-[7px] !text-[12px] !font-semibold sm:!px-5 sm:!text-[12.5px]`}
              onClick={() => setScale(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <TimeContext context={view.timeContext[scale]} />
      </div>

      {/* ── KPI cards ── */}
      <div className="mb-[18px]">
        <KpiGrid goals={goals} />
      </div>

      {/* ── strategy & grounding (human view — grounds AI agents) ── */}
      {isAll
        ? SLOT_IDS.map((sid) => <StrategyGrounding key={sid} slotId={sid} slot={SLOTS[sid]} />)
        : <StrategyGrounding slotId={activeSlot} slot={SLOTS[activeSlot]} />}

      {/* ── capture calendar ── */}
      <CaptureCalendar
        scale={scale}
        brand={brand}
        windows={view.windows}
        camps={view.camps}
        calHint={view.calHint[scale]}
      />

      {/* ── gallery ── */}
      <Gallery
        items={gallery}
        onOpen={(item) => setModal({ item, caption: item.cap, stage: "Draft → Editor", approved: false, posted: false })}
        onGenerate={() => setGenerateOpen(true)}
        generating={false}
      />

      {/* ── pipeline ── */}
      <Pipeline pipeline={pipeline} onAdvance={handleAdvance} />

      {/* ── composer + queue ── */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.3fr_1fr]">
        <section className="mc-card p-5" aria-labelledby="composer-title">
          <h2 id="composer-title" className="mb-3.5 flex items-center justify-between text-[13px] font-semibold text-ink">
            Compose once · publish everywhere
            <span className="text-[11px] font-medium normal-case text-dim">feeds the pipeline → draft</span>
          </h2>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {CHANNELS.map((channel) => (
              <button
                key={channel}
                type="button"
                className={`tg ${targets.includes(channel) ? "on" : ""}`}
                onClick={() => toggleTarget(channel)}
                aria-pressed={targets.includes(channel)}
              >
                <span className="d" aria-hidden />
                {channel}
              </button>
            ))}
          </div>
          <textarea
            ref={composerRef}
            className="mc-textarea"
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder="Write once — captions, hooks and formats adapt per platform…"
            rows={4}
          />
          <div className="my-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <button type="button" className="aibtn" onClick={handleAiAdapt} disabled={aiBusy || !composer.trim()}>
              {aiBusy ? "✦ adapting…" : "✦ AI-adapt for platform"}
            </button>
            <span className="text-[11px] text-mut">
              bank:{" "}
              {captionBank.map((cap) => (
                <b
                  key={cap.name}
                  className="cursor-pointer font-semibold text-accent-ink hover:underline"
                  onClick={() => {
                    setComposer(cap.text);
                    setPostState("");
                  }}
                >
                  {cap.name}
                  {cap !== captionBank[captionBank.length - 1] ? " · " : ""}
                </b>
              ))}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              className="mc-input w-full sm:w-64"
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Recipient email for scheduled send"
              aria-label="Recipient email for scheduled send"
            />
            <button type="button" className="btn sched" onClick={handleSchedule} disabled={schedBusy}>
              {schedBusy ? "Scheduling…" : "Schedule"}
            </button>
            <button type="button" className="btn post" onClick={() => void handleSendToDraft()}>
              Send to Draft →
            </button>
            <span className="ml-auto text-[11px] font-medium text-em">{postState}</span>
          </div>
        </section>

        <section className="mc-card p-5" aria-labelledby="queue-title">
          <h2 id="queue-title" className="mb-1 flex items-center justify-between text-[13px] font-semibold text-ink">
            Publish queue
            <span className="text-[11px] font-medium normal-case text-dim">all platforms · auto-scheduled</span>
          </h2>
          <div>
            {queue.map((entry, i) => (
              <div key={`${entry.tm}-${i}`} className={`qrow ${i === 0 ? "new" : ""}`}>
                <span className="w-16 flex-shrink-0 text-[12px] font-semibold tabular-nums text-accent-ink">{entry.tm}</span>
                <span className="w-[52px] flex-shrink-0 text-[10px] font-semibold tracking-[0.04em] text-mut">{entry.pt}</span>
                <span className="truncate text-[12px] text-mut">{entry.tx}</span>
                <span className="ml-auto flex-shrink-0 text-[10px] font-semibold text-em">✓</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-5 text-center text-[11px] text-dim">
        Pilot build — AI copy via DeepSeek v4-flash · images via Gemini 2.5 Flash Image · email via Resend. Human-in-the-loop: AI drafts, a human approves, only then it posts.
      </p>

      {/* ── Gemini generate pop-out ── */}
      <GenerateModal
        open={generateOpen}
        initialPrompt={view.defaultPrompt}
        onClose={() => setGenerateOpen(false)}
        onAdd={(item) => {
          setGenerateOpen(false);
          setGallery((prev) => [item, ...prev]);
          setModal({ item, caption: item.cap, stage: "Draft → Editor", approved: false, posted: false });
        }}
      />

      {/* ── editor modal ── */}
      {modal ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[8px] sm:p-6"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${modal.item.title}`}
        >
          <div
            className="grid max-h-[88vh] w-full max-w-[880px] grid-cols-1 overflow-y-auto rounded-3xl border border-line bg-surface-solid shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:grid-cols-[1fr_1.15fr]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative min-h-[220px] md:min-h-[380px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={modal.item.img}
                alt={modal.item.title}
                className="absolute inset-0 h-full w-full rounded-t-3xl object-cover md:rounded-l-3xl md:rounded-tr-none"
              />
              <span className="absolute left-3.5 top-3.5 rounded-[7px] border border-line bg-surface px-2.5 py-1 text-[9px] font-bold tracking-[0.06em] text-accent-ink backdrop-blur-[10px]">
                {modal.posted ? "LIVE" : modal.approved ? "HUMAN APPROVED" : modal.item.badge}
              </span>
            </div>
            <div className="flex flex-col p-7">
              <div className="mb-3.5 flex items-center justify-between">
                <div>
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-dim">
                    Pipeline: <em className="not-italic text-accent-ink">{modal.stage}</em>
                  </div>
                  <h3 className="text-[16px] font-bold tracking-[-0.01em] text-ink">{modal.item.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border border-line bg-surface-2 text-[13px] text-mut transition-all hover:rotate-90 hover:text-ink"
                  aria-label="Close editor"
                >
                  ✕
                </button>
              </div>
              <label className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-dim">
                Caption — edit before approval
              </label>
              <textarea
                className="mc-textarea !min-h-[88px] resize-y"
                value={modal.caption}
                onChange={(e) => setModal((prev) => (prev ? { ...prev, caption: e.target.value } : prev))}
                rows={4}
              />
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Publish targets">
                {["IG Feed", "Reels", "Pinterest"].map((t) => (
                  <span key={t} className="tg on">
                    <span className="d" aria-hidden />
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-[7px] text-[10.5px] text-mut">
                <span className="flex h-3 items-end gap-0.5" aria-hidden>
                  {[5, 9, 6, 11, 7].map((h, i) => (
                    <i key={i} className="w-[3px] animate-pulse rounded-[2px] bg-accent" style={{ height: h }} />
                  ))}
                </span>
                AI suggested 3 caption variants — human edits here, then approves
              </div>
              <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
                <button type="button" className="btn ghost" onClick={closeModal}>
                  ← Send back
                </button>
                {!modal.approved ? (
                  <button type="button" className="btn post" onClick={approveModal}>
                    Approve & advance →
                  </button>
                ) : null}
                {modal.approved && !modal.posted ? (
                  <button type="button" className="btn post" onClick={postModal}>
                    Post now →
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-[10.5px] leading-[1.5] text-dim">
                <b className="text-accent-ink">Human-in-the-loop:</b> AI generates the synthetic asset · a human edits
                and approves · only then it posts. UGC and reminders flow the same gate.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
