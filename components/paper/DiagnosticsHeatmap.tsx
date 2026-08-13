import { MODELS } from "@/lib/benchmark-data";
import {
  BEHAVIORAL_DIAGNOSTICS,
  DIAGNOSTIC_METRICS,
  type DiagnosticFormat,
  type DiagnosticGroup,
  type DiagnosticMetricKey,
  type PaperModelKey,
} from "@/lib/paper-data";

import { ModelIcon } from "../ModelIcon";
import { ChartFrame } from "./ChartFrame";

const GROUP_META: Record<
  DiagnosticGroup,
  { label: string; rgb: readonly [number, number, number] }
> = {
  c1: { label: "C1 Routes to progress", rgb: [79, 124, 168] },
  c2: { label: "C2 Implementation pathways", rgb: [79, 154, 103] },
  c3: { label: "C3 Feedback behavior", rgb: [179, 107, 44] },
  support: { label: "Observation support", rgb: [107, 114, 128] },
};

const MODEL_BY_KEY = new Map(MODELS.map((model) => [model.key, model]));

function getModel(key: PaperModelKey) {
  const model = MODEL_BY_KEY.get(key);
  if (!model) throw new Error(`Paper model metadata not found: ${key}`);
  return model;
}

function formatDiagnostic(value: number, format: DiagnosticFormat) {
  if (format === "percent-1") return `${(value * 100).toFixed(1)}%`;
  if (format === "decimal-2") return value.toFixed(2);
  return value.toFixed(3);
}

function normalizedValue(metric: DiagnosticMetricKey, value: number) {
  const values = BEHAVIORAL_DIAGNOSTICS.rows.map((row) => row[metric]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return max === min ? 0.5 : (value - min) / (max - min);
}

function cellBackground(group: DiagnosticGroup, metric: DiagnosticMetricKey, value: number) {
  const [red, green, blue] = GROUP_META[group].rgb;
  const alpha = 0.08 + normalizedValue(metric, value) * 0.3;
  return `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
}

export function DiagnosticsHeatmap() {
  return (
    <ChartFrame
      id="behavioral-diagnostics"
      title="Behavioral diagnostics across models"
      subtitle={`${BEHAVIORAL_DIAGNOSTICS.sample}. These diagnostics are not a second ranking: shading compares models only within each column, and a larger value is not uniformly preferable. Evaluated commit rounds indicate observation support rather than an additional capability measure.`}
      summary="The table reports ten trajectory diagnostics. Shading only compares values within a column and does not indicate overall capability. Every cell also prints its exact value."
      source={BEHAVIORAL_DIAGNOSTICS.source}
    >
      <div
        className="overflow-x-auto rounded-xl border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        role="region"
        aria-label="Scrollable behavioral diagnostics table"
        tabIndex={0}
      >
        <table className="min-w-[940px] w-full border-separate border-spacing-0 text-center text-[11px]">
          <caption className="sr-only">
            Behavioral diagnostics for seven models. Each metric is task balanced across 36 tasks.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                rowSpan={2}
                className="sticky left-0 z-20 w-36 border-b border-r border-border bg-surface px-3 py-2 text-left font-semibold"
              >
                Model
              </th>
              {(["c1", "c2", "c3", "support"] as const).map((group) => {
                const count = DIAGNOSTIC_METRICS.filter((metric) => metric.group === group).length;
                const [red, green, blue] = GROUP_META[group].rgb;
                return (
                  <th
                    key={group}
                    scope="colgroup"
                    colSpan={count}
                    className="border-b border-r border-border px-3 py-2 font-semibold last:border-r-0"
                    style={{ backgroundColor: `rgba(${red}, ${green}, ${blue}, .10)` }}
                  >
                    {GROUP_META[group].label}
                  </th>
                );
              })}
            </tr>
            <tr>
              {DIAGNOSTIC_METRICS.map((metric) => (
                <th
                  key={metric.key}
                  scope="col"
                  className="h-16 min-w-[78px] border-b border-r border-border bg-background/80 px-2 py-2 align-bottom font-medium leading-tight last:border-r-0"
                >
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BEHAVIORAL_DIAGNOSTICS.rows.map((row) => {
              const model = getModel(row.model);
              return (
                <tr key={row.model}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b border-r border-border bg-surface px-3 py-2.5 text-left last:border-b-0"
                  >
                    <span className="flex items-center gap-2">
                      <ModelIcon model={model} size={22} />
                      <span className="truncate text-xs font-semibold">{model.short}</span>
                    </span>
                  </th>
                  {DIAGNOSTIC_METRICS.map((metric) => {
                    const value = row[metric.key];
                    const formatted = formatDiagnostic(value, metric.format);
                    return (
                      <td
                        key={metric.key}
                        className="border-b border-r border-white/75 px-2 py-3 font-mono font-medium tabular-nums last:border-r-0"
                        style={{ backgroundColor: cellBackground(metric.group, metric.key, value) }}
                        aria-label={`${model.name}, ${metric.label}: ${formatted}`}
                      >
                        {formatted}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-5 max-w-4xl text-xs leading-5 text-muted">
        DeepSeek has the lowest peak retention at 80.4% and the deepest average dips at
        0.291, showing that its Feedback Control is limited by both losing strong intermediate
        results and suffering more severe regressions.
      </p>
    </ChartFrame>
  );
}
