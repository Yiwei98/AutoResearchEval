/**
 * Structured values transcribed from the paper
 * "Beyond Final Scores: A Systematic Evaluation of Agents for Long-Horizon AI
 * Research and Development".
 *
 * Keep figure/table provenance beside every dataset. Values are stored at the
 * precision printed in the paper; derived Table 2 means are task weighted.
 */

export const PAPER_REVISION = {
  date: "2026-08-13",
  sha256: "3a1185437685772aa03176c74b0ac369afa116a61b1d4c3019671ab869309ede",
} as const;

export const PAPER_SCALE = {
  models: 7,
  tasks: 36,
  baselineTrajectories: 756,
  trajectoryMessages: 332_797,
  scoredEvaluations: 31_887,
  wallClockBudgetHours: { min: 2, max: 12 },
  approximateInferenceCostUsd: 100_000,
} as const;

export const PAPER_MODEL_KEYS = [
  "claude",
  "glm",
  "gpt",
  "gemini",
  "kimi",
  "longcat",
  "deepseek",
] as const;

export type PaperModelKey = (typeof PAPER_MODEL_KEYS)[number];

export interface PaperSource {
  readonly label: string;
  readonly caption: string;
}

export const PAPER_SOURCES = {
  figure1: {
    label: "Figure 1",
    caption:
      "Analytical views used to interpret auto-research behavior: process quality and experience-based self-improvement.",
  },
  figure2: {
    label: "Figure 2",
    caption:
      "Solid segments show avg@3, while full bar heights show best@3. Category views compare the same seven models across Model Development, System Optimization, Puzzle & Challenge, and CUDA.",
  },
  figure3: {
    label: "Figure 3",
    caption:
      "Mean estimated inference cost per task across four task categories and overall.",
  },
  figure4: {
    label: "Figure 4",
    caption:
      "Outcome, Solution Framing, Execution, and Feedback Control across seven models. Process scores use task-macro aggregation and lie in [0, 1], where higher is better.",
  },
  figure5: {
    label: "Figure 5",
    caption:
      "Process dimensions by task category, averaged over the seven models.",
  },
  figure6: {
    label: "Figure 6",
    caption:
      "Task-balanced behavioral diagnostics across seven models and 36 tasks.",
  },
  figure7: {
    label: "Figure 7",
    caption:
      "Per-model first-commit reward with and without retained experience, together with the corresponding intra-task gain, averaged over 32 retained trajectories.",
  },
  figure8: {
    label: "Figure 8",
    caption:
      "Per-model avg@3 with and without distilled experience, together with the corresponding inter-task gain across 19 held-out targets.",
  },
  figure9: {
    label: "Figure 9",
    caption:
      "Coding harness comparison across Claude Code, each model's native harness, and OpenCode. Dark bars show avg@3 and light bars show best@3.",
  },
  figure10: {
    label: "Figure 10",
    caption:
      "Gain of the evolved harness over the original harness on seed tasks, held-out System Optimization tasks, cross-model System Optimization tasks, and unrelated task families.",
  },
  figure11: {
    label: "Figure 11",
    caption:
      "Solution nature across 252 best-seed solutions. Each model contributes 36 solutions; three novel approaches remain after manual review.",
  },
  table2: {
    label: "Table 2 (Appendix I)",
    caption:
      "Category-level harness comparison. Overall values are task-weighted from the category scores printed in Table 2.",
  },
  appendixFigure12: {
    label: "Appendix Figure 12",
    caption:
      "Resource-performance trade-offs across seven models: best@3 against total estimated cost, mean wall-clock time per task, and mean interaction steps per task.",
  },
  appendixFigure17: {
    label: "Appendix Figure 17",
    caption:
      "How the representation and source of experience affect inter-task reuse.",
  },
  section53: {
    label: "Section 5.3",
    caption:
      "Trajectory inspection of how general and evolved harnesses support recovery, task management, and long-horizon control.",
  },
  appendixI: {
    label: "Appendix I / Table 2",
    caption:
      "Category-level harness effects showing that the direction of a harness change depends jointly on the model and workload.",
  },
} as const satisfies Record<string, PaperSource>;

export interface EvaluationDimension {
  readonly key: "c1" | "c2" | "c3";
  readonly label: string;
  readonly question: string;
  readonly signal: string;
  readonly definition: string;
}

export interface ExperienceView {
  readonly key: "in-task" | "inter-task";
  readonly label: string;
  readonly comparison: string;
  readonly metric: string;
  readonly metricLabel: string;
  readonly detail: string;
}

