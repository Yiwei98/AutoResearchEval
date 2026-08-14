import type { ReactNode } from "react";

export function ChartFrame({
  id,
  title,
  subtitle,
  summary,
  children,
  className = "",
  plain = false,
}: {
  id: string;
  title: string;
  subtitle?: string;
  summary: string;
  children: ReactNode;
  className?: string;
  plain?: boolean;
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
      </header>

      <p id={`${id}-summary`} className="sr-only">
        {summary}
      </p>

      {children}
    </figure>
  );
}
