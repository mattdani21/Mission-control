import {
  axisLabels,
  brandLabel,
  brandMatch,
  scaleWidth,
  STAGES,
  tagLabel,
  type BrandFilter,
  type CampRow,
  type GalleryItem,
  type PipeCard,
  type TimeScale,
  type WindowRow,
} from "../../lib/mission-data";

/* ─── Market Capture Calendar ─── */

function barStyle(s: number, e: number, width: number): React.CSSProperties {
  const left = (s / width) * 100;
  const w = Math.max(((e - s + 1) / width) * 100 - 0.4, 1.5);
  return { left: `${left}%`, width: `${w}%` };
}

/** Capture bars emphasize the ACTIVE brand accent (var set on <main>). */
function captureBarStyle(s: number, e: number, width: number): React.CSSProperties {
  return {
    ...barStyle(s, e, width),
    background: "color-mix(in srgb, var(--brand-accent, var(--accent)) 26%, transparent)",
    borderColor: "color-mix(in srgb, var(--brand-accent, var(--accent)) 70%, transparent)",
    color: "color-mix(in srgb, var(--brand-accent, var(--accent)) 85%, var(--ink))",
  };
}

/** Only render the in-bar label when the bar is wide enough to hold it
 *  (~24% of the track) — narrow bars fall back to the row label (left
 *  column on desktop, label-above-bar on mobile) instead of clipping. */
function barHasRoom(s: number, e: number, width: number): boolean {
  return ((e - s + 1) / width) * 100 >= 24;
}

function CalRowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full text-left text-[11.5px] font-medium leading-tight text-mut sm:w-[180px] sm:flex-shrink-0 sm:text-right">
      {children}
    </div>
  );
}

function CalTrack({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-7 flex-1 overflow-hidden rounded-[7px] border border-line bg-surface-2 sm:h-6">
      {children}
    </div>
  );
}

function CampBar({ row, width }: { row: CampRow; width: number }) {
  return (
    <div className="calrow mb-2 flex flex-col gap-[3px] sm:flex-row sm:items-center sm:gap-3">
      <CalRowLabel>{row.label}</CalRowLabel>
      <CalTrack>
        <div className={`bar ${row.cls}`} style={barStyle(row.s, row.e, width)}>
          {barHasRoom(row.s, row.e, width) ? row.label : null}
        </div>
      </CalTrack>
    </div>
  );
}

export function CaptureCalendar({
  scale,
  brand,
  windows,
  camps,
  calHint,
}: {
  scale: TimeScale;
  brand: BrandFilter;
  windows: WindowRow[];
  camps: CampRow[];
  calHint: string;
}) {
  const width = scaleWidth(scale);
  const axes = axisLabels(scale);
  // The horizon starts at the current month (Sep 2026) — the "now" marker
  // sits mid-column of that first month so it never clips at the edge.
  const nowLeft = (0.5 / width) * 100;

  const visibleWindows = windows.filter((w) => brandMatch(w.brand, brand));
  const visibleCamps = camps.filter((c) => brandMatch(c.brand, brand));

  return (
    <section className="mc-card mb-[18px] p-6" aria-labelledby="cal-title">
      <h2
        id="cal-title"
        className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] font-semibold text-ink"
      >
        Market capture calendar
        <span className="whitespace-nowrap rounded-full border border-line bg-surface-2 px-2.5 py-[3px] text-[10px] font-medium text-dim">
          {calHint}
        </span>
      </h2>
      <div>
        {visibleWindows.map((w) => (
          <div key={w.label} className="mb-2 flex flex-col gap-[3px] sm:flex-row sm:items-center sm:gap-3">
            <CalRowLabel>{w.label}</CalRowLabel>
            <CalTrack>
              <div className="bar capture" style={captureBarStyle(w.s, w.e, width)}>
                {barHasRoom(w.s, w.e, width) ? (w.kind === "capture" ? "● CAPTURE" : "◌ build") : null}
              </div>
            </CalTrack>
          </div>
        ))}
        {visibleCamps.map((c) => (
          <CampBar key={c.label} row={c} width={width} />
        ))}
        <div className="relative mt-2.5 flex border-t border-line pt-2">
          {axes.map((label) => (
            <span
              key={label}
              className="flex-1 text-center text-[9.5px] font-medium uppercase tracking-[0.05em] text-dim"
            >
              {label}
            </span>
          ))}
          {/* today/now marker on the axis row */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-[3px] flex items-start gap-[3px]"
            style={{ left: `${nowLeft}%` }}
          >
            <span className="mt-[1px] h-[11px] w-[2px] rounded-full bg-[color:var(--brand-accent)]" />
            <span className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.08em] text-[color:var(--brand-accent)]">
              now
            </span>
          </span>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-[7px] rounded-full border border-line bg-[color-mix(in_srgb,var(--brand-accent)_9%,transparent)] px-2.5 py-[5px] text-[10.5px] font-medium text-mut">
          <span aria-hidden className="h-2 w-2 rounded-[3px] bg-[color:var(--brand-accent)]" />
          capture window
        </span>
        <span className="inline-flex items-center gap-[7px] rounded-full border border-line bg-[color-mix(in_srgb,var(--em)_9%,transparent)] px-2.5 py-[5px] text-[10.5px] font-medium text-mut">
          <span aria-hidden className="h-2 w-2 rounded-[3px] bg-em" />
          Envogue campaign
        </span>
        <span className="inline-flex items-center gap-[7px] rounded-full border border-line bg-[color-mix(in_srgb,var(--am)_9%,transparent)] px-2.5 py-[5px] text-[10.5px] font-medium text-mut">
          <span aria-hidden className="h-2 w-2 rounded-[3px] bg-am" />
          Personal brand
        </span>
      </div>
    </section>
  );
}

