"use client";

import { useState } from "react";
import {
  type ImprovementRound,
  type ImprovementSummary as Summary,
} from "@/lib/benchmark-data";
import { MessageFlow, type RawMessage } from "./MessageFlow";
import { ImprovementTimeline } from "./ImprovementTimeline";
import { ImprovementSummary } from "./ImprovementSummary";
import { ScoreSparkline } from "./ScoreSparkline";

export function TrajectoryView({
  messages,
  rounds,
  summary,
}: {
  messages: RawMessage[];
  rounds: ImprovementRound[];
  summary: Summary | null;
}) {
  const [active, setActive] = useState<number | undefined>(undefined);

  // Fallback: no comparable evaluator checkpoints → show the raw trajectory.
  if (rounds.length === 0) {
    return <MessageFlow messages={messages} />;
  }

  const direction = summary?.direction ?? "unknown";
  const hasScores = (summary?.numScored ?? 0) >= 2;

  const handleSelect = (messageIndex: number) => {
    setActive(messageIndex);
    const el = document.getElementById(`msg-${messageIndex}`);
    if (el) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr]">
      {/* Left: improvement arc (sticky on desktop) */}
      <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
        {summary && (
          <div className="mb-4">
            <ImprovementSummary summary={summary} />
          </div>
        )}
        {hasScores && summary && (
          <div className="mb-4 rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 text-xs font-medium text-muted">
              Score across evaluator checkpoints{" "}
              <span className="text-foreground">
                ({direction === "higher" ? "higher" : "lower"} is better)
              </span>
            </div>
            <ScoreSparkline
              rounds={rounds}
              direction={direction}
              metric={summary.metric}
            />
          </div>
        )}
        <div>
          <div className="mb-2 text-xs font-medium text-muted">
            Evaluated checkpoints · {rounds.length}
          </div>
          <ImprovementTimeline
            rounds={rounds}
            direction={direction}
            onSelect={handleSelect}
            activeMessageIndex={active}
          />
        </div>
      </aside>

      {/* Right: raw message flow (scrolls independently on desktop) */}
      <div className="min-w-0">
        <div className="mb-2 text-xs font-medium text-muted">Full trajectory</div>
        <div className="lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          <MessageFlow messages={messages} />
        </div>
      </div>
    </div>
  );
}
