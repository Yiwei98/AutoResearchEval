#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildScoreSummary,
  extractScoreEvents,
  getTaskScoreSpec,
} from "./lib/score-extraction.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FIXTURE_PATH = path.join(
  ROOT,
  "scripts",
  "fixtures",
  "trajectory-score-messages.json",
);
const FIXTURES = new Map(
  JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8")).map((fixture) => [
    fixture.id,
    fixture,
  ]),
);

function trajectory(id) {
  const fixture = FIXTURES.get(id);
  assert.ok(fixture, `${id}: missing compact score-extraction fixture`);
  return fixture;
}

function extracted(task, id) {
  const data = trajectory(id);
  assert.equal(data.task, task, `${id} must remain a ${task} trajectory`);
  const events = extractScoreEvents(data.messages, task);
  for (const event of events) {
    assert.equal(event.source, "tool_output", `${task}: only tool output is evidence`);
    assert.equal(data.messages[event.messageIndex]?.role, "tool", `${task}: invalid source role`);
    assert.ok(Number.isFinite(event.score), `${task}: score must be finite`);
    assert.ok(event.protocol, `${task}: every event needs a protocol`);
  }
  return { data, events, summary: buildScoreSummary(events, task) };
}

function values(events, protocol) {
  return events.filter((event) => event.protocol === protocol).map((event) => event.score);
}

function includesApprox(items, expected, label, epsilon = 1e-9) {
  assert.ok(
    items.some((value) => Math.abs(value - expected) <= epsilon),
    `${label}: expected ${expected}; got ${items.join(", ")}`,
  );
}

function excludesApprox(items, rejected, label, epsilon = 1e-9) {
  assert.ok(
    !items.some((value) => Math.abs(value - rejected) <= epsilon),
    `${label}: rejected value ${rejected} was extracted`,
  );
}

function assertSummary(summary, expected, label) {
  assert.ok(summary, `${label}: expected a summary`);
  for (const [key, value] of Object.entries(expected)) {
    if (typeof value === "number") {
      assert.ok(Math.abs(summary[key] - value) <= 1e-9, `${label}: ${key} mismatch`);
    } else {
      assert.equal(summary[key], value, `${label}: ${key} mismatch`);
    }
  }
}

const adaptiveSpec = getTaskScoreSpec("adaptive_compression");
assert.deepEqual(
  {
    metric: adaptiveSpec.metric,
    direction: adaptiveSpec.direction,
    unit: adaptiveSpec.unit,
    protocol: adaptiveSpec.protocol,
  },
  {
    metric: "overall_bpb",
    direction: "lower",
    unit: "bits/byte",
    protocol: "autolab/full-suite-9x34830",
  },
  "adaptive_compression must follow the official AutoLab metric",
);

{
  const { events, summary } = extracted(
    "data_select_ifeval",
    "e65143ff-1cef-4f0f-9c4d-f6d2a069c0ab",
  );
  const full = values(events, "autolab/ifeval-full");
  includesApprox(full, 0.4307, "IFEval full score");
  includesApprox(full, 0.4603, "IFEval best score");
  includesApprox(full, 0.4196, "IFEval final score");
  excludesApprox(full, 0.4732, "IFEval base-model baseline");
  includesApprox(values(events, "autolab/ifeval-base-full"), 0.4732, "IFEval baseline");
  assertSummary(
    summary,
    { protocol: "autolab/ifeval-full", firstScore: 0.4307, bestScore: 0.4603, lastScore: 0.4196 },
    "IFEval summary",
  );
}

{
  const { events, summary } = extracted(
    "flux2_klein_lora",
    "839447a4-0168-42a7-9c3d-b9cc3003a2c7",
  );
  const scores = values(events, "autolab/8-eval-prompts");
  for (const score of [0.8208, 0.8305, 0.786]) includesApprox(scores, score, "FLUX score");
  assert.equal(scores.filter((score) => score === 0.7383).length, 1, "FLUX log reread must deduplicate");
  assertSummary(summary, { firstScore: 0.8208, bestScore: 0.8305, lastScore: 0.786 }, "FLUX summary");
}

{
  const { events, summary } = extracted(
    "multilingual_ocr",
    "5b1902a5-3aaa-4937-8b94-6a7dbcfa4406",
  );
  const full = values(events, "autolab/ocr-400-images");
  for (const score of [0.4749, 0.3256, 0.3837, 0.2779, 0.2355]) {
    includesApprox(full, score, "OCR full evaluation");
  }
  for (const score of [1.2354, 0.6411, 0.63, 1.6839]) {
    excludesApprox(full, score, "OCR subset evaluation");
  }
  assertSummary(summary, { firstScore: 0.4749, bestScore: 0.2355, lastScore: 0.2355 }, "OCR summary");
}

