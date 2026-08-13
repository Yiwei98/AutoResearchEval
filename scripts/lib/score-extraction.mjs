/**
 * Conservative, task-aware score extraction for AutoLab trajectories.
 *
 * The input is the normalized message array produced by process-data.mjs.  In
 * particular, assistant tool calls retain their id/name/arguments and tool
 * responses retain role=tool, content, and tool_call_id.
 *
 * Design rules:
 *   - assistant prose is never evidence;
 *   - a score must come from a tool response;
 *   - correctness gates and workload shapes are task-specific;
 *   - observations from different protocols are labelled, never silently
 *     connected (for example OCR-20 vs OCR-400);
 *   - commits are optional metadata, not score boundaries;
 *   - repeated background-output polls are de-duplicated with tool_call_id and
 *     task_id when those identifiers are available.
 */

const NUMBER = String.raw`[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?`;

function spec(metric, direction, unit, protocol, parser, extra = {}) {
  return Object.freeze({ metric, direction, unit, protocol, parser, ...extra });
}

/**
 * Public task contract.  `protocol` is the primary, comparable protocol; a
 * parser may emit a more specific alternate protocol when the evaluator itself
 * explicitly reports a different workload.
 */
export const TASK_SCORE_SPECS = Object.freeze({
  adaptive_compression: spec(
    "overall_bpb",
    "lower",
    "bits/byte",
    "autolab/full-suite-9x34830",
    "adaptiveCompression",
    { gate: "9 sequences, 313470 bytes; invalid sequences score 8 bpb" },
  ),
  adversarial_splay: spec(
    "rotations",
    "higher",
    "rotations",
    "autolab/4096-accesses",
    "adversarialSplay",
  ),
  aes128_ctr: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/256MiB-median-5",
    "aes128Ctr",
  ),
  agent_tool_routing: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/public-router-650-tools-220-queries",
    "agentToolRouting",
    { gate: "MRR@10 >= 0.82 and Recall@10 >= 0.94" },
  ),
  bm25_search_go: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/40-queries-400-hits",
    "bm25SearchGo",
  ),
  bvh_raytracer: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/638x638-rays-4096-triangles",
    "bvhRaytracer",
  ),
  concurrent_kv_wal: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/public-driver-64000-ops",
    "concurrentKvWal",
  ),
  data_select_ifeval: spec(
    "prompt_level_strict_accuracy",
    "higher",
    "fraction",
    "autolab/ifeval-full",
    "dataSelectIfeval",
  ),
  discover_sorting: spec(
    "comparators",
    "lower",
    "comparators",
    "autolab/all-65536-binary-inputs",
    "discoverSorting",
  ),
  fft_rust: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/n32768-median-3",
    "fftRust",
  ),
  flash_attention: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/n4096-d64",
    "flashAttention",
  ),
  flux2_klein_lora: spec(
    "composite_quality_score",
    "higher",
    "score",
    "autolab/8-eval-prompts",
    "flux2KleinLora",
  ),
  fredkin_sort_network: spec(
    "gates",
    "lower",
    "gates",
    "autolab/exhaustive-fredkin-verifier",
    "fredkinSortNetwork",
  ),
  gaussian_blur: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/4096x4096-17x17-5-passes",
    "gaussianBlur",
    { gate: "pixel error tolerance passes" },
  ),
  grpo_multisource: spec(
    "mathvista_accuracy",
    "higher",
    "fraction",
    "autolab/mathvista-100+vqa-retention",
    "grpoMultisource",
    { gate: "VQA retention >= 0.9" },
  ),
  hash_join: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/20k-x-5m-rows",
    "hashJoin",
  ),
  huffman_canonical_decode_cuda: spec(
    "runtime",
    "lower",
    "milliseconds",
    "autolab/cuda-K2048-bpe65536",
    "huffmanCuda",
  ),
  icp_correspondence_step_cuda: spec(
    "runtime",
    "lower",
    "milliseconds",
    "autolab/cuda-N200000-M500000",
    "icpCuda",
  ),
  levenshtein_distance: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/1m-pairs-median-3",
    "levenshteinDistance",
  ),
  llm_online_serving: spec(
    "serving_score",
    "higher",
    "ratio",
    "autolab/96-requests",
    "llmOnlineServing",
    { formula: "0.5*(throughput/baseline throughput)+0.5*(baseline completion/candidate completion)" },
  ),
  moving_mnist_world_model: spec(
    "validation_psnr",
    "higher",
    "dB",
    "autolab/10-context-10-rollout-validation",
    "movingMnist",
  ),
  msm_pippenger_bls12_381_cuda: spec(
    "runtime",
    "lower",
    "milliseconds",
    "autolab/cuda-N262144",
    "msmCuda",
  ),
  multilingual_ocr: spec(
    "average_cer",
    "lower",
    "CER",
    "autolab/ocr-400-images",
    "multilingualOcr",
  ),
  ntt_butterfly_cuda: spec(
    "runtime",
    "lower",
    "milliseconds",
    "autolab/cuda-batch256-n65536",
    "nttCuda",
  ),
  radix_sort: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/full-radix-workload-median-5",
    "radixSort",
  ),
  regex_engine: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/23-patterns-100000-haystacks",
    "regexEngine",
  ),
  resnet_bit_flip: spec(
    "bits_flipped",
    "lower",
    "bits",
    "autolab/cifar10-10000-images",
    "resnetBitFlip",
    { gate: "full-test accuracy < 0.12" },
  ),
  safety_router: spec(
    "parameters",
    "lower",
    "parameters",
    "autolab/safety-router-gated-split",
    "safetyRouter",
    { gate: "accuracy >= .64, unsafe recall >= .66, safe recall >= .57" },
  ),
  scaling_law: spec(
    "validation_perplexity",
    "lower",
    "perplexity",
    "autolab/wikitext103-validation-seq1024",
    "scalingLaw",
  ),
  sha256_throughput: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/512MiB-median-3",
    "sha256Throughput",
  ),
  smallest_game_player: spec(
    "parameters",
    "lower",
    "parameters",
    "autolab/connect3-hidden-perfect-play",
    "smallestGamePlayer",
    { gate: "accuracy >= 0.95" },
  ),
  sstable_compaction_rs: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/sstable-public-verify+benchmark",
    "sstableCompaction",
  ),
  stack_machine_golf: spec(
    "instructions",
    "lower",
    "instructions",
    "autolab/256x256-dot-product",
    "stackMachineGolf",
  ),
  toy_isa_opt: spec(
    "cycles",
    "lower",
    "cycles",
    "autolab/pinc-512-dot-product",
    "toyIsaOpt",
  ),
  vliw_scheduler: spec(
    "cycles",
    "lower",
    "cycles",
    "autolab/3000-ops",
    "vliwScheduler",
  ),
  z_order_range_scan: spec(
    "runtime",
    "lower",
    "seconds",
    "autolab/verifier-range-scan",
    "zOrderRangeScan",
  ),
});