export const EVALUATION_FRAMEWORK = {
  source: PAPER_SOURCES.figure1,
  context: "7 frontier models, 36 long-horizon tasks, and 756 baseline trajectories",
  process: [
    {
      key: "c1",
      label: "Solution Framing",
      question: "Does the agent frame directions that drive reward high and fast?",
      signal: "Reward height and speed",
      definition:
        "Uses the running-best verifier reward over a common horizon, rewarding both how high the agent gets and how early it gets there.",
    },
    {
      key: "c2",
      label: "Execution",
      question: "Do proposed changes run cleanly and pass correctness checks?",
      signal: "Reliable delivery",
      definition:
        "Gates each non-initial checkpoint on executable, correct delivery, then applies a bounded discount for preceding code-related build failures.",
    },
    {
      key: "c3",
      label: "Feedback Control",
      question: "Does the agent preserve its best result and recover from regressions?",
      signal: "Peak retention and recovery",
      definition:
        "Combines final-to-peak retention with the amount and speed of recovery after meaningful regressions; with no regression, only retention is evaluated.",
    },
  ] satisfies readonly EvaluationDimension[],
  experience: [
    {
      key: "in-task",
      label: "Intra-Task Self-Improvement",
      comparison: "Continue from the same branch point with vs. without accumulated experience",
      metric: "\\Delta R_{\\mathrm{intra}} = R^{\\mathrm{exp}} - R^{\\mathrm{no\\_exp}}",
      metricLabel: "Delta R intra equals R exp minus R no exp",
      detail: "The first commit after the branch isolates the value of prior exploration.",
    },
    {
      key: "inter-task",
      label: "Inter-Task Self-Improvement",
      comparison: "Solve a held-out target with vs. without distilled lessons from a source task",
      metric: "\\Delta R_{\\mathrm{inter}} = R^{(+)} - R^{(0)}",
      metricLabel: "Delta R inter equals R plus minus R zero",
      detail: "Model, harness, environment, resources, and target protocol stay fixed.",
    },
  ] satisfies readonly ExperienceView[],
} as const;

export type Figure3Precision = "exact" | "figure-digitized";

export interface Figure3Measure {
  readonly value: number;
  readonly precision: Figure3Precision;
}

export interface Figure3ResourceRow {
  readonly model: PaperModelKey;
  /** Table 1 / Appendix Figure 12 y-value, printed to three decimals. */
  readonly best3: number;
  readonly costUsd: Figure3Measure;
  readonly meanHoursPerTask: Figure3Measure;
  readonly meanStepsPerTask: Figure3Measure;
}

/**
 * Appendix Figure 12 does not publish its full underlying x-value table. Values marked
 * `figure-digitized` are rounded positions read from the plotted points and
 * must always be shown with an approximation marker in the UI.
 */
export const FIGURE3_RESOURCE_PERFORMANCE = {
  source: PAPER_SOURCES.appendixFigure12,
  metric:
    "best@3 versus total estimated cost, mean wall-clock time per task, and mean interaction steps per task",
  sample: "Seven models, 36 tasks, and 756 common-harness trajectories",
  approximationNote:
    "All best@3 values are exact. Resource values are rounded positions digitized from Appendix Figure 12 and are approximate.",
  rows: [
    {
      model: "claude",
      best3: 0.79,
      costUsd: { value: 9712, precision: "figure-digitized" },
      meanHoursPerTask: { value: 2.1, precision: "figure-digitized" },
      meanStepsPerTask: { value: 178, precision: "figure-digitized" },
    },
    {
      model: "glm",
      best3: 0.757,
      costUsd: { value: 3569, precision: "figure-digitized" },
      meanHoursPerTask: { value: 2.8, precision: "figure-digitized" },
      meanStepsPerTask: { value: 323, precision: "figure-digitized" },
    },
    {
      model: "gpt",
      best3: 0.772,
      costUsd: { value: 1783, precision: "figure-digitized" },
      meanHoursPerTask: { value: 1.2, precision: "figure-digitized" },
      meanStepsPerTask: { value: 64, precision: "figure-digitized" },
    },
    {
      model: "gemini",
      best3: 0.75,
      costUsd: { value: 1330, precision: "figure-digitized" },
      meanHoursPerTask: { value: 1.1, precision: "figure-digitized" },
      meanStepsPerTask: { value: 84, precision: "figure-digitized" },
    },
    {
      model: "kimi",
      best3: 0.729,
      costUsd: { value: 1000, precision: "figure-digitized" },
      meanHoursPerTask: { value: 1.7, precision: "figure-digitized" },
      meanStepsPerTask: { value: 115, precision: "figure-digitized" },
    },
    {
      model: "longcat",
      best3: 0.674,
      costUsd: { value: 420, precision: "figure-digitized" },
      meanHoursPerTask: { value: 2.2, precision: "figure-digitized" },
      meanStepsPerTask: { value: 160, precision: "figure-digitized" },
    },
    {
      model: "deepseek",
      best3: 0.668,
      costUsd: { value: 463, precision: "figure-digitized" },
      meanHoursPerTask: { value: 2.4, precision: "figure-digitized" },
      meanStepsPerTask: { value: 117, precision: "figure-digitized" },
    },
  ] satisfies readonly Figure3ResourceRow[],
} as const;

