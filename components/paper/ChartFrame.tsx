import type { ReactNode } from "react";

import type { PaperSource } from "@/lib/paper-data";

export function ChartFrame({
  id,
  title,
  subtitle,
  summary,
  source,
  children,
  className = "",
  plain = false,
  showSourceLabel = true,
}: {
  id: string;
  title: string;
  subtitle?: string;
  summary: string;
  source: PaperSource;
  children: ReactNode;
  className?: string;
  plain?: boolean;
  showSourceLabel?: boolean;
}) {
  return (
    <figure
      className={`${
        plain
          ? "min-w-0 max-w-full"
          : "min-w-0 max-w-full rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] sm:p-5"
      } ${className}`}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${subtitle ? `${id}-subtitle ` : ""}${id}-summary`}
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`${id}-title`} className="text-base font-semibold tracking-tight sm:text-lg">
            {title}
          </h3>
          {subtitle ? (
            <p id={`${id}-subtitle`} className="mt-1 max-w-3xl text-xs leading-relaxed text-muted sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>
        {showSourceLabel ? (
          <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
            {source.label}
          </span>
        ) : null}
      </header>

      <p id={`${id}-summary`} className="sr-only">
        {summary}
      </p>

      {children}
    </figure>
  );
}
