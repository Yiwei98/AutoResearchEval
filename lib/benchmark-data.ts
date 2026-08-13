import {
  FIGURE4_PROCESS,
  FIGURE7_IN_TASK,
  FIGURE8_INTER_TASK,
} from "./paper-data.ts";
import { AUTOLAB_TASK_CATEGORY } from "./autolab-tasks.mjs";

// All leaderboard numbers are transcribed from the paper
// "Beyond Final Scores: A Systematic Evaluation of Agents for Long-Horizon AI
//  Research and Development".
// Sources: Figures 2, 4, 7, 8 and Table 1 in the August 13, 2026 PDF.

export type CategoryKey = "overall" | "model_dev" | "system_opt" | "puzzle" | "cuda";

export interface ModelInfo {
  /** stable key used across the app */
  key: string;
  /** display name as printed in the paper */
  name: string;
  /** short label for compact chart axes */
  short: string;
  /** value of `synthetic_model` in the raw JSONL, for joining to trajectories */
  syntheticModel: string;
  /** value of `owner` in the raw JSONL */
  owner: string;
  /** brand accent color */
  color: string;
  /** single-character glyph used as a lightweight fallback mark */
  glyph: string;
  /** path to the brand SVG icon under /public */
  icon: string;
}

// Ordered by overall avg@3 (paper ranking).
export const MODELS: ModelInfo[] = [
  {
    key: "claude",
    name: "Claude-Opus-4.7",
    short: "Claude",
    syntheticModel: "vertex.claude-opus-4.7-m17",
    owner: "claude",
    color: "#D97757",
    glyph: "✳",
    icon: "/icons/claude.svg",
  },
  {
    key: "glm",
    name: "GLM-5.2",
    short: "GLM-5.2",
    syntheticModel: "glm-5.2",
    owner: "glm",
    color: "#2B2B2B",
    glyph: "Z",
    icon: "/icons/glm.svg",
  },
  {
    key: "gpt",
    name: "GPT-5.5",
    short: "GPT-5.5",
    syntheticModel: "gpt-5.5-2026-04-24",
    owner: "gpt",
    color: "#10A37F",
    glyph: "◎",
    icon: "/icons/gpt.svg",
  },
  {
    key: "gemini",
    name: "Gemini-3.1-Pro",
    short: "Gemini",
    syntheticModel: "gemini-3.1-pro-preview",
    owner: "gemini-3.1-pro-preview",
    color: "#4587F4",
    glyph: "✦",
    icon: "/icons/gemini.svg",
  },
  {
    key: "kimi",
    name: "Kimi-K2.7-Code",
    short: "Kimi",
    syntheticModel: "kimi-k2.7-code",
    owner: "kimi",
    color: "#1A1A1A",
    glyph: "K",
    icon: "/icons/kimi.svg",
  },
  {
    key: "longcat",
    name: "LongCat-2.0",
    short: "LongCat",
    syntheticModel: "LongCat-2.0",
    owner: "longcat",
    color: "#2FA84F",
    glyph: "M",
    icon: "/icons/longcat.svg",
  },
  {
    key: "deepseek",
    name: "DeepSeek-V4-Pro",
    short: "DeepSeek",
    syntheticModel: "deepseek-v4-pro",
    owner: "deepseek-v4-pro-baidu",
    color: "#4D6BFE",
    glyph: "🐳",
    icon: "/icons/deepseek.svg",
  },
];

export const MODEL_BY_KEY: Record<string, ModelInfo> = Object.fromEntries(
  MODELS.map((m) => [m.key, m]),
);
export const MODEL_BY_SYNTHETIC: Record<string, ModelInfo> = Object.fromEntries(
  MODELS.map((m) => [m.syntheticModel, m]),
);

export const CATEGORIES: { key: CategoryKey; label: string; count: number }[] = [
  { key: "overall", label: "Overall", count: 36 },
  { key: "model_dev", label: "Model Development", count: 7 },
  { key: "system_opt", label: "System Optimization", count: 15 },
  { key: "puzzle", label: "Puzzle & Challenge", count: 10 },
  { key: "cuda", label: "CUDA", count: 4 },
];

// Table 1: per-category avg@3 and best@3, keyed by model key.
export interface Score {
  avg3: number;
  best3: number;
}
export const LEADERBOARD: Record<CategoryKey, Record<string, Score>> = {
  overall: {
    claude: { avg3: 0.739, best3: 0.790 },
    glm: { avg3: 0.682, best3: 0.757 },
    gpt: { avg3: 0.663, best3: 0.772 },
    gemini: { avg3: 0.652, best3: 0.750 },
    kimi: { avg3: 0.587, best3: 0.729 },
    longcat: { avg3: 0.572, best3: 0.674 },
    deepseek: { avg3: 0.502, best3: 0.668 },
  },
  model_dev: {
    claude: { avg3: 0.785, best3: 0.833 },
    glm: { avg3: 0.641, best3: 0.749 },
    gpt: { avg3: 0.623, best3: 0.738 },
    gemini: { avg3: 0.645, best3: 0.819 },
    kimi: { avg3: 0.567, best3: 0.806 },
    longcat: { avg3: 0.614, best3: 0.736 },
    deepseek: { avg3: 0.529, best3: 0.750 },
  },
  system_opt: {
    claude: { avg3: 0.675, best3: 0.705 },
    glm: { avg3: 0.622, best3: 0.700 },
    gpt: { avg3: 0.584, best3: 0.703 },
    gemini: { avg3: 0.590, best3: 0.671 },
    kimi: { avg3: 0.512, best3: 0.654 },
    longcat: { avg3: 0.484, best3: 0.596 },
    deepseek: { avg3: 0.415, best3: 0.584 },
  },
  puzzle: {
    claude: { avg3: 0.852, best3: 0.923 },
    glm: { avg3: 0.881, best3: 0.927 },
    gpt: { avg3: 0.879, best3: 0.918 },
    gemini: { avg3: 0.816, best3: 0.908 },
    kimi: { avg3: 0.793, best3: 0.894 },
    longcat: { avg3: 0.785, best3: 0.853 },
    deepseek: { avg3: 0.731, best3: 0.881 },
  },
  cuda: {
    claude: { avg3: 0.617, best3: 0.702 },
    glm: { avg3: 0.476, best3: 0.557 },
    gpt: { avg3: 0.493, best3: 0.722 },
    gemini: { avg3: 0.490, best3: 0.529 },
    kimi: { avg3: 0.386, best3: 0.462 },
    longcat: { avg3: 0.301, best3: 0.414 },
    deepseek: { avg3: 0.214, best3: 0.308 },
  },
};

