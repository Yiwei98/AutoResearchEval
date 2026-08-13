import {
  metricLabel,
  type ImprovementRound,
  type ScoreDirection,
} from "@/lib/benchmark-data";

// Score-over-evaluator-checkpoints chart, hand-rolled SVG (no chart lib).
// Draws TWO lines:
//   - a thin, faint line of each evaluator score (shows the agent exploring,
//     including failed attempts that spike the wrong way)
//   - a thick accent line of the running best-so-far / high-water mark, which is
//     monotone by construction and shows the real progress (this is how the
//     paper's C1 "solution framing" curve is defined).
// Y axis is oriented so UP always means "better", for both lower-better
// (time, bpb, loss) and higher-better (accuracy, reward) metrics.
export function ScoreSparkline({
  rounds,
  direction,
  metric,
}: {
  rounds: ImprovementRound[];
  direction: ScoreDirection;
  metric: string;
}) {
  const pts = rounds
    .filter((r) => r.score != null)
    .map((r) => ({ score: r.score as number }));

  if (pts.length < 2) return null;

  const lowerBetter = direction !== "higher";

  // Running best-so-far (high-water mark).
  const best: number[] = [];
  let run = pts[0].score;
  for (const p of pts) {
    run = lowerBetter ? Math.min(run, p.score) : Math.max(run, p.score);
    best.push(run);
  }

  const W = 380;
  const H = 120;
  const padX = 8;
  const padY = 14;

  const all = pts.map((p) => p.score);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;

  const bestVal = lowerBetter ? min : max;

  const x = (i: number) => padX + (i / (pts.length - 1)) * (W - 2 * padX);
  const y = (s: number) => {
    const norm = (s - min) / range; // 0..1
    const good = lowerBetter ? 1 - norm : norm; // 1 = best
    return H - padY - good * (H - 2 * padY);
  };

  const rawLine = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.score)}`).join(" ");
  const bestLine = best.map((s, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(s)}`).join(" ");
  const bestArea = `${bestLine} L${x(pts.length - 1)},${H - padY} L${x(0)},${H - padY} Z`;

  const fmt = (v: number) => v.toFixed(v < 10 ? 3 : 1);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: H }}
      >
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* best-so-far fill + thick line (the real progress) */}
        <path d={bestArea} fill="url(#spark-fill)" />
        <path
          d={bestLine}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* raw evaluator line (the exploration, faint & thin) */}
        <path
          d={rawLine}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={1}
          strokeOpacity={0.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* raw points */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.score)}
            r={p.score === bestVal ? 4 : 2}
            fill={p.score === bestVal ? "var(--color-accent)" : "#fff"}
            stroke={p.score === bestVal ? "var(--color-accent)" : "var(--color-muted)"}
            strokeWidth={p.score === bestVal ? 1.5 : 1}
          />
        ))}
      </svg>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
        <span>start {fmt(pts[0].score)}</span>
        <span className="font-medium text-accent">
          best {fmt(bestVal)} {metricLabel(metric)}
        </span>
        <span>end {fmt(pts[pts.length - 1].score)}</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-[2.5px] w-4 rounded-full bg-accent" />
          best so far
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-px w-4 bg-muted/60" />
          each evaluation
        </span>
      </div>
    </div>
  );
}
