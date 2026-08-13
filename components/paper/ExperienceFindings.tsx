import { EXPERIENCE_REUSE, FIGURE7_IN_TASK, FIGURE8_INTER_TASK } from "@/lib/paper-data";

function signed(value: number, digits = 3) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function mean(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function InTaskFindings() {
  const rows = FIGURE7_IN_TASK.rows;

  return (
    <div className="mt-8 sm:mt-10">
      <ol className="border-t border-border" aria-label="Figure 7 conclusions">
        <li className="grid gap-5 border-b border-border py-8 last:border-b-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-12 sm:py-10">
          <FindingHeading
            label="01 / General effect"
            title="In-task experience generally improves the next commit across models."
          />
          <div>
            <p className="text-sm leading-6 text-muted">
              Six of seven models record a positive mean gain. Kimi is the sole exception, but its
              near-zero result still favors experience on more tasks than it harms (17 positive vs.
              10 negative). LongCat shows the clearest reliance on accumulated exploration, while
              Claude improves only modestly.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
              <GainDatum label="LongCat" value={rows.longcat.gain} digits={4} />
              <GainDatum label="Gemini" value={rows.gemini.gain} digits={3} />
              <GainDatum label="Claude" value={rows.claude.gain} digits={4} />
              <GainDatum label="Kimi" value={rows.kimi.gain} digits={4} />
            </dl>
          </div>
        </li>

        <li className="grid gap-5 border-b border-border py-8 last:border-b-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-12 sm:py-10">
          <FindingHeading
            label="02 / Reliance"
            title="Models differ widely in how much they rely on in-task experience."
          />
          <p className="text-sm leading-6 text-muted">
            Claude records the smallest positive gain, possibly because its top Solution Framing
            (C1) score lets it formulate strong solutions with little support from prior exploration.
            Lower-performing models, especially LongCat, show much larger gains after experience is
            retained, suggesting that accumulated exploration has a stronger influence on their next
            commits.
          </p>
        </li>
      </ol>
    </div>
  );
}

export function InterTaskFindings() {
  const rows = FIGURE8_INTER_TASK.rows;

  return (
    <div className="mt-8 sm:mt-10">
      <ol className="border-t border-border" aria-label="Figure 8 conclusions">
        <li className="grid gap-5 border-b border-border py-8 last:border-b-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-12 sm:py-10">
          <FindingHeading
            label="01 / Ranking shifts"
            title="Initial performance does not reliably predict a model&apos;s ability to improve through experience."
          />
          <div>
            <p className="text-sm leading-6 text-muted">
              DeepSeek starts last without lessons yet records the largest inter-task gain, while
              initially strong Gemini declines. GLM and GPT overtake Gemini on avg@3, and DeepSeek
              moves above LongCat. Experience can therefore narrow or widen existing gaps and even
              reverse model rankings.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
              <GainDatum label="DeepSeek" value={rows.deepseek.gain} />
              <GainDatum label="GPT" value={rows.gpt.gain} />
              <GainDatum label="GLM" value={rows.glm.gain} />
              <GainDatum label="Gemini" value={rows.gemini.gain} />
            </dl>
          </div>
        </li>

        <li className="grid gap-5 border-b border-border py-8 last:border-b-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-12 sm:py-10">
          <FindingHeading
            label="02 / What transfers"
            title="Effective reuse transfers general problem-solving principles; poor reuse misapplies source-specific tactics or amplifies evaluator-specific shortcuts."
          />
          <p className="text-sm leading-6 text-muted">
            DeepSeek transfers engineering discipline through constraint checks, verification, and
            rollback; GLM removes repeated work from an online-serving critical path. By contrast,
            Opus applies an unhelpful caching tactic to mostly unique inputs, while Gemini turns a
            distilled evaluator shortcut into an apparent gain. Self-distillation can be genuine,
            negative, or merely apparent depending on how the lesson is validated.
          </p>
        </li>
      </ol>
    </div>
  );
}

export function ExperienceReuseFindings() {
  const representation = EXPERIENCE_REUSE.representation.rows;
  const source = EXPERIENCE_REUSE.sourceCompatibility.rows;
  const explicitAvg = mean(representation.map((row) => row.avg3.explicit));
  const implicitAvg = mean(representation.map((row) => row.avg3.implicit));
  const explicitBest = mean(representation.map((row) => row.best3.explicit));
  const implicitBest = mean(representation.map((row) => row.best3.implicit));

  return (
    <div className="mt-8 sm:mt-10">
      <ol className="border-t border-border" aria-label="Figure 9 conclusions">
        <li className="grid gap-5 border-b border-border py-8 last:border-b-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-12 sm:py-10">
          <FindingHeading
            label="01 / Representation"
            title="Distilled lessons outperform raw workspaces on both metrics."
          />
          <div>
            <p className="text-sm leading-6 text-muted">
              Across Claude, GPT, and GLM, distillation adds value beyond compression: it filters
              noise and highlights transferable knowledge. Raw workspaces can win on a few targets,
              but their aggregate transfer is weaker and less reliable.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
              <GainDatum label="Explicit avg@3" value={explicitAvg} />
              <GainDatum label="Implicit avg@3" value={implicitAvg} />
              <GainDatum label="Explicit best@3" value={explicitBest} />
              <GainDatum label="Implicit best@3" value={implicitBest} />
            </dl>
          </div>
        </li>

        <li className="grid gap-5 border-b border-border py-8 last:border-b-0 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-12 sm:py-10">
          <FindingHeading
            label="02 / Compatibility"
            title="Self-generated lessons outperform cross-model lessons in both directions."
          />
          <div>
            <p className="text-sm leading-6 text-muted">
              LongCat falls from {signed(source[0].avg3.self)} to {signed(source[0].avg3.cross)}{" "}
              on avg@3 when it receives GLM&apos;s lessons. In the reverse direction, GLM falls from{" "}
              {signed(source[1].avg3.self)} to {signed(source[1].avg3.cross)}. Effective reuse is
              currently most reliable as a model-specific, end-to-end process.
            </p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <ComparisonDatum
                label="LongCat · avg@3"
                self={source[0].avg3.self}
                cross={source[0].avg3.cross}
              />
              <ComparisonDatum
                label="GLM · avg@3"
                self={source[1].avg3.self}
                cross={source[1].avg3.cross}
              />
            </dl>
          </div>
        </li>
      </ol>
    </div>
  );
}

function FindingHeading({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
        {label}
      </p>
      <h4 className="mt-3 text-xl font-semibold leading-8 tracking-[-0.015em]">{title}</h4>
    </div>
  );
}

function GainDatum({ label, value, digits = 3 }: { label: string; value: number; digits?: number }) {
  return (
    <div
      className="border-t-2 pt-2.5"
      style={{ borderColor: value < 0 ? "#a55737" : "var(--accent)" }}
    >
      <dt className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd
        className={`mt-0.5 font-mono text-base font-semibold tabular-nums ${
          value < 0 ? "text-[#a55737]" : "text-accent"
        }`}
      >
        {signed(value, digits)}
      </dd>
    </div>
  );
}

function ComparisonDatum({ label, self, cross }: { label: string; self: number; cross: number }) {
  return (
    <div className="border-t border-border pt-2.5">
      <dt className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-xs font-semibold tabular-nums">
        <span className={self < 0 ? "text-[#a55737]" : "text-accent"}>{signed(self)}</span>
        <span className="px-1.5 text-muted" aria-hidden="true">
          →
        </span>
        <span className={cross < 0 ? "text-[#a55737]" : "text-accent"}>{signed(cross)}</span>
      </dd>
      <p className="mt-1 text-[10px] text-muted">self → cross-model lessons</p>
    </div>
  );
}