for (const test of [
  {
    task: "aes128_ctr",
    id: "9d2cff4c-cbda-41a0-8d26-f877f2f9327c",
    protocol: "autolab/256MiB-median-5",
    expected: [4.725004, 0.013976, 0.014169],
    rejected: [0],
    summary: { firstScore: 4.725004, bestScore: 0.013976, lastScore: 0.014169 },
  },
  {
    task: "bm25_search_go",
    id: "a060c1a4-008e-4eb8-b897-cfcc2ff3e677",
    protocol: "autolab/40-queries-400-hits",
    expected: [2.927877, 0.029966, 0.030952],
    rejected: [0],
    summary: { firstScore: 2.927877, bestScore: 0.029966, lastScore: 0.030952 },
  },
  {
    task: "gaussian_blur",
    id: "797b7499-636c-4836-8083-8e854a60c141",
    protocol: "autolab/4096x4096-17x17-5-passes",
    expected: [3.793224, 0.18095],
    rejected: [0.357731],
  },
  {
    task: "adaptive_compression",
    id: "52452209-049c-4cc1-9713-cd77718b6e01",
    protocol: "autolab/full-suite-9x34830",
    expected: [5.34, 3.99],
    summary: { firstScore: 5.34, bestScore: 3.99, lastScore: 3.99 },
  },
  {
    task: "resnet_bit_flip",
    id: "84886c4f-d62d-404c-ba9e-695787c41936",
    protocol: "autolab/cifar10-10000-images",
    expected: [95, 3],
    rejected: [2],
    summary: { firstScore: 95, bestScore: 3, lastScore: 3 },
  },
  {
    task: "vliw_scheduler",
    id: "134faa06-46ce-4cb4-9db6-f7592dc6b87b",
    protocol: "autolab/3000-ops",
    expected: [4080, 1800, 1250, 1200],
    rejected: [1362],
  },
  {
    task: "toy_isa_opt",
    id: "245e695c-0042-4ba0-8e4f-7e0f740c32ba",
    protocol: "autolab/pinc-512-dot-product",
    expected: [9220, 1545],
    rejected: [1544, 1537, 1535],
  },
  {
    task: "ntt_butterfly_cuda",
    id: "f9bf3d79-9b6b-42c0-9f4c-7910b0b3a62b",
    protocol: "autolab/cuda-batch256-n65536",
    expected: [110.591843, 5.534432, 5.692448],
    summary: { firstScore: 110.591843, bestScore: 5.534432, lastScore: 5.692448 },
  },
  {
    task: "huffman_canonical_decode_cuda",
    id: "f15ac000-57cd-4395-b3bc-c795c089cf14",
    protocol: "autolab/cuda-K2048-bpe65536",
    expected: [58.562401, 14.345184, 14.362848],
    summary: { firstScore: 58.562401, bestScore: 14.345184, lastScore: 14.362848 },
  },
  {
    task: "icp_correspondence_step_cuda",
    id: "72d2550f-d90a-4bde-a720-c8f74b071b28",
    protocol: "autolab/cuda-N200000-M500000",
    expected: [64.65757, 0.22272, 0.23168],
    summary: { firstScore: 64.65757, bestScore: 0.22272, lastScore: 0.23168 },
  },
]) {
  const { events, summary } = extracted(test.task, test.id);
  const scores = values(events, test.protocol);
  for (const score of test.expected) includesApprox(scores, score, `${test.task} score`);
  for (const score of test.rejected ?? []) excludesApprox(scores, score, `${test.task} rejected score`);
  if (test.summary) assertSummary(summary, test.summary, `${test.task} summary`);
}

{
  const { events } = extracted(
    "huffman_canonical_decode_cuda",
    "df92108a-dd05-4841-9c78-682921264d76",
  );
  assert.equal(events.length, 0, "source code containing printf formats is not evaluator evidence");
}

assert.equal(
  extractScoreEvents(
    [{ role: "assistant", content: "result=ok time_ms=0.001 batch=256 n=65536" }],
    "ntt_butterfly_cuda",
  ).length,
  0,
  "assistant prose must never become a score event",
);

assert.equal(
  extractScoreEvents(
    [
      {
        role: "assistant",
        tool_calls: [{ id: "read-1", name: "Read", arguments: { file_path: "/app/main.cu" } }],
      },
      {
        role: "tool",
        tool_call_id: "read-1",
        content: 'printf("result=ok time_ms=0.001 batch=256 n=65536\\n");',
      },
    ],
    "ntt_butterfly_cuda",
  ).length,
  0,
  "source listings must never become score events",
);

{
  const internalValidationMessages = [
    {
      role: "assistant",
      tool_calls: [
        {
          id: "train-log",
          name: "Read",
          arguments: { file_path: "/tmp/trajectory/tasks/task-0007.output" },
        },
      ],
    },
    {
      role: "tool",
      tool_call_id: "train-log",
      content: [
        "Step    500 | loss 0.01260 | train PSNR 19.00 dB",
        "  >> val MSE 0.03193 | val PSNR 14.96 dB (best 15.12 dB)",
        "Step   3000 | loss 0.02557 | train PSNR 15.92 dB",
        "  >> val MSE 0.02802 | val PSNR 15.53 dB (best 15.40 dB)",
      ].join("\n"),
    },
    {
      role: "assistant",
      tool_calls: [
        {
          id: "local-eval",
          name: "Bash",
          arguments: { command: "python3 /workspace/moving_mnist_world_model/app/evaluate_local.py" },
        },
      ],
    },
    {
      role: "tool",
      tool_call_id: "local-eval",
      content: "Val MSE:  0.03572\nVal PSNR: 14.47 dB",
    },
  ];
  assert.equal(
    extractScoreEvents(internalValidationMessages, "moving_mnist_world_model").length,
    1,
    "training validation must remain opt-in",
  );
  const restored = extractScoreEvents(
    internalValidationMessages,
    "moving_mnist_world_model",
    { includeProtocolEquivalentTrainingValidation: true },
  );
  assert.deepEqual(
    restored.map((event) => event.score),
    [15.53, 14.47],
    "opt-in extraction must retain the best newly visible training checkpoint and local recheck",
  );
  assert.equal(
    restored[0].evidenceKind,
    "protocol-equivalent-training-validation",
  );
  assert.equal(restored[0].trainingStep, 3000);
}

console.log(
  "Trajectory score extraction fixtures passed (14 compact real-output fixtures + synthetic protocol and negative checks).",
);