export interface Figure4ProcessScores {
  readonly outcome: number;
  readonly c1: number;
  readonly c2: number;
  readonly c3: number;
}

export const FIGURE4_PROCESS = {
  source: PAPER_SOURCES.figure4,
  metric: "Scores lie in [0, 1]; higher is better",
  sample: "Seven models on the 36-task common-harness evaluation",
  rows: {
    claude: { outcome: 0.739, c1: 0.612, c2: 0.967, c3: 0.92 },
    glm: { outcome: 0.682, c1: 0.539, c2: 0.937, c3: 0.911 },
    gpt: { outcome: 0.663, c1: 0.555, c2: 0.958, c3: 0.858 },
    gemini: { outcome: 0.652, c1: 0.555, c2: 0.889, c3: 0.921 },
    kimi: { outcome: 0.584, c1: 0.473, c2: 0.88, c3: 0.875 },
    longcat: { outcome: 0.572, c1: 0.478, c2: 0.888, c3: 0.928 },
    deepseek: { outcome: 0.524, c1: 0.519, c2: 0.888, c3: 0.772 },
  } satisfies Record<PaperModelKey, Figure4ProcessScores>,
} as const;

export interface ExperienceComparisonScores {
  readonly withExp: number;
  readonly withoutExp: number;
  readonly gain: number;
}

export const FIGURE7_IN_TASK = {
  source: PAPER_SOURCES.figure7,
  metric: "First-commit reward after the branch point; intra-task gain uses unrounded rewards",
  sample: "32 retained trajectories under the intra-task experience-erasure design",
  rows: {
    claude: { withExp: 0.74, withoutExp: 0.7, gain: 0.0362 },
    glm: { withExp: 0.72, withoutExp: 0.64, gain: 0.079 },
    gpt: { withExp: 0.66, withoutExp: 0.58, gain: 0.073 },
    gemini: { withExp: 0.7, withoutExp: 0.57, gain: 0.128 },
    kimi: { withExp: 0.52, withoutExp: 0.54, gain: -0.0127 },
    longcat: { withExp: 0.63, withoutExp: 0.48, gain: 0.1454 },
    deepseek: { withExp: 0.59, withoutExp: 0.5, gain: 0.089 },
  } satisfies Record<PaperModelKey, ExperienceComparisonScores>,
} as const;

export const FIGURE8_INTER_TASK = {
  source: PAPER_SOURCES.figure8,
  metric: "avg@3 target reward; gain uses unrounded rewards",
  sample: "19 held-out targets with three rollouts in each condition",
  rows: {
    claude: { withExp: 0.6, withoutExp: 0.6, gain: 0.001 },
    glm: { withExp: 0.55, withoutExp: 0.51, gain: 0.04 },
    gpt: { withExp: 0.54, withoutExp: 0.48, gain: 0.063 },
    gemini: { withExp: 0.52, withoutExp: 0.53, gain: -0.017 },
    kimi: { withExp: 0.48, withoutExp: 0.46, gain: 0.021 },
    longcat: { withExp: 0.41, withoutExp: 0.43, gain: -0.021 },
    deepseek: { withExp: 0.44, withoutExp: 0.35, gain: 0.093 },
  } satisfies Record<PaperModelKey, ExperienceComparisonScores>,
} as const;

export type ProcessDimensionKey = "c1" | "c2" | "c3";

export interface WorkloadProcessRow {
  readonly key: "model-development" | "system-optimization" | "puzzle-challenge" | "cuda";
  readonly label: string;
  readonly shortLabel: string;
  readonly taskCount: number;
  readonly c1: number;
  readonly c2: number;
  readonly c3: number;
}

export const PROCESS_DIMENSION_META = [
  { key: "c1", label: "C1 Solution Framing", color: "#4f7ca8", mark: "C1" },
  { key: "c2", label: "C2 Execution", color: "#4f9a67", mark: "C2" },
  { key: "c3", label: "C3 Feedback Control", color: "#b36b2c", mark: "C3" },
] as const satisfies readonly {
  key: ProcessDimensionKey;
  label: string;
  color: string;
  mark: string;
}[];

