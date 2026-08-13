import { HARNESS_SECTION } from "@/lib/paper-data";

export function HarnessFindings() {
  return (
    <div className="mt-12 space-y-14">
      <section className="border-t border-border pt-10" aria-labelledby="harness-realization-title">
        <header className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.7fr)] md:items-end md:gap-12">
          <div>
            <p className="section-kicker">What the comparison establishes</p>
            <h3
              id="harness-realization-title"
              className="mt-2 text-balance text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl"
            >
              {HARNESS_SECTION.comparison.headline}
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">{HARNESS_SECTION.comparison.body}</p>
        </header>
      </section>

      <section className="border-t border-border pt-10" aria-labelledby="harness-loop-title">
        <header className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.7fr)] md:items-end md:gap-12">
          <div>
            <p className="section-kicker">Inside the loop</p>
            <h3
              id="harness-loop-title"
              className="mt-2 text-balance text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl"
            >
              {HARNESS_SECTION.mechanism.headline}
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">{HARNESS_SECTION.mechanism.body}</p>
        </header>

        <div className="mt-8 grid border-y border-border md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:divide-x md:divide-border">
          <div className="py-6 md:pr-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
              Observed task management
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Metric value={HARNESS_SECTION.mechanism.taskCreateCalls.toLocaleString()} label="TaskCreate calls" />
              <Metric value={HARNESS_SECTION.mechanism.taskUpdateCalls.toLocaleString()} label="TaskUpdate calls" />
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              Counted across {HARNESS_SECTION.mechanism.trajectorySample}. {HARNESS_SECTION.mechanism.toolingNote}
            </p>
          </div>
          <div className="py-6 md:pl-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
              Failure stays recoverable
            </p>
            <ol className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
              <LoopStep number="01" title="Observe" body="Failed commands become explicit feedback." />
              <LoopStep number="02" title="Revise" body="The agent can change a command or retry." />
              <LoopStep number="03" title="Continue" body="Plans and progress survive the next experiment." />
            </ol>
          </div>
        </div>
      </section>

      <section className="border-t border-border pt-10" aria-labelledby="harness-evolution-title">
        <header className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.7fr)] md:items-end md:gap-12">
          <div>
            <p className="section-kicker">Auto Harness protocol</p>
            <h3
              id="harness-evolution-title"
              className="mt-2 text-balance text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl"
            >
              {HARNESS_SECTION.protocol.headline}
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">{HARNESS_SECTION.protocol.body}</p>
        </header>

        <ol className="mt-8 grid border-y border-border md:grid-cols-3 md:divide-x md:divide-border">
          {HARNESS_SECTION.protocol.interventions.map((intervention) => (
            <li key={intervention.label} className="py-6 md:px-6 md:first:pl-0 md:last:pr-0">
              <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-accent">
                {intervention.label}
              </span>
              <h4 className="mt-3 text-lg font-semibold">{intervention.title}</h4>
              <p className="mt-2 text-sm leading-6 text-muted">{intervention.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-l-2 border-accent pl-4 text-sm leading-6 text-muted">
          <span className="font-semibold text-foreground">A concrete trajectory.</span>{" "}
          {HARNESS_SECTION.protocol.caseStudy}
        </p>
      </section>

      <p className="border-t border-border pt-8 text-sm leading-6 text-muted">
        The best-performing harness can vary by workload; no harness dominates every model and
        category.
      </p>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-muted">{label}</p>
    </div>
  );
}

function LoopStep({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <li className="relative pl-8 sm:px-5 sm:first:pl-0 sm:last:pr-0">
      <span className="absolute left-0 top-0 font-mono text-[10px] font-semibold text-accent sm:static">
        {number}
      </span>
      <h4 className="text-sm font-semibold sm:mt-3">{title}</h4>
      <p className="mt-1 text-xs leading-5 text-muted">{body}</p>
    </li>
  );
}
