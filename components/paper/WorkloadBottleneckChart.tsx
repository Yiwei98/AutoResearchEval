import {
  PROCESS_DIMENSION_META,
  WORKLOAD_BOTTLENECKS,
  type ProcessDimensionKey,
} from "@/lib/paper-data";

import { ChartFrame } from "./ChartFrame";

const BAR_PATTERNS: Record<ProcessDimensionKey, string> = {
  c1: "none",
  c2: "repeating-linear-gradient(135deg, transparent 0, transparent 5px, rgba(255,255,255,.42) 5px, rgba(255,255,255,.42) 7px)",
  c3: "radial-gradient(circle at 2px 2px, rgba(255,255,255,.62) 1.2px, transparent 1.3px)",
};

export function WorkloadBottleneckChart() {
  return (
    <ChartFrame
      id="workload-bottlenecks"
      title="Process dimensions by task category"
      subtitle="Process dimensions by task category, averaged over the seven models."
      summary="Puzzle and Challenge has the strongest scores across all three dimensions. CUDA has the lowest solution framing and execution scores, while Model Development has the lowest feedback control score."
      source={WORKLOAD_BOTTLENECKS.source}
    >
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Process dimension legend">
        {PROCESS_DIMENSION_META.map((dimension) => (
          <li key={dimension.key} className="flex items-center gap-2 text-[11px] text-muted">
            <span
              className="flex h-4 min-w-7 items-center justify-center rounded-sm px-1 text-[8px] font-bold text-white"
              style={{
                backgroundColor: dimension.color,
                backgroundImage: BAR_PATTERNS[dimension.key],
                backgroundSize: dimension.key === "c3" ? "6px 6px" : undefined,
              }}
              aria-hidden="true"
            >
              {dimension.mark}
            </span>
            {dimension.label}
          </li>
        ))}
      </ul>

      <div className="grid gap-3 sm:grid-cols-2" role="list" aria-label="Workload category scores">
        {WORKLOAD_BOTTLENECKS.rows.map((row) => (
          <article
            key={row.key}
            className="rounded-xl border border-border bg-background/65 p-3.5"
            role="listitem"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h4 className="text-xs font-semibold sm:text-sm">{row.label}</h4>
              <span className="whitespace-nowrap text-[10px] text-muted">
                {row.taskCount} {row.taskCount === 1 ? "task" : "tasks"}
              </span>
            </div>

            <div className="space-y-2.5">
              {PROCESS_DIMENSION_META.map((dimension) => {
                const value = row[dimension.key];
                return (
                  <div
                    key={dimension.key}
                    className="grid grid-cols-[2rem_minmax(0,1fr)_3rem] items-center gap-2"
                    tabIndex={0}
                    aria-label={`${row.label}, ${dimension.label}: ${value.toFixed(3)}`}
                  >
                    <span className="text-[10px] font-bold text-muted">{dimension.mark}</span>
                    <span className="relative h-3 overflow-hidden rounded-full bg-surface ring-1 ring-border">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${value * 100}%`,
                          backgroundColor: dimension.color,
                          backgroundImage: BAR_PATTERNS[dimension.key],
                          backgroundSize: dimension.key === "c3" ? "6px 6px" : undefined,
                        }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-right font-mono text-[11px] font-semibold tabular-nums">
                      {value.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <table className="sr-only">
        <caption>Figure 5 process dimension values by task category</caption>
        <thead>
          <tr>
            <th scope="col">Workload</th>
            <th scope="col">Tasks</th>
            {PROCESS_DIMENSION_META.map((dimension) => (
              <th key={dimension.key} scope="col">
                {dimension.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WORKLOAD_BOTTLENECKS.rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td>{row.taskCount}</td>
              {PROCESS_DIMENSION_META.map((dimension) => (
                <td key={dimension.key}>{row[dimension.key].toFixed(3)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ChartFrame>
  );
}