export const WORKLOAD_BOTTLENECKS = {
  source: PAPER_SOURCES.figure5,
  metric: "Task-balanced mean in [0, 1]; higher is better",
  sample: "36 tasks grouped into four workload categories; averaged over seven models",
  rows: [
    {
      key: "model-development",
      label: "Model Development",
      shortLabel: "Model Dev.",
      taskCount: 7,
      c1: 0.471,
      c2: 0.985,
      c3: 0.743,
    },
    {
      key: "system-optimization",
      label: "System Optimization",
      shortLabel: "System Opt.",
      taskCount: 15,
      c1: 0.469,
      c2: 0.892,
      c3: 0.907,
    },
    {
      key: "puzzle-challenge",
      label: "Puzzle & Challenge",
      shortLabel: "Puzzle & Ch.",
      taskCount: 10,
      c1: 0.737,
      c2: 0.931,
      c3: 0.93,
    },
    {
      key: "cuda",
      label: "CUDA",
      shortLabel: "CUDA",
      taskCount: 4,
      c1: 0.37,
      c2: 0.85,
      c3: 0.924,
    },
  ] satisfies readonly WorkloadProcessRow[],
} as const;

export type DiagnosticGroup = "c1" | "c2" | "c3" | "support";
export type DiagnosticFormat = "decimal-3" | "decimal-2" | "percent-1";

export const DIAGNOSTIC_METRICS = [
  {
    key: "bestObservedReward",
    label: "Best observed reward",
    group: "c1",
    format: "decimal-3",
  },
  { key: "earlyCapture", label: "Early capture", group: "c1", format: "percent-1" },
  {
    key: "laterHeadroomCapture",
    label: "Later headroom capture",
    group: "c1",
    format: "percent-1",
  },
  { key: "buildsPerRound", label: "Builds per round", group: "c2", format: "decimal-2" },
  {
    key: "roundsWithBuildErrors",
    label: "Rounds with build errors",
    group: "c2",
    format: "percent-1",
  },
  { key: "peakRetention", label: "Peak retention", group: "c3", format: "percent-1" },
  { key: "dipRate", label: "Dip rate", group: "c3", format: "percent-1" },
  { key: "dipDepth", label: "Dip depth", group: "c3", format: "decimal-3" },
  { key: "recoveryCredit", label: "Recovery credit", group: "c3", format: "percent-1" },
  {
    key: "evaluatedCommitRounds",
    label: "Evaluated commit rounds",
    group: "support",
    format: "decimal-2",
  },
] as const satisfies readonly {
  key: string;
  label: string;
  group: DiagnosticGroup;
  format: DiagnosticFormat;
}[];

export type DiagnosticMetricKey = (typeof DIAGNOSTIC_METRICS)[number]["key"];

export type DiagnosticRow = {
  readonly model: PaperModelKey;
} & Readonly<Record<DiagnosticMetricKey, number>>;

export const BEHAVIORAL_DIAGNOSTICS = {
  source: PAPER_SOURCES.figure6,
  sample:
    "Valid seeds are averaged within each model-task pair, then the 36 tasks are weighted equally",
  note:
    "These values describe trajectory behavior, not a second capability ranking; larger is not uniformly better.",
  rows: [
    {
      model: "claude",
      bestObservedReward: 0.757,
      earlyCapture: 0.534,
      laterHeadroomCapture: 0.53,
      buildsPerRound: 2.17,
      roundsWithBuildErrors: 0.039,
      peakRetention: 0.981,
      dipRate: 0.084,
      dipDepth: 0.145,
      recoveryCredit: 0.711,
      evaluatedCommitRounds: 11.64,
    },
    {
      model: "glm",
      bestObservedReward: 0.687,
      earlyCapture: 0.463,
      laterHeadroomCapture: 0.508,
      buildsPerRound: 3.64,
      roundsWithBuildErrors: 0.089,
      peakRetention: 0.958,
      dipRate: 0.067,
      dipDepth: 0.118,
      recoveryCredit: 0.703,
      evaluatedCommitRounds: 16.01,
    },
    {
      model: "gpt",
      bestObservedReward: 0.68,
      earlyCapture: 0.453,
      laterHeadroomCapture: 0.469,
      buildsPerRound: 0.51,
      roundsWithBuildErrors: 0.008,
      peakRetention: 0.959,
      dipRate: 0.134,
      dipDepth: 0.208,
      recoveryCredit: 0.614,
      evaluatedCommitRounds: 10.12,
    },
    {
      model: "gemini",
      bestObservedReward: 0.667,
      earlyCapture: 0.837,
      laterHeadroomCapture: 0.165,
      buildsPerRound: 7.49,
      roundsWithBuildErrors: 0.176,
      peakRetention: 0.988,
      dipRate: 0.069,
      dipDepth: 0.22,
      recoveryCredit: 0.323,
      evaluatedCommitRounds: 2.54,
    },
    {
      model: "kimi",
      bestObservedReward: 0.573,
      earlyCapture: 0.525,
      laterHeadroomCapture: 0.341,
      buildsPerRound: 2.7,
      roundsWithBuildErrors: 0.085,
      peakRetention: 0.932,
      dipRate: 0.077,
      dipDepth: 0.24,
      recoveryCredit: 0.529,
      evaluatedCommitRounds: 5.22,
    },
    {
      model: "longcat",
      bestObservedReward: 0.575,
      earlyCapture: 0.584,
      laterHeadroomCapture: 0.287,
      buildsPerRound: 4.66,
      roundsWithBuildErrors: 0.171,
      peakRetention: 0.962,
      dipRate: 0.052,
      dipDepth: 0.172,
      recoveryCredit: 0.52,
      evaluatedCommitRounds: 5.42,
    },
    {
      model: "deepseek",
      bestObservedReward: 0.623,
      earlyCapture: 0.64,
      laterHeadroomCapture: 0.331,
      buildsPerRound: 5.2,
      roundsWithBuildErrors: 0.145,
      peakRetention: 0.804,
      dipRate: 0.07,
      dipDepth: 0.291,
      recoveryCredit: 0.542,
      evaluatedCommitRounds: 4.92,
    },
  ] satisfies readonly DiagnosticRow[],
} as const;

