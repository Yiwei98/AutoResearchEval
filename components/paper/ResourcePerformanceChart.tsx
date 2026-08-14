import { MODELS } from "@/lib/benchmark-data";
import {
  FIGURE3_RESOURCE_PERFORMANCE,
  type Figure3Measure,
  type Figure3ResourceRow,
  type PaperModelKey,
} from "@/lib/paper-data";

import { ChartFrame } from "./ChartFrame";

type ResourceMetricKey = "costUsd" | "meanHoursPerTask" | "meanStepsPerTask";
type PanelKey = "cost" | "time" | "steps";

interface ResourcePanelConfig {
  readonly key: PanelKey;
  readonly index: string;
  readonly metricKey: ResourceMetricKey;
  readonly title: string;
  readonly unit: string;
  readonly domain: readonly [number, number];
  readonly scale: "linear" | "log";
  readonly ticks: readonly { value: number; label: string }[];
  readonly guide: readonly PaperModelKey[];
}

const PANELS = [
  {
    key: "cost",
    index: "01",
    metricKey: "costUsd",
    title: "Total estimated cost",
    unit: "USD · logarithmic scale",
    domain: [350, 11000],
    scale: "log",
    ticks: [
      { value: 400, label: "$400" },
      { value: 1000, label: "$1k" },
      { value: 2000, label: "$2k" },
      { value: 4000, label: "$4k" },
      { value: 10000, label: "$10k" },
    ],
    guide: ["longcat", "kimi", "gpt", "claude"],
  },
  {
    key: "time",
    index: "02",
    metricKey: "meanHoursPerTask",
    title: "Mean wall-clock time",
    unit: "hours per task",
    domain: [1, 3],
    scale: "linear",
    ticks: [
      { value: 1, label: "1.0" },
      { value: 1.5, label: "1.5" },
      { value: 2, label: "2.0" },
      { value: 2.5, label: "2.5" },
      { value: 3, label: "3.0" },
    ],
    guide: ["gemini", "gpt", "claude"],
  },
  {
    key: "steps",
    index: "03",
    metricKey: "meanStepsPerTask",
    title: "Mean interaction steps",
    unit: "steps per task",
    domain: [50, 330],
    scale: "linear",
    ticks: [
      { value: 50, label: "50" },
      { value: 100, label: "100" },
      { value: 150, label: "150" },
      { value: 200, label: "200" },
      { value: 250, label: "250" },
      { value: 300, label: "300" },
    ],
    guide: ["gpt", "claude"],
  },
] as const satisfies readonly ResourcePanelConfig[];

const Y_TICKS = [0.65, 0.68, 0.71, 0.74, 0.77, 0.8] as const;
const Y_DOMAIN = [0.64, 0.81] as const;
const WIDTH = 360;
const HEIGHT = 260;
const PLOT = { left: 44, right: 346, top: 12, bottom: 220 } as const;

const SHORT_MODEL_LABEL: Record<PaperModelKey, string> = {
  claude: "Claude",
  glm: "GLM",
  gpt: "GPT",
  gemini: "Gemini",
  kimi: "Kimi",
  longcat: "LongCat",
  deepseek: "DeepSeek",
};

type LabelPosition = { dx: number; dy: number; anchor: "start" | "end" };

