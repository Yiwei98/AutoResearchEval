"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { ModelIcon } from "@/components/ModelIcon";
import { LEADERBOARD, MODELS } from "@/lib/benchmark-data";

const WIDTH = 820;
const HEIGHT = 370;
const PLOT_LEFT = 170;
const PLOT_RIGHT = 654;
const GAP_COLUMN_X = 790;
const TOP = 68;
const ROW_GAP = 40;
const DOMAIN_MIN = 0.48;
const DOMAIN_MAX = 0.81;
const TICKS = [0.5, 0.6, 0.7, 0.8] as const;

const rows = MODELS.map((model) => ({
  model,
  ...LEADERBOARD.overall[model.key],
})).sort((a, b) => b.avg3 - a.avg3);

function xFor(value: number) {
  return (
    PLOT_LEFT +
    ((value - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN)) *
      (PLOT_RIGHT - PLOT_LEFT)
  );
}

function formatGap(avg3: number, best3: number) {
  return `+${(best3 - avg3).toFixed(3)}`;
}

function mobilePosition(value: number) {
  return `${((value - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN)) * 100}%`;
}

export function ReliabilityGapVisual() {
  const reduceMotion = useReducedMotion();
  const [activeModel, setActiveModel] = useState<string | null>(null);

  return (
    <figure
      className="home-visual-surface bg-surface/95"
      aria-labelledby="home-reliability-title"
      aria-describedby="home-reliability-caption"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-1 pt-4 sm:px-6 sm:pt-6">
        <div>
          <h3
            id="home-reliability-title"
            className="text-sm font-semibold tracking-[-0.02em]"
          >
            Average and best across three runs
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">Overall AutoLab reward</p>
        </div>
        <div
          className="flex items-center gap-4 text-[11px] text-muted sm:text-[10px]"
          aria-hidden="true"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            avg@3
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-foreground/75 bg-surface" />
            best@3
          </span>
        </div>
      </div>

      <div
        className="px-4 pb-1 pt-3 sm:hidden"
        role="img"
        aria-label="Seven model rows showing the distance from average to best AutoLab reward"
      >
        <div className="space-y-4">
          {rows.map(({ model, avg3, best3 }, index) => {
            const start = mobilePosition(avg3);
            const end = mobilePosition(best3);
            const width = `${((best3 - avg3) / (DOMAIN_MAX - DOMAIN_MIN)) * 100}%`;

            return (
              <div key={model.key} className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-semibold">
                    <ModelIcon model={model} size={22} />
                    <span className="truncate">{model.short}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] leading-5 text-muted">
                    {avg3.toFixed(3)} <span aria-hidden="true">→</span> {best3.toFixed(3)}
                    <span className="ml-2 font-semibold text-accent">
                      {formatGap(avg3, best3)}
                    </span>
                  </span>
                </div>
                <div className="relative mt-2 h-5" aria-hidden="true">
                  <motion.span
                    className="absolute top-[9px] h-0.5 origin-left rounded-full bg-foreground/35"
                    style={{ left: start, width }}
                    initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.58,
                      delay: reduceMotion ? 0 : index * 0.055,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                  <motion.span
                    className="absolute top-1 h-[11px] w-[11px] -translate-x-1/2 rounded-full border-2 border-surface bg-accent"
                    style={{ left: start }}
                    initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.3,
                      delay: reduceMotion ? 0 : 0.12 + index * 0.055,
                    }}
                  />
                  <motion.span
                    className="absolute top-1 h-[11px] w-[11px] -translate-x-1/2 rounded-full border-[1.5px] border-foreground bg-surface"
                    style={{ left: end }}
                    initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.3,
                      delay: reduceMotion ? 0 : 0.32 + index * 0.055,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden px-2 pb-1 sm:block sm:px-4">
        <svg
          className="block h-auto w-full overflow-visible"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Dumbbell chart comparing overall average across three runs with the best of three for seven models"
        >
          {TICKS.map((tick) => {
            const x = xFor(tick);
            return (
              <g key={tick} aria-hidden="true">
                <line
                  x1={x}
                  x2={x}
                  y1="44"
                  y2="330"
                  stroke="color-mix(in srgb, var(--border) 72%, var(--foreground))"
                  strokeWidth="1"
                  strokeDasharray="2 7"
                />
                <text
                  x={x}
                  y="352"
                  textAnchor="middle"
                  fill="var(--muted)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          <text
            x={GAP_COLUMN_X}
            y="40"
            textAnchor="end"
            fill="var(--muted)"
            fontSize="9"
            fontWeight="600"
          >
            gap
          </text>

          {rows.map(({ model, avg3, best3 }, index) => {
            const y = TOP + index * ROW_GAP;
            const avgX = xFor(avg3);
            const bestX = xFor(best3);
            const dimmed = activeModel !== null && activeModel !== model.key;
            const selected = activeModel === model.key;

            return (
              <motion.g
                key={model.key}
                role="img"
                tabIndex={0}
                aria-label={`${model.name}: average of three ${avg3.toFixed(3)}, best of three ${best3.toFixed(3)}, gap ${(best3 - avg3).toFixed(3)}`}
                onHoverStart={() => setActiveModel(model.key)}
                onHoverEnd={() => setActiveModel(null)}
                onFocus={() => setActiveModel(model.key)}
                onBlur={() => setActiveModel(null)}
                animate={{ opacity: dimmed ? 0.25 : 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                style={{ outline: "none" }}
              >
                <rect
                  x="4"
                  y={y - 17}
                  width={WIDTH - 8}
                  height="34"
                  rx="9"
                  fill={selected ? "var(--accent-soft)" : "transparent"}
                  stroke={
                    selected
                      ? "color-mix(in srgb, var(--accent) 32%, transparent)"
                      : "transparent"
                  }
                />

                <foreignObject x="16" y={y - 12} width="26" height="26" aria-hidden="true">
                  <div>
                    <ModelIcon model={model} size={24} />
                  </div>
                </foreignObject>
                <text
                  x="51"
                  y={y + 4}
                  fill="var(--foreground)"
                  fontSize="11"
                  fontWeight="600"
                >
                  {model.short}
                </text>

                <motion.line
                  x1={avgX}
                  x2={bestX}
                  y1={y}
                  y2={y}
                  stroke={selected ? "var(--accent)" : "var(--foreground)"}
                  strokeOpacity={selected ? 0.72 : 0.3}
                  strokeWidth={selected ? 4 : 2.5}
                  strokeLinecap="round"
                  initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.62,
                    delay: reduceMotion ? 0 : 0.08 + index * 0.055,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
                <motion.circle
                  cx={avgX}
                  cy={y}
                  r={selected ? 6.5 : 5.25}
                  fill="var(--accent)"
                  stroke="var(--surface)"
                  strokeWidth="2"
                  initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.35,
                    delay: reduceMotion ? 0 : 0.18 + index * 0.055,
                  }}
                />
                <motion.circle
                  cx={bestX}
                  cy={y}
                  r={selected ? 6 : 5.25}
                  fill="var(--surface)"
                  stroke="var(--foreground)"
                  strokeWidth={selected ? 2 : 1.5}
                  initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.35,
                    delay: reduceMotion ? 0 : 0.4 + index * 0.055,
                  }}
                />

                <text
                  x={GAP_COLUMN_X}
                  y={y + 4}
                  textAnchor="end"
                  fill={selected ? "var(--accent)" : "var(--muted)"}
                  fontSize="9.5"
                  fontFamily="var(--font-mono)"
                  fontWeight={selected ? "700" : "500"}
                >
                  {formatGap(avg3, best3)}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      <figcaption
        id="home-reliability-caption"
        className="px-4 pb-4 pt-2 text-[11px] leading-5 text-muted sm:px-6 sm:pb-5"
      >
        The peak-to-average gap is a proxy for run-to-run consistency. A longer connector means
        the strongest result was harder to reproduce across three runs.
      </figcaption>

      <table className="sr-only">
        <caption>Overall avg@3 and best@3 results for seven models</caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col">avg@3</th>
            <th scope="col">best@3</th>
            <th scope="col">Gap</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ model, avg3, best3 }) => (
            <tr key={model.key}>
              <th scope="row">{model.name}</th>
              <td>{avg3.toFixed(3)}</td>
              <td>{best3.toFixed(3)}</td>
              <td>{(best3 - avg3).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default ReliabilityGapVisual;
