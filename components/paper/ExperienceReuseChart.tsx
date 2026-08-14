import { MODELS, type ModelInfo } from "@/lib/benchmark-data";
import {
  EXPERIENCE_REUSE,
  type ExperienceMetricKey,
  type PaperModelKey,
} from "@/lib/paper-data";

import { ModelIcon } from "../ModelIcon";
import { ChartFrame } from "./ChartFrame";

const MODEL_BY_KEY = new Map(MODELS.map((model) => [model.key, model]));
const MAX_ABS_GAIN = 0.07;

function getModel(key: PaperModelKey) {
  const model = MODEL_BY_KEY.get(key);
  if (!model) throw new Error(`Paper model metadata not found: ${key}`);
  return model;
}

function formatGain(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(3)}`;
}

export function ExperienceReuseChart() {
  return (
    <ChartFrame
      id="experience-reuse"
      title="Representation and source of inter-task experience"
      subtitle={EXPERIENCE_REUSE.sample}
      summary="Distilled lessons outperform raw workspaces for Claude, GPT, and GLM on both avg@3 and best@3. In the GLM and LongCat transfer study, each executing model performs better with its own lessons than with the other model's lessons."
    >
      <section aria-labelledby="experience-representation-title">
        <div className="mb-3">
          <h4 id="experience-representation-title" className="text-sm font-semibold">
            Distilled lessons vs. raw workspace
          </h4>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted">
            {EXPERIENCE_REUSE.representation.description}
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <RepresentationPanel metric="avg3" title="(a) avg@3 gain" />
          <RepresentationPanel metric="best3" title="(b) best@3 gain" />
        </div>
      </section>

      <section className="mt-6 border-t border-border pt-5" aria-labelledby="experience-source-title">
        <div className="mb-3">
          <h4 id="experience-source-title" className="text-sm font-semibold">
            Self-generated vs. cross-model lessons
          </h4>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted">
            {EXPERIENCE_REUSE.sourceCompatibility.description} The upper model produces cross-model lessons and the lower model executes them.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <SourcePanel metric="avg3" title="(c) avg@3 gain" />
          <SourcePanel metric="best3" title="(d) best@3 gain" />
        </div>
      </section>

      <ExperienceTables />
    </ChartFrame>
  );
}

function RepresentationPanel({ metric, title }: { metric: ExperienceMetricKey; title: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/65 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h5 className="text-xs font-semibold">{title}</h5>
        <SeriesLegend
          items={[
            { mark: "E", label: "Explicit", color: "#78adca" },
            { mark: "I", label: "Implicit", color: "#e9a45b", patterned: true },
          ]}
        />
      </div>
      <div className="space-y-3.5">
        {EXPERIENCE_REUSE.representation.rows.map((row) => {
          const model = getModel(row.model);
          return (
            <div key={row.model}>
              <ModelLabel model={model} />
              <div className="mt-1.5 space-y-1.5">
                <DeltaRow
                  seriesLabel="Explicit"
                  mark="E"
                  value={row[metric].explicit}
                  color="#78adca"
                  ariaLabel={`${model.name}, explicit distilled lessons, ${metric}: ${formatGain(row[metric].explicit)}`}
                />
                <DeltaRow
                  seriesLabel="Implicit"
                  mark="I"
                  value={row[metric].implicit}
                  color="#e9a45b"
                  patterned
                  ariaLabel={`${model.name}, implicit raw workspace, ${metric}: ${formatGain(row[metric].implicit)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <DeltaAxis />
    </div>
  );
}

