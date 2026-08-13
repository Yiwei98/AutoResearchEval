"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CATEGORY_LABEL,
  MODEL_BY_KEY,
  MODELS,
  type CategoryKey,
  type ScoreDirection,
} from "@/lib/benchmark-data";
import { ModelIcon } from "./ModelIcon";
import {
  TrajectoryComparisonChart,
  type TrajectoryAxisMode,
  type TrajectoryChartSeries,
  type TrajectoryRewardScale,
} from "./TrajectoryComparisonChart";

export interface TrajectoryShowcaseTask {
  task: string;
  slug: string;
  anchor: string;
  title: string;
  category: Exclude<CategoryKey, "overall">;
  description: string;
  metricLabel: string;
  unit: string;
  direction: ScoreDirection;
  protocol: string;
  workload: string;
  gate: string;
  timeBudget: string;
  yScale: "linear" | "log";
  rewardScale: TrajectoryRewardScale;
  evidenceNotes: readonly string[];
  series: TrajectoryChartSeries[];
}

function formatScore(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (absolute >= 10) return value.toFixed(2).replace(/\.00$/, "");
  if (absolute >= 1) return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  if (absolute >= 0.01) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function scoreSummary(item: TrajectoryChartSeries, direction: ScoreDirection) {
  const values = item.points.map((point) => point.score);
  const best =
    direction === "higher" ? Math.max(...values) : Math.min(...values);
  const bestPoint = item.points[values.indexOf(best)];
  return {
    start: values[0],
    best,
    end: values.at(-1) as number,
    bestProgress: bestPoint
      ? bestPoint.messageIndex / Math.max(1, item.messageCount - 1)
      : 0,
  };
}

export function TrajectoryShowcase({ tasks }: { tasks: TrajectoryShowcaseTask[] }) {
  const [requestedModelParam, setRequestedModelParam] = useState<string | null>(null);
  const [requestedTask, setRequestedTask] = useState<string | null>(null);
  const [axisModes, setAxisModes] = useState<Record<string, TrajectoryAxisMode>>(
    () => Object.fromEntries(tasks.map((task) => [task.task, "progress"])),
  );
  const requestedModel = MODELS.some((model) => model.key === requestedModelParam)
    ? requestedModelParam
    : null;
  const selectedTask = requestedTask
    ? tasks.find((task) => task.task === requestedTask)
    : null;
  const unknownTask = Boolean(requestedTask && !selectedTask);

  useEffect(() => {
    const syncLocation = () => {
      const params = new URLSearchParams(window.location.search);
      setRequestedModelParam(params.get("model"));
      setRequestedTask(params.get("task"));
      const initialAxisMode: TrajectoryAxisMode =
        params.get("axis") === "messages" ? "messages" : "progress";
      setAxisModes(
        Object.fromEntries(tasks.map((task) => [task.task, initialAxisMode])),
      );
    };
    syncLocation();
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, [tasks]);

  useEffect(() => {
    let frame = -1;
    let timeout = 0;
    const scrollToTarget = () => {
      const hashId = window.location.hash.slice(1);
      const hashTarget = tasks.some((task) => task.anchor === hashId)
        ? hashId
        : null;
      const targetId = hashTarget ?? selectedTask?.anchor;
      if (!targetId) return;

      if (frame >= 0) window.cancelAnimationFrame(frame);
      if (timeout) window.clearTimeout(timeout);
      frame = window.requestAnimationFrame(() => {
        timeout = window.setTimeout(() => {
          const element = document.getElementById(targetId);
          if (!element) return;
          const headerOffset = 76;
          window.scrollTo({
            top: Math.max(
              0,
              element.getBoundingClientRect().top + window.scrollY - headerOffset,
            ),
            behavior: "auto",
          });
        }, 80);
      });
    };

    scrollToTarget();
    window.addEventListener("hashchange", scrollToTarget);
    return () => {
      if (frame >= 0) window.cancelAnimationFrame(frame);
      if (timeout) window.clearTimeout(timeout);
      window.removeEventListener("hashchange", scrollToTarget);
    };
  }, [selectedTask, tasks]);

  const setTaskAxisMode = (task: string, mode: TrajectoryAxisMode) => {
    setAxisModes((current) => ({ ...current, [task]: mode }));
  };

  return (
    <article className="overflow-clip">
      <section id="trajectory-overview" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-14 sm:px-6 sm:pb-18 sm:pt-20">
          <div className="max-w-4xl">
            <p className="section-kicker">Agent trajectories</p>
            <h1 className="mt-4 max-w-4xl">
              <span className="block text-balance text-[2.15rem] font-bold leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-[3.75rem]">
                Beyond final scores:
              </span>
              <span className="mt-3 block max-w-3xl text-balance text-2xl font-semibold leading-[1.08] tracking-[-0.035em] text-accent sm:mt-4 sm:text-4xl lg:text-[3.15rem]">
                the trajectories behind them.
              </span>
            </h1>
          </div>

          {requestedModel ? (
            <p className="mt-8 border-l-2 border-accent pl-4 text-sm leading-6 text-muted">
              Highlighting <strong className="text-foreground">{MODEL_BY_KEY[requestedModel].name}</strong> across the published comparisons while retaining the other models for context.
            </p>
          ) : null}
          {unknownTask ? (
            <div role="status" className="mt-8 border-l-2 border-border pl-4 text-sm leading-6 text-muted">
              <span className="font-mono text-foreground">{requestedTask}</span> is outside this
              trajectory collection. The published comparisons remain available below.
            </div>
          ) : null}
        </div>
      </section>

      {tasks.map((task, index) => (
        <TrajectoryTaskSection
          key={task.task}
          task={task}
          index={index + 1}
          axisMode={axisModes[task.task] ?? "progress"}
          onAxisModeChange={(mode) => setTaskAxisMode(task.task, mode)}
          requestedModel={requestedModel}
        />
      ))}
    </article>
  );
}

function TrajectoryTaskSection({
  task,
  index,
  axisMode,
  onAxisModeChange,
  requestedModel,
}: {
  task: TrajectoryShowcaseTask;
  index: number;
  axisMode: TrajectoryAxisMode;
  onAxisModeChange: (mode: TrajectoryAxisMode) => void;
  requestedModel: string | null;
}) {
  const categoryLabel = CATEGORY_LABEL[task.category];
  const messageCounts = task.series.map((item) => item.messageCount);
  const checkpointCounts = task.series.map((item) => item.checkpointCount);

  return (
    <section
      id={task.anchor}
      data-trajectory-section
      className={`border-b border-border ${index % 2 === 0 ? "bg-surface/45" : ""}`}
    >
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-accent">
                {String(index).padStart(2, "0")}
              </span>
              <span className="h-px w-8 bg-border" aria-hidden="true" />
              <p className="section-kicker">{categoryLabel}</p>
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              {task.title}
            </h2>
            <p className="mt-2 font-mono text-xs text-muted">{task.task}</p>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted">{task.description}</p>
          </div>

          <dl className="divide-y divide-border border-y border-border text-sm">
            <MetricRow label="Objective" value={`${task.metricLabel} · ${task.direction === "higher" ? "higher" : "lower"} is better`} />
            <MetricRow label="Workload" value={task.workload} />
            <MetricRow label="Correctness" value={task.gate} />
            <MetricRow label="Budget" value={task.timeBudget} />
          </dl>
        </div>

        <div className="mt-10">
          <TrajectoryComparisonChart
            task={task.task}
            direction={task.direction}
            rewardScale={task.rewardScale}
            axisMode={axisMode}
            onAxisModeChange={onAxisModeChange}
            series={task.series}
            requestedModel={requestedModel}
          />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
          <div>
            <p className="section-kicker">What to notice</p>
            <div className="mt-4 space-y-5">
              {task.evidenceNotes.map((note, noteIndex) => (
                <div key={note} className="grid grid-cols-[1.75rem_1fr] gap-3">
                  <span className="font-mono text-xs font-semibold text-accent">
                    {String(noteIndex + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-6 text-muted">{note}</p>
                </div>
              ))}
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-y-5 border-t border-border pt-6 text-sm">
              <div>
                <dt className="text-xs text-muted">Messages across runs</dt>
                <dd className="mt-1 font-mono font-semibold tabular-nums">
                  {Math.min(...messageCounts).toLocaleString("en-US")}–{Math.max(...messageCounts).toLocaleString("en-US")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Evaluator checkpoints</dt>
                <dd className="mt-1 font-mono font-semibold tabular-nums">
                  {Math.min(...checkpointCounts).toLocaleString("en-US")}–{Math.max(...checkpointCounts).toLocaleString("en-US")}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Selected runs</p>
                <h3 className="mt-2 text-xl font-semibold">Open any model&apos;s full trajectory</h3>
              </div>
              <span className="text-xs text-muted">7 models</span>
            </div>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {task.series.map((item) => {
                const model = MODEL_BY_KEY[item.modelKey];
                const summary = scoreSummary(item, task.direction);
                const highlighted = requestedModel === item.modelKey;
                return (
                  <li key={item.trajectoryId}>
                    <Link
                      href={`/trajectories/${item.trajectoryId}`}
                      className={`group grid min-h-[3.75rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-2 py-2.5 transition-colors hover:bg-accent-soft/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                        highlighted ? "bg-accent-soft/60" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <ModelIcon model={model} size={28} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold group-hover:text-accent">
                            {model.name}
                          </p>
                        </div>
                      </div>
                      <div
                        className="text-right font-mono text-xs tabular-nums"
                        aria-label={
                          item.status === "single-checkpoint"
                            ? `Single checkpoint: ${formatScore(summary.start)}`
                            : `Start ${formatScore(summary.start)}, best ${formatScore(
                                summary.best,
                              )}, end ${formatScore(summary.end)}; best at ${Math.round(
                                summary.bestProgress * 100,
                              )} percent of the trajectory`
                        }
                      >
                        {item.status === "single-checkpoint" ? (
                          <>
                            <p className="font-semibold">{formatScore(summary.start)}</p>
                            <p className="mt-1 text-[10px] text-muted">single point</p>
                          </>
                        ) : (
                          <>
                            <p>
                              <span className="text-muted">{formatScore(summary.start)}</span>
                              <span className="mx-1.5 text-border">→</span>
                              <span className="font-semibold text-accent">{formatScore(summary.best)}</span>
                              <span className="mx-1.5 text-border">→</span>
                              <span className="text-foreground">{formatScore(summary.end)}</span>
                            </p>
                            <p className="mt-1 text-[10px] text-muted">
                              start · best · end · best at {Math.round(summary.bestProgress * 100)}%
                            </p>
                          </>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-3">
      <dt className="text-xs font-semibold text-foreground">{label}</dt>
      <dd className="text-xs leading-5 text-muted">{value}</dd>
    </div>
  );
}