export const SOLUTION_NATURE_CATEGORIES = [
  { key: "paramTune", label: "Param-tune", code: "A", color: "#78adca" },
  {
    key: "trainingSignal",
    label: "Training-signal / data engineering",
    code: "B",
    color: "#82c7c3",
  },
  { key: "structuralSwap", label: "Structural-swap", code: "C", color: "#e8b15e" },
  {
    key: "compositionStacking",
    label: "Composition-stacking",
    code: "D",
    color: "#74cf86",
  },
  {
    key: "searchHardcode",
    label: "Search-hardcode",
    code: "E",
    color: "#94a2ce",
  },
  {
    key: "evaluationHacking",
    label: "Evaluation-hacking",
    code: "F",
    color: "#b59ac5",
  },
  { key: "other", label: "Other", code: "G", color: "#c9c9c5" },
  {
    key: "novelApproach",
    label: "Novel-approach",
    code: "H",
    color: "#d18b6d",
  },
] as const;

export type SolutionNatureKey = (typeof SOLUTION_NATURE_CATEGORIES)[number]["key"];

export type SolutionNatureRow = {
  readonly model: PaperModelKey;
} & Readonly<Record<SolutionNatureKey, number>>;

export const SOLUTION_NATURE = {
  source: PAPER_SOURCES.figure11,
  sample: "252 best-seed solutions: 36 tasks for each of seven models",
  judgedBy:
    "Opus-4.8 classification with a fixed eight-category rubric; every novel candidate was manually reviewed",
  rows: [
    {
      model: "claude",
      paramTune: 2,
      trainingSignal: 4,
      structuralSwap: 5,
      compositionStacking: 21,
      searchHardcode: 3,
      evaluationHacking: 1,
      other: 0,
      novelApproach: 0,
    },
    {
      model: "glm",
      paramTune: 3,
      trainingSignal: 3,
      structuralSwap: 6,
      compositionStacking: 20,
      searchHardcode: 2,
      evaluationHacking: 1,
      other: 0,
      novelApproach: 1,
    },
    {
      model: "gpt",
      paramTune: 2,
      trainingSignal: 3,
      structuralSwap: 7,
      compositionStacking: 12,
      searchHardcode: 3,
      evaluationHacking: 8,
      other: 1,
      novelApproach: 0,
    },
    {
      model: "gemini",
      paramTune: 3,
      trainingSignal: 3,
      structuralSwap: 12,
      compositionStacking: 13,
      searchHardcode: 4,
      evaluationHacking: 0,
      other: 1,
      novelApproach: 0,
    },
    {
      model: "kimi",
      paramTune: 3,
      trainingSignal: 4,
      structuralSwap: 7,
      compositionStacking: 15,
      searchHardcode: 3,
      evaluationHacking: 3,
      other: 0,
      novelApproach: 1,
    },
    {
      model: "longcat",
      paramTune: 4,
      trainingSignal: 2,
      structuralSwap: 9,
      compositionStacking: 16,
      searchHardcode: 1,
      evaluationHacking: 2,
      other: 1,
      novelApproach: 1,
    },
    {
      model: "deepseek",
      paramTune: 2,
      trainingSignal: 3,
      structuralSwap: 10,
      compositionStacking: 14,
      searchHardcode: 2,
      evaluationHacking: 1,
      other: 4,
      novelApproach: 0,
    },
  ] satisfies readonly SolutionNatureRow[],
  novelty: {
    validatedNovelApproaches: 3,
    evaluationHacking: 16,
    compositionStacking: 111,
    total: 252,
    note:
      "Figure 11 retains three task-specific novel approaches after manual review.",
  },
  caseStudies: [
    {
      model: "glm" as const,
      task: "fredkin_sort_network",
      title: "A reversible comparator without ancilla",
      standard: "Search with BFS or use a CNOT/Toffoli comparator ladder.",
      approach:
        "Use the Fredkin gate to create and restore a temporary bit, combining split-and-restore with algebraic normal form.",
      result: "A 9-gate comparator with no ancilla.",
    },
    {
      model: "kimi" as const,
      task: "moving_mnist_world_model",
      title: "Predict motion before reconstructing pixels",
      standard: "Use ConvLSTM to predict next-frame pixels directly.",
      approach:
        "Predict optical flow and a residual, then warp the previous frame instead of generating the next frame directly.",
      result: "A task-specific reframing around motion and residual correction.",
    },
    {
      model: "longcat" as const,
      task: "resnet_bit_flip",
      title: "An architectural choke point replaces bit search",
      standard: "Use gradient saliency to search many candidate bits.",
      approach:
        "Flip bit 29 in 16 stem BatchNorm scales so early features collapse and downstream predictions become input-independent.",
      result: "CIFAR-10 accuracy falls to approximately 10%.",
    },
  ],
} as const;

