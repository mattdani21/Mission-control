"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Sparkles, X } from "lucide-react";

import type { GalleryItem } from "../../lib/mission-data";
import { generateImage } from "./api";

/** Gemini-style pop-out: prompt → generate → preview → add to gallery. */
export function GenerateModal({
  open,
  initialPrompt,
  onClose,
  onAdd,
}: {
  open: boolean;
  initialPrompt: string;
  onClose: () => void;
  onAdd: (item: GalleryItem) => void;
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ image: string; model: string } | null>(null);
  const [caption, setCaption] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setPrompt(initialPrompt);
      setResult(null);
      setError(null);
      setBusy(false);
      setCaption("");
      // Focus the prompt box after the overlay mounts.
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open, initialPrompt]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Write a prompt first — describe the look, fabric, and setting.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await generateImage(trimmed);
      setResult({ image: res.image, model: res.model });
      setCaption(trimmed.slice(0, 160));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () => {
    if (!result) return;
    onAdd({
      key: `gen-${Date.now()}`,
      img: result.image,
      badge: "AI · GENERATED",
      title: "Generated look",
      cap: caption.trim() || prompt.trim().slice(0, 160),
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-[10px] sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Generate a new look with Gemini"
    >
      {/* Bottom sheet on mobile, centered dialog from sm up. */}
      <div className="grid max-h-[92dvh] w-full max-w-[880px] grid-cols-1 overflow-y-auto rounded-t-3xl border border-line bg-surface-solid pb-[env(safe-area-inset-bottom)] shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)] sm:max-h-[90vh] sm:rounded-3xl sm:pb-0 md:grid-cols-[1fr_1.15fr]">
        {/* ── preview / result panel ── */}
        <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-black/30 md:min-h-[420px]">
          {result ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.image}
                alt="Generated look preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Scrim keeps the badge legible over bright imagery. */}
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent"
                aria-hidden
              />
            </>
          ) : (
            <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line/80 px-6 py-8 text-center">
              <span
                className={`relative flex h-12 w-12 items-center justify-center rounded-full border ${
                  busy
                    ? "border-[color-mix(in_srgb,var(--brand-accent,var(--accent))_45%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent,var(--accent))_10%,transparent)]"
                    : "border-line bg-surface-2"
                }`}
                aria-hidden
              >
                {busy ? (
                  <span
                    className="absolute inset-0 animate-ping rounded-full bg-[color-mix(in_srgb,var(--brand-accent,var(--accent))_20%,transparent)]"
                    aria-hidden
                  />
                ) : null}
                <Sparkles
                  size={20}
                  className={`${busy ? "relative animate-pulse text-[color:var(--brand-accent,var(--accent))]" : "text-accent-ink"}`}
                />
              </span>
              <div className="text-[12.5px] font-semibold text-ink">
                {busy ? "Gemini is generating… (10–20s)" : "Your look appears here"}
              </div>
              <div className="max-w-[30ch] text-[11px] leading-relaxed text-mut">
                {busy
                  ? "Nano Banana is painting the fabric, the light, and the moment."
                  : "Describe the gown, the fabric, the setting — then hit Generate."}
              </div>
            </div>
          )}
          {busy && result ? (
            <span className="absolute bottom-3 left-3 rounded-md border border-line bg-surface px-2 py-1 text-[9.5px] font-bold tracking-[0.05em] text-accent-ink shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-[10px]">
              AI · GENERATING
            </span>
          ) : null}
          {result && !busy ? (
            <span className="absolute left-3 top-3 rounded-md border border-line bg-surface px-2.5 py-1 text-[9px] font-bold tracking-[0.06em] text-accent-ink shadow-[0_2px_8px_rgba(0,0,0,0.35)] backdrop-blur-[10px]">
              AI · GENERATED · {result.model}
            </span>
          ) : null}
        </div>

        {/* ── controls panel ── */}
        <div className="flex flex-col p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-3 border-b border-line pb-4">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-dim">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-accent,var(--accent))] shadow-[0_0_6px_color-mix(in_srgb,var(--brand-accent,var(--accent))_60%,transparent)]"
                  aria-hidden
                />
                Gemini 2.5 Flash Image · ~$0.04/img
              </div>
              <h3 className="text-[16px] font-bold tracking-[-0.01em] text-ink">Generate new look</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface-2 text-[13px] text-mut transition-all duration-200 hover:rotate-90 hover:border-dim hover:text-ink disabled:cursor-default disabled:opacity-40"
              aria-label="Close generator"
            >
              <X size={14} />
            </button>
          </div>

          <label className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-dim" htmlFor="gen-prompt">
            Prompt
          </label>
          <textarea
            id="gen-prompt"
            ref={textareaRef}
            className="mc-textarea min-h-[110px] resize-y"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Editorial fashion photograph, champagne satin gown, South African model, golden hour on Camps Bay beach…"
          />
          <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Prompt helpers">
            {["Corseted Column — emerald", "Liquid Metallic — champagne", "Cape Moment — burgundy", "Minimalist Slip — chocolate"].map(
              (hint) => (
                <button
                  key={hint}
                  type="button"
                  className="tg cursor-pointer transition-all duration-150 hover:border-[color:var(--brand-accent,var(--accent))] hover:bg-[color-mix(in_srgb,var(--brand-accent,var(--accent))_12%,transparent)] hover:text-[color:var(--brand-accent,var(--accent))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)] active:scale-[0.97]"
                  onClick={() => setPrompt(`Editorial fashion photograph, ${hint.toLowerCase()}, South African model, golden hour on Camps Bay beach, Vogue editorial style, full body, natural relaxed hands with five visible fingers`)}
                >
                  <Sparkles size={10} className="shrink-0 opacity-60" aria-hidden />
                  {hint}
                </button>
              ),
            )}
          </div>

          {error ? (
            <div
              className="mt-3 flex items-start gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--rd)_35%,transparent)] bg-[color-mix(in_srgb,var(--rd)_10%,transparent)] px-3.5 py-2.5 text-[11.5px] leading-snug text-rd"
              role="alert"
            >
              <AlertCircle size={13} className="mt-px shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          ) : null}

          {result && !busy ? (
            <div className="mt-3">
              <label className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-dim" htmlFor="gen-caption">
                Caption — edit before adding
              </label>
              <textarea
                id="gen-caption"
                className="mc-textarea !min-h-[64px] resize-y"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
              />
            </div>
          ) : null}

          <div className="mt-[18px] flex flex-col gap-3 md:mt-auto md:pt-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                className="btn ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </button>
              {result && !busy ? (
                <>
                  <button
                    type="button"
                    className="btn ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                    onClick={() => void handleGenerate()}
                  >
                    ↻ Regenerate
                  </button>
                  <button
                    type="button"
                    className="btn post bg-[var(--brand-accent,var(--accent))] shadow-[0_2px_10px_color-mix(in_srgb,var(--brand-accent,var(--accent))_40%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-accent,var(--accent))_55%,transparent)]"
                    onClick={handleAdd}
                  >
                    Add to gallery →
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn post bg-[var(--brand-accent,var(--accent))] shadow-[0_2px_10px_color-mix(in_srgb,var(--brand-accent,var(--accent))_40%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-accent,var(--accent))_55%,transparent)]"
                  onClick={() => void handleGenerate()}
                  disabled={busy}
                >
                  {busy ? "Generating…" : "✦ Generate"}
                </button>
              )}
            </div>

            <p className="text-[10.5px] leading-[1.5] text-dim">
              <b className="text-accent-ink">Human-in-the-loop:</b> what you add still passes the approve gate before it
              posts. AI lookbook assets are labelled <em>#AIlookbook</em> — never mixed with real UGC in one frame.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
