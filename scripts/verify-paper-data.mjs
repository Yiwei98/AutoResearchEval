import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const benchmark = await import(new URL("../lib/benchmark-data.ts", import.meta.url));
const paper = await import(new URL("../lib/paper-data.ts", import.meta.url));

const paperPdfPath =
  process.env.PAPER_PDF_PATH ??
  new URL("../public/beyond-final-scores.pdf", import.meta.url);

const closeTo = (actual, expected, tolerance = 1e-9, message = "") => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message || "value"}: expected ${expected}, received ${actual}`,
  );
};

const select = (value, keys) =>
  Object.fromEntries(keys.map((key) => [key, value[key]]));

const EXPECTED_MODEL_KEYS = [
  "claude",
  "glm",
  "gpt",
  "gemini",
  "kimi",
  "longcat",
  "deepseek",
];

assert.deepEqual(paper.PAPER_REVISION, {
  date: "2026-08-13",
  sha256: "3a1185437685772aa03176c74b0ac369afa116a61b1d4c3019671ab869309ede",
});
if (existsSync(paperPdfPath)) {
  const sourcePdfSha256 = createHash("sha256")
    .update(readFileSync(paperPdfPath))
    .digest("hex");
  assert.equal(
    sourcePdfSha256,
    paper.PAPER_REVISION.sha256,
    `Source PDF hash mismatch: ${paperPdfPath}`,
  );
} else if (process.env.PAPER_PDF_PATH) {
  assert.fail(`PAPER_PDF_PATH does not exist: ${paperPdfPath}`);
}
assert.deepEqual(paper.PAPER_SCALE, {
  models: 7,
  tasks: 36,
  baselineTrajectories: 756,
  trajectoryMessages: 332_797,
  scoredEvaluations: 31_887,
  wallClockBudgetHours: { min: 2, max: 12 },
  approximateInferenceCostUsd: 100_000,
});
assert.match(paper.EVALUATION_FRAMEWORK.context, /7.+36.+756/);
assert.equal(benchmark.MODELS.length, paper.PAPER_SCALE.models);
assert.deepEqual(paper.PAPER_MODEL_KEYS, EXPECTED_MODEL_KEYS);
assert.deepEqual(
  benchmark.MODELS.map((model) => model.key),
  EXPECTED_MODEL_KEYS,
  "Every paper dataset must use the canonical model order",
);
assert.deepEqual(
  benchmark.MODELS.map((model) => model.name),
  [
    "Claude-Opus-4.7",
    "GLM-5.2",
    "GPT-5.5",
    "Gemini-3.1-Pro",
    "Kimi-K2.7-Code",
    "LongCat-2.0",
    "DeepSeek-V4-Pro",
  ],
  "Model display names must match the paper",
);

const EXPECTED_CATEGORY_COUNTS = {
  overall: 36,
  model_dev: 7,
  system_opt: 15,
  puzzle: 10,
  cuda: 4,
};
assert.deepEqual(
  Object.fromEntries(benchmark.CATEGORIES.map(({ key, count }) => [key, count])),
  EXPECTED_CATEGORY_COUNTS,
  "Task-category counts must match the evaluation protocol",
);
assert.equal(
  benchmark.CATEGORIES.filter(({ key }) => key !== "overall").reduce(
    (total, { count }) => total + count,
    0,
  ),
  paper.PAPER_SCALE.tasks,
  "Task-category counts must sum to 36",
);
assert.equal(
  benchmark.TASK_CATEGORY.adaptive_compression,
  "puzzle",
  "adaptive_compression must follow the official AutoLab domain",
);
assert.deepEqual(
  Object.values(benchmark.TASK_CATEGORY).reduce(
    (counts, category) => ({ ...counts, [category]: (counts[category] ?? 0) + 1 }),
    {},
  ),
  { model_dev: 7, system_opt: 15, puzzle: 10, cuda: 4 },
  "AutoLab task mappings must preserve the official 7/15/10/4 category split",
);
assert.deepEqual(
  {
    multilingual_ocr: benchmark.TASK_CATEGORY.multilingual_ocr,
    regex_engine: benchmark.TASK_CATEGORY.regex_engine,
    resnet_bit_flip: benchmark.TASK_CATEGORY.resnet_bit_flip,
  },
  {
    multilingual_ocr: "model_dev",
    regex_engine: "system_opt",
    resnet_bit_flip: "puzzle",
  },
  "Task mappings must follow the official AutoLab v1.1 domains",
);

const EXPECTED_TABLE1 = {
  overall: {
    claude: { avg3: 0.739, best3: 0.79 },
    glm: { avg3: 0.682, best3: 0.757 },
    gpt: { avg3: 0.663, best3: 0.772 },
    gemini: { avg3: 0.652, best3: 0.75 },
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
    deepseek: { avg3: 0.529, best3: 0.75 },
  },
  system_opt: {
    claude: { avg3: 0.675, best3: 0.705 },
    glm: { avg3: 0.622, best3: 0.7 },
    gpt: { avg3: 0.584, best3: 0.703 },
    gemini: { avg3: 0.59, best3: 0.671 },
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
    gemini: { avg3: 0.49, best3: 0.529 },
    kimi: { avg3: 0.386, best3: 0.462 },
    longcat: { avg3: 0.301, best3: 0.414 },
    deepseek: { avg3: 0.214, best3: 0.308 },
  },
};
assert.deepEqual(benchmark.LEADERBOARD, EXPECTED_TABLE1, "Table 1 full snapshot");
assert.equal(benchmark.LEADERBOARD.overall.glm.avg3, 0.682);

for (const category of benchmark.CATEGORIES) {
  const rows = benchmark.LEADERBOARD[category.key];
  assert.deepEqual(Object.keys(rows), EXPECTED_MODEL_KEYS);
  for (const [model, score] of Object.entries(rows)) {
    assert.ok(score.avg3 >= 0 && score.best3 <= 1, `${model} scores must lie in [0, 1]`);
    assert.ok(score.avg3 <= score.best3, `${model} avg@3 cannot exceed best@3`);
  }
}

const scoreSpread = (category, metric) => {
  const values = Object.values(benchmark.LEADERBOARD[category]).map((row) => row[metric]);
  return Math.max(...values) - Math.min(...values);
};
const EXPECTED_SPREADS = {
  overall: { avg3: 0.237, best3: 0.122 },
  model_dev: { avg3: 0.256, best3: 0.097 },
  system_opt: { avg3: 0.26, best3: 0.121 },
  puzzle: { avg3: 0.15, best3: 0.074 },
  cuda: { avg3: 0.403, best3: 0.414 },
};
for (const [category, expected] of Object.entries(EXPECTED_SPREADS)) {
  closeTo(scoreSpread(category, "avg3"), expected.avg3, 1e-9, `${category} avg@3 spread`);
  closeTo(scoreSpread(category, "best3"), expected.best3, 1e-9, `${category} best@3 spread`);
}

const EXPECTED_APPENDIX_FIGURE12 = [
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
];
assert.deepEqual(
  paper.FIGURE3_RESOURCE_PERFORMANCE.rows,
  EXPECTED_APPENDIX_FIGURE12,
  "Appendix Figure 12 resource-performance snapshot",
);
for (const row of paper.FIGURE3_RESOURCE_PERFORMANCE.rows) {
  assert.equal(row.best3, benchmark.LEADERBOARD.overall[row.model].best3);
}
assert.ok(
  paper.FIGURE3_RESOURCE_PERFORMANCE.rows.every(
    (row) =>
      row.costUsd.precision === "figure-digitized" &&
      row.meanHoursPerTask.precision === "figure-digitized" &&
      row.meanStepsPerTask.precision === "figure-digitized",
  ),
  "Appendix Figure 12 resource coordinates must remain visibly approximate",
);

const EXPECTED_FIGURE4 = {
  claude: { outcome: 0.739, c1: 0.612, c2: 0.967, c3: 0.92 },
  glm: { outcome: 0.682, c1: 0.539, c2: 0.937, c3: 0.911 },
  gpt: { outcome: 0.663, c1: 0.555, c2: 0.958, c3: 0.858 },
  gemini: { outcome: 0.652, c1: 0.555, c2: 0.889, c3: 0.921 },
  kimi: { outcome: 0.584, c1: 0.473, c2: 0.88, c3: 0.875 },
  longcat: { outcome: 0.572, c1: 0.478, c2: 0.888, c3: 0.928 },
  deepseek: { outcome: 0.524, c1: 0.519, c2: 0.888, c3: 0.772 },
};
assert.deepEqual(paper.FIGURE4_PROCESS.rows, EXPECTED_FIGURE4, "Figure 4 full snapshot");
assert.deepEqual(benchmark.PROCESS, EXPECTED_FIGURE4);
assert.equal(
  paper.FIGURE4_PROCESS.rows.deepseek.outcome,
  0.524,
  "Figure 4 Outcome is independent from Table 1 overall avg@3",
);

const EXPECTED_FIGURE5 = [
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
];
assert.deepEqual(paper.WORKLOAD_BOTTLENECKS.rows, EXPECTED_FIGURE5, "Figure 5 full snapshot");
assert.equal(
  paper.WORKLOAD_BOTTLENECKS.rows.reduce((total, row) => total + row.taskCount, 0),
  paper.PAPER_SCALE.tasks,
);

const EXPECTED_FIGURE6 = [
  ["claude", 0.757, 0.534, 0.53, 2.17, 0.039, 0.981, 0.084, 0.145, 0.711, 11.64],
  ["glm", 0.687, 0.463, 0.508, 3.64, 0.089, 0.958, 0.067, 0.118, 0.703, 16.01],
  ["gpt", 0.68, 0.453, 0.469, 0.51, 0.008, 0.959, 0.134, 0.208, 0.614, 10.12],
  ["gemini", 0.667, 0.837, 0.165, 7.49, 0.176, 0.988, 0.069, 0.22, 0.323, 2.54],
  ["kimi", 0.573, 0.525, 0.341, 2.7, 0.085, 0.932, 0.077, 0.24, 0.529, 5.22],
  ["longcat", 0.575, 0.584, 0.287, 4.66, 0.171, 0.962, 0.052, 0.172, 0.52, 5.42],
  ["deepseek", 0.623, 0.64, 0.331, 5.2, 0.145, 0.804, 0.07, 0.291, 0.542, 4.92],
];
const FIGURE6_KEYS = [
  "model",
  "bestObservedReward",
  "earlyCapture",
  "laterHeadroomCapture",
  "buildsPerRound",
  "roundsWithBuildErrors",
  "peakRetention",
  "dipRate",
  "dipDepth",
  "recoveryCredit",
  "evaluatedCommitRounds",
];
assert.deepEqual(
  paper.BEHAVIORAL_DIAGNOSTICS.rows.map((row) => FIGURE6_KEYS.map((key) => row[key])),
  EXPECTED_FIGURE6,
  "Figure 6 every printed cell",
);
assert.deepEqual(
  paper.DIAGNOSTIC_METRICS.map(({ key }) => key),
  FIGURE6_KEYS.slice(1),
  "Figure 6 diagnostic column order",
);

const EXPECTED_FIGURE7 = {
  claude: { withExp: 0.74, withoutExp: 0.7, gain: 0.0362 },
  glm: { withExp: 0.72, withoutExp: 0.64, gain: 0.079 },
  gpt: { withExp: 0.66, withoutExp: 0.58, gain: 0.073 },
  gemini: { withExp: 0.7, withoutExp: 0.57, gain: 0.128 },
  kimi: { withExp: 0.52, withoutExp: 0.54, gain: -0.0127 },
  longcat: { withExp: 0.63, withoutExp: 0.48, gain: 0.1454 },
  deepseek: { withExp: 0.59, withoutExp: 0.5, gain: 0.089 },
};
const EXPECTED_FIGURE8 = {
  claude: { withExp: 0.6, withoutExp: 0.6, gain: 0.001 },
  glm: { withExp: 0.55, withoutExp: 0.51, gain: 0.04 },
  gpt: { withExp: 0.54, withoutExp: 0.48, gain: 0.063 },
  gemini: { withExp: 0.52, withoutExp: 0.53, gain: -0.017 },
  kimi: { withExp: 0.48, withoutExp: 0.46, gain: 0.021 },
  longcat: { withExp: 0.41, withoutExp: 0.43, gain: -0.021 },
  deepseek: { withExp: 0.44, withoutExp: 0.35, gain: 0.093 },
};
assert.deepEqual(paper.FIGURE7_IN_TASK.rows, EXPECTED_FIGURE7, "Figure 7 full snapshot");
assert.deepEqual(paper.FIGURE8_INTER_TASK.rows, EXPECTED_FIGURE8, "Figure 8 full snapshot");
assert.equal(
  paper.FIGURE7_IN_TASK.sample,
  "32 retained trajectories under the intra-task experience-erasure design",
  "Figure 7 sample and intra-task terminology",
);
assert.match(paper.FIGURE7_IN_TASK.metric, /intra-task gain/);
assert.equal(paper.EVALUATION_FRAMEWORK.experience[0].label, "Intra-Task Self-Improvement");
assert.match(paper.EVALUATION_FRAMEWORK.experience[0].metric, /R_\{\\mathrm\{intra\}\}/);
assert.deepEqual(benchmark.IN_TASK, EXPECTED_FIGURE7);
assert.deepEqual(benchmark.INTER_TASK, EXPECTED_FIGURE8);
for (const [experiment, rows] of [
  ["Figure 7", paper.FIGURE7_IN_TASK.rows],
  ["Figure 8", paper.FIGURE8_INTER_TASK.rows],
]) {
  for (const [model, row] of Object.entries(rows)) {
    closeTo(
      row.withExp - row.withoutExp,
      row.gain,
      0.011,
      `${experiment} rounded bars and unrounded gain for ${model}`,
    );
  }
}

const EXPECTED_APPENDIX_FIGURE17_REPRESENTATION = [
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
];
const EXPECTED_APPENDIX_FIGURE17_SOURCE = [
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
];
assert.deepEqual(
  paper.EXPERIENCE_REUSE.representation.rows,
  EXPECTED_APPENDIX_FIGURE17_REPRESENTATION,
  "Appendix Figure 17a-b full snapshot",
);
assert.deepEqual(
  paper.EXPERIENCE_REUSE.sourceCompatibility.rows,
  EXPECTED_APPENDIX_FIGURE17_SOURCE,
  "Appendix Figure 17c-d full snapshot",
);

const EXPECTED_TABLE2 = [
  ["claude", "Claude Code (native)", "shared-native", [0.785, 0.833, 0.675, 0.705, 0.852, 0.923, 0.617, 0.702]],
  ["claude", "OpenCode", "open", [0.765, 0.904, 0.684, 0.767, 0.861, 0.916, 0.568, 0.679]],
  ["gpt", "Claude Code", "shared", [0.623, 0.738, 0.584, 0.703, 0.879, 0.918, 0.493, 0.722]],
  ["gpt", "Codex CLI (native)", "native", [0.575, 0.662, 0.65, 0.77, 0.92, 0.938, 0.394, 0.476]],
  ["gpt", "OpenCode", "open", [0.564, 0.617, 0.658, 0.74, 0.865, 0.907, 0.482, 0.727]],
  ["kimi", "Claude Code", "shared", [0.567, 0.806, 0.512, 0.654, 0.793, 0.894, 0.386, 0.462]],
  ["kimi", "Kimi Code CLI (native)", "native", [0.587, 0.691, 0.621, 0.721, 0.805, 0.887, 0.406, 0.522]],
  ["kimi", "OpenCode", "open", [0.671, 0.796, 0.581, 0.643, 0.746, 0.884, 0.471, 0.506]],
];
const HARNESS_CATEGORY_KEYS = [
  "modelDevelopment",
  "systemOptimization",
  "puzzleChallenge",
  "cuda",
];
const compactHarnessRow = (row) => [
  row.model,
  row.harness,
  row.kind,
  HARNESS_CATEGORY_KEYS.flatMap((category) => [
    row.categories[category].avg3,
    row.categories[category].best3,
  ]),
];
assert.deepEqual(paper.HARNESS_TASK_COUNTS, {
  modelDevelopment: 7,
  systemOptimization: 15,
  puzzleChallenge: 10,
  cuda: 4,
});
assert.deepEqual(
  paper.HARNESS_COMPARISON.rows.map(compactHarnessRow),
  EXPECTED_TABLE2,
  "Table 2 every printed cell",
);

const EXPECTED_FIGURE9_OVERALL = [
  ["claude", "Claude Code (native)", 0.7391111111111112, 0.7901111111111111],
  ["claude", "OpenCode", 0.7360277777777777, 0.82525],
  ["gpt", "Claude Code", 0.6634166666666667, 0.7716388888888888],
  ["gpt", "Codex CLI (native)", 0.6819722222222223, 0.763],
  ["gpt", "OpenCode", 0.6776666666666668, 0.7610277777777779],
  ["kimi", "Claude Code", 0.58675, 0.7288888888888889],
  ["kimi", "Kimi Code CLI (native)", 0.6416111111111111, 0.7391666666666666],
  ["kimi", "OpenCode", 0.6321111111111111, 0.7244722222222222],
];
for (const [index, row] of paper.HARNESS_COMPARISON.rows.entries()) {
  const [model, harness, avg3, best3] = EXPECTED_FIGURE9_OVERALL[index];
  assert.equal(row.model, model);
  assert.equal(row.harness, harness);
  closeTo(row.overall.avg3, avg3, 1e-12, `${model} ${harness} Figure 9 avg@3`);
  closeTo(row.overall.best3, best3, 1e-12, `${model} ${harness} Figure 9 best@3`);
}
assert.deepEqual(
  paper.HARNESS_COMPARISON.rows.map((row) => [
    row.model,
    row.harness,
    row.overall.avg3.toFixed(2),
    row.overall.best3.toFixed(2),
  ]),
  [
    ["claude", "Claude Code (native)", "0.74", "0.79"],
    ["claude", "OpenCode", "0.74", "0.83"],
    ["gpt", "Claude Code", "0.66", "0.77"],
    ["gpt", "Codex CLI (native)", "0.68", "0.76"],
    ["gpt", "OpenCode", "0.68", "0.76"],
    ["kimi", "Claude Code", "0.59", "0.73"],
    ["kimi", "Kimi Code CLI (native)", "0.64", "0.74"],
    ["kimi", "OpenCode", "0.63", "0.72"],
  ],
  "Figure 9 printed two-decimal labels",
);

const EXPECTED_FIGURE10 = [
  ["seed", 0.123, 0.065],
  ["held-out", 0.057, 0.043],
  ["cross-model", 0.027, 0.01],
  ["other-families", -0.014, 0.013],
];
assert.deepEqual(
  paper.AUTO_HARNESS_TRANSFER.rows.map((row) => [row.key, row.avg3, row.best3]),
  EXPECTED_FIGURE10,
  "Figure 10 every printed gain",
);
assert.equal(
  paper.AUTO_HARNESS_TRANSFER.interventions[1],
  "After every five new commits, reassess whether progress has plateaued and, if so, attempt a larger structural change.",
  "Auto Harness plateau hook wording",
);
assert.equal(
  paper.HARNESS_SECTION.protocol.interventions[1].body,
  paper.AUTO_HARNESS_TRANSFER.interventions[1],
  "Auto Harness intervention summaries must stay aligned",
);

const EXPECTED_FIGURE11_ROWS = [
  ["claude", 2, 4, 5, 21, 3, 1, 0, 0],
  ["glm", 3, 3, 6, 20, 2, 1, 0, 1],
  ["gpt", 2, 3, 7, 12, 3, 8, 1, 0],
  ["gemini", 3, 3, 12, 13, 4, 0, 1, 0],
  ["kimi", 3, 4, 7, 15, 3, 3, 0, 1],
  ["longcat", 4, 2, 9, 16, 1, 2, 1, 1],
  ["deepseek", 2, 3, 10, 14, 2, 1, 4, 0],
];
const EXPECTED_FIGURE11_CATEGORY_KEYS = [
  "paramTune",
  "trainingSignal",
  "structuralSwap",
  "compositionStacking",
  "searchHardcode",
  "evaluationHacking",
  "other",
  "novelApproach",
];
assert.deepEqual(
  paper.SOLUTION_NATURE_CATEGORIES.map(({ key }) => key),
  EXPECTED_FIGURE11_CATEGORY_KEYS,
);
assert.deepEqual(
  paper.SOLUTION_NATURE.rows.map((row) => [
    row.model,
    ...EXPECTED_FIGURE11_CATEGORY_KEYS.map((key) => row[key]),
  ]),
  EXPECTED_FIGURE11_ROWS,
  "Figure 11 every printed category count",
);

let solutionTotal = 0;
for (const row of paper.SOLUTION_NATURE.rows) {
  const rowTotal = EXPECTED_FIGURE11_CATEGORY_KEYS.reduce(
    (total, key) => total + row[key],
    0,
  );
  assert.equal(rowTotal, 36, `${row.model} Figure 11 categories must sum to 36`);
  solutionTotal += rowTotal;
}
assert.equal(solutionTotal, 252, "Figure 11 must contain 252 best-seed solutions");
const solutionTotals = Object.fromEntries(
  EXPECTED_FIGURE11_CATEGORY_KEYS.map((key) => [
    key,
    paper.SOLUTION_NATURE.rows.reduce((total, row) => total + row[key], 0),
  ]),
);
assert.deepEqual(solutionTotals, {
  paramTune: 19,
  trainingSignal: 22,
  structuralSwap: 56,
  compositionStacking: 111,
  searchHardcode: 18,
  evaluationHacking: 16,
  other: 7,
  novelApproach: 3,
});
assert.deepEqual(
  select(paper.SOLUTION_NATURE.novelty, [
    "validatedNovelApproaches",
    "evaluationHacking",
    "compositionStacking",
    "total",
  ]),
  {
    validatedNovelApproaches: 3,
    evaluationHacking: 16,
    compositionStacking: 111,
    total: 252,
  },
);
assert.equal(
  paper.SOLUTION_NATURE.judgedBy,
  "Opus-4.8 classification with a fixed eight-category rubric; every novel candidate was manually reviewed",
  "Figure 11 judging protocol",
);
assert.equal(
  paper.SOLUTION_NATURE.novelty.note,
  "Figure 11 retains three task-specific novel approaches after manual review.",
  "Figure 11 novelty wording",
);
assert.ok(
  !("genuineAlgorithmicInsights" in paper.SOLUTION_NATURE.novelty),
  "Deprecated 1/252 novelty wording must not remain in paper data",
);
assert.deepEqual(
  paper.SOLUTION_NATURE.caseStudies,
  [
    {
      model: "glm",
      task: "fredkin_sort_network",
      title: "A reversible comparator without ancilla",
      standard: "Search with BFS or use a CNOT/Toffoli comparator ladder.",
      approach:
        "Use the Fredkin gate to create and restore a temporary bit, combining split-and-restore with algebraic normal form.",
      result: "A 9-gate comparator with no ancilla.",
    },
    {
      model: "kimi",
      task: "moving_mnist_world_model",
      title: "Predict motion before reconstructing pixels",
      standard: "Use ConvLSTM to predict next-frame pixels directly.",
      approach:
        "Predict optical flow and a residual, then warp the previous frame instead of generating the next frame directly.",
      result: "A task-specific reframing around motion and residual correction.",
    },
    {
      model: "longcat",
      task: "resnet_bit_flip",
      title: "An architectural choke point replaces bit search",
      standard: "Use gradient saliency to search many candidate bits.",
      approach:
        "Flip bit 29 in 16 stem BatchNorm scales so early features collapse and downstream predictions become input-independent.",
      result: "CIFAR-10 accuracy falls to approximately 10%.",
    },
  ],
  "Figure 11 validated novelty cases",
);

assert.deepEqual(
  {
    figure2: paper.PAPER_SOURCES.figure2.label,
    appendixFigure12: paper.FIGURE3_RESOURCE_PERFORMANCE.source.label,
    figure4: paper.FIGURE4_PROCESS.source.label,
    figure5: paper.WORKLOAD_BOTTLENECKS.source.label,
    figure6: paper.BEHAVIORAL_DIAGNOSTICS.source.label,
    figure7: paper.FIGURE7_IN_TASK.source.label,
    figure8: paper.FIGURE8_INTER_TASK.source.label,
    appendixFigure17: paper.EXPERIENCE_REUSE.source.label,
    figure9: paper.HARNESS_COMPARISON.source.label,
    figure10: paper.AUTO_HARNESS_TRANSFER.source.label,
    figure11: paper.SOLUTION_NATURE.source.label,
  },
  {
    figure2: "Figure 2",
    appendixFigure12: "Appendix Figure 12",
    figure4: "Figure 4",
    figure5: "Figure 5",
    figure6: "Figure 6",
    figure7: "Figure 7",
    figure8: "Figure 8",
    appendixFigure17: "Appendix Figure 17",
    figure9: "Figure 9",
    figure10: "Figure 10",
    figure11: "Figure 11",
  },
  "Figure and table provenance labels",
);

assert.deepEqual(
  {
    figure2: paper.PAPER_SOURCES.figure2.caption,
    figure4: paper.PAPER_SOURCES.figure4.caption,
    figure5: paper.PAPER_SOURCES.figure5.caption,
    figure7: paper.PAPER_SOURCES.figure7.caption,
    figure8: paper.PAPER_SOURCES.figure8.caption,
    figure9: paper.PAPER_SOURCES.figure9.caption,
    figure10: paper.PAPER_SOURCES.figure10.caption,
    figure11: paper.PAPER_SOURCES.figure11.caption,
  },
  {
    figure2:
      "Solid segments show avg@3, while full bar heights show best@3. Category views compare the same seven models across Model Development, System Optimization, Puzzle & Challenge, and CUDA.",
    figure4:
      "Outcome, Solution Framing, Execution, and Feedback Control across seven models. Process scores use task-macro aggregation and lie in [0, 1], where higher is better.",
    figure5: "Process dimensions by task category, averaged over the seven models.",
    figure7:
      "Per-model first-commit reward with and without retained experience, together with the corresponding intra-task gain, averaged over 32 retained trajectories.",
    figure8:
      "Per-model avg@3 with and without distilled experience, together with the corresponding inter-task gain across 19 held-out targets.",
    figure9:
      "Coding harness comparison across Claude Code, each model's native harness, and OpenCode. Dark bars show avg@3 and light bars show best@3.",
    figure10:
      "Gain of the evolved harness over the original harness on seed tasks, held-out System Optimization tasks, cross-model System Optimization tasks, and unrelated task families.",
    figure11:
      "Solution nature across 252 best-seed solutions. Each model contributes 36 solutions; three novel approaches remain after manual review.",
  },
  "Main-text figure captions",
);

console.log(
  `Paper data verification passed: ${existsSync(paperPdfPath) ? "source PDF hash, " : ""}revision metadata, scale, Table 1, main-text Figures 2 and 4-11, Appendix Figures 12 and 17, and Table 2 are fully snapshot-checked.`,
);
