import {
  MODELS,
  PROCESS,
  PROCESS_DIMENSIONS,
  type ProcessScores,
} from "@/lib/benchmark-data";

import { ModelIcon } from "./ModelIcon";
import { ChartFrame } from "./paper/ChartFrame";

const CHART_H = 160;
const Y_MIN = 0.4;
const Y_MAX = 1.0;
const SPAN = Y_MAX - Y_MIN;
const TICKS = [0.4, 0.6, 0.8, 1.0];

const DIMENSION_COLOR: Record<keyof ProcessScores, string> = {
  outcome: "#34443b",
  c1: "#4f7ca8",
  c2: "#4f9a67",
  c3: "#b36b2c",
};

const px = (value: number) =>
  Math.max(((Math.min(Math.max(value, Y_MIN), Y_MAX) - Y_MIN) / SPAN) * CHART_H, 2);

export function ProcessChart() {
  return (
    <ChartFrame
      id="process-capability"
      title="Process dimensions across seven models"
      subtitle="Outcome, Solution Framing, Execution, and Feedback Control across seven models. Process scores use task-macro aggregation and lie in [0, 1], where higher is better."
      summary="Claude leads Outcome, Solution Framing, and Execution. GPT and Gemini reach similar outcomes through different balances of Execution and Feedback Control, while LongCat shows that high Feedback Control alone cannot compensate for weak Solution Framing."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PROCESS_DIMENSIONS.map((dimension) => (
          <section
            key={dimension.key}
            className="rounded-xl border border-border bg-background/70 p-3.5"
            aria-labelledby={`process-${dimension.key}`}
          >
            <div className="mb-4 flex items-center gap-2.5">
              <span
                className="h-5 w-1 rounded-full"
                style={{ backgroundColor: DIMENSION_COLOR[dimension.key] }}
                aria-hidden="true"
              />
              <h4 id={`process-${dimension.key}`} className="text-xs font-semibold sm:text-sm">
                {dimension.label}
              </h4>
            </div>

            <div className="relative pl-6" style={{ height: CHART_H }}>
              <div className="pointer-events-none absolute inset-0 left-6" aria-hidden="true">
                {TICKS.map((tick) => (
                  <div
                    key={tick}
                    className="absolute left-0 right-0 flex items-center"
                    style={{ bottom: px(tick) }}
                  >
                    <span className="absolute -left-6 -translate-y-1/2 font-mono text-[9px] text-muted">
                      {tick.toFixed(1)}
                    </span>
                    <span className="h-px w-full bg-border/70" />
                  </div>
                ))}
              </div>

              <div className="relative z-10 grid h-full grid-cols-7 items-end gap-1">
                {MODELS.map((model) => {
                  const value = PROCESS[model.key][dimension.key];
                  return (
                    <div
                      key={model.key}
                      className="group relative flex min-w-0 flex-col items-center justify-end rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      role="img"
                      tabIndex={0}
                      title={`${dimension.label}, ${model.name}: ${value.toFixed(3)}`}
                      aria-label={`${dimension.label}, ${model.name}: ${value.toFixed(3)}`}
                    >
                      <span className="mb-0.5 text-[8px] font-medium tabular-nums text-muted sm:text-[9px]">
                        {value.toFixed(3)}
                      </span>
                      <span
                        className="w-full rounded-t border-x border-t border-foreground/10"
                        style={{ height: px(value), backgroundColor: model.color }}
                        aria-hidden="true"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-1.5 grid grid-cols-7 gap-1 pl-6" aria-hidden="true">
              {MODELS.map((model) => (
                <span key={model.key} className="flex min-w-0 justify-center">
                  <ModelIcon model={model} size={16} />
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>

      <table className="sr-only">
        <caption>Outcome and process scores across seven models</caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            {PROCESS_DIMENSIONS.map((dimension) => (
              <th key={dimension.key} scope="col">
                {dimension.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODELS.map((model) => (
            <tr key={model.key}>
              <th scope="row">{model.name}</th>
              {PROCESS_DIMENSIONS.map((dimension) => (
                <td key={dimension.key}>{PROCESS[model.key][dimension.key].toFixed(3)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ChartFrame>
  );
}
