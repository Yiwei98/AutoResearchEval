#!/usr/bin/env node
// Rebuild evaluator events, compatible score curves, summaries, and official
// AutoLab categories for the frozen 35-trajectory showcase. This is the normal
// path when the source JSONL is not present in a fresh clone. If older builds
// still contain all 756 shards, this command also prunes them to the showcase.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AUTOLAB_TASK_CATEGORY } from "../lib/autolab-tasks.mjs";
import {
  TRAJECTORY_SHOWCASE_IDS,
  TRAJECTORY_SHOWCASE_TASKS,
} from "../lib/trajectory-showcase.mjs";
import { buildTrajectoryEvaluation } from "./lib/trajectory-processing.mjs";
import { sanitizeTrajectoryMessages } from "./lib/trajectory-sanitization.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const INDEX_PATH = path.join(DATA_DIR, "index.json");
const TRAJECTORY_DIR = path.join(DATA_DIR, "trajectories");

function removeIfPresent(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function main() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  const indexById = new Map();
  for (const entry of index) {
    if (indexById.has(entry.id)) throw new Error(`Duplicate index ID: ${entry.id}`);
    indexById.set(entry.id, entry);
  }
  const expectedById = new Map(
    TRAJECTORY_SHOWCASE_TASKS.flatMap((task) =>
      task.trajectories.map((trajectory) => [
        trajectory.id,
        {
          task: task.task,
          syntheticModel: trajectory.syntheticModel,
          protocolEquivalentTrainingValidation:
            trajectory.protocolEquivalentTrainingValidation === true,
        },
      ]),
    ),
  );
  const missing = TRAJECTORY_SHOWCASE_IDS.filter((id) => !indexById.has(id));
  if (missing.length > 0) {
    throw new Error(`Missing showcase trajectories from index: ${missing.join(", ")}`);
  }

  const tempDir = path.join(DATA_DIR, `.trajectories-reprocess-${process.pid}`);
  const backupDir = path.join(DATA_DIR, `.trajectories-backup-${process.pid}`);
  const tempIndex = path.join(DATA_DIR, `.index-reprocess-${process.pid}.json`);
  removeIfPresent(tempDir);
  removeIfPresent(backupDir);
  fs.mkdirSync(tempDir, { recursive: true });

  const nextIndex = [];
  const coverage = new Map();
  let swapped = false;

  try {
    for (let position = 0; position < TRAJECTORY_SHOWCASE_IDS.length; position += 1) {
      const id = TRAJECTORY_SHOWCASE_IDS[position];
      const entry = indexById.get(id);
      const expected = expectedById.get(id);
      const shardPath = path.join(TRAJECTORY_DIR, `${entry.id}.json`);
      if (!fs.existsSync(shardPath)) throw new Error(`${entry.id}: missing trajectory shard`);
      const trajectory = JSON.parse(fs.readFileSync(shardPath, "utf8"));
      if (trajectory.task !== expected.task) {
        throw new Error(
          `${entry.id}: expected task ${expected.task}; found ${trajectory.task}`,
        );
      }
      if (trajectory.synthetic !== expected.syntheticModel) {
        throw new Error(
          `${entry.id}: expected model ${expected.syntheticModel}; found ${trajectory.synthetic}`,
        );
      }
      const category = AUTOLAB_TASK_CATEGORY[trajectory.task];
      if (!category) throw new Error(`Unknown AutoLab task: ${trajectory.task}`);

      const { messages } = sanitizeTrajectoryMessages(trajectory.messages, {
        task: trajectory.task,
      });
      const { evaluationEvents, improvementRounds, summary } =
        buildTrajectoryEvaluation(messages, trajectory.task, {
          includeProtocolEquivalentTrainingValidation:
            expected.protocolEquivalentTrainingValidation,
        });
      const hasScores = (summary?.numScored ?? 0) >= 2;

      const nextTrajectory = {
        ...trajectory,
        category,
        rounds: messages.length,
        evaluationEvents,
        improvementRounds,
        summary,
        messages,
      };
      fs.writeFileSync(
        path.join(tempDir, `${entry.id}.json`),
        JSON.stringify(nextTrajectory),
      );

      nextIndex.push({
        ...entry,
        category,
        numRounds: improvementRounds.length,
        hasScores,
      });

      const stat = coverage.get(trajectory.task) ?? {
        category,
        trajectories: 0,
        curves: 0,
        events: 0,
      };
      stat.trajectories += 1;
      stat.curves += Number(hasScores);
      stat.events += evaluationEvents.length;
      coverage.set(trajectory.task, stat);

      if ((position + 1) % 10 === 0) {
        console.log(
          `  reprocessed ${position + 1}/${TRAJECTORY_SHOWCASE_IDS.length}`,
        );
      }
    }

    if (nextIndex.length !== TRAJECTORY_SHOWCASE_IDS.length) {
      throw new Error(
        `Expected ${TRAJECTORY_SHOWCASE_IDS.length} showcase entries; found ${nextIndex.length}`,
      );
    }
    fs.writeFileSync(tempIndex, JSON.stringify(nextIndex));

    // Swap the fully written dataset into place only after every shard parses.
    fs.renameSync(TRAJECTORY_DIR, backupDir);
    fs.renameSync(tempDir, TRAJECTORY_DIR);
    swapped = true;
    fs.renameSync(tempIndex, INDEX_PATH);
    swapped = false;
    removeIfPresent(backupDir);
  } catch (error) {
    removeIfPresent(tempDir);
    removeIfPresent(tempIndex);
    if (swapped && fs.existsSync(backupDir)) {
      const failedDir = path.join(DATA_DIR, `.trajectories-failed-${process.pid}`);
      if (fs.existsSync(TRAJECTORY_DIR)) fs.renameSync(TRAJECTORY_DIR, failedDir);
      fs.renameSync(backupDir, TRAJECTORY_DIR);
      removeIfPresent(failedDir);
    } else if (!fs.existsSync(TRAJECTORY_DIR) && fs.existsSync(backupDir)) {
      fs.renameSync(backupDir, TRAJECTORY_DIR);
    }
    throw error;
  }

  const curveCount = nextIndex.filter((entry) => entry.hasScores).length;
  console.log(`\nReprocessed ${nextIndex.length} trajectories; ${curveCount} have curves.`);
  for (const [task, stat] of [...coverage].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(
      `  ${task}: ${stat.curves}/${stat.trajectories} curves, ${stat.events} evaluator events`,
    );
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
