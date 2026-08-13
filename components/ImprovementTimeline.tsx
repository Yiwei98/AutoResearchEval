"use client";

import type { ImprovementRound, ScoreDirection } from "@/lib/benchmark-data";

interface AnnotatedRound {
  round: ImprovementRound;
  delta: number | null;
  improved: boolean;
}

// Keep score bookkeeping outside the component render body. The helper is
// deterministic and only mutates its own local accumulator.
function annotateRounds(
  rounds: ImprovementRound[],
  lowerBetter: boolean,
): AnnotatedRound[] {
  let previousScore: number | null = null;

  return rounds.map((round) => {
    const score = round.score ?? null;
    const delta = score != null && previousScore != null
      ? score - previousScore
      : null;
    const improved =
      delta != null && (lowerBetter ? delta < 0 : delta > 0);

    if (score != null) previousScore = score;

    return { round, delta, improved };
  });
}

// Vertical list of evaluator checkpoints. A nearby commit supplies the change
// description when available; clicking always scrolls to the measured tool
// result that produced the score.
export function ImprovementTimeline({
  rounds,
  direction,
  onSelect,
  activeMessageIndex,
}: {
  rounds: ImprovementRound[];
  direction: ScoreDirection;
  onSelect: (messageIndex: number) => void;
  activeMessageIndex?: number;
}) {
  const lowerBetter = direction !== "higher";
  const annotatedRounds = annotateRounds(rounds, lowerBetter);

  return (
    <ol className="relative space-y-1.5">
      {annotatedRounds.map(({ round: r, delta, improved }) => {
        const hasScore = r.score != null;
        const active = activeMessageIndex === r.messageIndex;
        const isBaseline = r.index === 1 && /initial|baseline/i.test(r.description);

        return (
          <li key={`${r.index}-${r.messageIndex}`}>
            <button
              type="button"
              onClick={() => onSelect(r.messageIndex)}
              aria-current={active ? "step" : undefined}
              className={`group flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? "border-accent/50 bg-accent-soft"
                  : "border-border bg-surface hover:border-accent/30 hover:bg-accent-soft/40"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
            >
              {/* evaluation badge */}
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                  isBaseline
                    ? "bg-border text-muted"
                    : "bg-accent-soft text-accent"
                }`}
              >
                {isBaseline ? "0" : r.index}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm leading-snug text-foreground [overflow-wrap:anywhere]">
                  {r.description}
                </span>
                {hasScore && (
                  <span className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums text-muted">
                      {(r.score as number).toFixed((r.score as number) < 10 ? 3 : 1)}
                    </span>
                    {delta != null && Math.abs(delta) > 1e-9 && (
                      <span
                        className={`text-[11px] font-medium tabular-nums ${
                          improved ? "text-accent" : "text-red-700"
                        }`}
                      >
                        <span aria-hidden="true">
                          {delta > 0 ? "▲" : "▼"}{" "}
                          {Math.abs(delta).toFixed(Math.abs(delta) < 10 ? 3 : 1)}
                        </span>
                        <span className="sr-only">
                          {improved ? "Improved" : "Regressed"} by{" "}
                          {Math.abs(delta).toFixed(Math.abs(delta) < 10 ? 3 : 1)}
                        </span>
                      </span>
                    )}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
