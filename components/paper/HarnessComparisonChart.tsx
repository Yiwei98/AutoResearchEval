import { MODELS } from "@/lib/benchmark-data";
import {
  HARNESS_COMPARISON,
  type HarnessKind,
  type PaperModelKey,
} from "@/lib/paper-data";

import { ModelIcon } from "../ModelIcon";
import { ChartFrame } from "./ChartFrame";

const MODEL_BY_KEY = new Map(MODELS.map((model) => [model.key, model]));
const MODEL_ORDER = ["claude", "gpt", "kimi"] as const;

const HARNESS_STYLE: Record<
  HarnessKind,
  { color: string; mark: string; label: string }
> = {
  shared: { color: "#d18b6d", mark: "CC", label: "Shared Claude Code" },
  native: { color: "#8bb8c8", mark: "N", label: "Model-native harness" },
  "shared-native": { color: "#d18b6d", mark: "CC/N", label: "Claude Code (shared and native)" },
  open: { color: "#74beba", mark: "O", label: "OpenCode" },
};

function getModel(key: PaperModelKey) {
  const model = MODEL_BY_KEY.get(key);
  if (!model) throw new Error(`Paper model metadata not found: ${key}`);
  return model;
}

export function HarnessComparisonChart() {
  return (
    <ChartFrame
      id="harness-comparison"
      title="Harness Comparison: Leading, Native, and Open-Source Harnesses"
      subtitle="Coding harness comparison across Claude Code, each model’s native harness, and OpenCode. Dark bars show avg@3 and light bars show best@3."
      summary="Model ranking is unchanged across harnesses. Native and OpenCode harnesses improve GPT and Kimi average performance more than best performance, indicating greater run-to-run stability."
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm bg-foreground/75" aria-hidden="true" />
          Solid extent: avg@3
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-3 w-5 rounded-sm bg-foreground/20"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent 0, transparent 3px, rgba(255,255,255,.75) 3px, rgba(255,255,255,.75) 5px)",
            }}
            aria-hidden="true"
          />
          Hatched extent: best@3
        </span>
        <span className="ml-auto font-mono tabular-nums">Scale 0.000 - 1.000</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {MODEL_ORDER.map((modelKey) => {
          const model = getModel(modelKey);
          const rows = HARNESS_COMPARISON.rows.filter((row) => row.model === modelKey);
          return (
            <section
              key={modelKey}
              className="rounded-xl border border-border bg-background/65 p-3.5"
              aria-labelledby={`harness-${modelKey}-title`}
            >
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
                <ModelIcon model={model} size={24} />
                <h4 id={`harness-${modelKey}-title`} className="text-xs font-semibold">
                  {model.name}
                </h4>
              </div>

              <div className="space-y-4">
                {rows.map((row) => {
                  const style = HARNESS_STYLE[row.kind];
                  const avg = row.overall.avg3;
                  const best = row.overall.best3;
                  return (
                    <div
                      key={row.harness}
                      className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      tabIndex={0}
                      aria-label={`${model.name}, ${row.harness}: avg@3 ${avg.toFixed(3)}, best@3 ${best.toFixed(3)}`}
                    >
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          className="flex h-4 min-w-7 items-center justify-center rounded-sm px-1 text-[7px] font-bold text-foreground/80"
                          style={{ backgroundColor: style.color }}
                          aria-hidden="true"
                        >
                          {style.mark}
                        </span>
                        <span className="truncate text-[10px] font-medium">{row.shortLabel}</span>
                      </div>
                      <div className="relative h-4 overflow-hidden rounded bg-surface ring-1 ring-border" aria-hidden="true">
                        <span
                          className="absolute inset-y-0 left-0 rounded-r"
                          style={{
                            width: `${best * 100}%`,
                            backgroundColor: `${style.color}55`,
                            backgroundImage:
                              "repeating-linear-gradient(135deg, transparent 0, transparent 4px, rgba(255,255,255,.70) 4px, rgba(255,255,255,.70) 6px)",
                          }}
                        />
                        <span
                          className="absolute inset-y-0 left-0 rounded-r"
                          style={{ width: `${avg * 100}%`, backgroundColor: style.color }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between gap-2 font-mono text-[9px] tabular-nums">
                        <span>
                          <span className="text-muted">avg </span>
                          <span className="font-semibold">{avg.toFixed(3)}</span>
                        </span>
                        <span>
                          <span className="text-muted">best </span>
                          <span className="font-semibold">{best.toFixed(3)}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Harness type legend">
        {(["shared", "native", "open"] as const).map((kind) => (
          <li key={kind} className="flex items-center gap-1.5 text-[9px] text-muted">
            <span
              className="flex h-4 min-w-7 items-center justify-center rounded-sm px-1 text-[7px] font-bold text-foreground/80"
              style={{ backgroundColor: HARNESS_STYLE[kind].color }}
              aria-hidden="true"
            >
              {HARNESS_STYLE[kind].mark}
            </span>
            {HARNESS_STYLE[kind].label}
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>Coding harness comparison values</caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col">Harness</th>
            <th scope="col">avg@3</th>
            <th scope="col">best@3</th>
          </tr>
        </thead>
        <tbody>
          {HARNESS_COMPARISON.rows.map((row) => (
            <tr key={`${row.model}-${row.harness}`}>
              <th scope="row">{getModel(row.model).name}</th>
              <td>{row.harness}</td>
              <td>{row.overall.avg3.toFixed(3)}</td>
              <td>{row.overall.best3.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartFrame>
  );
}