const LABEL_POSITION: Record<PanelKey, Record<PaperModelKey, LabelPosition>> = {
  cost: {
    claude: { dx: -8, dy: -9, anchor: "end" },
    glm: { dx: 8, dy: 14, anchor: "start" },
    gpt: { dx: -8, dy: -9, anchor: "end" },
    gemini: { dx: 8, dy: 15, anchor: "start" },
    kimi: { dx: 8, dy: 14, anchor: "start" },
    longcat: { dx: 8, dy: -10, anchor: "start" },
    deepseek: { dx: 8, dy: 17, anchor: "start" },
  },
  time: {
    claude: { dx: 8, dy: -9, anchor: "start" },
    glm: { dx: -8, dy: 14, anchor: "end" },
    gpt: { dx: 8, dy: -9, anchor: "start" },
    gemini: { dx: 8, dy: 15, anchor: "start" },
    kimi: { dx: 8, dy: 14, anchor: "start" },
    longcat: { dx: -8, dy: -10, anchor: "end" },
    deepseek: { dx: 8, dy: 15, anchor: "start" },
  },
  steps: {
    claude: { dx: 8, dy: -9, anchor: "start" },
    glm: { dx: -8, dy: 14, anchor: "end" },
    gpt: { dx: 8, dy: -9, anchor: "start" },
    gemini: { dx: 8, dy: -9, anchor: "start" },
    kimi: { dx: 8, dy: 14, anchor: "start" },
    longcat: { dx: 8, dy: -10, anchor: "start" },
    deepseek: { dx: 8, dy: 15, anchor: "start" },
  },
};

const MODEL_BY_KEY = new Map(MODELS.map((model) => [model.key, model]));
const ROW_BY_MODEL = new Map<PaperModelKey, Figure3ResourceRow>(
  FIGURE3_RESOURCE_PERFORMANCE.rows.map((row) => [row.model, row]),
);

function getModel(key: PaperModelKey) {
  const model = MODEL_BY_KEY.get(key);
  if (!model) throw new Error(`Paper model metadata not found: ${key}`);
  return model;
}

function getRow(key: PaperModelKey) {
  const row = ROW_BY_MODEL.get(key);
  if (!row) throw new Error(`Figure 3 row not found: ${key}`);
  return row;
}

function xPosition(value: number, panel: ResourcePanelConfig) {
  const [minimum, maximum] = panel.domain;
  const normalized =
    panel.scale === "log"
      ? (Math.log(value) - Math.log(minimum)) / (Math.log(maximum) - Math.log(minimum))
      : (value - minimum) / (maximum - minimum);
  return PLOT.left + normalized * (PLOT.right - PLOT.left);
}

function yPosition(value: number) {
  const normalized = (value - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0]);
  return PLOT.bottom - normalized * (PLOT.bottom - PLOT.top);
}

function formatMeasure(metricKey: ResourceMetricKey, measure: Figure3Measure) {
  let value: string;
  if (metricKey === "costUsd") {
    value = `$${measure.value.toLocaleString("en-US")}`;
  } else if (metricKey === "meanHoursPerTask") {
    value = `${measure.value.toFixed(1)} h/task`;
  } else {
    value = `${measure.value.toFixed(0)} steps/task`;
  }
  return `${measure.precision === "exact" ? "" : "≈"}${value}`;
}

function precisionLabel(measure: Figure3Measure) {
  return measure.precision === "exact"
    ? "exact value printed in Section 2.3"
    : "approximate value digitized from the published chart";
}

