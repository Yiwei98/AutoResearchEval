#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AUTOLAB_TASK_CATEGORY } from "../lib/autolab-tasks.mjs";
import {
  TRAJECTORY_SHOWCASE_IDS,
  TRAJECTORY_SHOWCASE_MODEL_ORDER,
  TRAJECTORY_SHOWCASE_TASKS,
} from "../lib/trajectory-showcase.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const TRAJECTORY_DIR = path.join(DATA_DIR, "trajectories");
const index = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "index.json"), "utf8"));

assert.equal(TRAJECTORY_SHOWCASE_TASKS.length, 5, "Showcase must define exactly five tasks");
assert.equal(TRAJECTORY_SHOWCASE_MODEL_ORDER.length, 7, "Showcase must define seven models");
assert.equal(TRAJECTORY_SHOWCASE_IDS.length, 35, "Showcase must freeze 35 trajectory IDs");
assert.equal(
  new Set(TRAJECTORY_SHOWCASE_IDS).size,
  35,
  "Frozen showcase trajectory IDs must be unique",
);
assert.equal(new Set(TRAJECTORY_SHOWCASE_TASKS.map((task) => task.slug)).size, 5);
assert.equal(new Set(TRAJECTORY_SHOWCASE_TASKS.map((task) => task.anchor)).size, 5);

const showcaseById = new Map(
  TRAJECTORY_SHOWCASE_TASKS.flatMap((task) =>
    task.trajectories.map((trajectory) => [trajectory.id, { task, trajectory }]),
  ),
);

assert.equal(index.length, 35, "Public trajectory index must contain only 35 showcase runs");
assert.deepEqual(
  index.map((entry) => entry.id),
  TRAJECTORY_SHOWCASE_IDS,
  "Public index must follow the frozen task/model showcase order",
);
assert.equal(new Set(index.map((entry) => entry.id)).size, 35, "Index IDs must be unique");

const shardFiles = fs
  .readdirSync(TRAJECTORY_DIR)
  .filter((name) => name.endsWith(".json"))
  .sort();
assert.deepEqual(
  shardFiles,
  TRAJECTORY_SHOWCASE_IDS.map((id) => `${id}.json`).sort(),
  "Public trajectory directory must contain exactly the 35 showcase shards",
);

const byTask = new Map();
const signaturesByTask = new Map();
const rewardSeriesByTask = new Map();
let curveCount = 0;

function autolabRewardForScore(score, scale) {
  if (!Number.isFinite(score)) return 0;
  if (scale.mustBeat != null && score >= scale.mustBeat) return 0;
  let reward = 0;
  if (scale.kind === "anchored-linear") {
    reward = (score - scale.baseline) / (scale.reference - scale.baseline);
  } else {
    assert.equal(scale.kind, "log-speedup", "Unknown reward scale");
    const speedup = score > 0 ? scale.baseline / score : 0;
    const referenceSpeedup = scale.baseline / scale.reference;
    reward =
      speedup > 1 && referenceSpeedup > 1
        ? (0.5 * Math.log(speedup)) / Math.log(referenceSpeedup)
        : 0;
  }
  return Number.isFinite(reward) ? Math.min(1, Math.max(0, reward)) : 0;
}

