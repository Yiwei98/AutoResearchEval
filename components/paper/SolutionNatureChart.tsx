import { MODELS } from "@/lib/benchmark-data";
import {
  SOLUTION_NATURE,
  SOLUTION_NATURE_CATEGORIES,
  type PaperModelKey,
  type SolutionNatureKey,
} from "@/lib/paper-data";

import { ModelIcon } from "../ModelIcon";
import { ChartFrame } from "./ChartFrame";

const MODEL_BY_KEY = new Map(MODELS.map((model) => [model.key, model]));

const CATEGORY_PATTERNS: Partial<Record<SolutionNatureKey, string>> = {
  trainingSignal:
    "repeating-linear-gradient(135deg, transparent 0, transparent 5px, rgba(255,255,255,.42) 5px, rgba(255,255,255,.42) 7px)",
  structuralSwap:
    "repeating-linear-gradient(90deg, transparent 0, transparent 5px, rgba(255,255,255,.38) 5px, rgba(255,255,255,.38) 7px)",
  compositionStacking:
    "repeating-linear-gradient(0deg, transparent 0, transparent 5px, rgba(255,255,255,.3) 5px, rgba(255,255,255,.3) 7px)",
  searchHardcode:
    "radial-gradient(circle at 2px 2px, rgba(255,255,255,.7) 1.1px, transparent 1.2px)",
  evaluationHacking:
    "repeating-linear-gradient(45deg, transparent 0, transparent 4px, rgba(255,255,255,.46) 4px, rgba(255,255,255,.46) 6px)",
  novelApproach:
    "repeating-linear-gradient(135deg, transparent 0, transparent 3px, rgba(86,40,23,.36) 3px, rgba(86,40,23,.36) 5px)",
  other:
    "repeating-linear-gradient(135deg, transparent 0, transparent 3px, rgba(70,70,66,.24) 3px, rgba(70,70,66,.24) 4px)",
};

function getModel(key: PaperModelKey) {
  const model = MODEL_BY_KEY.get(key);
  if (!model) throw new Error(`Paper model metadata not found: ${key}`);
  return model;
}

function totalForCategory(category: SolutionNatureKey) {
  return SOLUTION_NATURE.rows.reduce((sum, row) => sum + row[category], 0);
}

function totalForRow(row: (typeof SOLUTION_NATURE.rows)[number]) {
  return SOLUTION_NATURE_CATEGORIES.reduce((sum, category) => sum + row[category.key], 0);
}

