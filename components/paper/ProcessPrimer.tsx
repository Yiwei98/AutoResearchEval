import {
  EVALUATION_FRAMEWORK,
  PROCESS_DIMENSION_META,
  type ProcessDimensionKey,
} from "@/lib/paper-data";

const STAGE_CONTEXT: Record<ProcessDimensionKey, string> = {
  c1: "Direction quality",
  c2: "Delivery gate",
  c3: "Retention + recovery",
};

function getDimensionMeta(key: ProcessDimensionKey) {
  const meta = PROCESS_DIMENSION_META.find((dimension) => dimension.key === key);
  if (!meta) throw new Error(`Process dimension metadata not found: ${key}`);
  return meta;
}

export function ProcessPrimer() {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-surface"
      aria-labelledby="process-primer-title"
    >
      <header className="grid gap-3 border-b border-border bg-accent-soft/45 px-5 py-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] md:items-end">
        <div>
          <p className="section-kicker">How to read C1-C3</p>
          <h3 id="process-primer-title" className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl">
            Three measurements of one research loop
          </h3>
        </div>
        <p className="text-xs leading-5 text-muted sm:text-sm sm:leading-6">
          Each score is computed deterministically from recorded evaluation signals. Valid seeds
          are averaged within each model-task pair, then all 36 tasks receive equal weight. These
          scores are observable proxies, not exhaustive definitions of the underlying capabilities.
        </p>
      </header>

      <dl className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {EVALUATION_FRAMEWORK.process.map((dimension) => {
          const meta = getDimensionMeta(dimension.key);
          return (
            <div key={dimension.key} className="flex min-w-0 flex-col px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="inline-flex h-8 min-w-10 items-center justify-center rounded-md px-2 font-mono text-xs font-bold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${meta.color} 12%, white)`,
                    color: meta.color,
                  }}
                >
                  {dimension.key.toUpperCase()}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  {STAGE_CONTEXT[dimension.key]}
                </span>
              </div>
              <dt className="mt-4 text-base font-semibold">{dimension.label}</dt>
              <dd className="mt-2 flex flex-1 flex-col">
                <p className="text-sm leading-6 text-muted">{dimension.definition}</p>
                <p className="mt-4 border-t border-border pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Primary signal
                  <span className="ml-2 normal-case tracking-normal text-foreground">
                    {dimension.signal}
                  </span>
                </p>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
