"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { MODELS, IN_TASK, INTER_TASK } from "@/lib/benchmark-data";
import { ModelIcon } from "./ModelIcon";

export type SelfImprovementMode = "in" | "inter";

interface SelfImprovementChartProps {
  mode?: SelfImprovementMode;
  showTabs?: boolean;
}

export function SelfImprovementChart({
  mode: initialMode = "in",
  showTabs = true,
}: SelfImprovementChartProps) {
  const [selectedMode, setSelectedMode] = useState<SelfImprovementMode>(initialMode);
  const mode = showTabs ? selectedMode : initialMode;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const data = mode === "in" ? IN_TASK : INTER_TASK;
  const titleId = `self-improvement-title-${showTabs ? "switcher" : mode}`;
  const descriptionId = `self-improvement-description-${showTabs ? "switcher" : mode}`;
  const panelId = `self-improvement-panel-${showTabs ? "switcher" : mode}`;
  const tabSuffix = showTabs ? "" : `-${mode}`;
  const title = mode === "in" ? "Intra-Task Experience Reuse" : "Inter-Task Experience Reuse";

  // Sort by gain, descending, to make the "who benefits most" story legible.
  const rows = [...MODELS]
    .map((m) => ({ m, ...data[m.key] }))
    .sort((a, b) => b.gain - a.gain);

  const modes = ["in", "inter"] as const;

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      nextIndex = index === 0 ? 1 : 0;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = modes.length - 1;
    }

    if (nextIndex == null) return;
    event.preventDefault();
    setSelectedMode(modes[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5" aria-labelledby={titleId}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id={titleId} className="text-base font-semibold">{title}</h3>
          <p id={descriptionId} className="mt-0.5 text-xs text-muted">
            {mode === "in"
              ? "Per-model first-commit reward with and without retained experience, together with the corresponding intra-task gain, averaged over 32 retained trajectories."
              : "Per-model avg@3 with and without distilled experience, together with the corresponding inter-task gain across 19 held-out targets."}
          </p>
        </div>
        {showTabs ? <div
          className="flex rounded-lg bg-background p-0.5 ring-1 ring-border"
          role="tablist"
          aria-label="Self-improvement experiment"
        >
          <button
            ref={(node) => {
              tabRefs.current[0] = node;
            }}
            type="button"
            id={`self-improvement-tab-in${tabSuffix}`}
            role="tab"
            aria-selected={mode === "in"}
            aria-controls={panelId}
            tabIndex={mode === "in" ? 0 : -1}
            onClick={() => setSelectedMode("in")}
            onKeyDown={(event) => handleTabKeyDown(event, 0)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
              mode === "in" ? "bg-accent text-white" : "text-muted"
            }`}
          >
            Intra-task
          </button>
          <button
            ref={(node) => {
              tabRefs.current[1] = node;
            }}
            type="button"
            id={`self-improvement-tab-inter${tabSuffix}`}
            role="tab"
            aria-selected={mode === "inter"}
            aria-controls={panelId}
            tabIndex={mode === "inter" ? 0 : -1}
            onClick={() => setSelectedMode("inter")}
            onKeyDown={(event) => handleTabKeyDown(event, 1)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
              mode === "inter" ? "bg-accent text-white" : "text-muted"
            }`}
          >
            Inter-task
          </button>
        </div> : null}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={showTabs ? `self-improvement-tab-${mode}${tabSuffix}` : titleId}
        aria-describedby={descriptionId}
        tabIndex={0}
        className="space-y-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
      >
        {rows.map(({ m, withExp, withoutExp, gain }) => (
          <div
            key={m.key}
            className="flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            role="img"
            tabIndex={0}
            aria-label={`${m.name}: reward with experience ${withExp.toFixed(2)}, reward without experience ${withoutExp.toFixed(2)}, ${gain > 0 ? "improvement" : gain < 0 ? "decline" : "no change"} ${Math.abs(gain).toFixed(3)}`}
          >
            <div className="flex w-28 shrink-0 items-center gap-1.5">
              <ModelIcon model={m} size={18} />
              <span className="truncate text-xs">{m.short}</span>
            </div>

            {/* reward bars: without (light) vs with (solid) */}
            <div className="flex flex-1 items-center gap-2">
              <div className="flex h-5 flex-1 items-center gap-1">
                <div className="relative h-full flex-1 rounded bg-background ring-1 ring-border">
                  <div
                    className="absolute inset-y-0 left-0 rounded-l"
                    style={{
                      width: `${withoutExp * 100}%`,
                      backgroundImage: `repeating-linear-gradient(135deg, ${m.color} 0, ${m.color} 2px, transparent 2px, transparent 5px)`,
                      opacity: 0.45,
                    }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-l"
                    style={{
                      width: `${withExp * 100}%`,
                      backgroundColor: m.color,
                      opacity: 0.55,
                    }}
                  />
                </div>
              </div>

              {/* gain chip */}
              <span
                className={`w-16 shrink-0 text-right text-xs font-semibold tabular-nums ${
                  gain >= 0 ? "text-accent" : "text-red-700"
                }`}
                title={`with ${withExp.toFixed(2)} / without ${withoutExp.toFixed(2)}`}
              >
                <span aria-hidden="true">
                  {gain > 0 ? "↑ " : gain < 0 ? "↓ " : "— "}
                </span>
                {gain > 0 ? "+" : ""}
                {gain.toFixed(3)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm bg-accent/55" />
          with experience
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-sm border border-accent/50"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, color-mix(in srgb, var(--accent) 55%, transparent) 0, color-mix(in srgb, var(--accent) 55%, transparent) 2px, transparent 2px, transparent 5px)",
            }}
          />
          without experience
        </span>
        <span className="sm:ml-auto">
          gain Δ = reward(with) − reward(without)
        </span>
      </div>

      <table className="sr-only">
        <caption>
          {mode === "in" ? "Intra-task" : "Inter-task"} experience-reuse data
        </caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col">With experience</th>
            <th scope="col">Without experience</th>
            <th scope="col">Gain</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ m, withExp, withoutExp, gain }) => (
            <tr key={m.key}>
              <th scope="row">{m.name}</th>
              <td>{withExp.toFixed(2)}</td>
              <td>{withoutExp.toFixed(2)}</td>
              <td>{gain >= 0 ? "+" : ""}{gain.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
