"use client";

import { useState } from "react";
import { MODELS, LEADERBOARD, type CategoryKey } from "@/lib/benchmark-data";
import { ModelIcon } from "./ModelIcon";

const CHART_H = 300; // px, plot area height

// Figure 2 style stacked bars: solid avg@3 bottom, translucent best@3 gain on top.
export function LeaderboardChart({ category }: { category: CategoryKey }) {
  const scores = LEADERBOARD[category];
  const ranked = [...MODELS]
    .map((m) => ({ m, s: scores[m.key] }))
    .sort((a, b) => b.s.avg3 - a.s.avg3);

  const [hover, setHover] = useState<string | null>(null);

  // Dynamic Y axis: fit the current category's data with a little padding,
  // snapped to 0.1 grid lines. Different categories span very different ranges
  // (e.g. CUDA dips to ~0.21), so a fixed 0.4–0.85 window would clip bars.
  const values = ranked.flatMap(({ s }) => [s.avg3, s.best3]);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const yMin = Math.max(0, Math.floor((dataMin - 0.05) * 10) / 10);
  const yMax = Math.min(1, Math.ceil((dataMax + 0.03) * 10) / 10);
  const span = yMax - yMin || 1;

  const ticks: number[] = [];
  for (let t = yMin; t <= yMax + 1e-9; t += 0.1) ticks.push(Math.round(t * 10) / 10);

  const px = (v: number) =>
    Math.max(((Math.min(Math.max(v, yMin), yMax) - yMin) / span) * CHART_H, 0);

  return (
    <figure className="w-full" aria-labelledby={`leaderboard-chart-${category}`}>
      <h3 id={`leaderboard-chart-${category}`} className="sr-only">
        {category} avg@3 and best@3 model comparison
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-accent" />
          avg@3
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-accent/30" />
          best@3 gain
        </span>
      </div>

      <div className="relative pl-9" style={{ height: CHART_H }}>
        {/* Y axis grid + labels */}
        <div className="pointer-events-none absolute inset-0 left-9">
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute left-0 right-0 flex items-center"
              style={{ bottom: px(t) }}
            >
              <span className="absolute -left-9 -translate-y-1/2 text-[11px] text-muted">
                {t.toFixed(1)}
              </span>
              <div className="h-px w-full bg-border" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="relative z-10 grid h-full w-full grid-cols-7 items-end gap-2">
          {ranked.map(({ m, s }) => {
            const dim = hover && hover !== m.key;
            const hBest = px(s.best3);
            const hAvg = px(s.avg3);
            return (
              <div
                key={m.key}
                className="group flex h-full min-w-0 flex-col items-center justify-end rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                role="img"
                tabIndex={0}
                title={`${m.name}: avg@3 ${s.avg3.toFixed(3)}, best@3 ${s.best3.toFixed(3)}`}
                onMouseEnter={() => setHover(m.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(m.key)}
                onBlur={() => setHover(null)}
                aria-label={`${m.name}: avg@3 ${s.avg3.toFixed(3)}, best@3 ${s.best3.toFixed(3)}`}
              >
                <span
                  className={`mb-1 text-[11px] font-semibold tabular-nums transition-opacity ${
                    dim ? "opacity-30" : "opacity-100"
                  }`}
                >
                  {s.best3.toFixed(3)}
                </span>
                <div
                  className="relative w-full max-w-[54px] rounded-t-md transition-opacity"
                  style={{ height: hBest, opacity: dim ? 0.3 : 1 }}
                >
                  {/* best@3 gain (light, full bar) */}
                  <div
                    className="absolute inset-0 rounded-t-md"
                    style={{ backgroundColor: m.color, opacity: 0.28 }}
                  />
                  {/* avg@3 (solid, from base) */}
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t-md"
                    style={{ height: hAvg, backgroundColor: m.color }}
                  >
                    <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded-sm bg-foreground/85 px-1 text-center text-[11px] font-semibold tabular-nums text-white">
                      {s.avg3.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X axis labels */}
      <div className="mt-2 grid grid-cols-7 gap-2 pl-9">
        {ranked.map(({ m }) => (
          <div
            key={m.key}
            className="flex min-w-0 flex-col items-center gap-1"
            onMouseEnter={() => setHover(m.key)}
            onMouseLeave={() => setHover(null)}
          >
            <ModelIcon model={m} size={24} />
            <span className="text-center text-[10px] leading-tight text-muted">
              {m.short}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-[11px] leading-relaxed text-muted">
        Solid segments show avg@3, while full bar heights show best@3. Category views compare the
        same seven models across Model Development, System Optimization, Puzzle &amp; Challenge, and
        CUDA.
      </figcaption>
    </figure>
  );
}