function SourcePanel({ metric, title }: { metric: ExperienceMetricKey; title: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/65 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h5 className="text-xs font-semibold">{title}</h5>
        <SeriesLegend
          items={[
            { mark: "S", label: "Self", color: "#78adca" },
            { mark: "X", label: "Cross", color: "#e9a45b", patterned: true },
          ]}
        />
      </div>
      <div className="space-y-4">
        {EXPERIENCE_REUSE.sourceCompatibility.rows.map((row) => {
          const producer = getModel(row.producer);
          const executor = getModel(row.executor);
          return (
            <div key={`${row.producer}-${row.executor}`}>
              <div
                className="flex items-center gap-1.5 text-[10px] text-muted"
                aria-label={`${producer.name} produces lessons; ${executor.name} executes them`}
              >
                <ModelIcon model={producer} size={18} />
                <span className="font-medium text-foreground">{producer.short}</span>
                <span aria-hidden="true">→</span>
                <ModelIcon model={executor} size={18} />
                <span className="font-medium text-foreground">{executor.short}</span>
              </div>
              <div className="mt-1.5 space-y-1.5">
                <DeltaRow
                  seriesLabel="Self"
                  mark="S"
                  value={row[metric].self}
                  color="#78adca"
                  ariaLabel={`${executor.name}, self-generated lessons, ${metric}: ${formatGain(row[metric].self)}`}
                />
                <DeltaRow
                  seriesLabel="Cross"
                  mark="X"
                  value={row[metric].cross}
                  color="#e9a45b"
                  patterned
                  ariaLabel={`${executor.name}, lessons from ${producer.name}, ${metric}: ${formatGain(row[metric].cross)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <DeltaAxis />
    </div>
  );
}

function ModelLabel({ model }: { model: ModelInfo }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold">
      <ModelIcon model={model} size={18} />
      {model.short}
    </div>
  );
}

function DeltaRow({
  seriesLabel,
  mark,
  value,
  color,
  patterned = false,
  ariaLabel,
}: {
  seriesLabel: string;
  mark: string;
  value: number;
  color: string;
  patterned?: boolean;
  ariaLabel: string;
}) {
  const width = Math.min(Math.abs(value) / MAX_ABS_GAIN, 1) * 50;
  const left = value >= 0 ? 50 : 50 - width;

  return (
    <div
      className="grid grid-cols-[4.25rem_minmax(0,1fr)_3.25rem] items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      tabIndex={0}
      aria-label={ariaLabel}
    >
      <span className="flex items-center gap-1.5 text-[9px] text-muted">
        <span
          className="flex h-3.5 w-4 items-center justify-center rounded-sm text-[7px] font-bold text-foreground/75"
          style={{
            backgroundColor: color,
            backgroundImage: patterned
              ? "repeating-linear-gradient(135deg, transparent 0, transparent 3px, rgba(255,255,255,.62) 3px, rgba(255,255,255,.62) 5px)"
              : undefined,
          }}
          aria-hidden="true"
        >
          {mark}
        </span>
        {seriesLabel}
      </span>
      <span className="relative h-3 rounded bg-surface ring-1 ring-border" aria-hidden="true">
        <span className="absolute inset-y-[-3px] left-1/2 w-px bg-foreground/35" />
        <span
          className="absolute inset-y-0 min-w-px rounded-sm"
          style={{
            left: `${left}%`,
            width: `${width}%`,
            backgroundColor: color,
            backgroundImage: patterned
              ? "repeating-linear-gradient(135deg, transparent 0, transparent 3px, rgba(255,255,255,.62) 3px, rgba(255,255,255,.62) 5px)"
              : undefined,
          }}
        />
      </span>
      <span
        className={`text-right font-mono text-[10px] font-semibold tabular-nums ${
          value < 0 ? "text-[#a55737]" : "text-foreground"
        }`}
      >
        {formatGain(value)}
      </span>
    </div>
  );
}

function DeltaAxis() {
  return (
    <div className="mt-2 grid grid-cols-[4.25rem_minmax(0,1fr)_3.25rem] gap-2 text-[8px] text-muted" aria-hidden="true">
      <span />
      <span className="flex justify-between font-mono tabular-nums">
        <span>-0.07</span>
        <span>0</span>
        <span>+0.07</span>
      </span>
      <span />
    </div>
  );
}

function SeriesLegend({
  items,
}: {
  items: readonly { mark: string; label: string; color: string; patterned?: boolean }[];
}) {
  return (
    <ul className="flex gap-2.5" aria-label="Series legend">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1 text-[8px] text-muted">
          <span
            className="flex h-3.5 w-4 items-center justify-center rounded-sm text-[7px] font-bold text-foreground/75"
            style={{
              backgroundColor: item.color,
              backgroundImage: item.patterned
                ? "repeating-linear-gradient(135deg, transparent 0, transparent 3px, rgba(255,255,255,.62) 3px, rgba(255,255,255,.62) 5px)"
                : undefined,
            }}
            aria-hidden="true"
          >
            {item.mark}
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function ExperienceTables() {
  return (
    <div className="sr-only">
      <table>
        <caption>Experience representation gains</caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col">Metric</th>
            <th scope="col">Explicit distilled lessons</th>
            <th scope="col">Implicit raw workspace</th>
          </tr>
        </thead>
        <tbody>
          {EXPERIENCE_REUSE.representation.rows.flatMap((row) =>
            (["avg3", "best3"] as const).map((metric) => (
              <tr key={`${row.model}-${metric}`}>
                <th scope="row">{getModel(row.model).name}</th>
                <td>{metric}</td>
                <td>{formatGain(row[metric].explicit)}</td>
                <td>{formatGain(row[metric].implicit)}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
      <table>
        <caption>Self-generated and cross-model lesson gains</caption>
        <thead>
          <tr>
            <th scope="col">Producer</th>
            <th scope="col">Executor</th>
            <th scope="col">Metric</th>
            <th scope="col">Self</th>
            <th scope="col">Cross</th>
          </tr>
        </thead>
        <tbody>
          {EXPERIENCE_REUSE.sourceCompatibility.rows.flatMap((row) =>
            (["avg3", "best3"] as const).map((metric) => (
              <tr key={`${row.producer}-${row.executor}-${metric}`}>
                <th scope="row">{getModel(row.producer).name}</th>
                <td>{getModel(row.executor).name}</td>
                <td>{metric}</td>
                <td>{formatGain(row[metric].self)}</td>
                <td>{formatGain(row[metric].cross)}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
