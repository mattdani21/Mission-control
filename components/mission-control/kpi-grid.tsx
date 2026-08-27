import type { Goal, GoalTone } from "../../lib/mission-data";

export function goalToneClass(tone: GoalTone): string {
  switch (tone) {
    case "gold":
      return "text-accent-ink";
    case "up":
      return "text-em";
    case "am":
      return "text-am";
    default:
      return "text-ink";
  }
}

function goalToneDot(tone: GoalTone): string {
  switch (tone) {
    case "gold":
      return "bg-accent";
    case "up":
      return "bg-em";
    case "am":
      return "bg-am";
    default:
      return "bg-mut";
  }
}

export function KpiGrid({ goals }: { goals: Goal[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
      {goals.map((goal) => (
        <div key={goal.label} className="goal">
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.07em] text-dim">
            {goal.label}
          </div>
          <div className={`text-[24px] font-bold leading-tight tracking-tight tabular-nums sm:text-[26px] ${goalToneClass(goal.tone)}`}>
            {goal.value}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] leading-[1.4] text-mut">
            <span aria-hidden className={`h-1 w-1 flex-shrink-0 rounded-full ${goalToneDot(goal.tone)}`} />
            <span className="min-w-0 truncate" title={goal.sub}>
              {goal.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
