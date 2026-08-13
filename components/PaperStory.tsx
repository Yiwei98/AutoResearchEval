import Link from "next/link";
import { LeaderboardSection } from "@/components/LeaderboardSection";
import { ProcessChart } from "@/components/ProcessChart";
import { SelfImprovementChart } from "@/components/SelfImprovementChart";
import {
  ExperienceEvaluationFramework,
  ProcessEvaluationFramework,
} from "@/components/paper/EvaluationFramework";
import { WorkloadBottleneckChart } from "@/components/paper/WorkloadBottleneckChart";
import { SolutionNatureChart } from "@/components/paper/SolutionNatureChart";
import { HarnessComparisonChart } from "@/components/paper/HarnessComparisonChart";
import { AutoHarnessTransferChart } from "@/components/paper/AutoHarnessTransferChart";
import { CitationBlock } from "@/components/paper/CitationBlock";
import {
  PAPER_SCALE,
  PROCESS_DIMENSION_META,
} from "@/lib/paper-data";
import { withBasePath } from "@/lib/base-path";
import { SITE_RESOURCES } from "@/lib/site-config";

const PROCESS_COLOR_BY_KEY = Object.fromEntries(
  PROCESS_DIMENSION_META.map(({ key, color }) => [key, color]),
) as Record<(typeof PROCESS_DIMENSION_META)[number]["key"], string>;

const OVERALL_ASSESSMENT = {
  title:
    "Current agents operate more like engineering optimizers than fully autonomous researchers.",
  body:
    "Within bounded research loops, they can formulate practical directions, implement working solutions, and improve technical artifacts. Yet success varies across runs, genuine algorithmic innovation remains rare, and realized performance is shaped by process bottlenecks, accumulated experience, and harness design.",
};

const ASSESSMENT_EVIDENCE = [
  {
    number: "01",
    title: "Reliability separates current models more than peak performance.",
    body: "The strongest-to-weakest gap is 0.237 on avg@3 but only 0.122 on best@3: several models can reach competitive solutions, but do so with substantially different consistency across repeated runs.",
  },
  {
    number: "02",
    title: "Outcome scores conceal where research actually fails.",
    body: "Similar rewards can hide different process profiles, and dominant bottlenecks shift by workload. Only three of 252 best-seed solutions qualify as novel approaches, exposing a gap between optimization performance and methodological novelty.",
  },
  {
    number: "03",
    title: "Research performance is not fixed by the backbone model alone.",
    body: "Experience can improve or degrade performance strongly enough to change model ordering, while native harnesses mainly improve run-to-run reliability. Automated harness optimization offers further headroom.",
  },
];

interface PaperConclusion {
  readonly title: string;
  readonly body: string;
}

const OUTCOME_CONCLUSIONS = [
  {
    title: "Average performance separates models more sharply than best performance.",
    body: "The highest-to-lowest gap is 0.237 on avg@3 but only 0.122 on best@3. Lower-ranked models can still reach competitive solutions, but do so less consistently across repeated rollouts.",
  },
  {
    title: "Task categories reveal distinct capability profiles.",
    body: "Claude leads avg@3 in three categories, while GLM narrowly leads Puzzle & Challenge. Puzzle & Challenge separates models least, whereas CUDA separates them most and splits the metric leaders: Claude on avg@3, GPT on best@3.",
  },
] as const satisfies readonly PaperConclusion[];

const MODEL_PROCESS_CONCLUSIONS = [
  {
    title: "Strong outcomes depend mainly on effective Solution Framing and reliable Execution.",
    body: "Claude leads Outcome (0.739), Solution Framing (0.612), and Execution (0.967). Execution is relatively compressed across models, while the wider Solution Framing and Feedback Control ranges reveal differences that successful delivery alone cannot explain.",
  },
  {
    title: "Similar outcomes can conceal sharply different Execution and Feedback Control profiles.",
    body: "GPT and Gemini have nearly identical outcomes and the same Solution Framing score, yet GPT is stronger in Execution while Gemini is stronger in Feedback Control. LongCat shows the complementary limit: the highest Feedback Control score cannot compensate for weaker framing and outcome.",
  },
] as const satisfies readonly PaperConclusion[];