// Figure 4: process-level dimensions (all in [0,1], higher better).
// `outcome` is the value printed in Figure 4. It is intentionally kept
// independent from the Table 1 overall leaderboard series.
export interface ProcessScores {
  outcome: number;
  c1: number; // Solution Framing
  c2: number; // Execution
  c3: number; // Feedback Control
}
export const PROCESS = FIGURE4_PROCESS.rows as Record<string, ProcessScores>;

export const PROCESS_DIMENSIONS: {
  key: keyof ProcessScores;
  label: string;
  blurb: string;
}[] = [
  {
    key: "outcome",
    label: "Outcome",
    blurb: "Outcome score printed alongside the process dimensions in Figure 4.",
  },
  {
    key: "c1",
    label: "C1 · Solution Framing",
    blurb: "Does the agent frame directions that drive reward high and fast?",
  },
  {
    key: "c2",
    label: "C2 · Execution",
    blurb: "Do proposed changes run cleanly and pass correctness checks?",
  },
  {
    key: "c3",
    label: "C3 · Feedback Control",
    blurb: "Does the agent hold its best result and recover from regressions?",
  },
];

// Figure 7: intra-task self-improvement — first-commit reward with/without
// retained experience, and the resulting gain.
export interface SelfImprove {
  withExp: number;
  withoutExp: number;
  gain: number;
}
export const IN_TASK = FIGURE7_IN_TASK.rows as Record<string, SelfImprove>;

// Figure 8: inter-task self-improvement (avg@3) with/without distilled lessons.
export const INTER_TASK = FIGURE8_INTER_TASK.rows as Record<string, SelfImprove>;

// The 36 AutoLab tasks grouped by their official v1.1 domains.
export const TASK_CATEGORY = AUTOLAB_TASK_CATEGORY as Record<
  string,
  Exclude<CategoryKey, "overall">
>;

export const CATEGORY_LABEL: Record<Exclude<CategoryKey, "overall">, string> = {
  model_dev: "Model Development",
  system_opt: "System Optimization",
  puzzle: "Puzzle & Challenge",
  cuda: "CUDA",
};

export function taskCategory(task: string): Exclude<CategoryKey, "overall"> | null {
  return TASK_CATEGORY[task] ?? null;
}

export function rankedModels(category: CategoryKey) {
  const scores = LEADERBOARD[category];
  return [...MODELS]
    .map((m) => ({ model: m, score: scores[m.key] }))
    .sort((a, b) => b.score.avg3 - a.score.avg3);
}

// --- Trajectory improvement arc (produced by scripts/process-data.mjs) ---

export type ScoreDirection = "lower" | "higher" | "unknown";

// One evaluator checkpoint. A nearby git commit may annotate the measurement,
// but the tool-produced evaluator result is the source of truth.
export interface ImprovementRound {
  index: number;
  label: string;
  description: string;
  commitMessage?: string;
  messageIndex: number; // index into messages[] of the evaluator tool result
  score?: number;
  scoreRaw?: string;
  scoreMsgIndex?: number;
  metric?: string;
  direction?: ScoreDirection;
  unit?: string;
  protocol?: string;
  source?: "tool_output";
  confidence?: "high" | "medium" | "low";
  toolCallId?: string;
  taskId?: string;
  gate?: Record<string, unknown>;
  evidenceKind?: "protocol-equivalent-training-validation";
  trainingStep?: number;
}

export interface ImprovementSummary {
  numRounds: number;
  numScored: number;
  metric: string;
  direction: ScoreDirection;
  unit?: string;
  protocol?: string;
  firstScore?: number;
  lastScore?: number;
  bestScore?: number;
  baselineScore?: number;
}

// Human-readable metric label + whether an up-tick is an improvement.
export function metricLabel(metric: string): string {
  const map: Record<string, string> = {
    bpb: "bits/byte",
    overall_bpb: "overall bits/byte",
    time: "time (s)",
    runtime: "runtime",
    loss: "loss",
    accuracy: "accuracy",
    reward: "reward",
    throughput: "throughput",
    score: "score",
    rotations: "rotations",
    comparators: "comparators",
    gates: "gates",
    cycles: "cycles",
    instructions: "instructions",
    parameters: "parameters",
    bits_flipped: "bits flipped",
    average_cer: "average CER",
    validation_psnr: "validation PSNR",
    validation_perplexity: "validation perplexity",
    mathvista_accuracy: "MathVista accuracy",
    serving_score: "serving score",
    composite_quality_score: "composite quality",
    prompt_level_strict_accuracy: "prompt-level strict accuracy",
  };
  return map[metric] ?? metric;
}