export type ExperienceMetricKey = "avg3" | "best3";

export interface RepresentationReuseRow {
  readonly model: "claude" | "gpt" | "glm";
  readonly avg3: { readonly explicit: number; readonly implicit: number };
  readonly best3: { readonly explicit: number; readonly implicit: number };
}

export interface SourceReuseRow {
  readonly producer: "glm" | "longcat";
  readonly executor: "glm" | "longcat";
  readonly avg3: { readonly self: number; readonly cross: number };
  readonly best3: { readonly self: number; readonly cross: number };
}

export const EXPERIENCE_REUSE = {
  source: PAPER_SOURCES.appendixFigure17,
  sample: "19 held-out targets and three rollouts per target in every condition",
  representation: {
    description:
      "Explicit reuse provides distilled lessons.md; implicit reuse exposes the raw source workspace by path and file structure.",
    rows: [
      {
        model: "claude",
        avg3: { explicit: 0.001, implicit: -0.048 },
        best3: { explicit: 0.038, implicit: -0.001 },
      },
      {
        model: "gpt",
        avg3: { explicit: 0.063, implicit: 0.039 },
        best3: { explicit: 0.022, implicit: 0.01 },
      },
      {
        model: "glm",
        avg3: { explicit: 0.04, implicit: -0.012 },
        best3: { explicit: 0.067, implicit: -0.035 },
      },
    ] satisfies readonly RepresentationReuseRow[],
  },
  sourceCompatibility: {
    description:
      "Self uses lessons generated by the executing model; cross uses lessons generated by the other model.",
    rows: [
      {
        producer: "glm",
        executor: "longcat",
        avg3: { self: -0.021, cross: -0.049 },
        best3: { self: -0.046, cross: -0.067 },
      },
      {
        producer: "longcat",
        executor: "glm",
        avg3: { self: 0.04, cross: -0.012 },
        best3: { self: 0.067, cross: -0.009 },
      },
    ] satisfies readonly SourceReuseRow[],
  },
} as const;

export const HARNESS_TASK_COUNTS = {
  modelDevelopment: 7,
  systemOptimization: 15,
  puzzleChallenge: 10,
  cuda: 4,
} as const;

export type HarnessCategoryKey = keyof typeof HARNESS_TASK_COUNTS;
export type HarnessKind = "shared" | "native" | "shared-native" | "open";

export interface HarnessCategoryScore {
  readonly avg3: number;
  readonly best3: number;
}

export interface HarnessTableRow {
  readonly model: "claude" | "gpt" | "kimi";
  readonly harness: string;
  readonly shortLabel: string;
  readonly kind: HarnessKind;
  readonly categories: Readonly<Record<HarnessCategoryKey, HarnessCategoryScore>>;
}

