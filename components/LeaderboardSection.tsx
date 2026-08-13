"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  CATEGORIES,
  LEADERBOARD,
  MODELS,
  type CategoryKey,
} from "@/lib/benchmark-data";
import { LeaderboardChart } from "./LeaderboardChart";
import { ModelIcon } from "./ModelIcon";

type SortKey = "avg3" | "best3" | "gap";

export function LeaderboardSection() {
  const [category, setCategory] = useState<CategoryKey>("overall");
  const [sort, setSort] = useState<SortKey>("avg3");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const scores = LEADERBOARD[category];
  const rows = [...MODELS]
    .map((m) => ({
      m,
      avg3: scores[m.key].avg3,
      best3: scores[m.key].best3,
      gap: scores[m.key].best3 - scores[m.key].avg3,
    }))
    .sort((a, b) => b[sort] - a[sort]);

  // Rank is always by avg@3 regardless of table sort.
  const rankByAvg = new Map(
    [...MODELS]
      .map((m) => ({ key: m.key, avg3: scores[m.key].avg3 }))
      .sort((a, b) => b.avg3 - a.avg3)
      .map((r, i) => [r.key, i + 1]),
  );

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % CATEGORIES.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + CATEGORIES.length) % CATEGORIES.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = CATEGORIES.length - 1;
    }

    if (nextIndex == null) return;
    event.preventDefault();
    setCategory(CATEGORIES[nextIndex].key);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section>
      {/* Category tabs */}
      <div
        className="mb-6 flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Leaderboard task category"
      >
        {CATEGORIES.map((c, index) => (
          <button
            key={c.key}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            id={`leaderboard-tab-${c.key}`}
            role="tab"
            aria-selected={category === c.key}
            aria-controls="leaderboard-panel"
            tabIndex={category === c.key ? 0 : -1}
            onClick={() => setCategory(c.key)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
              category === c.key
                ? "bg-accent text-white"
                : "bg-surface text-muted ring-1 ring-border hover:text-foreground"
            }`}
          >
            {c.label}
            <span
              className={`ml-1.5 text-xs ${
                category === c.key ? "text-white/90" : "text-muted/70"
              }`}
            >
              {c.count}
            </span>
          </button>
        ))}
      </div>

      <div
        id="leaderboard-panel"
        role="tabpanel"
        aria-labelledby={`leaderboard-tab-${category}`}
        tabIndex={0}
        className="grid gap-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
      >
        {/* Chart */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <LeaderboardChart category={category} />
        </div>

        {/* Responsive leaderboard: cards on phones, sortable table from small screens up. */}
        <div className="min-w-0 sm:overflow-hidden sm:rounded-xl sm:border sm:border-border sm:bg-surface">
          <div className="sm:hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="section-kicker">Ranked results</p>
              <label className="flex items-center gap-2 text-xs text-muted">
                <span>Sort</span>
                <select
                  aria-label="Sort leaderboard"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <option value="avg3">avg@3</option>
                  <option value="best3">best@3</option>
                  <option value="gap">Δ gap</option>
                </select>
              </label>
            </div>
            <p className="sr-only">
              Model rewards for {CATEGORIES.find((c) => c.key === category)?.label}; rank is
              based on avg@3.
            </p>
            <div className="grid gap-2">
              {rows.map(({ m, avg3, best3, gap }) => (
                <article
                  key={m.key}
                  className="rounded-xl border border-border/80 bg-surface p-3 shadow-sm transition-colors hover:border-accent/30 hover:bg-accent-soft/25"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface font-mono text-xs tabular-nums text-muted ring-1 ring-border">
                      <span className="sr-only">Rank </span>
                      {rankByAvg.get(m.key)}
                    </span>
                    <Link
                      href={`/trajectories?model=${m.key}`}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-sm hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <ModelIcon model={m} size={24} />
                      <span className="truncate text-sm font-semibold">{m.name}</span>
                    </Link>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 divide-x divide-border rounded-lg bg-surface/75 ring-1 ring-border/70">
                    <MobileMetric label="avg@3" value={avg3.toFixed(3)} emphasis />
                    <MobileMetric label="best@3" value={best3.toFixed(3)} />
                    <MobileMetric label="Δ gap" value={gap.toFixed(3)} />
                  </dl>
                </article>
              ))}
            </div>
          </div>

          <div className="hidden overflow-x-auto overscroll-x-contain sm:block">
            <table className="w-full min-w-[30rem] text-sm">
              <caption className="sr-only">
                Model rewards for {CATEGORIES.find((c) => c.key === category)?.label};
                rank is based on avg@3. Columns can be sorted in descending order.
              </caption>
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th scope="col" className="px-4 py-3 font-medium">
                    <abbr title="Rank by avg@3" className="no-underline">#</abbr>
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">Model</th>
                  <SortHeader label="avg@3" k="avg3" sort={sort} setSort={setSort} />
                  <SortHeader label="best@3" k="best3" sort={sort} setSort={setSort} />
                  <SortHeader label="Δ" k="gap" sort={sort} setSort={setSort} />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ m, avg3, best3, gap }) => (
                  <tr
                    key={m.key}
                    className="border-b border-border/60 last:border-0 transition-colors hover:bg-accent-soft/40"
                  >
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {rankByAvg.get(m.key)}
                    </td>
                    <th scope="row" className="px-4 py-3 text-left">
                      <Link
                        href={`/trajectories?model=${m.key}`}
                        className="flex items-center gap-2 rounded-sm hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <ModelIcon model={m} size={22} />
                        <span className="font-medium">{m.name}</span>
                      </Link>
                    </th>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {avg3.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {best3.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {gap.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileMetric({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="px-2 py-2 text-center first:pl-1 last:pr-1">
      <dt className="text-[10px] font-medium text-muted">{label}</dt>
      <dd className={`mt-0.5 font-mono text-xs tabular-nums ${emphasis ? "font-semibold text-foreground" : "text-muted"}`}>
        {value}
      </dd>
    </div>
  );
}

function SortHeader({
  label,
  k,
  sort,
  setSort,
}: {
  label: string;
  k: SortKey;
  sort: SortKey;
  setSort: (k: SortKey) => void;
}) {
  return (
    <th
      scope="col"
      aria-sort={sort === k ? "descending" : "none"}
      className="px-2 py-1 font-medium"
    >
      <button
        type="button"
        onClick={() => setSort(k)}
        className="whitespace-nowrap rounded px-2 py-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`Sort by ${label} in descending order`}
      >
        {label}
        <span
          aria-hidden="true"
          className={sort === k ? "text-accent" : "text-transparent"}
        >{" "}▼</span>
      </button>
    </th>
  );
}
