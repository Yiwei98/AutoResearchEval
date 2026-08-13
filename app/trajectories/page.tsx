import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import {
  TrajectoryShowcase,
  type TrajectoryShowcaseTask,
} from "@/components/TrajectoryShowcase";
import { TrajectoryToc } from "@/components/TrajectoryToc";
import {
  MODEL_BY_SYNTHETIC,
  type CategoryKey,
  type ScoreDirection,
} from "@/lib/benchmark-data";
import {
  TRAJECTORY_SHOWCASE_TASKS,
} from "@/lib/trajectory-showcase.mjs";

export const metadata: Metadata = {
  title: "Beyond Final Scores · Agent Trajectories",
  description:
    "Follow frontier research agents as they search, test, and revise, checkpoint by checkpoint.",
};

interface ManifestTrajectory {
  syntheticModel: string;
  id: string;
  kind: "curve" | "single-checkpoint";
  protocolEquivalentTrainingValidation?: boolean;
}

interface ManifestTask {
  task: string;
  slug: string;
  anchor: string;
  title: string;
  category: Exclude<CategoryKey, "overall">;
  description: string;
  metric: {
    key: string;
    label: string;
    direction: ScoreDirection;
    unit: string;
    protocol: string;
    yScale: "linear" | "log";
    reward: {
      kind: "anchored-linear" | "log-speedup";
      baseline: number;
      reference: number;
      mustBeat?: number;
    };
  };
  workload: string;
  correctnessGate: string;
  timeBudgetHours: number;
  evidenceNotes: readonly string[];
  trajectories: readonly ManifestTrajectory[];
}

interface TrajectoryShard {
  id: string;
  task: string;
  category: string;
  synthetic: string;
  seed: string;
  messages: unknown[];
  improvementRounds?: Array<{
    messageIndex: number;
    score?: number;
    metric?: string;
    direction?: ScoreDirection;
    protocol?: string;
  }>;
  summary?: {
    metric: string;
    direction: ScoreDirection;
    unit?: string;
    protocol?: string;
  } | null;
}

function loadShowcaseTasks(): TrajectoryShowcaseTask[] {
  const trajectoryDir = path.join(process.cwd(), "public", "data", "trajectories");
  const manifest = TRAJECTORY_SHOWCASE_TASKS as unknown as readonly ManifestTask[];

  return manifest.map((task) => {
    const series = task.trajectories.map((selected) => {
      const shardPath = path.join(trajectoryDir, `${selected.id}.json`);
      if (!fs.existsSync(shardPath)) {
        throw new Error(`Missing curated trajectory shard: ${selected.id}`);
      }
      const trajectory = JSON.parse(fs.readFileSync(shardPath, "utf8")) as TrajectoryShard;
      const model = MODEL_BY_SYNTHETIC[selected.syntheticModel];
      if (!model) throw new Error(`Unknown showcase model: ${selected.syntheticModel}`);
      if (
        trajectory.id !== selected.id ||
        trajectory.task !== task.task ||
        trajectory.synthetic !== selected.syntheticModel
      ) {
        throw new Error(`Curated trajectory identity mismatch: ${selected.id}`);
      }

      const points = (trajectory.improvementRounds ?? [])
        .filter(
          (round): round is typeof round & { score: number } =>
            Number.isFinite(round.score),
        )
        .map((round) => ({ messageIndex: round.messageIndex, score: round.score }))
        .sort((a, b) => a.messageIndex - b.messageIndex);

      const expectedPoints = selected.kind === "single-checkpoint" ? 1 : 2;
      if (points.length < expectedPoints) {
        throw new Error(`${selected.id}: expected ${selected.kind}, found ${points.length} point(s)`);
      }
      if (
        trajectory.summary?.metric !== task.metric.key ||
        trajectory.summary?.direction !== task.metric.direction ||
        trajectory.summary?.protocol !== task.metric.protocol
      ) {
        throw new Error(`${selected.id}: metric/protocol does not match showcase manifest`);
      }
      if (task.metric.yScale === "log" && points.some((point) => point.score <= 0)) {
        throw new Error(`${selected.id}: logarithmic showcase score must be positive`);
      }

      return {
        trajectoryId: selected.id,
        modelKey: model.key,
        seed: trajectory.seed,
        messageCount: trajectory.messages.length,
        checkpointCount: points.length,
        status: selected.kind,
        points,
      };
    });

    return {
      task: task.task,
      slug: task.slug,
      anchor: task.anchor,
      title: task.title,
      category: task.category,
      description: task.description,
      metricLabel: task.metric.label,
      unit: task.metric.unit,
      direction: task.metric.direction,
      protocol: task.metric.protocol,
      workload: task.workload,
      gate: task.correctnessGate,
      timeBudget: `${task.timeBudgetHours} hours`,
      yScale: task.metric.yScale,
      rewardScale: task.metric.reward,
      evidenceNotes: task.evidenceNotes,
      series,
    };
  });
}

export default function TrajectoriesPage() {
  const tasks = loadShowcaseTasks();
  return (
    <>
      <TrajectoryToc />
      <TrajectoryShowcase tasks={tasks} />
    </>
  );
}