const HARNESS_TABLE_ROWS = [
  {
    model: "claude",
    harness: "Claude Code (native)",
    shortLabel: "Claude Code",
    kind: "shared-native",
    categories: {
      modelDevelopment: { avg3: 0.785, best3: 0.833 },
      systemOptimization: { avg3: 0.675, best3: 0.705 },
      puzzleChallenge: { avg3: 0.852, best3: 0.923 },
      cuda: { avg3: 0.617, best3: 0.702 },
    },
  },
  {
    model: "claude",
    harness: "OpenCode",
    shortLabel: "OpenCode",
    kind: "open",
    categories: {
      modelDevelopment: { avg3: 0.765, best3: 0.904 },
      systemOptimization: { avg3: 0.684, best3: 0.767 },
      puzzleChallenge: { avg3: 0.861, best3: 0.916 },
      cuda: { avg3: 0.568, best3: 0.679 },
    },
  },
  {
    model: "gpt",
    harness: "Claude Code",
    shortLabel: "Claude Code",
    kind: "shared",
    categories: {
      modelDevelopment: { avg3: 0.623, best3: 0.738 },
      systemOptimization: { avg3: 0.584, best3: 0.703 },
      puzzleChallenge: { avg3: 0.879, best3: 0.918 },
      cuda: { avg3: 0.493, best3: 0.722 },
    },
  },
  {
    model: "gpt",
    harness: "Codex CLI (native)",
    shortLabel: "Codex CLI",
    kind: "native",
    categories: {
      modelDevelopment: { avg3: 0.575, best3: 0.662 },
      systemOptimization: { avg3: 0.65, best3: 0.77 },
      puzzleChallenge: { avg3: 0.92, best3: 0.938 },
      cuda: { avg3: 0.394, best3: 0.476 },
    },
  },
  {
    model: "gpt",
    harness: "OpenCode",
    shortLabel: "OpenCode",
    kind: "open",
    categories: {
      modelDevelopment: { avg3: 0.564, best3: 0.617 },
      systemOptimization: { avg3: 0.658, best3: 0.74 },
      puzzleChallenge: { avg3: 0.865, best3: 0.907 },
      cuda: { avg3: 0.482, best3: 0.727 },
    },
  },
  {
    model: "kimi",
    harness: "Claude Code",
    shortLabel: "Claude Code",
    kind: "shared",
    categories: {
      modelDevelopment: { avg3: 0.567, best3: 0.806 },
      systemOptimization: { avg3: 0.512, best3: 0.654 },
      puzzleChallenge: { avg3: 0.793, best3: 0.894 },
      cuda: { avg3: 0.386, best3: 0.462 },
    },
  },
  {
    model: "kimi",
    harness: "Kimi Code CLI (native)",
    shortLabel: "Kimi Code CLI",
    kind: "native",
    categories: {
      modelDevelopment: { avg3: 0.587, best3: 0.691 },
      systemOptimization: { avg3: 0.621, best3: 0.721 },
      puzzleChallenge: { avg3: 0.805, best3: 0.887 },
      cuda: { avg3: 0.406, best3: 0.522 },
    },
  },
  {
    model: "kimi",
    harness: "OpenCode",
    shortLabel: "OpenCode",
    kind: "open",
    categories: {
      modelDevelopment: { avg3: 0.671, best3: 0.796 },
      systemOptimization: { avg3: 0.581, best3: 0.643 },
      puzzleChallenge: { avg3: 0.746, best3: 0.884 },
      cuda: { avg3: 0.471, best3: 0.506 },
    },
  },
] as const satisfies readonly HarnessTableRow[];

const TOTAL_HARNESS_TASKS = Object.values(HARNESS_TASK_COUNTS).reduce(
  (total, count) => total + count,
  0,
);

function weightedHarnessScore(
  categories: HarnessTableRow["categories"],
  metric: keyof HarnessCategoryScore,
) {
  return (Object.keys(HARNESS_TASK_COUNTS) as HarnessCategoryKey[]).reduce(
    (total, category) =>
      total + categories[category][metric] * HARNESS_TASK_COUNTS[category],
    0,
  ) / TOTAL_HARNESS_TASKS;
}

export const HARNESS_COMPARISON = {
  source: PAPER_SOURCES.figure9,
  sample:
    "36 tasks and three rollouts per task; shared Claude Code, model-native, and OpenCode harnesses",
  precisionNote:
    "Overall values are task-weighted from the three-decimal category values in Table 2; paper-reported gains can differ by 0.001 because they use unrounded values.",
  rows: HARNESS_TABLE_ROWS.map((row) => ({
    ...row,
    overall: {
      avg3: weightedHarnessScore(row.categories, "avg3"),
      best3: weightedHarnessScore(row.categories, "best3"),
    },
  })),
} as const;

export interface AutoHarnessTransferRow {
  readonly key: "seed" | "held-out" | "cross-model" | "other-families";
  readonly label: string;
  readonly context: string;
  readonly avg3: number;
  readonly best3: number;
}

