"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODEL_BY_KEY, type ScoreDirection } from "@/lib/benchmark-data";

export type TrajectoryAxisMode = "progress" | "messages";
export type TrajectorySeriesStatus = "curve" | "single-checkpoint";

export interface TrajectoryRewardScale {
  kind: "anchored-linear" | "log-speedup";
  baseline: number;
  reference: number;
  mustBeat?: number;
}

export interface TrajectoryChartPoint {
  messageIndex: number;
  score: number;
}

export interface TrajectoryChartSeries {
  trajectoryId: string;
  modelKey: string;
  seed: string;
  messageCount: number;
  checkpointCount: number;
  status: TrajectorySeriesStatus;
  points: TrajectoryChartPoint[];
}

interface TrajectoryComparisonChartProps {
  task: string;
  direction: ScoreDirection;
  rewardScale: TrajectoryRewardScale;
  axisMode: TrajectoryAxisMode;
  onAxisModeChange: (mode: TrajectoryAxisMode) => void;
  series: TrajectoryChartSeries[];
  requestedModel: string | null;
}

const DEFAULT_WIDTH = 1040;
const DESKTOP_HEIGHT = 430;
const REWARD_TICKS = [1, 0.75, 0.5, 0.25, 0] as const;

const LINE_DASH: Record<string, string | undefined> = {
  claude: undefined,
  glm: "10 5",
  gpt: "3 3",
  gemini: "14 5",
  kimi: "11 4 2 4",
  longcat: "6 3",
  deepseek: "16 5 3 5",
};

const MARKER: Record<string, "circle" | "square" | "diamond" | "triangle"> = {
  claude: "circle",
  glm: "square",
  gpt: "diamond",
  gemini: "circle",
  kimi: "triangle",
  longcat: "square",
  deepseek: "diamond",
};

function bestSoFar(
  points: TrajectoryChartPoint[],
  direction: ScoreDirection,
  finalMessageIndex: number,
) {
  if (points.length === 0) return [];
  let running = points[0]?.score;
  const result = [{ ...points[0], score: running }];

  for (const point of points.slice(1)) {
    const improved =
      direction === "higher" ? point.score > running : point.score < running;
    if (!improved) continue;
    running = point.score;
    result.push({ ...point, score: running });
  }

  const last = result.at(-1);
  if (last && finalMessageIndex > last.messageIndex) {
    result.push({ messageIndex: finalMessageIndex, score: running });
  }
  return result;
}

function distributeLabelPositions(
  labels: Array<{ id: string; y: number }>,
  minY: number,
  maxY: number,
  gap: number,
) {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  const positioned = sorted.map((label, index) => ({
    ...label,
    labelY:
      index === 0
        ? Math.max(minY, label.y)
        : Math.max(label.y, sorted[index - 1].y),
  }));

  for (let index = 1; index < positioned.length; index += 1) {
    positioned[index].labelY = Math.max(
      positioned[index].labelY,
      positioned[index - 1].labelY + gap,
    );
  }
  if (positioned.at(-1)?.labelY && positioned.at(-1)!.labelY > maxY) {
    positioned[positioned.length - 1].labelY = maxY;
    for (let index = positioned.length - 2; index >= 0; index -= 1) {
      positioned[index].labelY = Math.min(
        positioned[index].labelY,
        positioned[index + 1].labelY - gap,
      );
    }
  }
  if (positioned[0]?.labelY < minY) {
    const shift = minY - positioned[0].labelY;
    positioned.forEach((label) => {
      label.labelY += shift;
    });
  }
  return new Map(positioned.map((label) => [label.id, label.labelY]));
}

function formatReward(value: number) {
  return value.toFixed(2);
}

