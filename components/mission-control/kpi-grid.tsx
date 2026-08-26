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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {goals.map((goal) => (
        <div key={goal.label} className="goal">
          <div className="mb-1 text-[10.5px] font-medium uppercase tracking-[0.06em] text-dim">
            {goal.label}
          </div>
          <div className={`text-[21px] font-bold leading-tight tracking-tight tabular-nums ${goalToneClass(goal.tone)}`}>
            {goal.value}
          </div>
          <div className="mt-1 text-[10.5px] text-mut">{goal.sub}</div>
        </div>
      ))}
    </div>
  );
}
