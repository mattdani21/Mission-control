import {
  axisLabels,
  brandLabel,
  brandMatch,
  CAL_HINT,
  CAMPS,
  scaleWidth,
  STAGES,
  tagLabel,
  TIME_CONTEXT,
  WINDOWS,
  type BrandFilter,
  type CampRow,
  type GalleryItem,
  type PipeCard,
  type TimeScale,
} from "../../lib/mission-data";

/* ─── Market Capture Calendar ─── */

function barStyle(s: number, e: number, width: number): React.CSSProperties {
  const left = (s / width) * 100;
  const w = Math.max(((e - s + 1) / width) * 100 - 0.4, 1.5);
  return { left: `${left}%`, width: `${w}%` };
}

function CampBar({ row, width }: { row: CampRow; width: number }) {
  return (
    <div className="calrow mb-[7px] flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <div className="w-full text-left text-[11.5px] font-medium leading-tight text-mut sm:w-[168px] sm:flex-shrink-0 sm:text-right">
        {row.label}
      </div>
      <div className="relative h-6 flex-1 overflow-hidden rounded-[7px] border border-line-2 bg-surface-2">
        <div className={`bar ${row.cls}`} style={barStyle(row.s, row.e, width)}>
          {row.label}
        </div>
      </div>
    </div>
  );
}

export function CaptureCalendar({ scale, brand }: { scale: TimeScale; brand: BrandFilter }) {
  const width = scaleWidth(scale);
  const axes = axisLabels(scale);

  const windows = WINDOWS.filter((w) => brandMatch(w.brand, brand));
  const camps = CAMPS.filter((c) => brandMatch(c.brand, brand));

  return (
    <section className="mc-card mb-[18px] p-6" aria-labelledby="cal-title">
      <h2 id="cal-title" className="mb-4 flex items-center justify-between text-[13px] font-semibold text-ink">
        Market capture calendar
        <span className="text-[11px] font-medium normal-case text-dim">{CAL_HINT[scale]}</span>
      </h2>
      <div>
        {windows.map((w) => (
          <div key={w.label} className="mb-[7px] flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div className="w-full text-left text-[11.5px] font-medium leading-tight text-mut sm:w-[168px] sm:flex-shrink-0 sm:text-right">
              {w.label}
            </div>
            <div className="relative h-6 flex-1 overflow-hidden rounded-[7px] border border-line-2 bg-surface-2">
              <div className="bar capture" style={barStyle(w.s, w.e, width)}>
                {w.kind === "capture" ? "● CAPTURE" : "◌ build"}
              </div>
            </div>
          </div>
        ))}
        {camps.map((c) => (
          <CampBar key={c.label} row={c} width={width} />
        ))}
        <div className="mt-2.5 flex border-t border-line pt-2">
          {axes.map((label) => (
            <span key={label} className="flex-1 text-center text-[9.5px] font-medium tracking-[0.04em] text-dim">
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-[18px]">
        <span className="flex items-center gap-[7px] text-[11px] text-mut">
          <span className="inline-block h-3 w-3 rounded border border-line bg-accent-soft" />
          capture window
        </span>
        <span className="flex items-center gap-[7px] text-[11px] text-mut">
          <span className="inline-block h-3 w-3 rounded border border-line bg-em/15" />
          Envogue campaign
        </span>
        <span className="flex items-center gap-[7px] text-[11px] text-mut">
          <span className="inline-block h-3 w-3 rounded border border-line bg-am/15" />
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
          return (
            <div
              key={stage}
              className="min-h-[210px] rounded-[var(--radius)] border border-line bg-surface-2 p-3.5 backdrop-blur-[14px]"
            >
              <h3 className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.06em] text-mut">
                {stage}
                <span className="text-[10.5px] font-bold text-accent-ink">{cards.length}</span>
              </h3>
              {cards.map((card) => (
                <button
                  key={`${card.title}-${index}`}
                  type="button"
                  onClick={() => index < STAGES.length - 1 && onAdvance(stage, card.title)}
                  className={`pcard block w-full text-left ${index === STAGES.length - 1 ? "done" : ""}`}
                  aria-label={`${card.title} — advance to next stage`}
                >
                  <span className={`tag ${card.tag}`}>{tagLabel(card.tag)}</span>
                  <div className="mb-0.5 pr-4 text-[12px] font-semibold text-ink">{card.title}</div>
                  <div className="text-[10.5px] leading-[1.35] text-mut">{card.sub}</div>
                  <div className="mt-1.5 text-[8.5px] font-semibold tracking-[0.06em] text-dim">
                    {brandLabel(card.brand)}
                  </div>
                </button>
              ))}
              {index < STAGES.length - 1 ? (
                <div className="py-0.5 pb-2 text-center text-[10px] font-medium tracking-[0.04em] text-dim">
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onOpen(item)}
            className="group relative cursor-pointer overflow-hidden rounded-[var(--radius-s)] border border-line bg-surface text-left shadow-[var(--shadow)] backdrop-blur-[16px] transition-transform duration-200 hover:-translate-y-[3px] hover:shadow-[var(--shadow-hover)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.img} alt={item.title} className="block aspect-[4/5] w-full object-cover" loading="lazy" />
            <span
              className={`absolute left-2.5 top-2.5 rounded-md border border-line bg-surface px-[7px] py-[3px] text-[8.5px] font-bold tracking-[0.05em] text-accent-ink backdrop-blur-[8px] ${
                item.badgeTone === "green" ? "!text-em" : ""
              }`}
            >
              {item.badge}
            </span>
            <div className="p-3 text-[11px] leading-[1.4] text-mut">
              <b className="mb-0.5 block text-[12px] font-semibold text-ink">{item.title}</b>
              {item.cap}
            </div>
          </button>
        ))}
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-s)] border border-dashed border-line bg-surface-2 text-mut transition-colors hover:border-accent/50 hover:text-accent-ink disabled:cursor-default disabled:opacity-50"
          aria-label="Generate a new look with AI"
        >
          <span className="text-[22px]" aria-hidden>
            ✦
          </span>
          <span className="text-[11.5px] font-semibold">{generating ? "Generating…" : "Generate new look"}</span>
          <span className="text-[10px] text-dim">FLUX.1-dev · ~$0.03/img</span>
        </button>
      </div>
    </section>
  );
}

/* ─── Time context line ─── */

export function TimeContext({ scale }: { scale: TimeScale }) {
  return <span className="text-[12.5px] font-normal text-mut">{TIME_CONTEXT[scale]}</span>;
}