const WORKLOAD_PROCESS_CONCLUSIONS = [
  {
    title: "Different task categories expose different bottlenecks in the research loop.",
    body: "CUDA is constrained by Solution Framing and Execution despite strong Feedback Control, while Model Development shows the reverse pattern. Puzzle & Challenge is strongest across all three process dimensions.",
  },
] as const satisfies readonly PaperConclusion[];

const INTRA_TASK_CONCLUSIONS = [
  {
    title: "Intra-task experience generally improves the next commit across models.",
    body: "Six of seven models improve on average. Kimi is the sole aggregate exception at -0.0127, although it still benefits from retained experience on more tasks than it is harmed.",
  },
  {
    title: "Models differ widely in how much they rely on intra-task experience.",
    body: "Claude shows the smallest positive gain (+0.0362), while LongCat combines the largest gain (+0.1454) with the weakest Solution Framing. Accumulated exploration matters more when strong solutions are harder to formulate immediately.",
  },
  {
    title: "Why retained experience is usually beneficial, and when it backfires.",
    body: "Memory helps when it preserves a known dead end, a tuned configuration, or a hard-won implementation that cannot be rediscovered within the remaining budget. It backfires when retained state carries a premature conclusion or anchors the agent to a local optimum.",
  },
] as const satisfies readonly PaperConclusion[];

const INTER_TASK_CONCLUSIONS = [
  {
    title: "Initial performance does not reliably predict a model’s ability to improve through experience.",
    body: "DeepSeek begins from the weakest lesson-free baseline yet records the largest gains, while the stronger Gemini declines on avg@3. Experience can therefore narrow, widen, or reverse the original ranking.",
  },
  {
    title: "Experience reuse can improve performance but remains unstable: successful transfer abstracts general principles, whereas failures misapply source-specific tactics or reinforce evaluator-specific shortcuts.",
    body: "Successful lessons capture general practices such as constraint checking, verification, and rollback. Failures either transplant a tactic to the wrong workload or turn evaluator-specific behavior into an apparent gain.",
  },
  {
    title: "Experience transfers more effectively through explicitly distilled, self-generated lessons.",
    body: "Distilled lessons outperform raw workspaces for all three tested models, and self-generated lessons outperform cross-model lessons for both GLM and LongCat. Transfer depends on filtering noise and matching the lesson to the receiving model.",
  },
] as const satisfies readonly PaperConclusion[];

const HARNESS_CONCLUSIONS = [
  {
    title: "The three harness settings achieve comparable aggregate performance and preserve model rankings, differing mainly in run-to-run stability.",
    body: "Across harnesses, best@3 moves by at most 0.035, while avg@3 rises more for GPT and especially Kimi under native and OpenCode harnesses. Harness choice therefore improves stability more than the capability ceiling.",
  },
] as const satisfies readonly PaperConclusion[];

const SOLUTION_CONCLUSIONS = [
  {
    title: "Agents improve artifacts primarily by composing established techniques, while genuine novelty is rare.",
    body: "Composition-stacking is the largest category for every model, accounting for 111 of 252 solutions (44.0%). Only three solutions (1.2%) remain novel after manual review, while 16 (6.3%) exploit evaluation-specific shortcuts.",
  },
  {
    title: "Novel approaches do not concentrate in the highest-performing models and arise through task-specific reframing rather than new technical primitives.",
    body: "The three validated cases come from GLM, Kimi, and LongCat rather than the top-ranked models. Each reframes a task with familiar components instead of inventing a new technical primitive.",
  },
] as const satisfies readonly PaperConclusion[];

