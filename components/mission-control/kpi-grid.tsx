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

export function KpiGrid({ goals }: { goals: Goal[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
      {goals.map((goal) => (
        <div key={goal.label} className="goal">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-dim">
            {goal.label}
          </div>
          <div className={`text-[22px] font-bold leading-tight tracking-tight tabular-nums ${goalToneClass(goal.tone)}`}>
            {goal.value}
          </div>
          <div className="mt-1 text-[11px] leading-[1.4] text-mut">{goal.sub}</div>
        </div>
      ))}
    </div>
  );
}
