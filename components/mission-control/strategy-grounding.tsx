"use client";

import { useEffect, useState } from "react";
import { Bot, Check, Clock, Save, Users } from "lucide-react";

import type { SlotConfig, SlotId } from "../../lib/slots";

/**
 * Human View — the editable strategy layer (per the founder's wireframe).
 *
 * Company Strat (goals for the company) + Brand Strategy (researched
 * strategy tied to those goals) are human-editable and persist per brand.
 * This content is the research & ops grounding AI agents work from:
 * agents read it, humans edit it, everything else executes against it.
 */

const STORE_KEY = (id: SlotId) => `mc-strat-${id}`;

interface StoredStrat {
  companyStrat: string;
  brandStrategy: string;
  updatedAt: string;
}

function loadStored(id: SlotId): StoredStrat | null {
  try {
    const raw = window.localStorage.getItem(STORE_KEY(id));
    return raw ? (JSON.parse(raw) as StoredStrat) : null;
  } catch {
    return null;
  }
}

export function StrategyGrounding({ slotId, slot }: { slotId: SlotId; slot: SlotConfig }) {
  const [companyStrat, setCompanyStrat] = useState(slot.companyStrat);
  const [brandStrategy, setBrandStrategy] = useState(slot.brandStrategy);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadStored(slotId);
    setCompanyStrat(stored?.companyStrat ?? slot.companyStrat);
    setBrandStrategy(stored?.brandStrategy ?? slot.brandStrategy);
    setUpdatedAt(stored?.updatedAt ?? null);
    setSaved(false);
  }, [slotId, slot]);

  const save = () => {
    const record: StoredStrat = {
      companyStrat,
      brandStrategy,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORE_KEY(slotId), JSON.stringify(record));
    setUpdatedAt(record.updatedAt);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const edited = companyStrat !== slot.companyStrat || brandStrategy !== slot.brandStrategy;

  return (
    <section className="mc-card mb-[18px] p-5 sm:p-6" aria-labelledby={`strat-title-${slotId}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2
          id={`strat-title-${slotId}`}
          className="flex items-center gap-2.5 text-[13px] font-semibold text-ink"
        >
          Strategy &amp; grounding — {slot.brandName}
          <span className="flex items-center gap-1 rounded-md border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-accent-soft px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.06em] text-accent-ink">
            <Users size={9} aria-hidden /> Human view · editable
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {updatedAt ? (
            <span className="flex items-center gap-1.5 text-[10.5px] tabular-nums text-dim">
              <Clock size={11} aria-hidden />
              last edited{" "}
              <span className="text-mut">
                {new Date(updatedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
              </span>
            </span>
          ) : null}
          <button
            type="button"
            className={`btn !px-4 !py-2 !text-[12px] ${
              saved
                ? "border border-[color-mix(in_srgb,var(--em)_45%,transparent)] bg-[color-mix(in_srgb,var(--em)_10%,transparent)] text-em hover:bg-[color-mix(in_srgb,var(--em)_16%,transparent)]"
                : edited
                  ? "post"
                  : "sched"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)] disabled:cursor-default disabled:opacity-60`}
            onClick={save}
            disabled={!edited && !saved}
          >
            {saved ? "Saved ✓" : "Save"}
            {saved ? (
              <Check size={11} className="ml-1.5 inline" aria-hidden />
            ) : (
              <Save size={11} className="ml-1.5 inline" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <div className="rounded-[var(--radius-s)] border border-line bg-surface-2 p-4 transition-colors duration-200 focus-within:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-accent-ink">
              Brand Strategy
            </span>
          </div>
          <p className="mb-2.5 text-[10.5px] leading-[1.45] text-mut">
            Researched strategy for the brand, tied in to company goals.
          </p>
          <textarea
            className="mc-textarea min-h-[132px] resize-y font-mono !text-[12.5px] leading-[1.65]"
            value={brandStrategy}
            onChange={(e) => setBrandStrategy(e.target.value)}
            rows={6}
            aria-label={`${slot.brandName} brand strategy`}
          />
        </div>
        <div className="rounded-[var(--radius-s)] border border-line bg-surface-2 p-4 transition-colors duration-200 focus-within:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-accent-ink">
              Company Strat
            </span>
          </div>
          <p className="mb-2.5 text-[10.5px] leading-[1.45] text-mut">
            Goals for the company.
          </p>
          <textarea
            className="mc-textarea min-h-[132px] resize-y font-mono !text-[12.5px] leading-[1.65]"
            value={companyStrat}
            onChange={(e) => setCompanyStrat(e.target.value)}
            rows={6}
            aria-label={`${slot.brandName} company strategy`}
          />
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-[10.5px] leading-[1.55] text-dim">
        <Bot size={12} className="mt-px shrink-0 text-accent-ink opacity-80" aria-hidden />
        <span>
          <b className="font-semibold text-accent-ink">AI-agent grounding:</b> this human-edited strategy is what the agents read
          before they research and operate. Keep it current — the machine works from your words, not its own.
        </span>
      </p>
    </section>
  );
}