/* ─── AI pipeline ─── */

export function Pipeline({
  pipeline,
  onAdvance,
}: {
  pipeline: Record<string, PipeCard[]>;
  onAdvance: (stage: string, title: string) => void;
}) {
  return (
    <section className="mb-[18px]" aria-label="AI pipeline">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {STAGES.map((stage, index) => {
          const cards = pipeline[stage] ?? [];
          const last = index === STAGES.length - 1;
          return (
            <div
              key={stage}
              className="flex min-h-[210px] flex-col rounded-[var(--radius)] border border-line bg-surface-2 p-3.5 backdrop-blur-[14px]"
            >
              <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-mut">
                {stage}
                <span
                  className={`rounded-[6px] border border-line bg-surface px-[5px] py-[1px] text-[9.5px] font-bold tabular-nums leading-[1.4] ${
                    cards.length > 0 ? (last ? "text-em" : "text-accent-ink") : "text-dim"
                  }`}
                >
                  {cards.length}
                </span>
              </h3>
              {cards.map((card) => (
                <button
                  key={`${card.title}-${index}`}
                  type="button"
                  onClick={() => !last && onAdvance(stage, card.title)}
                  className={`pcard group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2 active:translate-y-0 active:scale-[0.98] ${
                    last ? "done" : ""
                  }`}
                  aria-label={`${card.title} — advance to next stage`}
                >
                  <span className={`tag ${card.tag} rounded-full border border-line`}>{tagLabel(card.tag)}</span>
                  <div className="mb-0.5 pr-4 text-[12px] font-semibold text-ink">{card.title}</div>
                  <div className="text-[10.5px] leading-[1.35] text-mut">{card.sub}</div>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-[5px] bg-surface-2 px-[6px] py-[2px] text-[8px] font-bold tracking-[0.07em] text-dim">
                    <span
                      aria-hidden
                      className="h-[4px] w-[4px] rounded-full"
                      style={{ background: card.brand === "brand" ? "var(--am)" : "var(--brand-accent, var(--accent))" }}
                    />
                    {brandLabel(card.brand)}
                  </div>
                </button>
              ))}
              {!last ? (
                <div className="mt-auto pt-2 text-center text-[9.5px] font-medium tracking-[0.06em] text-dim">
                  ▼ advance
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── AI content gallery ─── */

export function Gallery({
  items,
  onOpen,
  onGenerate,
  generating,
}: {
  items: GalleryItem[];
  onOpen: (item: GalleryItem) => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  return (
    <section className="mc-card mb-[18px] p-6" aria-labelledby="gallery-title">
      <h2 id="gallery-title" className="mb-4 flex items-center justify-between text-[13px] font-semibold text-ink">
        AI-generated content — what the pipeline produces
        <span className="text-[11px] font-medium normal-case text-dim">click any asset to edit & post</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onOpen(item)}
            className="group relative cursor-pointer overflow-hidden rounded-[var(--radius-s)] border border-line bg-surface text-left shadow-[var(--shadow)] backdrop-blur-[16px] transition-transform duration-200 hover:-translate-y-[3px] hover:shadow-[var(--shadow-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-0 active:scale-[0.99]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.img}
              alt={item.title}
              className="block aspect-[4/5] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              loading="lazy"
            />
            <span
              className={`absolute left-2.5 top-2.5 rounded-full border border-line bg-[color-mix(in_srgb,var(--surface-solid)_85%,transparent)] px-2 py-[3px] text-[8px] font-bold tracking-[0.07em] text-accent-ink shadow-sm backdrop-blur-[10px] ${
                item.badgeTone === "green" ? "!text-em" : ""
              }`}
            >
              {item.badge}
            </span>
            <div className="p-3">
              <b className="mb-0.5 block truncate text-[12px] font-semibold text-ink">{item.title}</b>
              <span className="block text-[11px] leading-[1.45] text-mut line-clamp-2">{item.cap}</span>
            </div>
          </button>
        ))}
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="group flex aspect-[4/5] min-h-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-s)] border border-dashed border-[color-mix(in_srgb,var(--brand-accent)_38%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_5%,transparent)] px-3 text-center transition-all duration-200 hover:-translate-y-[3px] hover:border-[color-mix(in_srgb,var(--brand-accent)_60%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand-accent)_9%,transparent)] hover:shadow-[var(--shadow-hover)] disabled:cursor-default disabled:opacity-50 disabled:hover:translate-y-0"
          aria-label="Generate a new look with AI"
        >
          <span
            className="text-[22px] text-[color:var(--brand-accent)] transition-transform duration-300 group-hover:scale-110"
            aria-hidden
          >
            ✦
          </span>
          <span className="text-[11.5px] font-semibold text-mut transition-colors group-hover:text-[color:var(--brand-accent)]">
            {generating ? "Generating…" : "Generate new look"}
          </span>
          <span className="text-[10px] text-dim">Gemini 2.5 Flash Image · ~$0.04/img</span>
        </button>
      </div>
    </section>
  );
}

/* ─── Time context line ─── */

export function TimeContext({ context }: { context: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-[7px] text-[12px] font-medium text-mut">
      <span aria-hidden className="h-[7px] w-[7px] flex-shrink-0 rounded-full bg-[color:var(--brand-accent)]" />
      <span className="min-w-0">{context}</span>
    </span>
  );
}