for (const entry of index) {
  const frozen = showcaseById.get(entry.id);
  assert.ok(frozen, `${entry.id}: index entry is outside the frozen showcase`);
  const { task: taskConfig, trajectory: trajectoryConfig } = frozen;
  const officialCategory = AUTOLAB_TASK_CATEGORY[entry.task];
  assert.ok(officialCategory, `Unknown AutoLab task ${entry.task}`);
  assert.equal(entry.task, taskConfig.task, `${entry.id}: incorrect showcase task`);
  assert.equal(entry.category, taskConfig.category, `${entry.id}: incorrect showcase category`);
  assert.equal(entry.category, officialCategory, `${entry.task}: incorrect official category`);
  assert.equal(
    entry.synthetic,
    trajectoryConfig.syntheticModel,
    `${entry.id}: incorrect showcase model`,
  );

  const taskEntries = byTask.get(entry.task) ?? [];
  taskEntries.push(entry);
  byTask.set(entry.task, taskEntries);

  const shardPath = path.join(TRAJECTORY_DIR, `${entry.id}.json`);
  const shard = JSON.parse(fs.readFileSync(shardPath, "utf8"));
  for (const key of ["id", "task", "category", "synthetic", "owner", "seed", "rounds"]) {
    assert.equal(shard[key], entry[key], `${entry.id}: shard/index ${key} mismatch`);
  }
  assert.equal(shard.rounds, shard.messages.length, `${entry.id}: message count mismatch`);
  assert.equal(
    shard.improvementRounds.length,
    entry.numRounds,
    `${entry.id}: evaluator-checkpoint count mismatch`,
  );

  const scored = shard.improvementRounds.filter((round) => round.score != null);
  assert.equal(scored.length, shard.improvementRounds.length, `${entry.id}: unscored point emitted`);
  assert.equal(entry.hasScores, scored.length >= 2, `${entry.id}: hasScores mismatch`);
  assert.equal(trajectoryConfig.kind, "curve", `${entry.id}: every showcase run must be a curve`);
  assert.ok(scored.length >= 2, `${entry.id}: showcase curve needs at least two checkpoints`);
  curveCount += 1;

  if (entry.id === "7ed28ba5-a64b-4905-9ba6-7612723b1501") {
    assert.equal(entry.task, "moving_mnist_world_model");
    assert.equal(entry.synthetic, "kimi-k2.7-code");
    assert.equal(entry.seed, "seed-2");
    assert.equal(entry.rounds, 674);
    const internalValidation = scored.filter(
      (point) =>
        point.evidenceKind === "protocol-equivalent-training-validation",
    );
    assert.ok(internalValidation.length >= 2, `${entry.id}: missing restored training validation`);
    assert.ok(
      internalValidation.every(
        (point) => Number.isInteger(point.trainingStep) && point.trainingStep >= 0,
      ),
      `${entry.id}: restored validation must retain its training step`,
    );
    assert.ok(
      internalValidation.some((point) => Math.abs(point.score - 15.53) < 1e-9),
      `${entry.id}: restored validation must include the 15.53 dB checkpoint`,
    );
    assert.ok(
      scored.some(
        (point) =>
          point.evidenceKind == null && Math.abs(point.score - 14.47) < 1e-9,
      ),
      `${entry.id}: independent local-evaluator recheck must remain present`,
    );
  }

  const summary = shard.summary;
  assert.ok(summary, `${entry.id}: showcase trajectory needs a score summary`);
  assert.equal(summary.numRounds, scored.length, `${entry.id}: numRounds mismatch`);
  assert.equal(summary.numScored, scored.length, `${entry.id}: numScored mismatch`);
  assert.equal(new Set(scored.map((point) => point.metric)).size, 1, `${entry.id}: mixed metrics`);
  assert.equal(new Set(scored.map((point) => point.protocol)).size, 1, `${entry.id}: mixed protocols`);
  assert.equal(new Set(scored.map((point) => point.direction)).size, 1, `${entry.id}: mixed directions`);
  assert.equal(summary.metric, taskConfig.metric.key, `${entry.id}: manifest metric mismatch`);
  assert.equal(summary.protocol, taskConfig.metric.protocol, `${entry.id}: manifest protocol mismatch`);
  assert.equal(summary.direction, taskConfig.metric.direction, `${entry.id}: manifest direction mismatch`);
  assert.equal(summary.unit, taskConfig.metric.unit, `${entry.id}: manifest unit mismatch`);
  assert.equal(summary.firstScore, scored[0].score, `${entry.id}: first score mismatch`);
  assert.equal(summary.lastScore, scored.at(-1).score, `${entry.id}: last score mismatch`);
  const values = scored.map((point) => point.score);
  const expectedBest =
    summary.direction === "higher" ? Math.max(...values) : Math.min(...values);
  assert.equal(summary.bestScore, expectedBest, `${entry.id}: best score mismatch`);

  const signature = `${summary.metric}\u0000${summary.direction}\u0000${summary.protocol}`;
  const signatures = signaturesByTask.get(entry.task) ?? new Set();
  signatures.add(signature);
  signaturesByTask.set(entry.task, signatures);

  const rewardSeries = rewardSeriesByTask.get(entry.task) ?? [];
  rewardSeries.push({
    id: entry.id,
    direction: summary.direction,
    scores: scored.map((point) => point.score),
  });
  rewardSeriesByTask.set(entry.task, rewardSeries);

  for (const point of scored) {
    assert.ok(Number.isFinite(point.score), `${entry.id}: non-finite score`);
    if (taskConfig.metric.yScale === "log") {
      assert.ok(point.score > 0, `${entry.id}: log-scale score must be positive`);
    }
    const reward = autolabRewardForScore(point.score, taskConfig.metric.reward);
    assert.ok(
      Number.isFinite(reward) && reward >= 0 && reward <= 1,
      `${entry.id}: invalid AutoLab reward`,
    );
    assert.ok(point.messageIndex >= 0 && point.messageIndex < shard.messages.length);
    assert.equal(
      shard.messages[point.messageIndex]?.role,
      "tool",
      `${entry.id}: score must point to a tool result`,
    );
    assert.equal(point.source, "tool_output", `${entry.id}: invalid score source`);
  }

  for (const event of shard.evaluationEvents ?? []) {
    assert.ok(Number.isFinite(event.score), `${entry.id}: invalid audit event score`);
    assert.equal(event.source, "tool_output", `${entry.id}: invalid audit event source`);
    assert.equal(
      shard.messages[event.messageIndex]?.role,
      "tool",
      `${entry.id}: audit event must point to tool output`,
    );
  }
}

