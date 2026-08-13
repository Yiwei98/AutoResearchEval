/**
 * Frozen trajectory showcase manifest.
 *
 * The representative seed for each task/model cell was selected once from the
 * curve-bearing seeds. Message count and evaluator-checkpoint count were each
 * normalized to the maximum for that cell, then combined with their harmonic
 * mean. The highest-scoring seed is frozen below so builds never change when
 * index ordering changes. Moving MNIST / Kimi additionally includes training-
 * loop validation after its numerical protocol was verified against the task's
 * provided local evaluator.
 */

export const TRAJECTORY_SHOWCASE_MODEL_ORDER = Object.freeze([
  "vertex.claude-opus-4.7-m17",
  "glm-5.2",
  "gpt-5.5-2026-04-24",
  "gemini-3.1-pro-preview",
  "kimi-k2.7-code",
  "LongCat-2.0",
  "deepseek-v4-pro",
]);

export const TRAJECTORY_SHOWCASE_TASKS = Object.freeze([
  Object.freeze({
    task: "moving_mnist_world_model",
    slug: "moving-mnist-world-model",
    anchor: "task-moving-mnist-world-model",
    title: "Moving MNIST World Model",
    category: "model_dev",
    categoryLabel: "Model Development",
    description:
      "Train a PyTorch video world model from scratch on deterministic Moving MNIST clips. The model receives ten 64×64 grayscale context frames and must generate the next ten frames autoregressively; the hidden test uses fresh clips from the same generator.",
    metric: Object.freeze({
      key: "validation_psnr",
      label: "Validation PSNR",
      direction: "higher",
      unit: "dB",
      protocol: "autolab/10-context-10-rollout-validation",
      yScale: "linear",
      reward: Object.freeze({
        kind: "anchored-linear",
        baseline: 14.0,
        reference: 20.0,
      }),
    }),
    workload:
      "1,000 validation clips; 10 context frames → 10 autoregressive target frames at 64×64.",
    correctnessGate:
      "The checkpoint must reconstruct through build_model, emit the required 10-frame tensor, and never condition on future ground-truth frames.",
    timeBudgetHours: 4,
    evidenceNotes: Object.freeze([
      "Claude reaches 18.60 dB in six validated checkpoints; DeepSeek and GLM finish close together at 17.25 and 17.27 dB despite differently sized loops.",
      "Kimi rises from 13.96 to 15.53 dB, with its strongest advance appearing after the move to scheduled sampling and input noise.",
    ]),
    trajectories: Object.freeze([
      Object.freeze({
        syntheticModel: "vertex.claude-opus-4.7-m17",
        id: "0efcde3c-7e5c-409b-a604-d8e853129141",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "glm-5.2",
        id: "93b1824f-4a0d-4e48-86b0-e526f95b0a49",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "gpt-5.5-2026-04-24",
        id: "43932a55-770d-4f90-bc18-39c7132545de",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "gemini-3.1-pro-preview",
        id: "2d3dbe30-f440-430d-a61c-0188e64320ea",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "kimi-k2.7-code",
        id: "7ed28ba5-a64b-4905-9ba6-7612723b1501",
        kind: "curve",
        protocolEquivalentTrainingValidation: true,
      }),
      Object.freeze({
        syntheticModel: "LongCat-2.0",
        id: "4eabd928-9e2f-4925-9a18-cef0129160ea",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "deepseek-v4-pro",
        id: "e9819bcb-911f-44c4-aa63-652ab58bf2eb",
        kind: "curve",
      }),
    ]),
  }),
  Object.freeze({
    task: "bm25_search_go",
    slug: "bm25-search-go",
    anchor: "task-bm25-search-go",
    title: "BM25 Search in Go",
    category: "system_opt",
    categoryLabel: "System Optimization",
    description:
      "Optimize a standard-library-only Go search engine over a deterministic synthetic corpus. Query execution must preserve the exact BM25 top-10 results and checksum while reducing end-to-end runtime.",
    metric: Object.freeze({
      key: "runtime",
      label: "Query runtime",
      direction: "lower",
      unit: "seconds",
      protocol: "autolab/40-queries-400-hits",
      yScale: "log",
      reward: Object.freeze({
        kind: "log-speedup",
        baseline: 2.1,
        reference: 0.03,
      }),
    }),
    workload: "40 queries producing 400 exact top-10 hits in total.",
    correctnessGate:
      "The hit count and correctness checksum must match exactly; any wrong result receives no score.",
    timeBudgetHours: 4,
    evidenceNotes: Object.freeze([
      "Six of seven selected runs reach a sub-millisecond best runtime; DeepSeek's selected run stops at 32.75 ms.",
      "Checkpoint density ranges from 19 for GPT to 1,268 for GLM, so progress appears in both compact searches and extended tuning loops.",
    ]),
    trajectories: Object.freeze([
      Object.freeze({
        syntheticModel: "vertex.claude-opus-4.7-m17",
        id: "9372a85f-a26d-46aa-a4b4-5c4535b80440",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "glm-5.2",
        id: "e02fc6b3-9820-4c16-9cdb-5256c615ff4b",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "gpt-5.5-2026-04-24",
        id: "a489707e-0e4d-4a9d-a46d-6dbdffe50030",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "gemini-3.1-pro-preview",
        id: "857c9c2b-c8e3-471c-ae85-abb21065536c",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "kimi-k2.7-code",
        id: "b31e7f59-0508-4ef9-b314-88c2b9e2fef1",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "LongCat-2.0",
        id: "5a130bf5-4310-4350-89bc-5cfb70f7ccd7",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "deepseek-v4-pro",
        id: "12aa77c6-afd6-472f-92e5-4df9ad5c6f76",
        kind: "curve",
      }),
    ]),
  }),
  Object.freeze({
    task: "regex_engine",
    slug: "regex-engine",
    anchor: "task-regex-engine",
    title: "Regex Engine",
    category: "system_opt",
    categoryLabel: "System Optimization",
    description:
      "Optimize a pure-Rust regex engine for a fixed collection of patterns and diverse HTTP paths, logs, identifiers, and emails. Pattern compilation and matching are both included in the measured runtime.",
    metric: Object.freeze({
      key: "runtime",
      label: "Compile + search runtime",
      direction: "lower",
      unit: "seconds",
      protocol: "autolab/23-patterns-100000-haystacks",
      yScale: "log",
      reward: Object.freeze({
        kind: "log-speedup",
        baseline: 1.5,
        reference: 0.37,
      }),
    }),
    workload: "23 patterns compiled and searched over 100,000 haystacks.",
    correctnessGate:
      "Every result must exactly match the reference engine across the supported regex syntax.",
    timeBudgetHours: 2,
    evidenceNotes: Object.freeze([
      "GPT and Claude reduce their selected best runtime to 12.95 ms and 18.30 ms, while DeepSeek remains at 547.62 ms.",
      "GLM's 1,584-message trajectory reaches 84.41 ms but trails several shorter searches, exposing strategy rather than persistence as the bottleneck.",
    ]),
    trajectories: Object.freeze([
      Object.freeze({
        syntheticModel: "vertex.claude-opus-4.7-m17",
        id: "f83a2f19-7843-44b8-aee8-5edd9a50196e",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "glm-5.2",
        id: "56213f5f-a303-4af8-aec2-f1324b1e5921",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "gpt-5.5-2026-04-24",
        id: "0437718a-b0bb-427c-94f9-aba153fc8bfe",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "gemini-3.1-pro-preview",
        id: "0b22fb83-574c-4174-95e7-e2c45933ade6",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "kimi-k2.7-code",
        id: "f917dfda-fcba-41b6-8390-35c4580d1435",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "LongCat-2.0",
        id: "aea87f3c-1d79-4340-ae9e-d215c0f9c7cf",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "deepseek-v4-pro",
        id: "9cd70fa4-61ab-4419-b18b-d34634078549",
        kind: "curve",
      }),
    ]),
  }),
  Object.freeze({
    task: "adaptive_compression",
    slug: "adaptive-compression",
    anchor: "task-adaptive-compression",
    title: "Adaptive Compression",
    category: "puzzle",
    categoryLabel: "Puzzle & Challenge",
    description:
      "Build an online byte predictor that adapts across nine hidden sequence families, from Markov and periodic sources to nested structures, recurrences, regime switches, run lengths, and random data.",
    metric: Object.freeze({
      key: "overall_bpb",
      label: "Byte-weighted overall bpb",
      direction: "lower",
      unit: "bits/byte",
      protocol: "autolab/full-suite-9x34830",
      yScale: "linear",
      reward: Object.freeze({
        kind: "log-speedup",
        baseline: 5.0,
        reference: 3.8,
        mustBeat: 4.75,
      }),
    }),
    workload: "9 sequence families × 34,830 bytes = 313,470 bytes.",
    correctnessGate:
      "Every prediction must be a valid 256-value probability distribution; an invalid sequence is scored as 8.0 bpb.",
    timeBudgetHours: 4,
    evidenceNotes: Object.freeze([
      "The selected runs begin near 5.34 bpb (Kimi begins at 5.03) and separate to best scores from GLM's 3.55 bpb to Kimi's 4.04 bpb.",
      "DeepSeek uses 1,710 messages and 83 checkpoints to reach 3.86 bpb; Gemini reaches 3.69 bpb in 118 messages and 12 checkpoints.",
    ]),
    trajectories: Object.freeze([
      Object.freeze({
        syntheticModel: "vertex.claude-opus-4.7-m17",
        id: "61e90cb5-a552-4f57-b440-aa272378cbbc",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "glm-5.2",
        id: "06b92cd9-97d0-4e60-959d-243bd5ae6c32",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "gpt-5.5-2026-04-24",
        id: "7717fe24-993d-429f-91c2-0cf094e0ee2c",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "gemini-3.1-pro-preview",
        id: "ea11b2eb-2925-40d5-a25e-9ca4d814f3ec",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "kimi-k2.7-code",
        id: "3d89aae6-0627-40b6-b67a-03264ef2e487",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "LongCat-2.0",
        id: "c0b87b0f-41ee-4263-a34f-48e07a7004e9",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "deepseek-v4-pro",
        id: "fa77b595-a945-4087-a174-bfbab40ccf88",
        kind: "curve",
      }),
    ]),
  }),
  Object.freeze({
    task: "icp_correspondence_step_cuda",
    slug: "icp-correspondence-step-cuda",
    anchor: "task-icp-correspondence-step-cuda",
    title: "ICP Correspondence Step",
    category: "cuda",
    categoryLabel: "CUDA",
    description:
      "Optimize one CUDA Iterative Closest Point correspondence step: find each source point's nearest target neighbor, reject distant pairs, and accumulate covariance, error, and count entirely on the GPU.",
    metric: Object.freeze({
      key: "runtime",
      label: "Median kernel runtime",
      direction: "lower",
      unit: "milliseconds",
      protocol: "autolab/cuda-N200000-M500000",
      yScale: "log",
      reward: Object.freeze({
        kind: "log-speedup",
        baseline: 64.65,
        reference: 0.28,
      }),
    }),
    workload:
      "N = 200,000 source points; M = 500,000 target points; d_max = 0.05; median after warmup.",
    correctnessGate:
      "The pair count must match exactly and covariance/error outputs must match the CPU reference within 1e-4 relative tolerance.",
    timeBudgetHours: 2,
    evidenceNotes: Object.freeze([
      "Claude's selected trajectory reaches 0.0380 ms, more than 3× faster than the next-best Gemini at 0.1458 ms.",
      "GLM, DeepSeek, Kimi, and LongCat use 123–237 checkpoints yet cluster near 0.17–0.23 ms, despite widely different loop lengths.",
    ]),
    trajectories: Object.freeze([
      Object.freeze({
        syntheticModel: "vertex.claude-opus-4.7-m17",
        id: "74ea71b4-293c-4d24-9f3d-ad3edf617db9",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "glm-5.2",
        id: "1a1164d3-0763-4abc-942b-d9d1c983f80f",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "gpt-5.5-2026-04-24",
        id: "6ec15f84-9bc7-45cd-ad86-5c83d42e3825",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "gemini-3.1-pro-preview",
        id: "b8612e64-aebc-403b-9459-42f63c45aba1",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "kimi-k2.7-code",
        id: "20cfec10-cd0e-4f7a-83e9-27ce4094a039",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "LongCat-2.0",
        id: "c5e3988e-3142-4e41-a534-b4a65f4c9bcc",
        kind: "curve",
      }),
      Object.freeze({
        syntheticModel: "deepseek-v4-pro",
        id: "2e72c8c4-fd8a-4b58-9837-099f49ce6b85",
        kind: "curve",
      }),
    ]),
  }),
]);

export const TRAJECTORY_SHOWCASE_IDS = Object.freeze(
  TRAJECTORY_SHOWCASE_TASKS.flatMap((task) =>
    task.trajectories.map((trajectory) => trajectory.id),
  ),
);

export const TRAJECTORY_SHOWCASE_ID_SET = new Set(TRAJECTORY_SHOWCASE_IDS);

export const TRAJECTORY_SHOWCASE_TASK_BY_ID = new Map(
  TRAJECTORY_SHOWCASE_TASKS.flatMap((task) =>
    task.trajectories.map((trajectory) => [trajectory.id, task]),
  ),
);

export const TRAJECTORY_SHOWCASE_BY_TASK = new Map(
  TRAJECTORY_SHOWCASE_TASKS.map((task) => [task.task, task]),
);
