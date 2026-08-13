import type { ReactNode } from "react";

const DIMENSION_COLOR = {
  c1: "#4f7ca8",
  c2: "#4f9a67",
  c3: "#b36b2c",
} as const;

const WORKLOAD_FINDINGS = [
  {
    label: "CUDA",
    title: "Discovery and execution are the constraint—not retention.",
    body: (
      <>
        It records the lowest <Metric dimension="c1">C1 · 0.370</Metric> and{" "}
        <Metric dimension="c2">C2 · 0.850</Metric>, while Feedback Control remains high at{" "}
        <Metric dimension="c3">C3 · 0.924</Metric>. The difficulty is finding and implementing
        effective optimizations, rather than preserving them once found.
      </>
    ),
  },
  {
    label: "Model Development",
    title: "Execution is easy; stabilizing progress is harder.",
    body: (
      <>
        The profile reverses: Execution is the strongest of any workload at{" "}
        <Metric dimension="c2">C2 · 0.985</Metric>, but Feedback Control is the weakest at{" "}
        <Metric dimension="c3">C3 · 0.743</Metric>. Agents readily produce runnable changes,
        yet struggle to retain and recover optimization gains.
      </>
    ),
  },
  {
    label: "Puzzle & Challenge",
    title: "The strongest workload profile spans the full loop.",
    body: (
      <>
        It combines the highest Solution Framing score, <Metric dimension="c1">C1 · 0.737</Metric>,
        with reliable Execution and Feedback Control at{" "}
        <Metric dimension="c2">C2 · 0.931</Metric> and{" "}
        <Metric dimension="c3">C3 · 0.930</Metric>.
      </>
    ),
  },
] as const;

const DIAGNOSTIC_FINDINGS = [
  {
    label: "Route to progress",
    title: "Progress can be front-loaded or earned later.",
    body: (
      <>
        Gemini captures 83.7% of its eventual peak in the first evaluated round—the highest early
        capture—but only 16.5% of the remaining headroom later. GPT begins at 45.3% and captures
        46.9% later, while Claude ultimately reaches the highest best-observed reward, 0.757.
      </>
    ),
  },
  {
    label: "Implementation pathway",
    title: "Similar delivery scores can conceal very different working styles.",
    body: (
      <>
        Kimi and LongCat have nearly identical C2 scores (0.880 vs. 0.888), yet LongCat performs
        4.66 builds per round and encounters build errors in 17.1% of rounds, versus 2.70 builds
        and 8.5% for Kimi. Dense construction and repair activity does not itself imply reliable
        delivery.
      </>
    ),
  },
  {
    label: "Feedback behavior",
    title: "High retention is not the same as demonstrated recovery.",
    body: (
      <>
        Gemini and LongCat retain 98.8% and 96.2% of peak reward, but average only 2.54 and 5.42
        evaluated commit rounds; their recovery credit is 32.3% and 52.0%. Claude and GLM show
        better-supported recovery profiles: 71.1% and 70.3% over 11.64 and 16.01 evaluated rounds.
      </>
    ),
  },
] as const;

export function WorkloadFindings() {
  return (
    <div className="mt-8 sm:mt-10">
      <ol
        className="grid border-t border-border md:grid-cols-3 md:divide-x md:divide-border"
        aria-label="Figure 5 conclusions"
      >
        {WORKLOAD_FINDINGS.map((finding, index) => (
          <li
            key={finding.label}
            className="border-b border-border py-6 last:border-b-0 md:border-b-0 md:px-6 md:first:pl-0 md:last:pr-0"
          >
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
              {String(index + 1).padStart(2, "0")} / {finding.label}
            </p>
            <h4 className="mt-3 text-base font-semibold leading-6">{finding.title}</h4>
            <p className="mt-3 text-sm leading-6 text-muted">{finding.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function DiagnosticFindings() {
  return (
    <div className="mt-8 sm:mt-10">
      <ol
        className="divide-y divide-border border-t border-border"
        aria-label="Figure 6 conclusions"
      >
        {DIAGNOSTIC_FINDINGS.map((finding, index) => (
          <li
            key={finding.label}
            className="grid gap-3 py-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-10"
          >
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
                {String(index + 1).padStart(2, "0")} / {finding.label}
              </p>
              <h4 className="mt-2 text-base font-semibold leading-6">{finding.title}</h4>
            </div>
            <p className="text-sm leading-6 text-muted">{finding.body}</p>
          </li>
        ))}
      </ol>

    </div>
  );
}

function Metric({
  children,
  dimension,
}: {
  children: ReactNode;
  dimension: keyof typeof DIMENSION_COLOR;
}) {
  return (
    <span
      className="whitespace-nowrap font-mono text-[0.78rem] font-semibold"
      style={{ color: DIMENSION_COLOR[dimension] }}
    >
      {children}
    </span>
  );
}