assert.equal(byTask.size, 5, "Public dataset must contain exactly five showcase tasks");
for (const taskConfig of TRAJECTORY_SHOWCASE_TASKS) {
  const entries = byTask.get(taskConfig.task) ?? [];
  assert.equal(entries.length, 7, `${taskConfig.task}: expected one run per model`);
  assert.deepEqual(
    entries.map((entry) => entry.synthetic),
    TRAJECTORY_SHOWCASE_MODEL_ORDER,
    `${taskConfig.task}: model coverage/order mismatch`,
  );
  assert.equal(signaturesByTask.get(taskConfig.task)?.size, 1, `${taskConfig.task}: mixed curve contract`);
  assert.equal(taskConfig.evidenceNotes.length, 2, `${taskConfig.task}: expected two evidence notes`);
  assert.ok(taskConfig.timeBudgetHours > 0, `${taskConfig.task}: missing time budget`);
  assert.ok(taskConfig.metric.reward, `${taskConfig.task}: missing reward scale`);
  assert.ok(taskConfig.metric.reward.baseline > 0, `${taskConfig.task}: invalid reward baseline`);
  assert.ok(taskConfig.metric.reward.reference > 0, `${taskConfig.task}: invalid reward reference`);
  assert.equal(
    autolabRewardForScore(taskConfig.metric.reward.baseline, taskConfig.metric.reward),
    0,
    `${taskConfig.task}: baseline must map to zero reward`,
  );
  const expectedReferenceReward =
    taskConfig.metric.reward.kind === "anchored-linear" ? 1 : 0.5;
  assert.ok(
    Math.abs(
      autolabRewardForScore(taskConfig.metric.reward.reference, taskConfig.metric.reward) -
        expectedReferenceReward,
    ) < 1e-12,
    `${taskConfig.task}: reference reward mismatch`,
  );

  const taskSeries = rewardSeriesByTask.get(taskConfig.task) ?? [];
  const autolabRewards = taskSeries.flatMap((item) =>
    item.scores.map((score) => autolabRewardForScore(score, taskConfig.metric.reward)),
  );
  assert.ok(
    autolabRewards.every(
      (reward) => Number.isFinite(reward) && reward >= 0 && reward <= 1,
    ),
    `${taskConfig.task}: AutoLab rewards must lie in [0, 1]`,
  );
  assert.ok(Math.max(...autolabRewards) > 0, `${taskConfig.task}: expected a positive AutoLab reward`);

  for (const item of taskSeries) {
    let runningBest;
    let previousReward = -Infinity;
    for (const score of item.scores) {
      if (runningBest == null) {
        runningBest = score;
      } else if (
        (item.direction === "higher" && score > runningBest) ||
        (item.direction === "lower" && score < runningBest)
      ) {
        runningBest = score;
      }
      const reward = autolabRewardForScore(runningBest, taskConfig.metric.reward);
      assert.ok(
        reward + 1e-12 >= previousReward,
        `${item.id}: running-best AutoLab reward must be nondecreasing`,
      );
      previousReward = reward;
    }
  }
}

assert.equal(curveCount, 35, "Showcase must contain exactly 35 multi-checkpoint curves");

console.log(
  "Trajectory showcase integrity passed: 5 tasks × 7 models, all 35 runs have curves.",
);
