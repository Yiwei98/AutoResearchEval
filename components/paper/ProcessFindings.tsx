const DIMENSION_COLOR = {
  outcome: "#34443b",
  c1: "#4f7ca8",
  c2: "#4f9a67",
  c3: "#b36b2c",
} as const;

export function ProcessFindings() {
  return (
    <div className="mt-8 sm:mt-10">
      <ol className="border-t border-border" aria-label="Model process conclusions">
        <li className="grid gap-5 border-b border-border py-8 last:border-b-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-12 sm:py-10">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
              01 / Primary driver
            </p>
            <h4 className="mt-3 text-xl font-semibold leading-8 tracking-[-0.015em]">
              Strong outcomes depend mainly on effective Solution Framing and reliable Execution.
            </h4>
          </div>

          <div>
            <p className="text-sm leading-6 text-muted">
              Claude leads Outcome (0.739), C1 (0.612), and C2 (0.967), despite placing only
              third on C3 (0.920). C2 is relatively compressed across models, from 0.880 to
              0.967, while the wider C1 range, from 0.473 to 0.612, reveals differences that
              successful delivery alone cannot explain.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
              <MetricDatum label="Outcome" value="0.739" color={DIMENSION_COLOR.outcome} />
              <MetricDatum label="C1" value="0.612" color={DIMENSION_COLOR.c1} />
              <MetricDatum label="C2" value="0.967" color={DIMENSION_COLOR.c2} />
              <MetricDatum label="C3 · third" value="0.920" color={DIMENSION_COLOR.c3} />
            </dl>
          </div>
        </li>

        <li className="grid gap-5 border-b border-border py-8 last:border-b-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-12 sm:py-10">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
              02 / Different profiles
            </p>
            <h4 className="mt-3 text-xl font-semibold leading-8 tracking-[-0.015em]">
              Similar outcomes can conceal sharply different Execution and Feedback Control profiles.
            </h4>
          </div>

          <div>
            <p className="text-sm leading-6 text-muted">
              GPT and Gemini are close on Outcome (0.663 vs. 0.652) and identical on C1
              (0.555), yet GPT is stronger on C2 while Gemini is stronger on C3. Final reward
              alone therefore hides whether the limiting factor is delivery or feedback control.
            </p>

            <dl className="mt-5">
              <ProfileDatum model="GPT-5.5" c2="0.958" c3="0.858" />
              <ProfileDatum model="Gemini-3.1-Pro" c2="0.889" c3="0.921" />
            </dl>

            <p className="mt-5 text-xs leading-5 text-muted">
              <span className="font-semibold text-foreground">Complementary limit.</span>{" "}
              LongCat has the highest observed C3 (0.928) but ranks sixth on Outcome (0.572)
              and C1 (0.478). Strong retention and recovery cannot compensate for weak solution
              framing. LongCat, Gemini, and Claude remain closely grouped on C3, so this is not a
              decisive ordering.
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}

function MetricDatum({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border-t-2 pt-2.5" style={{ borderColor: color }}>
      <dt className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-base font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function ProfileDatum({ model, c2, c3 }: { model: string; c2: string; c3: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-4 border-t border-border py-3 first:pt-3">
      <dt className="truncate text-xs font-semibold text-foreground">{model}</dt>
      <dd className="font-mono text-[11px] tabular-nums" style={{ color: DIMENSION_COLOR.c2 }}>
        C2 {c2}
      </dd>
      <dd className="font-mono text-[11px] tabular-nums" style={{ color: DIMENSION_COLOR.c3 }}>
        C3 {c3}
      </dd>
    </div>
  );
}