function autolabReward(score: number, scale: TrajectoryRewardScale) {
  if (!Number.isFinite(score)) return 0;
  if (scale.mustBeat != null && score >= scale.mustBeat) return 0;

  let reward = 0;
  if (scale.kind === "anchored-linear") {
    reward = (score - scale.baseline) / (scale.reference - scale.baseline);
  } else if (score > 0) {
    const speedup = scale.baseline / score;
    const referenceSpeedup = scale.baseline / scale.reference;
    reward =
      speedup > 1 && referenceSpeedup > 1
        ? (0.5 * Math.log(speedup)) / Math.log(referenceSpeedup)
        : 0;
  }
  return Number.isFinite(reward) ? Math.min(1, Math.max(0, reward)) : 0;
}

function chartCoordinate(value: number) {
  return Math.round(value * 1000) / 1000;
}

function Marker({
  kind,
  x,
  y,
  color,
  size = 5,
}: {
  kind: "circle" | "square" | "diamond" | "triangle";
  x: number;
  y: number;
  color: string;
  size?: number;
}) {
  if (kind === "square") {
    return (
      <rect
        x={x - size}
        y={y - size}
        width={size * 2}
        height={size * 2}
        rx={1.5}
        fill="white"
        stroke={color}
        strokeWidth={2}
        pointerEvents="none"
      />
    );
  }
  if (kind === "diamond") {
    return (
      <path
        d={`M ${x} ${y - size - 1} L ${x + size + 1} ${y} L ${x} ${
          y + size + 1
        } L ${x - size - 1} ${y} Z`}
        fill="white"
        stroke={color}
        strokeWidth={2}
        pointerEvents="none"
      />
    );
  }
  if (kind === "triangle") {
    return (
      <path
        d={`M ${x} ${y - size - 1} L ${x + size + 1} ${
          y + size
        } L ${x - size - 1} ${y + size} Z`}
        fill="white"
        stroke={color}
        strokeWidth={2}
        pointerEvents="none"
      />
    );
  }
  return (
    <circle
      cx={x}
      cy={y}
      r={size}
      fill="white"
      stroke={color}
      strokeWidth={2}
      pointerEvents="none"
    />
  );
}

