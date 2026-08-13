#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TRAJECTORY_SHOWCASE_IDS } from "../lib/trajectory-showcase.mjs";
import {
  findTrajectorySanitizationViolations,
  PROCESS_LISTING_REDACTION,
  sanitizeTrajectoryMessages,
} from "./lib/trajectory-sanitization.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TRAJECTORY_DIR = path.join(ROOT, "public", "data", "trajectories");
const SANITIZED_CALL_ID = /^call-\d{5}$/;
const SANITIZED_TASK_ID = /^task-\d{4}$/;

let processListingPlaceholders = 0;
let toolCallCount = 0;
let toolResultCount = 0;
const observedToolCallIds = new Set();

for (const id of TRAJECTORY_SHOWCASE_IDS) {
  const shardPath = path.join(TRAJECTORY_DIR, `${id}.json`);
  const trajectory = JSON.parse(fs.readFileSync(shardPath, "utf8"));
  const violations = findTrajectorySanitizationViolations(trajectory);
  assert.deepEqual(violations, [], `${id}: ${violations.join(", ")}`);

  const rerun = sanitizeTrajectoryMessages(trajectory.messages, {
    task: trajectory.task,
  }).messages;
  assert.deepEqual(rerun, trajectory.messages, `${id}: sanitization must be idempotent`);

  const trajectoryToolCallIds = new Set();
  const trajectoryToolResultIds = [];
  for (const [messageIndex, message] of trajectory.messages.entries()) {
    if (message.content === PROCESS_LISTING_REDACTION) {
      assert.equal(message.role, "tool", `${id}:${messageIndex}: redaction must be a tool result`);
      processListingPlaceholders += 1;
    }

    for (const toolCall of message.tool_calls ?? []) {
      assert.match(
        toolCall.id,
        SANITIZED_CALL_ID,
        `${id}:${messageIndex}: raw tool-call ID`,
      );
      trajectoryToolCallIds.add(toolCall.id);
      observedToolCallIds.add(`${id}:${toolCall.id}`);
      toolCallCount += 1;
      assertSanitizedTaskArguments(toolCall.arguments, `${id}:${messageIndex}`);
    }

    if (message.tool_call_id != null) {
      assert.match(
        message.tool_call_id,
        SANITIZED_CALL_ID,
        `${id}:${messageIndex}: raw tool-result ID`,
      );
      trajectoryToolResultIds.push(message.tool_call_id);
      toolResultCount += 1;
    }
  }

  for (const toolResultId of trajectoryToolResultIds) {
    assert.ok(
      trajectoryToolCallIds.has(toolResultId),
      `${id}: pseudonymous tool-result reference has no matching call`,
    );
  }

  for (const event of trajectory.evaluationEvents ?? []) {
    if (event.toolCallId != null) {
      assert.match(event.toolCallId, SANITIZED_CALL_ID, `${id}: raw evaluator call ID`);
      assert.ok(
        trajectoryToolCallIds.has(event.toolCallId),
        `${id}: evaluator reference has no matching call`,
      );
    }
    if (event.taskId != null && String(event.taskId).length >= 4) {
      assert.match(String(event.taskId), SANITIZED_TASK_ID, `${id}: raw evaluator task ID`);
    }
  }
  for (const round of trajectory.improvementRounds ?? []) {
    if (round.toolCallId != null) {
      assert.match(round.toolCallId, SANITIZED_CALL_ID, `${id}: raw checkpoint call ID`);
    }
    if (round.taskId != null && String(round.taskId).length >= 4) {
      assert.match(String(round.taskId), SANITIZED_TASK_ID, `${id}: raw checkpoint task ID`);
    }
  }
}

assert.equal(
  processListingPlaceholders,
  2,
  "The two internal process listings must remain as explicit redaction placeholders",
);
assert.ok(toolCallCount > 0, "Expected sanitized tool calls");
assert.ok(toolResultCount > 0, "Expected sanitized tool results");
assert.ok(observedToolCallIds.size > 0, "Expected stable pseudonymous call IDs");

console.log(
  `Trajectory sanitization passed: 35 shards, ${processListingPlaceholders} process-listing placeholders, ${observedToolCallIds.size.toLocaleString("en-US")} pseudonymous call IDs.`,
);

function assertSanitizedTaskArguments(value, context, key = "") {
  if (Array.isArray(value)) {
    for (const item of value) assertSanitizedTaskArguments(item, context, key);
    return;
  }
  if (!value || typeof value !== "object") {
    if ((key === "taskId" || key === "task_id") && String(value).length >= 4) {
      assert.match(String(value), SANITIZED_TASK_ID, `${context}: raw task ID`);
    }
    return;
  }
  for (const [childKey, childValue] of Object.entries(value)) {
    assertSanitizedTaskArguments(childValue, context, childKey);
  }
}