function ResourcePanel({ panel }: { panel: ResourcePanelConfig }) {
  const panelTitleId = `resource-panel-${panel.key}`;
  const guidePoints = panel.guide
    .map((modelKey) => {
      const row = getRow(modelKey);
      const measure = row[panel.metricKey];
      return `${xPosition(measure.value, panel)},${yPosition(row.best3)}`;
    })
    .join(" ");

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-background/70">
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[9px] font-semibold tracking-[0.14em] text-accent">
            {panel.index}
          </p>
          <h4 id={panelTitleId} className="mt-0.5 text-xs font-semibold sm:text-sm">
            {panel.title}
          </h4>
        </div>
        <span className="mt-1 whitespace-nowrap text-[9px] text-muted">{panel.unit}</span>
      </header>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full"
        role="group"
        aria-labelledby={panelTitleId}
      >
        <text
          x="12"
          y={(PLOT.top + PLOT.bottom) / 2}
          transform={`rotate(-90 12 ${(PLOT.top + PLOT.bottom) / 2})`}
          fill="var(--muted)"
          fontSize="8.5"
          fontWeight="600"
          textAnchor="middle"
          aria-hidden="true"
        >
          best@3
        </text>

        {Y_TICKS.map((tick) => {
          const y = yPosition(tick);
          return (
            <g key={tick} aria-hidden="true">
              <line
                x1={PLOT.left}
                x2={PLOT.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={PLOT.left - 7}
                y={y + 3}
                fill="var(--muted)"
                fontFamily="var(--font-mono)"
                fontSize="8"
                textAnchor="end"
              >
                {tick.toFixed(2)}
              </text>
            </g>
          );
        })}

        {panel.ticks.map((tick) => {
          const x = xPosition(tick.value, panel);
          return (
            <g key={tick.value} aria-hidden="true">
              <line
                x1={x}
                x2={x}
                y1={PLOT.top}
                y2={PLOT.bottom}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={PLOT.bottom + 17}
                fill="var(--muted)"
                fontFamily="var(--font-mono)"
                fontSize="8"
                textAnchor="middle"
              >
                {tick.label}
              </text>
            </g>
          );
        })}

        <line
          x1={PLOT.left}
          x2={PLOT.right}
          y1={PLOT.bottom}
          y2={PLOT.bottom}
          stroke="var(--foreground)"
          strokeOpacity="0.58"
          aria-hidden="true"
        />
        <line
          x1={PLOT.left}
          x2={PLOT.left}
          y1={PLOT.top}
          y2={PLOT.bottom}
          stroke="var(--foreground)"
          strokeOpacity="0.58"
          aria-hidden="true"
        />

        <polyline
          points={guidePoints}
          fill="none"
          stroke="var(--muted)"
          strokeDasharray="6 5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.58"
          strokeWidth="1.5"
          aria-hidden="true"
        />

        {FIGURE3_RESOURCE_PERFORMANCE.rows.map((row) => {
          const model = getModel(row.model);
          const measure: Figure3Measure = row[panel.metricKey];
          const x = xPosition(measure.value, panel);
          const y = yPosition(row.best3);
          const label = LABEL_POSITION[panel.key][row.model];
          const exactResourceValue = measure.precision === "exact";
          const displayValue = formatMeasure(panel.metricKey, measure);
          const tooltipWidth = 146;
          const tooltipX = Math.max(4, Math.min(WIDTH - tooltipWidth - 4, x + 10));
          const tooltipY = y < 55 ? y + 11 : y - 43;

          return (
            <g
              key={row.model}
              className="resource-chart-point"
            >
              <circle
                className="resource-chart-halo"
                cx={x}
                cy={y}
                r="10"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                aria-hidden="true"
              />
              {exactResourceValue ? (
                <circle
                  cx={x}
                  cy={y}
                  r="5.5"
                  fill={model.color}
                  stroke="var(--surface)"
                  strokeWidth="2"
                  aria-hidden="true"
                />
              ) : (
                <g aria-hidden="true">
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="var(--surface)"
                    stroke={model.color}
                    strokeWidth="2"
                  />
                  <circle cx={x} cy={y} r="2.25" fill={model.color} />
                </g>
              )}
              <text
                x={x + label.dx}
                y={y + label.dy}
                fill="var(--foreground)"
                fontSize="9.5"
                fontWeight="650"
                paintOrder="stroke fill"
                stroke="var(--surface)"
                strokeLinejoin="round"
                strokeWidth="4"
                textAnchor={label.anchor}
                aria-hidden="true"
              >
                {SHORT_MODEL_LABEL[row.model]}
              </text>

              <g
                className="resource-chart-tooltip"
                transform={`translate(${tooltipX} ${tooltipY})`}
                aria-hidden="true"
              >
                <rect
                  width={tooltipWidth}
                  height="35"
                  rx="6"
                  fill="var(--surface)"
                  stroke="var(--border)"
                />
                <text x="8" y="13" fill="var(--foreground)" fontSize="8.5" fontWeight="650">
                  {model.name}
                </text>
                <text x="8" y="26" fill="var(--muted)" fontFamily="var(--font-mono)" fontSize="7.5">
                  {displayValue} · best@3 {row.best3.toFixed(3)}
                </text>
              </g>
              <foreignObject x={x - 12} y={y - 12} width="24" height="24">
                <button
                  type="button"
                  className="resource-chart-hit"
                  aria-label={`${model.name}: best@3 ${row.best3.toFixed(3)}; ${panel.title.toLowerCase()} ${displayValue}, ${precisionLabel(measure)}.`}
                />
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

export function ResourcePerformanceChart() {
  return (
    <ChartFrame
      id="resource-performance"
      title="Resource-performance trade-offs"
      subtitle={`${FIGURE3_RESOURCE_PERFORMANCE.metric}. ${FIGURE3_RESOURCE_PERFORMANCE.sample}.`}
      summary="Claude achieves the highest best@3 at the highest estimated cost. GPT approaches that performance at substantially lower cost and mean time. LongCat and DeepSeek are the lowest-cost models."
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] leading-5 text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" aria-hidden="true" />
          Resource value printed in §2.3
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative h-3 w-3 rounded-full border-2 border-accent bg-surface" aria-hidden="true">
            <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
          </span>
          ≈ digitized from the published chart
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 border-t border-dashed border-muted" aria-hidden="true" />
          Guide drawn in the paper, not a fitted trend
        </span>
        <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">
          All best@3 values are exact
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PANELS.map((panel) => (
          <ResourcePanel key={panel.key} panel={panel} />
        ))}
      </div>

      <div className="mt-4 grid divide-y divide-border overflow-hidden rounded-xl border border-border bg-background/70 md:grid-cols-3 md:divide-x md:divide-y-0">
        <ResourceInsight
          eyebrow="Top result"
          title="Claude reaches 0.790"
          body="The strongest best@3 comes with the highest stated cost: $9,712."
        />
        <ResourceInsight
          eyebrow="Close alternative"
          title="GPT reaches 0.772"
          body="GPT reaches 0.772 versus Claude’s 0.790, at $1,783 and ≈1.2 hours per task."
        />
        <ResourceInsight
          eyebrow="Tight budgets"
          title="≈$420 / ≈$463"
          body="LongCat and DeepSeek trade some performance for the two lowest plotted costs."
        />
      </div>

      <p className="mt-5 max-w-4xl text-xs leading-5 text-muted">
        Gemini and GPT use the least wall-clock time, suggesting that they often terminate before
        fully exploiting the available task budget. Estimated costs depend on provider pricing and
        token accounting, while wall-clock use also reflects task-specific budgets and infrastructure;
        these values should not be read as universal deployment prices.
      </p>

      <table className="sr-only">
        <caption>
          Resource-performance values. Approximate resource values were digitized from the
          published chart.
        </caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col">best@3</th>
            <th scope="col">Total cost</th>
            <th scope="col">Cost precision</th>
            <th scope="col">Mean hours per task</th>
            <th scope="col">Time precision</th>
            <th scope="col">Mean steps per task</th>
            <th scope="col">Steps precision</th>
          </tr>
        </thead>
        <tbody>
          {FIGURE3_RESOURCE_PERFORMANCE.rows.map((row) => (
            <tr key={row.model}>
              <th scope="row">{getModel(row.model).name}</th>
              <td>{row.best3.toFixed(3)}</td>
              <td>{row.costUsd.value}</td>
              <td>{precisionLabel(row.costUsd)}</td>
              <td>{row.meanHoursPerTask.value}</td>
              <td>{precisionLabel(row.meanHoursPerTask)}</td>
              <td>{row.meanStepsPerTask.value}</td>
              <td>{precisionLabel(row.meanStepsPerTask)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartFrame>
  );
}

function ResourceInsight({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <article className="p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-accent">{eyebrow}</p>
      <h4 className="mt-1.5 font-mono text-lg font-semibold tracking-tight">{title}</h4>
      <p className="mt-1.5 text-xs leading-5 text-muted">{body}</p>
    </article>
  );
}