export function TrajectoryComparisonChart({
  task,
  direction,
  rewardScale,
  axisMode,
  onAxisModeChange,
  series,
  requestedModel,
}: TrajectoryComparisonChartProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartFrameRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [localFocus, setLocalFocus] = useState<string | null>(null);
  const [layoutWidth, setLayoutWidth] = useState(DEFAULT_WIDTH);
  const focusedModel = localFocus ?? requestedModel;

  useEffect(() => {
    const element = containerRef.current;
    if (!element || entered) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px 0px", threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [entered]);

  useEffect(() => {
    const element = chartFrameRef.current;
    if (!element) return;

    let observer: ResizeObserver | null = null;
    const updateWidth = () => {
      const nextWidth = Math.max(300, Math.round(element.getBoundingClientRect().width));
      setLayoutWidth((current) => (current === nextWidth ? current : nextWidth));
    };
    // Wait one painted frame before measuring. This keeps the server snapshot in
    // place for hydration while still switching to the real responsive geometry
    // before the reader begins interacting with the chart.
    const frame = window.requestAnimationFrame(() => {
      updateWidth();
      observer = new ResizeObserver(updateWidth);
      observer.observe(element);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  const chart = useMemo(() => {
    const width = layoutWidth;
    const compact = width < 560;
    const height = compact ? 360 : width < 820 ? 400 : DESKTOP_HEIGHT;
    const margin = compact
      ? { top: 24, right: 60, bottom: 54, left: 52 }
      : { top: 26, right: 92, bottom: 58, left: 88 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const maxMessages = Math.max(...series.map((item) => item.messageCount));
    const rewardFor = (score: number) => autolabReward(score, rewardScale);

    const x = (point: TrajectoryChartPoint, item: TrajectoryChartSeries) => {
      const value =
        axisMode === "progress"
          ? point.messageIndex / Math.max(1, item.messageCount - 1)
          : (point.messageIndex + 1) / Math.max(1, maxMessages);
      return chartCoordinate(margin.left + value * plotWidth);
    };
    const y = (score: number) => {
      return chartCoordinate(
        margin.top + (1 - rewardFor(score)) * plotHeight,
      );
    };
    const pathFor = (points: TrajectoryChartPoint[], item: TrajectoryChartSeries) =>
      points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${x(point, item)} ${y(point.score)}`)
        .join(" ");

    const yTicks = REWARD_TICKS.map((value) => ({
      y: chartCoordinate(margin.top + (1 - value) * plotHeight),
      value,
    }));
    const xTickCount = compact ? 3 : 5;
    const xTicks = Array.from({ length: xTickCount }, (_, index) => {
      const ratio = index / (xTickCount - 1);
      return {
        x: chartCoordinate(margin.left + ratio * plotWidth),
        label:
          axisMode === "progress"
            ? `${Math.round(ratio * 100)}%`
            : Math.round(ratio * maxMessages).toLocaleString("en-US"),
      };
    });

    const mainPointsById = new Map(
      series.map((item) => [
        item.trajectoryId,
        item.status === "single-checkpoint"
          ? item.points
          : bestSoFar(item.points, direction, item.messageCount - 1),
      ]),
    );
    const pathById = new Map(
      series.map((item) => [
        item.trajectoryId,
        pathFor(mainPointsById.get(item.trajectoryId) ?? [], item),
      ]),
    );
    const labelYById = distributeLabelPositions(
      series.flatMap((item) => {
        const endpoint = mainPointsById.get(item.trajectoryId)?.at(-1);
        return endpoint
          ? [{ id: item.trajectoryId, y: y(endpoint.score) }]
          : [];
      }),
      margin.top + 6,
      margin.top + plotHeight - 6,
      compact ? 13 : 16,
    );

    return {
      width,
      height,
      compact,
      margin,
      plotWidth,
      plotHeight,
      x,
      y,
      rewardFor,
      pathFor,
      pathById,
      mainPointsById,
      labelYById,
      yTicks,
      xTicks,
    };
  }, [axisMode, direction, layoutWidth, rewardScale, series]);

  const activeSeries = focusedModel
    ? series.find((item) => item.modelKey === focusedModel)
    : undefined;
  const activeModel = activeSeries ? MODEL_BY_KEY[activeSeries.modelKey] : null;
  const activeRewards =
    activeSeries?.points.map((point) => chart.rewardFor(point.score)) ?? [];
  const activeBestReward = activeRewards.length
    ? Math.max(...activeRewards)
    : undefined;

  const navigate = (trajectoryId: string) => router.push(`/trajectories/${trajectoryId}`);

  return (
    <div ref={containerRef} className="rounded-2xl border border-border bg-surface p-3 sm:p-5">
      <div className="relative flex min-h-[3rem] justify-center pb-3 lg:items-start">
        <div className="flex justify-center">
          <AxisToggle
            task={task}
            mode={axisMode}
            setMode={onAxisModeChange}
          />
        </div>
        {activeSeries && activeModel ? (
          <div className="absolute right-0 top-0 hidden min-w-0 rounded-lg bg-background px-3 py-2 text-xs ring-1 ring-border lg:block lg:w-[15rem] lg:text-right">
            <p className="font-semibold" style={{ color: activeModel.color }}>
              {activeModel.short}
            </p>
            <p className="mt-0.5 tabular-nums text-muted">
              {activeSeries.status === "single-checkpoint"
                ? `one validated checkpoint · reward ${formatReward(activeRewards[0])}`
                : `${formatReward(activeRewards[0])} → best ${formatReward(activeBestReward as number)}`}
            </p>
          </div>
        ) : null}
      </div>

      <div ref={chartFrameRef} className="relative min-h-[360px] w-full sm:min-h-[320px]">
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          width={chart.width}
          height={chart.height}
          className="block h-auto w-full"
          role="group"
          aria-labelledby={`${task}-chart-title ${task}-chart-desc`}
        >
          <title id={`${task}-chart-title`}>{`${task} model trajectory comparison`}</title>
          <desc id={`${task}-chart-desc`}>{`Running-best AutoLab reward for seven models, computed by applying the task's official scoring rule to trajectory evaluator observations. Rewards are clipped to the zero-to-one range and shown on a linear vertical axis. Focus or select an interactive line to inspect or open its full trajectory.`}</desc>

          {chart.yTicks.map((tick, index) => (
            <g key={`y-${index}`}>
              <line
                x1={chart.margin.left}
                x2={chart.width - chart.margin.right}
                y1={tick.y}
                y2={tick.y}
                stroke="var(--color-border)"
                strokeWidth={1}
              />
              <text
                x={chart.margin.left - (chart.compact ? 8 : 12)}
                y={tick.y + 4}
                textAnchor="end"
                fill="var(--color-muted)"
                fontSize={chart.compact ? 9.5 : 11}
                fontFamily="var(--font-mono)"
              >
                {formatReward(tick.value)}
              </text>
            </g>
          ))}
          {chart.xTicks.map((tick, index) => (
            <g key={`x-${index}`}>
              <line
                x1={tick.x}
                x2={tick.x}
                y1={chart.margin.top}
                y2={chart.height - chart.margin.bottom}
                stroke="var(--color-border)"
                strokeWidth={1}
                strokeDasharray={
                  index === 0 || index === chart.xTicks.length - 1 ? undefined : "3 6"
                }
                strokeOpacity={
                  index === 0 || index === chart.xTicks.length - 1 ? 0.8 : 0.55
                }
              />
              <text
                x={tick.x}
                y={chart.height - chart.margin.bottom + 24}
                textAnchor="middle"
                fill="var(--color-muted)"
                fontSize={chart.compact ? 9.5 : 11}
                fontFamily="var(--font-mono)"
              >
                {tick.label}
              </text>
            </g>
          ))}
          <text
            x={chart.margin.left + chart.plotWidth / 2}
            y={chart.height - 10}
            textAnchor="middle"
            fill="var(--color-muted)"
            fontSize={chart.compact ? 10.5 : 12}
          >
            {axisMode === "progress" ? "Relative progress" : "Absolute progress"}
          </text>
          <text
            transform={`translate(${chart.compact ? 12 : 18} ${
              chart.margin.top + chart.plotHeight / 2
            }) rotate(-90)`}
            textAnchor="middle"
            fill="var(--color-muted)"
            fontSize={chart.compact ? 10 : 12}
          >
            AutoLab reward ↑
          </text>

          <g key={axisMode} className="trajectory-chart-swap">
            {activeSeries?.status === "curve" ? (
              <path
                d={chart.pathFor(activeSeries.points, activeSeries)}
                fill="none"
                stroke={activeModel?.color ?? "var(--color-muted)"}
                strokeWidth={1.4}
                strokeOpacity={0.26}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}

            {series.map((item, index) => {
              const model = MODEL_BY_KEY[item.modelKey];
              const color = model?.color ?? "#777";
              const points = chart.mainPointsById.get(item.trajectoryId) ?? [];
              const isFocused = focusedModel === item.modelKey;
              const dimmed = focusedModel != null && !isFocused;
              const last = points.at(-1);
              const itemBestReward = Math.max(
                ...item.points.map((point) => chart.rewardFor(point.score)),
              );

              if (item.status === "single-checkpoint" || points.length === 1) {
                const point = points[0];
                return (
                  <g
                    key={item.trajectoryId}
                    opacity={dimmed ? 0.22 : 1}
                    role="link"
                    tabIndex={0}
                    aria-label={`${model?.name ?? item.modelKey}: one validated checkpoint at AutoLab reward ${formatReward(chart.rewardFor(point.score))}. Open trajectory.`}
                    onClick={() => navigate(item.trajectoryId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(item.trajectoryId);
                      }
                    }}
                    onFocus={() => setLocalFocus(item.modelKey)}
                    onBlur={() => setLocalFocus(null)}
                    className="trajectory-chart-hit cursor-pointer outline-none"
                  >
                      <circle
                        cx={chart.x(point, item)}
                        cy={chart.y(point.score)}
                        r={14}
                        fill={color}
                        fillOpacity={0.1}
                        stroke={color}
                        strokeDasharray="3 3"
                      />
                      <Marker
                        kind="diamond"
                        x={chart.x(point, item)}
                        y={chart.y(point.score)}
                        color={color}
                        size={6}
                      />
                  </g>
                );
              }

              const path = chart.pathById.get(item.trajectoryId) ?? "";
              return (
                <g key={item.trajectoryId} opacity={dimmed ? 0.18 : 1}>
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={isFocused ? 3.5 : 2.5}
                    strokeDasharray={LINE_DASH[item.modelKey]}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    pathLength={1}
                    className={entered ? "trajectory-line-reveal" : "trajectory-line-hidden"}
                    style={{ animationDelay: `${index * 70}ms` }}
                    aria-hidden="true"
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={18}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    pointerEvents="stroke"
                    role="link"
                    tabIndex={0}
                    className="trajectory-chart-hit cursor-pointer outline-none"
                    aria-label={`${model?.name ?? item.modelKey}: ${item.messageCount} messages, ${item.checkpointCount} evaluator checkpoints, best AutoLab reward ${formatReward(
                      itemBestReward,
                    )}. Open trajectory.`}
                    onMouseEnter={() => setLocalFocus(item.modelKey)}
                    onMouseLeave={() => setLocalFocus(null)}
                    onFocus={() => setLocalFocus(item.modelKey)}
                    onBlur={() => setLocalFocus(null)}
                    onClick={() => navigate(item.trajectoryId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(item.trajectoryId);
                      }
                    }}
                  />
                  {last ? (
                    <Marker
                      kind={MARKER[item.modelKey] ?? "circle"}
                      x={chart.x(last, item)}
                      y={chart.y(last.score)}
                      color={color}
                      size={isFocused ? 6 : 4.5}
                    />
                  ) : null}
                </g>
              );
            })}

            {series.map((item) => {
              const model = MODEL_BY_KEY[item.modelKey];
              const color = model?.color ?? "#777";
              const endpoint = chart.mainPointsById.get(item.trajectoryId)?.at(-1);
              const labelY = chart.labelYById.get(item.trajectoryId);
              if (!endpoint || labelY == null) return null;
              const endpointX = chart.x(endpoint, item);
              const endpointY = chart.y(endpoint.score);
              const labelX = Math.min(
                endpointX + (chart.compact ? 6 : 8),
                chart.width - chart.margin.right + (chart.compact ? 5 : 7),
              );
              const dimmed = focusedModel != null && focusedModel !== item.modelKey;
              return (
                <g
                  key={`${item.trajectoryId}-label`}
                  opacity={dimmed ? 0.2 : 1}
                  aria-hidden="true"
                  pointerEvents="none"
                >
                  <line
                    x1={endpointX + 3}
                    y1={endpointY}
                    x2={labelX - 2}
                    y2={labelY}
                    stroke={color}
                    strokeWidth={0.9}
                    strokeOpacity={0.55}
                  />
                  <text
                    x={labelX}
                    y={labelY + (chart.compact ? 3 : 3.5)}
                    fill={color}
                    fontSize={chart.compact ? 9 : 10.5}
                    fontWeight={650}
                    paintOrder="stroke"
                    stroke="var(--color-surface)"
                    strokeWidth={chart.compact ? 3 : 4}
                    strokeLinejoin="round"
                  >
                    {model?.short ?? item.modelKey}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

function AxisToggle({
  task,
  mode,
  setMode,
}: {
  task: string;
  mode: TrajectoryAxisMode;
  setMode: (mode: TrajectoryAxisMode) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-border bg-background/70 p-1"
      role="group"
      aria-label={`${task} horizontal axis`}
    >
      {([
        ["progress", "Relative progress"],
        ["messages", "Absolute progress"],
      ] as const).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            mode === value
              ? "bg-accent-soft text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