export function SolutionNatureChart() {
  const totalSolutions = SOLUTION_NATURE.rows.reduce(
    (sum, row) => sum + totalForRow(row),
    0,
  );
  const compositionStacking = totalForCategory("compositionStacking");
  const evaluationHacking = totalForCategory("evaluationHacking");
  const novelApproaches = totalForCategory("novelApproach");

  return (
    <ChartFrame
      id="solution-nature"
      title="Solution Nature and Novelty"
      subtitle="Solution nature across 252 best-seed solutions. Each model contributes 36 solutions; three novel approaches remain after manual review."
      summary={`${compositionStacking} of ${totalSolutions} solutions use composition-stacking. ${evaluationHacking} use evaluation-specific shortcuts and ${novelApproaches} qualify as validated novel approaches.`}
    >
      <div className="mb-6 grid border-y border-border py-4 sm:grid-cols-3">
        <EvidenceStat
          value={compositionStacking}
          total={totalSolutions}
          label="Composition-stacking"
          note="The largest solution category for every model"
          tone="composition"
        />
        <EvidenceStat
          value={evaluationHacking}
          total={totalSolutions}
          label="Evaluation-hacking"
          note="Evaluation-specific shortcuts"
          tone="shortcut"
        />
        <EvidenceStat
          value={novelApproaches}
          total={totalSolutions}
          label="Validated novel approaches"
          note="Retained after manual review"
          tone="novel"
        />
      </div>

      <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-2" aria-label="Solution-nature legend">
        {SOLUTION_NATURE_CATEGORIES.map((category) => (
          <li key={category.key} className="flex items-center gap-1.5 text-[10px] text-muted">
            <span
              className="flex h-4 w-5 items-center justify-center rounded-sm text-[8px] font-bold text-foreground/75 ring-1 ring-black/5"
              style={{
                backgroundColor: category.color,
                backgroundImage: CATEGORY_PATTERNS[category.key],
                backgroundSize: category.key === "searchHardcode" ? "6px 6px" : undefined,
              }}
              aria-hidden="true"
            >
              {category.code}
            </span>
            {category.label}
          </li>
        ))}
      </ul>

      <div className="space-y-2.5" aria-label="Stacked bars showing solution counts">
        {SOLUTION_NATURE.rows.map((row) => {
          const model = getModel(row.model);
          const rowTotal = totalForRow(row);
          return (
            <div
              key={row.model}
              className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <ModelIcon model={model} size={22} />
                <span className="truncate text-[10px] font-semibold sm:text-[11px]">{model.short}</span>
              </div>
              <div
                className="flex h-8 min-w-0 overflow-hidden rounded-md ring-1 ring-border"
                role="group"
                aria-label={`${model.name}: ${SOLUTION_NATURE_CATEGORIES.map(
                  (category) => `${category.label} ${row[category.key]}`,
                ).join(", ")}`}
              >
                {SOLUTION_NATURE_CATEGORIES.map((category) => {
                  const count = row[category.key];
                  if (count === 0) return null;
                  const isNovel = category.key === "novelApproach";
                  return (
                    <span
                      key={category.key}
                      className="flex items-center justify-center border-r border-white/70 text-[8px] font-bold tabular-nums text-foreground/80 last:border-r-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground sm:text-[9px]"
                      style={{
                        flex: `0 0 ${(count / rowTotal) * 100}%`,
                        backgroundColor: category.color,
                        backgroundImage: CATEGORY_PATTERNS[category.key],
                        backgroundSize:
                          category.key === "searchHardcode" ? "6px 6px" : undefined,
                        boxShadow: isNovel ? "inset 0 0 0 1.5px #86482f" : undefined,
                      }}
                      tabIndex={0}
                      aria-label={`${model.name}, ${category.label}: ${count} of ${rowTotal}`}
                      title={`${model.name} · ${category.label}: ${count}/${rowTotal}`}
                    >
                      {count >= 2 ? count : null}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-2 text-[9px] text-muted sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-3">
          <span />
          <div className="flex justify-between border-t border-border pt-1.5 font-mono tabular-nums">
            <span>0</span>
            <span>6</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
            <span>30</span>
            <span>36</span>
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>
          Exact solution-nature counts. Each model contributes 36 solutions and the
          full sample contains {totalSolutions} solutions.
        </caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            {SOLUTION_NATURE_CATEGORIES.map((category) => (
              <th key={category.key} scope="col">
                {category.label}
              </th>
            ))}
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {SOLUTION_NATURE.rows.map((row) => (
            <tr key={row.model}>
              <th scope="row">{getModel(row.model).name}</th>
              {SOLUTION_NATURE_CATEGORIES.map((category) => (
                <td key={category.key}>{row[category.key]}</td>
              ))}
              <td>{totalForRow(row)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">All models</th>
            {SOLUTION_NATURE_CATEGORIES.map((category) => (
              <td key={category.key}>{totalForCategory(category.key)}</td>
            ))}
            <td>{totalSolutions}</td>
          </tr>
        </tfoot>
      </table>
    </ChartFrame>
  );
}

function EvidenceStat({
  value,
  total,
  label,
  note,
  tone,
}: {
  value: number;
  total: number;
  label: string;
  note: string;
  tone: "composition" | "shortcut" | "novel";
}) {
  const toneClass = {
    composition: "text-accent",
    shortcut: "text-[#805f85]",
    novel: "text-[#a55737]",
  }[tone];

  return (
    <div className="border-b border-border py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:py-0 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
      <div className={`flex items-baseline gap-1.5 ${toneClass}`}>
        <span className="text-2xl font-bold tabular-nums sm:text-3xl">{value}</span>
        <span className="text-[10px] font-semibold tabular-nums text-muted">/{total}</span>
      </div>
      <p className="mt-1 text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-[10px] leading-4 text-muted">{note}</p>
    </div>
  );
}