const DISCUSSION_CONCLUSIONS = [
  {
    title: "What Training Can Improve",
    body: "Training should target the bottleneck revealed by each model and task category. Because Execution is already strong and tightly clustered, larger opportunities lie in Solution Framing and Feedback Control. Process diagnostics can guide targeted training data, process rewards, and curricula, while positive and negative transfer cases can teach models when prior experience applies and when it should be reconsidered.",
  },
  {
    title: "What Inference-Time Search Can Recover",
    body: "Inference-time strategies can improve how reliably models realize their existing capabilities. Diverse rollouts, verifier-backed selection, branching from promising checkpoints, and early termination of repeatedly failing or stagnant trajectories could allocate compute more effectively. Process diagnostics can guide when to explore, implement, or recover, while trajectory selection should consider execution validity and progress retention alongside final reward.",
  },
  {
    title: "What Memory and Harness Design Can Stabilize",
    body: "Memory must selectively retrieve, validate, revise, and remove experience rather than simply retain more context. Harness stability likely reflects mechanisms such as error recovery, task management, and best-state protection; native harnesses mainly improve reliability, while automated optimization points toward task-specific and model-adaptive harnesses.",
  },
  {
    title: "What Requires New Objectives and Benchmarks",
    body: "When reward captures task performance but not methodological quality, optimizing it more aggressively may reinforce shortcut-seeking. Progress toward open-ended research requires tasks and feedback that reward not only performance, but also novelty, validity, and generality.",
  },
] as const satisfies readonly PaperConclusion[];

