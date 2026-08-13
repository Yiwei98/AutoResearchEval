#!/usr/bin/env node
// Extracts the frozen trajectory showcase from the large AutoLab JSONL:
//   public/data/index.json                 — the 35 showcase trajectories
//   public/data/trajectories/<id>.json     — one shard per showcase trajectory
//
// Run with: npm run process-data
// Re-run whenever data/raw/autolab_docent_all.jsonl changes.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { AUTOLAB_TASK_CATEGORY as TASK_CATEGORY } from "../lib/autolab-tasks.mjs";
import {
  TRAJECTORY_SHOWCASE_IDS,
  TRAJECTORY_SHOWCASE_TASKS,
} from "../lib/trajectory-showcase.mjs";
import { buildTrajectoryEvaluation } from "./lib/trajectory-processing.mjs";
import { sanitizeTrajectoryMessages } from "./lib/trajectory-sanitization.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const RAW = path.join(ROOT, "data", "raw", "autolab_docent_all.jsonl");
const OUT_DIR = path.join(ROOT, "public", "data");
const TRAJ_DIR = path.join(OUT_DIR, "trajectories");

const EXPECTED_BY_ID = new Map(
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

function removeIfPresent(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function normalizeMessages(messages) {
  // Keep only the fields the viewer needs, in order.
  return (messages || []).map((m) => {
    const out = { role: m.role };
    if (m.content != null && String(m.content).length > 0) out.content = String(m.content);
    if (Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
      out.tool_calls = m.tool_calls.map((tc) => ({
        id: tc.id,
        name: tc.function?.name ?? tc.name ?? "tool",
        arguments: tc.function?.arguments ?? tc.arguments ?? {},
      }));
    }
    if (m.tool_call_id) out.tool_call_id = m.tool_call_id;
    return out;
  });
}

async function main() {
  if (!fs.existsSync(RAW)) {
    console.error(`Raw file not found: ${RAW}`);
    console.error("Place autolab_docent_all.jsonl in data/raw/ and re-run.");
    process.exit(1);
  }

  const tempDir = path.join(OUT_DIR, `.trajectories-process-${process.pid}`);
  const backupDir = path.join(OUT_DIR, `.trajectories-backup-${process.pid}`);
  const tempIndex = path.join(OUT_DIR, `.index-process-${process.pid}.json`);
  removeIfPresent(tempDir);
  removeIfPresent(backupDir);
  fs.mkdirSync(tempDir, { recursive: true });

  const rl = readline.createInterface({
    input: fs.createReadStream(RAW, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const index = [];
  const seen = new Set();
  let sourceCount = 0;
  let skipped = 0;
  let swapped = false;

  try {
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let rec;
      try {
        rec = JSON.parse(trimmed);
      } catch {
        skipped++;
        continue;
      }
      sourceCount += 1;

      const id = rec.id;
      const expected = EXPECTED_BY_ID.get(id);
      if (!expected) continue;
      if (seen.has(id)) throw new Error(`Duplicate showcase trajectory in source: ${id}`);

      const task = rec.special_ability || rec.autolab_meta?.task || "unknown";
      const synthetic = rec.synthetic_model || "";
      if (task !== expected.task) {
        throw new Error(`${id}: expected task ${expected.task}; found ${task}`);
      }
      if (synthetic !== expected.syntheticModel) {
        throw new Error(
          `${id}: expected model ${expected.syntheticModel}; found ${synthetic}`,
        );
      }

      const owner = rec.owner || rec.autolab_meta?.model || "";
      const seed =
        rec.tag || (rec.autolab_meta?.seed ? `seed-${rec.autolab_meta.seed}` : "");
      const normalizedMessages = normalizeMessages(rec.messages);
      const { messages } = sanitizeTrajectoryMessages(normalizedMessages, { task });
      const category = TASK_CATEGORY[task] || "unknown";

      const rounds = messages.length;

      // Evaluator observations are the source of truth. Git commits are used only
      // to annotate the nearest measured checkpoint.
      const { evaluationEvents, improvementRounds, summary } =
        buildTrajectoryEvaluation(messages, task, {
          includeProtocolEquivalentTrainingValidation:
            expected.protocolEquivalentTrainingValidation,
        });

      index.push({
        id,
        task,
        category,
        synthetic,
        owner,
        seed,
        rounds,
        numRounds: improvementRounds.length,
        hasScores: (summary?.numScored ?? 0) >= 2,
      });

      const full = {
        id,
        task,
        category,
        synthetic,
        owner,
        seed,
        rounds,
        evaluationEvents,
        improvementRounds,
        summary,
        messages,
      };
      fs.writeFileSync(path.join(tempDir, `${id}.json`), JSON.stringify(full));
      seen.add(id);

      if (seen.size % 10 === 0) {
        console.log(`  extracted ${seen.size}/${TRAJECTORY_SHOWCASE_IDS.length}`);
      }
    }

    const missing = TRAJECTORY_SHOWCASE_IDS.filter((id) => !seen.has(id));
    if (missing.length > 0) {
      throw new Error(`Missing showcase trajectories: ${missing.join(", ")}`);
    }

    const position = new Map(
      TRAJECTORY_SHOWCASE_IDS.map((id, indexPosition) => [id, indexPosition]),
    );
    index.sort((a, b) => position.get(a.id) - position.get(b.id));
    fs.writeFileSync(tempIndex, JSON.stringify(index));

    if (fs.existsSync(TRAJ_DIR)) fs.renameSync(TRAJ_DIR, backupDir);
    fs.renameSync(tempDir, TRAJ_DIR);
    swapped = true;
    fs.renameSync(tempIndex, path.join(OUT_DIR, "index.json"));
    swapped = false;
    removeIfPresent(backupDir);
  } catch (error) {
    removeIfPresent(tempDir);
    removeIfPresent(tempIndex);
    if (swapped && fs.existsSync(backupDir)) {
      const failedDir = path.join(OUT_DIR, `.trajectories-failed-${process.pid}`);
      if (fs.existsSync(TRAJ_DIR)) fs.renameSync(TRAJ_DIR, failedDir);
      fs.renameSync(backupDir, TRAJ_DIR);
      removeIfPresent(failedDir);
    } else if (!fs.existsSync(TRAJ_DIR) && fs.existsSync(backupDir)) {
      fs.renameSync(backupDir, TRAJ_DIR);
    }
    throw error;
  }

  console.log(`\nDone.`);
  console.log(`  source trajectories scanned: ${sourceCount}`);
  if (skipped) console.log(`  skipped (parse errors): ${skipped}`);
  console.log(`  showcase trajectories published: ${index.length}`);
  console.log(`  shards written to public/data/trajectories/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
