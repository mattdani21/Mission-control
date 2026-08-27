"use client";

import { useEffect, useState } from "react";
import { Save, Users } from "lucide-react";

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
    <section className="mc-card mb-[18px] p-6" aria-labelledby={`strat-title-${slotId}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2
          id={`strat-title-${slotId}`}
          className="flex items-center gap-2 text-[13px] font-semibold text-ink"
        >
          Strategy &amp; grounding — {slot.brandName}
          <span className="flex items-center gap-1 rounded-md border border-line bg-surface-2 px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.06em] text-dim">
            <Users size={9} aria-hidden /> Human view · editable
          </span>
        </h2>
        <div className="flex items-center gap-2.5">
          {updatedAt ? (
            <span className="text-[10.5px] text-dim">
              last edited {new Date(updatedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
            </span>
          ) : null}
          <button
            type="button"
            className={`btn ${edited || saved ? "post" : "sched"} !px-4 !py-2 !text-[12px]`}
            onClick={save}
            disabled={!edited && !saved}
          >
            {saved ? "Saved ✓" : "Save"}
            {!saved ? <Save size={11} className="ml-1.5 inline" aria-hidden /> : null}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <div className="rounded-[var(--radius-s)] border border-line bg-surface-2 p-4">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-accent-ink">
            Brand Strategy
          </div>
          <p className="mb-2.5 text-[10.5px] leading-[1.45] text-mut">
            Researched strategy for the brand, tied in to company goals.
          </p>
          <textarea
            className="mc-textarea min-h-[120px] resize-y"
            value={brandStrategy}
            onChange={(e) => setBrandStrategy(e.target.value)}
            rows={6}
            aria-label={`${slot.brandName} brand strategy`}
          />
        </div>
        <div className="rounded-[var(--radius-s)] border border-line bg-surface-2 p-4">
          <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-accent-ink">
            Company Strat
          </div>
          <p className="mb-2.5 text-[10.5px] leading-[1.45] text-mut">
            Goals for the company.
          </p>
          <textarea
            className="mc-textarea min-h-[120px] resize-y"
            value={companyStrat}
            onChange={(e) => setCompanyStrat(e.target.value)}
            rows={6}
            aria-label={`${slot.brandName} company strategy`}
          />
        </div>
      </div>

      <p className="mt-3 text-[10.5px] leading-[1.5] text-dim">
        <b className="text-accent-ink">AI-agent grounding:</b> this human-edited strategy is what the agents read
        before they research and operate. Keep it current — the machine works from your words, not its own.
      </p>
    </section>
  );
}
