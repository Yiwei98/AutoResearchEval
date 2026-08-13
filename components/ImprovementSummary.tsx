import {
  metricLabel,
  type ImprovementSummary as Summary,
} from "@/lib/benchmark-data";

// A compact stat strip describing the improvement arc.
export function ImprovementSummary({ summary }: { summary: Summary }) {
  const hasScores = summary.numScored > 0 && summary.firstScore != null;
  const lowerBetter = summary.direction !== "higher";

  const fmt = (v?: number) =>
    v == null ? "—" : v.toFixed(v < 10 ? 3 : 1);

  // Net change first -> best, expressed as improvement magnitude.
  let delta: number | null = null;
  if (hasScores && summary.bestScore != null && summary.firstScore != null) {
    delta = lowerBetter
      ? summary.firstScore - summary.bestScore
      : summary.bestScore - summary.firstScore;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Stat label="Evaluations" value={String(summary.numRounds)} />
      {hasScores && (
        <>
          <Stat
            label="Start"
            value={`${fmt(summary.firstScore)}`}
            sub={summary.unit ?? metricLabel(summary.metric)}
          />
          <Stat
            label="Best"
            value={`${fmt(summary.bestScore)}`}
            sub={summary.unit ?? metricLabel(summary.metric)}
            accent
          />
          {delta != null && delta > 0 && (
            <Stat
              label="Improved by"
              value={`${lowerBetter ? "−" : "+"}${fmt(Math.abs(delta))}`}
              accent
            />
          )}
        </>
      )}
      {!hasScores && (
        <div className="flex items-center rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted">
          No comparable evaluator checkpoints were found for this task.
        </div>
      )}
      {summary.metric === "overall_bpb" && (
        <p className="basis-full pt-1 text-xs leading-relaxed text-muted">
          AutoLab&apos;s byte-weighted overall score across 9 sequence families
          (313,470 bytes). Lower is better; an invalid sequence contributes 8.0 bpb.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div
        className={`text-sm font-semibold tabular-nums ${
          accent ? "text-accent" : ""
        }`}
      >
        {value}
        {sub && <span className="ml-1 text-[10px] font-normal text-muted">{sub}</span>}
      </div>
    </div>
  );
}
