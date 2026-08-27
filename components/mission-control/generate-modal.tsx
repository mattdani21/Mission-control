"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

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
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[8px] sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Generate a new look with Gemini"
    >
      <div className="grid max-h-[90vh] w-full max-w-[880px] grid-cols-1 overflow-y-auto rounded-3xl border border-line bg-surface-solid shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:grid-cols-[1fr_1.15fr]">
        {/* ── preview / result panel ── */}
        <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden bg-black/30 md:min-h-[420px]">
          {result ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.image}
              alt="Generated look preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface-2 text-accent-ink ${
                  busy ? "animate-pulse" : ""
                }`}
                aria-hidden
              >
                <Sparkles size={20} />
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
            <span className="absolute bottom-3 left-3 rounded-md border border-line bg-surface px-2 py-1 text-[9.5px] font-bold tracking-[0.05em] text-accent-ink backdrop-blur-[10px]">
              AI · GENERATING
            </span>
          ) : null}
          {result && !busy ? (
            <span className="absolute left-3 top-3 rounded-md border border-line bg-surface px-2.5 py-1 text-[9px] font-bold tracking-[0.06em] text-accent-ink backdrop-blur-[10px]">
              AI · GENERATED · {result.model}
            </span>
          ) : null}
        </div>

        {/* ── controls panel ── */}
        <div className="flex flex-col p-6 sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-dim">
                Gemini 2.5 Flash Image · ~$0.04/img
              </div>
              <h3 className="text-[16px] font-bold tracking-[-0.01em] text-ink">Generate new look</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border border-line bg-surface-2 text-[13px] text-mut transition-all hover:rotate-90 hover:text-ink disabled:cursor-default disabled:opacity-40"
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
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Prompt helpers">
            {["Corseted Column — emerald", "Liquid Metallic — champagne", "Cape Moment — burgundy", "Minimalist Slip — chocolate"].map(
              (hint) => (
                <button
                  key={hint}
                  type="button"
                  className="tg"
                  onClick={() => setPrompt(`Editorial fashion photograph, ${hint.toLowerCase()}, South African model, golden hour on Camps Bay beach, Vogue editorial style, full body, natural relaxed hands with five visible fingers`)}
                >
                  {hint}
                </button>
              ),
            )}
          </div>

          {error ? (
            <div className="mt-3 rounded-lg border border-rd/40 bg-rd/10 px-3 py-2 text-[11.5px] leading-snug text-rd" role="alert">
              {error}
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

          <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
            <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            {result && !busy ? (
              <>
                <button type="button" className="btn ghost" onClick={() => void handleGenerate()}>
                  ↻ Regenerate
                </button>
                <button type="button" className="btn post" onClick={handleAdd}>
                  Add to gallery →
                </button>
              </>
            ) : (
              <button type="button" className="btn post" onClick={() => void handleGenerate()} disabled={busy}>
                {busy ? "Generating…" : "✦ Generate"}
              </button>
            )}
          </div>

          <p className="mt-3 text-[10.5px] leading-[1.5] text-dim">
            <b className="text-accent-ink">Human-in-the-loop:</b> what you add still passes the approve gate before it
            posts. AI lookbook assets are labelled <em>#AIlookbook</em> — never mixed with real UGC in one frame.
          </p>
        </div>
      </div>
    </div>
  );
}