export function PaperStory() {
  return (
    <article className="overflow-clip">
      <section
        id="overview"
        data-paper-section
        className="scroll-mt-24 border-b border-border"
      >
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-5xl text-center">
            <h1
              aria-label="Beyond Final Scores: A Systematic Evaluation of Agents for Long-Horizon AI Research and Development"
              className="mx-auto max-w-6xl text-balance text-[2.05rem] font-bold leading-[1.12] tracking-[-0.032em] sm:text-[2.45rem] lg:text-[2.6rem]"
            >
              <span className="block lg:whitespace-nowrap">
                <span className="text-accent">Beyond Final Scores:</span>{" "}
                A Systematic Evaluation of Agents{" "}
              </span>
              <span className="block lg:whitespace-nowrap">
                for Long-Horizon AI Research and Development
              </span>
            </h1>
            <div className="mx-auto mt-9 max-w-4xl text-left">
              <p className="text-pretty text-base leading-7 text-muted sm:text-lg sm:leading-8">
                Autonomous agents can now improve technical artifacts through long-horizon
                experimentation. Yet final scores reveal little about how they succeed or fail. We
                examine these loops through{" "}
                <strong
                  className="font-semibold"
                  style={{ color: PROCESS_COLOR_BY_KEY.c1 }}
                >
                  Solution Framing
                </strong>
                ,{" "}
                <strong
                  className="font-semibold"
                  style={{ color: PROCESS_COLOR_BY_KEY.c2 }}
                >
                  Execution
                </strong>
                , and{" "}
                <strong
                  className="font-semibold"
                  style={{ color: PROCESS_COLOR_BY_KEY.c3 }}
                >
                  Feedback Control
                </strong>
                , complemented by analyses of experience reuse, harness effects, and solution
                novelty. Taken together, the results show that current agents behave more like{" "}
                <strong className="font-semibold text-foreground">
                  engineering optimizers than autonomous researchers
                </strong>
                : they can deliver practical improvements, but remain inconsistent across runs and
                rarely produce genuinely novel methods.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={withBasePath(SITE_RESOURCES.paperUrl)}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
                target="_blank"
                rel="noreferrer"
              >
                Read the paper
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <Link
                href="/trajectories"
                className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition-colors hover:border-accent/50 hover:text-accent"
              >
                Explore agent trajectories
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            <div className="mb-3 flex items-center gap-3 px-1">
              <p className="section-kicker whitespace-nowrap">Study at a glance</p>
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              <HeroStat index="01" value={String(PAPER_SCALE.models)} label="frontier models" />
              <HeroStat index="02" value={String(PAPER_SCALE.tasks)} label="long-horizon tasks" />
              <HeroStat
                index="03"
                value={String(PAPER_SCALE.baselineTrajectories)}
                label="common-harness rollouts"
              />
              <HeroStat
                index="04"
                value={`${PAPER_SCALE.wallClockBudgetHours.min}-${PAPER_SCALE.wallClockBudgetHours.max}h`}
                label="wall-clock budget"
              />
              <HeroStat
                index="05"
                value={`~$${PAPER_SCALE.approximateInferenceCostUsd / 1_000}k`}
                label="inference cost across all experiments"
                wide
              />
            </dl>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <div className="mb-6">
              <p className="section-kicker">In one minute</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Where current auto-research agents stand
              </h2>
            </div>
            <div className="rounded-r-xl border-l-2 border-accent bg-accent-soft/45 px-5 py-5 sm:px-6 sm:py-6">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                Overall assessment
              </p>
              <h3 className="mt-2 max-w-4xl text-xl font-semibold leading-7 tracking-[-0.02em] sm:text-2xl sm:leading-8">
                {OVERALL_ASSESSMENT.title}
              </h3>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
                {OVERALL_ASSESSMENT.body}
              </p>
            </div>
            <ol className="mt-5 grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
              {ASSESSMENT_EVIDENCE.map((finding) => (
                <li key={finding.number} className="px-4 py-5 sm:px-5">
                  <span className="font-mono text-xs font-semibold text-accent">
                    {finding.number}
                  </span>
                  <h3 className="mt-3 text-base font-semibold leading-6">{finding.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{finding.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <PaperSection
        id="outcomes"
        kicker="02"
        title="Evaluation Setting and Outcome-Level Landscape"
        intro="We compare seven frontier models under the same tasks, harness, and protocol to establish a controlled view of final performance. This outcome landscape anchors the process, experience, harness, and novelty analyses that follow."
        tone="soft"
      >
        <LeaderboardSection />
        <PaperConclusions label="Figure 2 conclusions" conclusions={OUTCOME_CONCLUSIONS} />
      </PaperSection>

      <PaperSection
        id="process"
        kicker="03"
        title="Inside the Research Loop: Process Evaluation"
        intro="Auto research unfolds as a repeated loop of proposing a direction, implementing a change, observing the result, and deciding what to do next. We look inside that loop to distinguish failures of Solution Framing, Execution, and Feedback Control."
      >
        <span id="evaluation" className="block scroll-mt-24" aria-hidden="true" />
        <ProcessEvaluationFramework />

        <div
          id="model-process-profiles"
          className="mt-16 scroll-mt-24 sm:mt-20"
        >
          <ProcessChart />
          <PaperConclusions
            label="Figure 4 conclusions"
            conclusions={MODEL_PROCESS_CONCLUSIONS}
          />

          <div
            id="workload-process-profiles"
            className="mt-16 scroll-mt-24 sm:mt-20"
          >
            <WorkloadBottleneckChart />
            <PaperConclusions
              label="Figure 5 conclusion"
              conclusions={WORKLOAD_PROCESS_CONCLUSIONS}
            />
          </div>
        </div>
      </PaperSection>

      <PaperSection
        id="experience"
        kicker="04"
        title="Learning from Experience"
        intro="Practical auto research should improve as experience accumulates. We test this evolving capability at two scales: reuse within the same task and transfer from solved tasks to a held-out target."
      >
        <ExperienceEvaluationFramework />

        <StorySubsection
          id="experience-in-task"
          title="Intra-Task Experience Reuse"
        >
          <div className="mt-7">
            <SelfImprovementChart mode="in" showTabs={false} />
          </div>
          <PaperConclusions
            label="Figure 7 conclusions"
            conclusions={INTRA_TASK_CONCLUSIONS}
          />
        </StorySubsection>

        <StorySubsection
          id="experience-inter-task"
          title="Inter-Task Experience Reuse"
        >
          <div className="mt-7">
            <SelfImprovementChart mode="inter" showTabs={false} />
          </div>
          <PaperConclusions
            label="Figure 8 conclusions"
            conclusions={INTER_TASK_CONCLUSIONS}
          />
        </StorySubsection>
      </PaperSection>

      <PaperSection
        id="harness"
        kicker="05"
        title="The Role of the Agent Harness"
        intro="The harness shapes how an agent plans, executes tools, observes failures, and preserves progress over long runs. We compare leading, native, and open-source harnesses, then test how far an evolved Auto Harness transfers beyond its seed tasks."
        tone="soft"
      >
        <div className="grid gap-8 xl:grid-cols-2">
          <HarnessComparisonChart />
          <AutoHarnessTransferChart />
        </div>
        <PaperConclusions label="Figure 9 conclusion" conclusions={HARNESS_CONCLUSIONS} />
      </PaperSection>

      <PaperSection
        id="innovation"
        kicker="06"
        title="Solution Nature and Novelty"
        intro="High reward does not reveal whether an agent discovered a new idea or assembled established techniques. We classify 252 best-seed solutions to examine what current auto research agents actually produce."
      >
        <SolutionNatureChart />
        <PaperConclusions label="Figure 11 conclusions" conclusions={SOLUTION_CONCLUSIONS} />
      </PaperSection>

      <PaperSection
        id="implications"
        kicker="07"
        title="Discussion"
        intro="The limitations of current agents cannot be addressed through a single optimization strategy. Different failure patterns require corresponding changes to model training, inference-time strategies, long-horizon system design, or the evaluation objective itself."
      >
        <PaperConclusions label="Discussion conclusions" conclusions={DISCUSSION_CONCLUSIONS} />
      </PaperSection>

      <PaperSection
        id="citation"
        kicker="Citation"
        title="Cite our paper"
        tone="soft"
      >
        <CitationBlock />
      </PaperSection>
    </article>
  );
}

function PaperSection({
  id,
  kicker,
  title,
  intro,
  children,
  tone = "plain",
}: {
  id: string;
  kicker: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  tone?: "plain" | "soft";
}) {
  return (
    <section
      id={id}
      data-paper-section
      className={`scroll-mt-24 border-b border-border py-16 last:border-b-0 sm:py-20 ${
        tone === "soft" ? "bg-surface/45" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mb-9 max-w-3xl">
          <p className="section-kicker">{kicker}</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          {intro ? (
            <p className="mt-4 text-pretty text-base leading-7 text-muted">{intro}</p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function StorySubsection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="mt-16 sm:mt-20"
      aria-labelledby={id}
    >
      <header className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.7fr)] md:items-end md:gap-12">
        <div>
          <h3
            id={id}
            className="text-balance text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl"
          >
            {title}
          </h3>
        </div>
      </header>
      {children}
    </section>
  );
}

function PaperConclusions({
  label,
  conclusions,
}: {
  label: string;
  conclusions: readonly PaperConclusion[];
}) {
  return (
    <ol className="mt-8 max-w-5xl space-y-7 sm:mt-10 sm:space-y-8" aria-label={label}>
      {conclusions.map((conclusion) => (
        <li key={conclusion.title}>
          <p className="text-lg font-semibold leading-7 tracking-[-0.012em] sm:text-xl sm:leading-8">
            {conclusion.title}
          </p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted sm:text-[0.95rem] sm:leading-7">
            {conclusion.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

function HeroStat({
  index,
  value,
  label,
  wide = false,
}: {
  index: string;
  value: string;
  label: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`relative flex min-h-[6.25rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md sm:px-5 ${
        wide ? "col-span-2 sm:col-span-1" : ""
      }`}
    >
      <span
        className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-accent/60"
        aria-hidden="true"
      />
      <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-accent" aria-hidden="true">
        {index}
      </span>
      <dt className="order-3 mt-auto text-xs leading-5 text-muted">{label}</dt>
      <dd className="order-2 mt-1 font-mono text-2xl font-semibold tracking-[-0.03em] sm:text-[1.7rem]">
        {value}
      </dd>
    </div>
  );
}