// A shorter alias is convenient for callers and keeps migration patches small.
export const TASK_SPECS = TASK_SCORE_SPECS;
export const SUPPORTED_SCORE_TASKS = Object.freeze(Object.keys(TASK_SCORE_SPECS));

export function getTaskScoreSpec(task) {
  return TASK_SCORE_SPECS[task] ?? null;
}

function finiteNumber(value) {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function stripAnsi(value) {
  return String(value ?? "")
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\r/g, "\n");
}

function outputLines(text) {
  return stripAnsi(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function regex(source, flags = "i") {
  return new RegExp(source.replaceAll("<N>", `(${NUMBER})`), flags);
}

function matchesByLine(text, re, map) {
  const out = [];
  for (const line of outputLines(text)) {
    const match = line.match(re);
    if (!match) continue;
    const item = map(match, line);
    if (item) out.push(item);
  }
  return out;
}

function allMatches(text, re) {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  return [...text.matchAll(new RegExp(re.source, flags))];
}

function makeCandidate(score, scoreRaw, extra = {}) {
  const parsed = finiteNumber(score);
  if (parsed == null) return null;
  return { score: parsed, scoreRaw: String(scoreRaw).trim(), ...extra };
}

function hasExactLine(text, re) {
  return outputLines(text).some((line) => re.test(line));
}

function noFailureSignal(text) {
  return !/(?:^|\n)\s*(?:FAIL(?:ED)?|result=(?:wrong|fail)|verify=(?:fail|wrong)|WRONG(?:_ANSWER)?|mismatch)\b/im.test(
    stripAnsi(text),
  );
}

function commandString(toolCall) {
  if (!toolCall) return "";
  const args = toolCall.arguments;
  if (typeof args === "string") return args;
  if (!args || typeof args !== "object") return "";
  for (const key of ["command", "cmd", "input", "script"]) {
    if (typeof args[key] === "string") return args[key];
  }
  return "";
}

function toolCallIndex(messages) {
  const calls = new Map();
  for (let messageIndex = 0; messageIndex < messages.length; messageIndex += 1) {
    const message = messages[messageIndex];
    if (message?.role !== "assistant" || !Array.isArray(message.tool_calls)) continue;
    for (const call of message.tool_calls) {
      if (!call?.id) continue;
      calls.set(call.id, {
        id: call.id,
        name: call.name ?? call.function?.name ?? "tool",
        arguments: call.arguments ?? call.function?.arguments ?? {},
        messageIndex,
      });
    }
  }
  return calls;
}

function taskIdFrom(message, toolCall, text) {
  const args = toolCall?.arguments;
  const fromArgs =
    args && typeof args === "object"
      ? args.task_id ?? args.taskId ?? args.session_id ?? args.sessionId
      : null;
  if (message?.task_id || message?.taskId || fromArgs) {
    return String(message?.task_id ?? message?.taskId ?? fromArgs);
  }
  const tagged = String(text).match(/<task_id>\s*([^<\s]+)\s*<\/task_id>/i);
  if (tagged) return tagged[1];
  const filePath =
    args && typeof args === "object"
      ? String(args.file_path ?? args.path ?? "")
      : "";
  return filePath.match(/\/tasks\/([^/]+)\.output(?:\s|$)/i)?.[1] ?? null;
}

function isSourceInspection(toolCall) {
  if (!toolCall) return false;
  const name = String(toolCall.name ?? "").toLowerCase();
  const command = commandString(toolCall).trim();
  const args = toolCall.arguments;
  const filePath =
    args && typeof args === "object"
      ? String(args.file_path ?? args.path ?? "")
      : "";

  // Reading the harness's captured background stdout is equivalent to
  // receiving the original Bash result. Other file reads remain inspection.
  if (/^(read|read_file)$/.test(name)) {
    return !/\/tasks\/[^/]+\.output(?:\s|$)/i.test(filePath);
  }
  if (/^(grep|glob)$/.test(name)) return true;
  if (!command) return false;

  // A compound command may write source with a heredoc and then run the real
  // evaluator. The executable result at the end is still admissible evidence.
  if (looksLikeExecutableRun(command)) return false;
  // A compound command may create a tuning script and execute it immediately.
  // Its stdout is evaluator evidence even though the command also mentions a
  // source extension.  Exact task parsers still reject any source text echoed
  // before the run's output.
  if (looksLikeExecutableRun(command) || /(?:^|[;&|\n])\s*(?:bash|sh)\s+\S+/i.test(command)) {
    return false;
  }

  // Source and journals often quote evaluator printf lines verbatim.  Do not
  // reinterpret a file inspection as an evaluator run.  Captured stdout logs
  // (for example /tmp/bench.out) remain eligible.
  return /^(?:cat|sed|head|tail|less|nl|rg|grep)\b[\s\S]*\.(?:md|py|pyi|c|cc|cpp|cxx|h|hpp|rs|go|cu|cuh|sh)(?:\s|$)/i.test(
    command,
  );
}

function looksLikeExecutableRun(command) {
  if (!command) return false;
  return /(?:^|[\s;&|])(?:python3?|cargo\s+run|go\s+(?:run|test)|make(?:\s|$)|bash\s+\S*(?:train|bench|eval|run)|\.\/[\w.-]+|\S+\/(?:main|solve|bench|benchmark))(?:\s|$)/i.test(
    command,
  );
}

function adaptiveCompression(text) {
  return matchesByLine(
    text,
    regex(String.raw`^===\s*Overall:\s*<N>\s*bpb\s*\(9\s+sequences,\s*313470\s+bytes\)\s*===$`),
    (m, line) => makeCandidate(m[1], line),
  );
}

function adversarialSplay(text) {
  return matchesByLine(
    text,
    /^(?:__VERIFIER__\s+)?rotations=(\d+)\s+accesses=4096\s+verify=ok$/i,
    (m, line) => makeCandidate(m[1], line),
  );
}

function aes128Ctr(text) {
  return matchesByLine(
    text,
    regex(String.raw`^runs=5\s+time=<N>\s+result=ok$`),
    (m, line) => {
      const score = finiteNumber(m[1]);
      return score > 0 ? makeCandidate(score, line) : null;
    },
  );
}

function agentToolRouting(text) {
  const candidates = [];
  candidates.push(
    ...matchesByLine(
      text,
      regex(String.raw`^verify\s+time=<N>\s+mrr=<N>\s+recall=<N>\s+checksum=\d+$`),
      (m, line) => {
        const runtime = finiteNumber(m[1]);
        const mrr = finiteNumber(m[2]);
        const recall = finiteNumber(m[3]);
        if (runtime <= 0 || mrr < 0.82 || recall < 0.94) return null;
        return makeCandidate(runtime, line, {
          protocol: "autolab/public-router-650-tools-220-queries",
          gate: { mrr, recall },
        });
      },
    ),
  );

  for (const match of allMatches(text, /\{[^{}]*"correctness"[^{}]*\}/i)) {
    let result;
    try {
      result = JSON.parse(match[0]);
    } catch {
      continue;
    }
    const metric = finiteNumber(result.metric);
    const mrr = finiteNumber(result.mrr);
    const recall = finiteNumber(result.recall);
    if (result.correctness !== true || metric == null || metric <= 0 || mrr < 0.82) continue;
    candidates.push(
      makeCandidate(metric, match[0], {
        protocol: "autolab/router-json-evaluation",
        gate: { mrr, recall },
      }),
    );
  }
  return candidates;
}

function bm25SearchGo(text) {
  return matchesByLine(
    text,
    regex(String.raw`^result=ok\s+time=<N>(?:\s+checksum=\d+)?\s+hits=400\s+queries=40$`),
    (m, line) => {
      const score = finiteNumber(m[1]);
      return score > 0 ? makeCandidate(score, line) : null;
    },
  );
}

function bvhRaytracer(text) {
  if (!/\bhits=397805\b/i.test(text)) return [];
  if (!noFailureSignal(text)) return [];

  const runMatches = allMatches(text, /run\s+([1-5]):\s*([0-9.]+)s\s+hits=397805/gi);
  const completeRunSet = new Set(runMatches.map((match) => Number(match[1]))).size === 5;
  if (completeRunSet) {
    const bareScores = outputLines(text)
      .map((line) => line.match(/^([0-9]+\.[0-9]+)$/)?.[1] ?? null)
      .filter(Boolean);
    if (bareScores.length) {
      const score = bareScores[bareScores.length - 1];
      const checksumPassed = /\bchecksum=5259598270423092022\b/i.test(text);
      return [
        makeCandidate(score, score, {
          confidence: checksumPassed ? "high" : "medium",
          gate: {
            hits: 397805,
            runs: 5,
            checksum: checksumPassed ? "5259598270423092022" : null,
          },
        }),
      ];
    }
  }

  if (!/\bchecksum=5259598270423092022\b/i.test(text)) return [];

  const direct = matchesByLine(
    text,
    regex(String.raw`^(?:runs=\d+\s+)?time=<N>(?:\s+hits=397805)?(?:\s+checksum=5259598270423092022)?(?:\s+result=ok)?$`),
    (m, line) => makeCandidate(m[1], line),
  );
  if (direct.length) return direct;

  return matchesByLine(
    text,
    regex(String.raw`^Median\s+time:\s*<N>s$`),
    (m, line) => makeCandidate(m[1], line),
  );
}

function concurrentKvWal(text) {
  return matchesByLine(
    text,
    regex(
      String.raw`^ops=64000\s+runs=(?:3|5|\d{2,})\s+time=<N>\s+checksum=10736860379913288937\s+final_keys=12514$`,
    ),
    (m, line) => makeCandidate(m[1], line),
  );
}

function dataSelectIfeval(text, context) {
  const clean = stripAnsi(text);
  const adapterStart = clean.toLowerCase().lastIndexOf("evaluating adapter");
  const relevant = adapterStart >= 0 ? clean.slice(adapterStart) : clean;
  const scores = allMatches(
    relevant,
    /\|\s*prompt_level_strict_acc\s*\|\s*↑\s*\|\s*([0-9.]+)\s*\|/i,
  );
  if (!scores.length) return [];

  const last = scores[scores.length - 1];
  const limitMatch = relevant.match(/(?:--limit\s+|limit:\s*)(\d+)/i);
  const isFull = /limit:\s*None/i.test(relevant) || (!limitMatch && /ifeval/i.test(relevant));
  const evidence = `${context.command}\n${relevant}`;
  const hasAdapter = /enable_lora['"]?\s*[:=]\s*True|lora_local_path|Evaluating adapter/i.test(
    evidence,
  );
  const isBaseline =
    isFull &&
    /lm_eval|vllm/i.test(evidence) &&
    !hasAdapter;
  const protocol = isBaseline
    ? "autolab/ifeval-base-full"
    : isFull
      ? "autolab/ifeval-full"
      : `autolab/ifeval-limit-${limitMatch?.[1] ?? "unknown"}`;
  return [
    makeCandidate(last[1], last[0], {
      protocol,
      confidence: isFull ? "high" : "medium",
      ...(isBaseline ? { isBaseline: true } : {}),
    }),
  ];
}

function discoverSorting(text) {
  return matchesByLine(
    text,
    /^result=ok\s+comparators=(\d+)\s+checksum=[0-9a-f]+$/i,
    (m, line) => makeCandidate(m[1], line),
  );
}

function fftRust(text) {
  return matchesByLine(
    text,
    regex(String.raw`^n=32768\s+runs=3\s+time=<N>\s+checksum=(?!0(?:\.0+)?e?[+-]?0?\b)\S+\s+verify=ok$`),
    (m, line) => makeCandidate(m[1], line),
  );
}

function flashAttention(text) {
  const officialReferenceSum = -13.879631219;
  const verifyLine = outputLines(text)
    .map((line) => line.match(regex(String.raw`^verify\s+n=256\s+d=32\s+sum=<N>$`)))
    .find(Boolean);
  const verifiedSum = verifyLine ? finiteNumber(verifyLine[1]) : null;
  const relativeError =
    verifiedSum == null
      ? Number.POSITIVE_INFINITY
      : Math.abs(verifiedSum - officialReferenceSum) / Math.abs(officialReferenceSum);
  const passed = hasExactLine(text, /^PASS$/i) || relativeError <= 0.01;
  if (!passed || !noFailureSignal(text)) return [];
  return matchesByLine(
    text,
    regex(String.raw`^n=4096\s+d=64\s+time=<N>\s+checksum=(-?<N>)$`),
    (m, line) => {
      const score = finiteNumber(m[1]);
      const checksum = finiteNumber(m[2]);
      return score > 0 && checksum !== 0
        ? makeCandidate(score, line, {
            gate: { relativeError, tolerance: 0.01 },
          })
        : null;
    },
  );
}

function flux2KleinLora(text) {
  if (!hasExactLine(text, /^(?:=+\s*)?EVALUATION RESULTS(?:\s*=+)?$/i)) return [];
  const componentCount = ["clip", "dino", "text"].filter((key) =>
    new RegExp(`(?:^|[\"_ ])${key}`, "im").test(text),
  ).length;
  if (componentCount < 2) return [];
  return allMatches(text, /["']score["']\s*:\s*([0-9.]+)/i).map((m) =>
    makeCandidate(m[1], m[0]),
  );
}

function fredkinSortNetwork(text) {
  return matchesByLine(
    text,
    /^gates=(\d+)\s+verify=ok$/i,
    (m, line) => makeCandidate(m[1], line),
  );
}

function gaussianArtifact(command, executable) {
  const clean = String(command ?? "").replaceAll(/2>[^\s;&|]+|2>&1|>[^\s;&|]+/g, " ");
  const pattern = executable === "blur"
    ? /(?:^|[;&|]\s*|\s)(?:\.\/)?blur\s+\S+\s+(\S+)/gi
    : /(?:^|[;&|]\s*|\s)(?:\.\/)?diffcheck\s+\S+\s+(\S+)/gi;
  const matches = [...clean.matchAll(pattern)];
  return matches.at(-1)?.[1]?.replace(/[;|&]+$/, "") ?? null;
}

function pendingGaussianCandidate(candidate, context, artifact) {
  return {
    ...candidate,
    messageIndex: context.messageIndex,
    command: context.command,
    toolCallId: context.toolCallId,
    taskId: context.taskId,
    toolName: context.toolName,
    artifact,
  };
}

function gaussianBlur(text, context) {
  const state = context.state;
  state.gaussianPending ??= new Map();

  const times = matchesByLine(
    text,
    regex(String.raw`^time=<N>\s+checksum=\d+$`),
    (m, line) => {
      const score = finiteNumber(m[1]);
      return score > 0 ? makeCandidate(score, line) : null;
    },
  );
  const maxDiffMatches = allMatches(
    text,
    /max(?:imum)?[_ ]diff\s*[=:]\s*([0-9]+(?:\.[0-9]+)?)/i,
  );
  const maxDiff = maxDiffMatches.length
    ? finiteNumber(maxDiffMatches[maxDiffMatches.length - 1][1])
    : null;
  const explicitPass =
    /PASS:\s*all\s+65536\s+pixels\s+within\s+tolerance/i.test(text) ||
    (maxDiff != null && maxDiff <= 4);
  const explicitFailure =
    !noFailureSignal(text) ||
    (maxDiff != null && maxDiff > 4);
  const measuredArtifact = gaussianArtifact(context.command, "blur");
  const checkedArtifact = gaussianArtifact(context.command, "diffcheck");

  if (times.length && explicitPass && !explicitFailure) return times;

  if (times.length && !explicitFailure) {
    for (const candidate of times) {
      const pending = pendingGaussianCandidate(candidate, context, measuredArtifact);
      if (measuredArtifact) state.gaussianPending.set(measuredArtifact, pending);
      state.gaussianLastPending = pending;
    }
  }

  if (explicitFailure) {
    if (checkedArtifact) state.gaussianPending.delete(checkedArtifact);
    if (state.gaussianLastPending?.artifact === checkedArtifact) state.gaussianLastPending = null;
    return [];
  }
  if (!explicitPass) return [];

  const pending =
    (checkedArtifact ? state.gaussianPending.get(checkedArtifact) : null) ??
    (state.gaussianLastPending && context.messageIndex - state.gaussianLastPending.messageIndex <= 6
      ? state.gaussianLastPending
      : null);
  if (!pending) return [];
  if (pending.artifact) state.gaussianPending.delete(pending.artifact);
  if (state.gaussianLastPending === pending) state.gaussianLastPending = null;
  return [{ ...pending, gate: { maxDiff, tolerance: 4 } }];
}

function grpoMultisource(text) {
  const lines = outputLines(text);
  const candidates = [];
  for (let i = 0; i < lines.length; i += 1) {
    const scoreMatch = lines[i].match(/^Combined(?:\s+score)?\s*:\s*([0-9.]+)$/i);
    if (!scoreMatch) continue;
    const neighborhood = lines.slice(Math.max(0, i - 12), Math.min(lines.length, i + 12)).join("\n");
    if (!/Forgetting\s+gate:\s*PASS/i.test(neighborhood)) continue;
    const full = /(?:Eval:\s*100\s+held-out|MathVista:\s*100\/100)/i.test(text);
    candidates.push(
      makeCandidate(scoreMatch[1], lines[i], {
        protocol: full
          ? "autolab/mathvista-100+vqa-retention"
          : "autolab/mathvista-local+vqa-retention",
        confidence: full ? "high" : "medium",
      }),
    );
  }
  return candidates;
}

function hashJoin(text) {
  return matchesByLine(
    text,
    regex(
      String.raw`^time=<N>\s+matches=2000002\s+checksum=8602332552186931$`,
    ),
    (m, line) => {
      const score = finiteNumber(m[1]);
      return score > 0 ? makeCandidate(score, line) : null;
    },
  );
}

function huffmanCuda(text) {
  return matchesByLine(
    text,
    regex(String.raw`^result=ok\s+time_ms=<N>\s+K=2048\s+bpe=65536$`),
    (m, line) => makeCandidate(m[1], line),
  );
}

function icpCuda(text) {
  return matchesByLine(
    text,
    regex(
      String.raw`^(?:\S+:\s+)?result=ok\s+N=200000\s+M=500000\s+nodes=500000\s+count=200000\s+time_ms=<N>$`,
    ),
    (m, line) => makeCandidate(m[1], line),
  );
}

function levenshteinDistance(text) {
  if (!noFailureSignal(text)) return [];
  return matchesByLine(
    text,
    regex(
      String.raw`^(?:seed=\S+:\s*)?runs=3\s+time=<N>\s+checksum=\d+\s+fingerprint=0x[0-9a-f]+\s+result=ok$`,
    ),
    (m, line) => {
      const score = finiteNumber(m[1]);
      return score > 0 ? makeCandidate(score, line) : null;
    },
  );
}

function llmOnlineServing(text) {
  const observations = [];
  for (const match of allMatches(text, /\{[^{}]*"throughput_tok_per_sec"[^{}]*\}/i)) {
    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      continue;
    }
    const throughput = finiteNumber(parsed.throughput_tok_per_sec);
    const completion = finiteNumber(parsed.mean_completion_sec);
    const requests = finiteNumber(parsed.num_requests);
    const completed = finiteNumber(parsed.num_completed);
    const tokens = finiteNumber(parsed.total_output_tokens);
    if (
      throughput == null ||
      completion == null ||
      throughput <= 0 ||
      completion <= 0 ||
      requests !== 96 ||
      completed !== 96 ||
      tokens !== 21632
    ) {
      continue;
    }
    observations.push(
      makeCandidate(throughput, match[0], {
        components: {
          throughputTokPerSec: throughput,
          meanCompletionSec: completion,
          totalOutputTokens: tokens,
          numRequests: requests,
          numCompleted: completed,
        },
        needsServingBaseline: true,
      }),
    );
  }
  return observations;
}

function movingMnistValidationRun(context) {
  const text = String(context.message?.content ?? "");
  const tagged = text.match(/<task_id>\s*([^<\s]+)\s*<\/task_id>/i)?.[1];
  if (tagged) return tagged;

  const command = String(context.command ?? "");
  const fromCommand = command.match(/\/tasks\/([^/\s]+)\.output\b/i)?.[1];
  return fromCommand ?? context.taskId ?? null;
}

function movingMnistTrainingValidation(text, context) {
  if (context.options?.includeProtocolEquivalentTrainingValidation !== true) return [];

  const validationRun = movingMnistValidationRun(context);
  // Training stdout is repeatedly polled. A stable background-run identifier
  // is required so a historical checkpoint is never emitted twice.
  if (!validationRun) return [];

  context.state.movingMnistValidationSteps ??= new Set();
  const unseen = [];
  let trainingStep = null;
  for (const line of outputLines(text)) {
    const stepMatch = line.match(/^(?:\d+\t)?\s*Step\s+(\d+)\s*\|/i);
    if (stepMatch) {
      trainingStep = Number.parseInt(stepMatch[1], 10);
      continue;
    }

    const validationMatch = line.match(
      /^(?:\d+\t)?\s*>>\s*val MSE\s+([0-9]+(?:\.[0-9]+)?)\s*\|\s*val PSNR\s+([0-9]+(?:\.[0-9]+)?)\s*dB\s*\(best\s+(?:-?inf|[0-9]+(?:\.[0-9]+)?)\s*dB\)\s*$/i,
    );
    if (!validationMatch || trainingStep == null) continue;

    const mse = finiteNumber(validationMatch[1]);
    const psnr = finiteNumber(validationMatch[2]);
    if (mse == null || psnr == null || mse <= 0) continue;
    const recomputed = 10 * Math.log10(1 / Math.max(mse, 1e-12));
    // MSE is printed to five decimal places and PSNR to two, so allow only the
    // small discrepancy introduced by those display roundings.
    if (Math.abs(recomputed - psnr) > 0.02) continue;

    const key = `${validationRun}|${trainingStep}`;
    if (context.state.movingMnistValidationSteps.has(key)) continue;
    context.state.movingMnistValidationSteps.add(key);
    unseen.push(
      makeCandidate(psnr, line, {
        confidence: "high",
        evidenceKind: "protocol-equivalent-training-validation",
        trainingStep,
        taskId: validationRun,
        validationRunId: validationRun,
        gate: {
          meanMse: mse,
          psnrFromRoundedMse: recomputed,
          numericalProtocolVerified: true,
        },
      }),
    );
  }

  // A single poll can contain a long historical log. Place one representative
  // observation at the point where that log becomes visible, choosing its best
  // newly observed checkpoint so genuine advances are retained without drawing
  // multiple vertical transitions at one message index.
  return unseen.length
    ? [unseen.reduce((best, candidate) => (candidate.score > best.score ? candidate : best))]
    : [];
}

function movingMnist(text, context) {
  const official = matchesByLine(
    text,
    regex(String.raw`^Val\s+PSNR:\s*<N>\s*dB$`),
    (m, line) => makeCandidate(m[1], line),
  );
  return [...official, ...movingMnistTrainingValidation(text, context)];
}

function msmCuda(text) {
  return matchesByLine(
    text,
    regex(String.raw`^result=ok\s+N=262144\s+median_ms=<N>$`),
    (m, line) => makeCandidate(m[1], line),
  );
}

function multilingualOcr(text) {
  const lines = outputLines(text);
  let protocol = "autolab/ocr-unknown-count";
  let confidence = "medium";
  if (/(?:Evaluat(?:ed|ing)|Samples?|Images?)\D{0,12}400\b|\b400\s+(?:images|samples)\b|\/400\b/i.test(text)) {
    protocol = "autolab/ocr-400-images";
    confidence = "high";
  } else if (
    /(?:Evaluat(?:ed|ing)|Samples?|Images?)\D{0,12}20\b|\b20\s+(?:images|samples)\b|\/20\b/i.test(text)
  ) {
    protocol = "autolab/ocr-20-sample-local";
    confidence = "high";
  }
  return lines
    .map((line) => {
      const match = line.match(/^Average\s+CER:\s*([0-9.]+)$/i);
      return match
        ? makeCandidate(match[1], line, { protocol, confidence })
        : null;
    })
    .filter(Boolean);
}

function nttCuda(text) {
  return matchesByLine(
    text,
    regex(String.raw`^result=ok\s+time_ms=<N>\s+batch=256\s+n=65536$`),
    (m, line) => makeCandidate(m[1], line),
  );
}

function radixSort(text) {
  return matchesByLine(
    text,
    regex(String.raw`^runs=5\s+time=<N>\s+checksum=107372525662220181\s+sorted=ok$`),
    (m, line) => makeCandidate(m[1], line),
  );
}

function regexEngine(text) {
  return matchesByLine(
    text,
    regex(
      String.raw`^patterns=23\s+haystacks=100000\s+time=<N>\s+matches=140977\s+checksum=3680588992811618038$`,
    ),
    (m, line) => makeCandidate(m[1], line),
  );
}

function resnetBitFlip(text) {
  return matchesByLine(
    text,
    regex(
      String.raw`^result=ok\s+accuracy=<N>\s+bits_flipped=(\d+)\s+gate=pass(?:\s+solve_time=<N>\s+eval_time=<N>)?$`,
    ),
    (m, line) => {
      const accuracy = finiteNumber(m[1]);
      const bits = finiteNumber(m[2]);
      return accuracy < 0.12
        ? makeCandidate(bits, line, { gate: { accuracy, threshold: 0.12 } })
        : null;
    },
  );
}

function safetyRouter(text) {
  const candidates = [];
  for (const match of allMatches(text, /\{[^{}]*"total_params"[^{}]*\}/i)) {
    let result;
    try {
      result = JSON.parse(match[0]);
    } catch {
      continue;
    }
    const params = finiteNumber(result.total_params);
    const accuracy = finiteNumber(result.accuracy);
    const unsafeRecall = finiteNumber(result.unsafe_recall);
    const safeRecall = finiteNumber(result.safe_recall);
    if (
      result.passed_constraints !== true ||
      params == null ||
      accuracy < 0.64 ||
      unsafeRecall < 0.66 ||
      safeRecall < 0.57
    ) {
      continue;
    }
    candidates.push(
      makeCandidate(params, match[0], {
        gate: { accuracy, unsafeRecall, safeRecall },
      }),
    );
  }

  for (const line of outputLines(text)) {
    const match = line.match(
      regex(
        String.raw`^(?:PASS(?:\s+tag=\S+)?\s+)?params=(\d+)\s+(?:acc|accuracy)=<N>\s+(?:urec|unsafe_recall)=<N>\s+(?:srec|safe_recall)=<N>(?:\s+.*)?$`,
      ),
    );
    if (!match) continue;
    const params = finiteNumber(match[1]);
    const accuracy = finiteNumber(match[2]);
    const unsafeRecall = finiteNumber(match[3]);
    const safeRecall = finiteNumber(match[4]);
    if (accuracy < 0.64 || unsafeRecall < 0.66 || safeRecall < 0.57) continue;
    candidates.push(
      makeCandidate(params, line, {
        gate: { accuracy, unsafeRecall, safeRecall },
      }),
    );
  }

  const lines = outputLines(text);
  for (let i = 0; i < lines.length; i += 1) {
    const paramsMatch = lines[i].match(/^params\s+(\d+)$/i);
    if (!paramsMatch) continue;
    const neighborhood = lines.slice(i, Math.min(lines.length, i + 5)).join("\n");
    const metrics = neighborhood.match(
      /test(?:_public)?\s+Metrics\(accuracy=([0-9.]+),\s*unsafe_recall=([0-9.]+),\s*safe_recall=([0-9.]+)\)/i,
    );
    if (!metrics) continue;
    const accuracy = finiteNumber(metrics[1]);
    const unsafeRecall = finiteNumber(metrics[2]);
    const safeRecall = finiteNumber(metrics[3]);
    if (accuracy < 0.64 || unsafeRecall < 0.66 || safeRecall < 0.57) continue;
    candidates.push(
      makeCandidate(paramsMatch[1], `${lines[i]} | ${metrics[0]}`, {
        protocol: "autolab/safety-router-test-public",
        confidence: "medium",
        gate: { accuracy, unsafeRecall, safeRecall },
      }),
    );
  }

  for (const line of lines) {
    const best = line.match(
      /\bparams\s+(\d+)\b[\s\S]*?test\s+Metrics\(accuracy=([0-9.]+),\s*unsafe_recall=([0-9.]+),\s*safe_recall=([0-9.]+)\)/i,
    );
    if (!best) continue;
    const accuracy = finiteNumber(best[2]);
    const unsafeRecall = finiteNumber(best[3]);
    const safeRecall = finiteNumber(best[4]);
    if (accuracy < 0.64 || unsafeRecall < 0.66 || safeRecall < 0.57) continue;
    candidates.push(
      makeCandidate(best[1], line, {
        protocol: "autolab/safety-router-test-public",
        confidence: "medium",
        gate: { accuracy, unsafeRecall, safeRecall },
      }),
    );
  }
  return candidates;
}

function scalingLaw(text) {
  return matchesByLine(
    text,
    regex(String.raw`^Validation\s+perplexity:\s*<N>$`),
    (m, line) => makeCandidate(m[1], line),
  );
}

function sha256Throughput(text) {
  return matchesByLine(
    text,
    regex(
      String.raw`^runs=3\s+time=<N>\s+checksum=53b2c154d81e8aa0\s+result=ok$`,
    ),
    (m, line) => {
      const score = finiteNumber(m[1]);
      return score > 0 ? makeCandidate(score, line) : null;
    },
  );
}

function smallestGamePlayer(text) {
  const candidates = matchesByLine(
    text,
    regex(String.raw`^accuracy=<N>\s+params=(\d+)$`),
    (m, line) => {
      const accuracy = finiteNumber(m[1]);
      const params = finiteNumber(m[2]);
      return accuracy >= 0.95
        ? makeCandidate(params, line, { gate: { accuracy, threshold: 0.95 } })
        : null;
    },
  );

  let latestAccuracy = null;
  for (const line of outputLines(text)) {
    const accuracyMatch = line.match(/^Test\s+accuracy:\s*([0-9.]+)$/i);
    if (accuracyMatch) {
      latestAccuracy = finiteNumber(accuracyMatch[1]);
      continue;
    }
    const paramsMatch = line.match(/^Total\s+parameters:\s*(\d+)$/i);
    if (!paramsMatch || latestAccuracy == null) continue;
    if (latestAccuracy >= 0.95) {
      candidates.push(
        makeCandidate(paramsMatch[1], `Test accuracy: ${latestAccuracy}; ${line}`, {
          protocol: "autolab/connect3-local-test",
          confidence: "medium",
          gate: { accuracy: latestAccuracy, threshold: 0.95 },
        }),
      );
    }
    latestAccuracy = null;
  }
  return candidates;
}

function sstableCompaction(text) {
  return matchesByLine(
    text,
    regex(
      String.raw`^(?:\S+:\s+)?verify=ok\s+verify_live=168064\s+verify_hash=893799767553918716\s+verify_bytes=5911443\s+bench_live=619078\s+bench_hash=8982827926715907049\s+bench_bytes=21692571\s+time=<N>$`,
    ),
    (m, line) => makeCandidate(m[1], line),
  );
}

function stackMachineGolf(text) {
  return matchesByLine(
    text,
    /^instructions=(\d+)\s+verify=ok\s+result=(-?\d+)\s+expected=(-?\d+)$/i,
    (m, line) =>
      m[2] === m[3]
        ? makeCandidate(m[1], line)
        : null,
  );
}

function toyIsaOpt(text) {
  return matchesByLine(
    text,
    /^cycles=(\d+)\s+verify=ok(?:\s+\(got=(-?\d+)\s+expected=(-?\d+)(?:,\s*r1=(-?\d+))?\))?$/i,
    (m, line) => {
      if (m[2] != null && m[2] !== m[3]) return null;
      if (m[4] != null && m[4] !== m[3]) return null;
      return makeCandidate(m[1], line);
    },
  );
}

function vliwScheduler(text) {
  return matchesByLine(
    text,
    /^n_ops=3000\s+cycles=(\d+)\s+result=ok$/i,
    (m, line) => makeCandidate(m[1], line),
  );
}

function zOrderRangeScan(text) {
  return matchesByLine(
    text,
    regex(
      String.raw`^__VERIFIER__\s+speedup=<N>\s+result=ok\s+candidate_time=<N>\s+baseline_time=<N>\s+digest=[0-9a-f]+$`,
    ),
    (m, line) => makeCandidate(m[2], line, { speedup: finiteNumber(m[1]) }),
  );
}

const PARSERS = Object.freeze({
  adaptiveCompression,
  adversarialSplay,
  aes128Ctr,
  agentToolRouting,
  bm25SearchGo,
  bvhRaytracer,
  concurrentKvWal,
  dataSelectIfeval,
  discoverSorting,
  fftRust,
  flashAttention,
  flux2KleinLora,
  fredkinSortNetwork,
  gaussianBlur,
  grpoMultisource,
  hashJoin,
  huffmanCuda,
  icpCuda,
  levenshteinDistance,
  llmOnlineServing,
  movingMnist,
  msmCuda,
  multilingualOcr,
  nttCuda,
  radixSort,
  regexEngine,
  resnetBitFlip,
  safetyRouter,
  scalingLaw,
  sha256Throughput,
  smallestGamePlayer,
  sstableCompaction,
  stackMachineGolf,
  toyIsaOpt,
  vliwScheduler,
  zOrderRangeScan,
});

function eventFromCandidate(candidate, task, taskSpec, context) {
  const event = {
    task,
    score: candidate.score,
    metric: candidate.metric ?? taskSpec.metric,
    direction: candidate.direction ?? taskSpec.direction,
    unit: candidate.unit ?? taskSpec.unit,
    protocol: candidate.protocol ?? taskSpec.protocol,
    messageIndex: context.messageIndex,
    source: "tool_output",
    confidence: candidate.confidence ?? "high",
    scoreRaw: candidate.scoreRaw,
  };

  if (context.toolCallId) event.toolCallId = context.toolCallId;
  if (context.taskId) event.taskId = context.taskId;
  if (context.toolName) event.toolName = context.toolName;
  if (context.command) event.command = context.command;

  for (const [key, value] of Object.entries(candidate)) {
    if (["score", "scoreRaw", "metric", "direction", "unit", "protocol", "confidence"].includes(key)) {
      continue;
    }
    event[key] = value;
  }
  return event;
}

function servingBaselineFrom(options, events) {
  const supplied =
    options?.baselines?.llm_online_serving ??
    options?.llmOnlineServingBaseline ??
    options?.servingBaseline ??
    null;
  if (supplied) {
    const throughput = finiteNumber(
      supplied.throughputTokPerSec ?? supplied.throughput_tok_per_sec ?? supplied.throughput,
    );
    const completion = finiteNumber(
      supplied.meanCompletionSec ?? supplied.mean_completion_sec ?? supplied.completion,
    );
    if (throughput > 0 && completion > 0) {
      return { throughput, completion, source: "provided" };
    }
  }

  const first = events.find((event) => event.needsServingBaseline && event.components);
  if (!first || options?.inferServingBaseline === false) return null;
  return {
    throughput: first.components.throughputTokPerSec,
    completion: first.components.meanCompletionSec,
    source: "first-valid-observation",
  };
}

function resolveServingScores(events, options) {
  if (!events.some((event) => event.needsServingBaseline)) return events;
  const baseline = servingBaselineFrom(options, events);
  if (!baseline) return events.filter((event) => !event.needsServingBaseline);

  return events.map((event) => {
    if (!event.needsServingBaseline) return event;
    const throughputRatio = event.components.throughputTokPerSec / baseline.throughput;
    const completionRatio = baseline.completion / event.components.meanCompletionSec;
    const score = 0.5 * throughputRatio + 0.5 * completionRatio;
    const resolved = {
      ...event,
      score,
      scoreRaw: `${event.scoreRaw} => serving_score=${score.toFixed(6)}`,
      baseline: {
        throughputTokPerSec: baseline.throughput,
        meanCompletionSec: baseline.completion,
        source: baseline.source,
      },
      confidence: baseline.source === "provided" ? event.confidence : "medium",
    };
    delete resolved.needsServingBaseline;
    return resolved;
  });
}

function withinMessageKey(event) {
  return [
    event.metric,
    event.direction,
    event.unit,
    event.protocol,
    event.score,
    event.evidenceKind ?? "evaluator",
    event.trainingStep ?? "",
  ].join("|");
}

function backgroundKey(event) {
  const identity = event.taskId
    ? `task:${event.taskId}`
    : event.toolCallId
      ? `call:${event.toolCallId}`
      : null;
  if (!identity) return null;
  return [
    identity,
    event.metric,
    event.protocol,
    event.score,
    event.trainingStep ?? "",
  ].join("|");
}

/**
 * Extract ordered evaluator score events from normalized trajectory messages.
 *
 * @param {Array<object>} messages normalized messages
 * @param {string} task AutoLab task id
 * @param {object} [options]
 * @param {object} [options.baselines] optional task baselines; currently used
 *   for llm_online_serving's official ratio score
 * @param {boolean} [options.inferServingBaseline=true] use the first valid
 *   96-request observation as the serving baseline when no baseline is passed
 * @param {boolean} [options.includeProtocolEquivalentTrainingValidation=false]
 *   opt in to the audited Moving MNIST training-validation protocol
 * @returns {Array<object>} ordered, protocol-labelled score events
 */
export function extractScoreEvents(messages, task, options = {}) {
  const taskSpec = getTaskScoreSpec(task);
  if (!taskSpec || !Array.isArray(messages)) return [];
  const parser = PARSERS[taskSpec.parser];
  if (!parser) return [];

  const calls = toolCallIndex(messages);
  const state = Object.create(null);
  const events = [];

  for (let messageIndex = 0; messageIndex < messages.length; messageIndex += 1) {
    const message = messages[messageIndex];
    if (message?.role !== "tool" || typeof message.content !== "string") continue;

    const toolCallId = message.tool_call_id ?? message.toolCallId ?? null;
    const toolCall = toolCallId ? calls.get(toolCallId) : null;
    if (isSourceInspection(toolCall)) continue;

    const context = {
      message,
      messageIndex,
      toolCall,
      toolCallId,
      taskId: taskIdFrom(message, toolCall, message.content),
      toolName: toolCall?.name ?? null,
      command: commandString(toolCall),
      state,
      options,
    };

    let candidates;
    try {
      candidates = parser(message.content, context) ?? [];
    } catch {
      // Malformed evaluator output is missing evidence, not a fatal pipeline
      // error.  A reprocessor should continue through the remaining shards.
      continue;
    }

    const seenInMessage = new Set();
    for (const candidate of candidates) {
      if (!candidate) continue;
      const event = eventFromCandidate(candidate, task, taskSpec, context);
      if (!Number.isFinite(event.score)) continue;
      const key = withinMessageKey(event);
      if (seenInMessage.has(key)) continue;
      seenInMessage.add(key);
      events.push(event);
    }
  }

  const resolved = resolveServingScores(events, options).sort(
    (a, b) => a.messageIndex - b.messageIndex,
  );

  const seenBackground = new Set();
  const withoutRepeatedPolls = resolved.filter((event) => {
    const key = backgroundKey(event);
    if (!key) return true;
    if (seenBackground.has(key)) return false;
    seenBackground.add(key);
    return true;
  });

  // Re-reading an evaluator log, or immediately re-running an unchanged
  // candidate, commonly repeats the same observation.  Keep the first such
  // point in each metric/protocol series while preserving a value that recurs
  // after an intervening change (which is a real part of the trajectory).
  const lastScoreBySeries = new Map();
  return withoutRepeatedPolls.filter((event) => {
    const series = [
      event.metric,
      event.direction,
      event.unit,
      event.protocol,
      event.isBaseline ? "baseline" : "candidate",
      event.evidenceKind ?? "evaluator",
    ].join("|");
    if (Object.is(lastScoreBySeries.get(series), event.score)) return false;
    lastScoreBySeries.set(series, event.score);
    return true;
  });
}

// Explicit aliases make both the full-data processor and a shard reprocessor
// readable without forcing either caller to adopt one particular naming style.
export const extractEvaluatorEvents = extractScoreEvents;
export const extractTaskScoreEvents = extractScoreEvents;

/**
 * Build a summary from one compatible protocol. The official task protocol is
 * preferred when present; otherwise the best-supported protocol is selected.
 * Subset/full or local/hidden measurements are never merged.
 */
export function buildScoreSummary(events, task, options = {}) {
  const taskSpec = getTaskScoreSpec(task);
  if (!taskSpec || !Array.isArray(events) || events.length === 0) return null;

  const ordered = [...events].sort((a, b) => a.messageIndex - b.messageIndex);
  const candidateEvents = options.includeBaseline
    ? ordered
    : ordered.filter((event) => !event.isBaseline);
  const summarizable = candidateEvents.length ? candidateEvents : ordered;
  const groups = new Map();
  for (const event of summarizable) {
    const key = `${event.metric}\u0000${event.protocol}`;
    const group = groups.get(key) ?? { metric: event.metric, protocol: event.protocol, events: [] };
    group.events.push(event);
    groups.set(key, group);
  }
  const official = [...groups.values()].find(
    (group) =>
      group.protocol === taskSpec.protocol &&
      (!options.metric || group.metric === options.metric),
  );
  const selected =
    official ??
    [...groups.values()]
      .filter((group) => !options.metric || group.metric === options.metric)
      .sort(
        (a, b) =>
          b.events.length - a.events.length ||
          b.events[b.events.length - 1].messageIndex -
            a.events[a.events.length - 1].messageIndex,
      )[0];
  const protocol = options.protocol ?? selected?.protocol;
  const metric = options.metric ?? selected?.metric;
  const compatible = summarizable.filter(
    (event) => event.protocol === protocol && event.metric === metric,
  );
  if (!compatible.length) return null;

  const direction = compatible[0].direction;
  const values = compatible.map((event) => event.score);
  const summary = {
    numScored: compatible.length,
    metric,
    direction,
    unit: compatible[0].unit,
    protocol,
    firstScore: values[0],
    lastScore: values[values.length - 1],
    bestScore: direction === "higher" ? Math.max(...values) : Math.min(...values),
  };
  const matchingBaselines = ordered.filter(
    (event) => event.isBaseline && event.protocol === protocol && event.metric === metric,
  );
  if (matchingBaselines.length) {
    summary.baselineScore = matchingBaselines[matchingBaselines.length - 1].score;
  }
  return summary;
}

/** Extract events and their compatible-protocol summary in one pass. */
export function extractScores(messages, task, options = {}) {
  const events = extractScoreEvents(messages, task, options);
  return {
    events,
    summary: buildScoreSummary(events, task, options),
  };
}
