"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CATEGORY_LABEL,
  MODEL_BY_SYNTHETIC,
  type CategoryKey,
  type ImprovementRound,
  type ImprovementSummary,
} from "@/lib/benchmark-data";
import { withBasePath } from "@/lib/base-path";
import { type RawMessage } from "./MessageFlow";
import { TrajectoryView } from "./TrajectoryView";
import { ModelIcon } from "./ModelIcon";

interface Trajectory {
  id: string;
  task: string;
  category: string;
  synthetic: string;
  owner: string;
  seed: string;
  rounds: number;
  improvementRounds?: ImprovementRound[];
  summary?: ImprovementSummary | null;
  messages: RawMessage[];
}

export function TrajectoryDetailClient({ id }: { id: string }) {
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(withBasePath(`/data/trajectories/${id}.json`))
      .then((response) => {
        if (!response.ok) throw new Error("Trajectory not found");
        return response.json() as Promise<Trajectory>;
      })
      .then((data) => {
        if (mounted) setTrajectory(data);
      })
      .catch(() => {
        if (mounted) setFailed(true);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (failed) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-muted">
        Unable to load this trajectory.
      </div>
    );
  }

  if (!trajectory) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-muted">
        Loading trajectory...
      </div>
    );
  }

  const model = MODEL_BY_SYNTHETIC[trajectory.synthetic];
  const categoryLabel =
    CATEGORY_LABEL[trajectory.category as Exclude<CategoryKey, "overall">] ??
    trajectory.category;
  const improvementRounds = trajectory.improvementRounds ?? [];
  const summary = trajectory.summary ?? null;
  const taskAnchor = `task-${trajectory.task.replaceAll("_", "-")}`;
  const backParams = new URLSearchParams({ task: trajectory.task });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Link
        href={`/trajectories?${backParams.toString()}#${taskAnchor}`}
        className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-accent"
      >
        ← Back to model comparison
      </Link>

      <div className="mb-6 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-3">
          {model ? (
            <ModelIcon model={model} size={32} />
          ) : (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: "#999" }}
            >
              ?
            </span>
          )}
          <div>
            <div className="font-semibold">
              {model?.name ?? trajectory.synthetic}
            </div>
            <div className="font-mono text-sm text-muted">{trajectory.task}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          <Chip>{categoryLabel}</Chip>
          <Chip>{trajectory.messages.length} messages</Chip>
        </div>
      </div>

      <TrajectoryView
        messages={trajectory.messages}
        rounds={improvementRounds}
        summary={summary}
      />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-background px-2 py-1 ring-1 ring-border">
      {children}
    </span>
  );
}