export const AUTO_HARNESS_TRANSFER = {
  source: PAPER_SOURCES.figure10,
  sample:
    "A Claude Opus-4.8 outer loop evolved LongCat-2.0's harness for four rounds on three System Optimization seed tasks",
  metric:
    "Gain over the original harness; avg@3 is the mean over nonzero replicas and best@3 is the best replica",
  rows: [
    {
      key: "seed",
      label: "Seed tasks",
      context: "LongCat-2.0 System Optimization tasks used for evolution",
      avg3: 0.123,
      best3: 0.065,
    },
    {
      key: "held-out",
      label: "Held-out SysOpt",
      context: "Remaining LongCat-2.0 System Optimization tasks",
      avg3: 0.057,
      best3: 0.043,
    },
    {
      key: "cross-model",
      label: "GPT-5.5 SysOpt",
      context: "Cross-model transfer on System Optimization tasks",
      avg3: 0.027,
      best3: 0.01,
    },
    {
      key: "other-families",
      label: "Other families",
      context: "Unrelated task families",
      avg3: -0.014,
      best3: 0.013,
    },
  ] satisfies readonly AutoHarnessTransferRow[],
  interventions: [
    "Identify what the verifier actually rewards.",
    "After every five new commits, reassess whether progress has plateaued and, if so, attempt a larger structural change.",
    "Protect the best verified state against a late regressing edit.",
  ],
} as const;

export const HARNESS_SECTION = {
  comparison: {
    source: PAPER_SOURCES.figure9,
    headline: "Harness choice changes realized performance more than the capability ceiling.",
    body:
      "Across the three harness settings, Claude, GPT, and Kimi keep the same ordering. Relative to shared Claude Code, the native harness and OpenCode raise GPT avg@3 by +0.019 and +0.014, and Kimi avg@3 by +0.055 and +0.046. Best@3 changes little, so the main effect is more reliable realization across runs rather than a substantially higher peak.",
  },
  mechanism: {
    source: PAPER_SOURCES.section53,
    headline: "A general harness keeps failure inside the research loop.",
    body:
      "Failed commands and invalid tool inputs become explicit observations. The agent can revise a command or retry instead of terminating the loop, while task management preserves plans and progress across many experiments.",
    trajectorySample: "756 Claude Code trajectories",
    taskCreateCalls: 2711,
    taskUpdateCalls: 4632,
    toolingNote:
      "OpenCode and Kimi CLI provide lighter todo mechanisms for the same purpose.",
  },
  protocol: {
    source: PAPER_SOURCES.figure10,
    headline: "The evolved harness is a small, frozen intervention—not a new model.",
    body:
      "A Claude Opus 4.8 outer loop starts from LongCat 2.0 running on Claude Code, inspects three randomly chosen System Optimization tasks, and evolves the harness for four rounds. It refines only the preamble, a few standing in-context rules, and a thin layer of hooks; the resulting generic, task-agnostic harness is then frozen and applied unchanged during evaluation.",
    caseStudy:
      "On agent_tool_routing, the plateau reflection preceded a switch from Python refinement to native C, after which reward increased from approximately 0.37 to 0.68.",
    interventions: [
      {
        label: "01",
        title: "Read the verifier",
        body: "Identify what the verifier actually rewards before optimizing the wrong objective.",
      },
      {
        label: "02",
        title: "Break a plateau",
        body: "After every five new commits, reassess whether progress has plateaued and, if so, attempt a larger structural change.",
      },
      {
        label: "03",
        title: "Protect the best state",
        body: "Save verified improvements, isolate risky edits, and restore unsuccessful experiments.",
      },
    ],
  },
  workloadReversals: {
    source: PAPER_SOURCES.appendixI,
    headline: "The best harness reverses with the workload.",
    intro:
      "Appendix I shows why an overall average is not enough: a harness that helps one workload can hurt another for the same model, and no harness dominates across models and categories.",
    rows: [
      {
        model: "Opus",
        body:
          "OpenCode raises best@3 on Model Development from 0.833 to 0.904 and on System Optimization from 0.705 to 0.767, while Claude Code remains stronger on Puzzle & Challenge and CUDA.",
      },
      {
        model: "GPT",
        body:
          "Codex CLI raises avg@3 on System Optimization by +0.067 and Puzzle & Challenge by +0.041, but lowers CUDA avg@3 by −0.099; its CUDA best@3 falls from 0.722 to 0.476, while OpenCode reaches 0.727.",
      },
      {
        model: "Kimi",
        body:
          "Kimi Code CLI improves avg@3 in all four categories, with the largest gain on System Optimization (+0.110). OpenCode is strongest on Model Development and CUDA but weaker on Puzzle & Challenge.",
      },
    ],
    conclusion:
      "Harness selection should therefore be conditioned on both the model and the workload; it is useful for controlled comparisons and deployment tuning, but is not a universal replacement for model improvement.",
  },
} as const;
