"use client";

import { useState } from "react";
import { BookOpenCheck, LogIn, Plus } from "lucide-react";

import { CHANNELS, type DecisionEntry, type ReportEntry } from "../../lib/mission-data";

/**
 * Campaign brain memory — the decision log (current state, proposed action,
 * source, rollback plan, approve/edit/reject) and dated channel reports.
 * Human-editable, persisted per slot; approvals auto-log from the editor gate.
 */
export function CampaignMemory({
  decisions,
  reports,
  onAddDecision,
  onAddReport,
}: {
  decisions: DecisionEntry[];
  reports: ReportEntry[];
  onAddDecision: (d: DecisionEntry) => void;
  onAddReport: (r: ReportEntry) => void;
}) {
  const [showDecision, setShowDecision] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [action, setAction] = useState("");
  const [source, setSource] = useState("");
  const [rollback, setRollback] = useState("");
  const [decision, setDecision] = useState<DecisionEntry["decision"]>("approve");
  const [reportChannel, setReportChannel] = useState(CHANNELS[0]!);
  const [summary, setSummary] = useState("");

  const submitDecision = () => {
    if (!action.trim()) return;
    onAddDecision({
      ts: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      action: action.trim(),
      state: decision === "approve" ? "Approved" : decision === "edit" ? "Sent back" : "Rejected",
      source: source.trim() || "manual entry",
      rollback: rollback.trim() || "—",
      decision,
    });
    setAction("");
    setSource("");
    setRollback("");
    setShowDecision(false);
  };

  const submitReport = () => {
    if (!summary.trim()) return;
    onAddReport({
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      channel: reportChannel,
      summary: summary.trim(),
    });
    setSummary("");
    setShowReport(false);
  };

  const tone = (d: DecisionEntry["decision"]) =>
    d === "approve" ? "text-em" : d === "edit" ? "text-am" : "text-rd";

  return (
    <section className="mb-[18px]" aria-label="Campaign memory">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <BookOpenCheck size={14} aria-hidden className="text-[color:var(--brand-accent,var(--accent))]" />
          Campaign memory
          <span className="text-[10.5px] font-medium normal-case text-dim">
            decisions · dated channel reports → the campaign report
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* ── Decision log ── */}
        <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-3.5 backdrop-blur-[14px]">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-mut">Decision log</h3>
            <button
              type="button"
              onClick={() => setShowDecision((v) => !v)}
              className="inline-flex h-[30px] cursor-pointer items-center gap-1 rounded-full border border-line bg-surface px-2.5 text-[10px] font-semibold text-mut transition-colors hover:border-[color:var(--brand-accent,var(--accent))] hover:text-ink"
            >
              <Plus size={11} aria-hidden /> log decision
            </button>
          </div>

          {showDecision ? (
            <div className="mb-3 space-y-2 rounded-xl border border-line bg-surface p-3">
              <input
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Decision / action (e.g. approve Hero Girl 1)"
                className="mc-input"
              />
              <div className="flex gap-2">
                {(["approve", "edit", "reject"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDecision(d)}
                    className={`seg-fill rounded-full border px-3 py-[6px] text-[10px] font-bold uppercase tracking-[0.06em] ${
                      decision === d ? "on" : "border-line text-dim"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Source (file · meeting · repo)"
                className="mc-input"
              />
              <input
                value={rollback}
                onChange={(e) => setRollback(e.target.value)}
                placeholder="Rollback plan"
                className="mc-input"
              />
              <button
                type="button"
                onClick={submitDecision}
                className="btn post w-full"
                disabled={!action.trim()}
              >
                Record decision
              </button>
            </div>
          ) : null}

          <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {decisions.length === 0 ? (
              <p className="text-[11px] text-dim">No decisions recorded yet.</p>
            ) : (
              decisions.map((d, i) => (
                <div key={`${d.ts}-${d.action}-${i}`} className="rounded-lg border border-line bg-surface p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-[11.5px] font-semibold text-ink">{d.action}</span>
                    <span className={`shrink-0 text-[9.5px] font-bold uppercase tracking-[0.06em] ${tone(d.decision)}`}>
                      {d.state}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px] text-dim">
                    <span>{d.ts}</span>
                    <span aria-hidden>·</span>
                    <span className="min-w-0 truncate">source: {d.source}</span>
                  </div>
                  {d.rollback && d.rollback !== "—" ? (
                    <div className="mt-1 text-[9.5px] leading-snug text-mut">↩ {d.rollback}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Channel reports ── */}
        <div className="rounded-[var(--radius)] border border-line bg-surface-2 p-3.5 backdrop-blur-[14px]">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-mut">Channel reports</h3>
            <button
              type="button"
              onClick={() => setShowReport((v) => !v)}
              className="inline-flex h-[30px] cursor-pointer items-center gap-1 rounded-full border border-line bg-surface px-2.5 text-[10px] font-semibold text-mut transition-colors hover:border-[color:var(--brand-accent,var(--accent))] hover:text-ink"
            >
              <Plus size={11} aria-hidden /> add report
            </button>
          </div>

          {showReport ? (
            <div className="mb-3 space-y-2 rounded-xl border border-line bg-surface p-3">
              <select
                value={reportChannel}
                onChange={(e) => setReportChannel(e.target.value)}
                className="mc-input cursor-pointer"
                aria-label="Report channel"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What happened · what changed · what to reuse (2–3 lines)"
                rows={3}
                className="mc-textarea"
              />
              <button
                type="button"
                onClick={submitReport}
                className="btn post w-full"
                disabled={!summary.trim()}
              >
                Add report
              </button>
            </div>
          ) : null}

          <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {reports.length === 0 ? (
              <p className="text-[11px] text-dim">No reports yet — the final campaign report builds from these.</p>
            ) : (
              reports.map((r, i) => (
                <div key={`${r.date}-${r.channel}-${i}`} className="rounded-lg border border-line bg-surface p-2.5">
                  <div className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.06em] text-mut">
                    <LogIn size={10} aria-hidden className="text-[color:var(--brand-accent,var(--accent))]" />
                    {r.date} · {r.channel}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-ink">{r.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
