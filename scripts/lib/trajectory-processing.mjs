import {
  buildScoreSummary,
  extractScoreEvents,
} from "./score-extraction.mjs";

// Extract a git commit message from a shell command, including the heredoc form
// used by several agent harnesses.
export function extractCommitMessage(command) {
  if (!String(command).includes("git commit")) return null;

  const heredoc = String(command).match(
    /-m\s+"?\$\(cat\s+<<-?\s*['"]?\w+['"]?\s*\n([\s\S]*?)\n\s*\w+\s*\)/,
  );
  if (heredoc) return heredoc[1].split("\n")[0].trim();

  const quoted = String(command).match(/-m\s+(["'])((?:\\.|(?!\1).)*)\1/);
  if (quoted) return quoted[2].trim();

  const bare = String(command).match(/-m\s+([^\n|&]+)/);
  return bare ? bare[1].trim().replace(/^["']|["']$/g, "") : null;
}

function commandString(toolCall) {
  const args = toolCall?.arguments;
  if (typeof args === "string") return args;
  if (!args || typeof args !== "object") return "";
  return String(args.command ?? args.cmd ?? args.input ?? args.script ?? "");
}

function collectCommits(messages) {
  const commits = [];

  for (let messageIndex = 0; messageIndex < messages.length; messageIndex += 1) {
    const message = messages[messageIndex];
    if (message?.role !== "assistant" || !Array.isArray(message.tool_calls)) continue;

    for (const toolCall of message.tool_calls) {
      const commitMessage = extractCommitMessage(commandString(toolCall));
      if (!commitMessage) continue;
      const roundMatch = commitMessage.match(/round\s*(\d+)/i);
      const description = commitMessage
        .replace(/^round\s*\d+\s*[:\-–]\s*/i, "")
        .trim();
      commits.push({
        messageIndex,
        commitMessage,
        description: description || commitMessage,
        explicitRound: roundMatch ? Number.parseInt(roundMatch[1], 10) : null,
      });
    }
  }

  return commits;
}

function compactEvent(event) {
  const compact = {
    score: event.score,
    scoreRaw: event.scoreRaw,
    metric: event.metric,
    direction: event.direction,
    unit: event.unit,
    protocol: event.protocol,
    messageIndex: event.messageIndex,
    source: event.source,
    confidence: event.confidence,
  };

  for (const key of [
    "toolCallId",
    "taskId",
    "toolName",
    "gate",
    "components",
    "baseline",
    "isBaseline",
    "speedup",
    "evidenceKind",
    "trainingStep",
  ]) {
    if (event[key] != null) compact[key] = event[key];
  }
  return compact;
}

function nearestPriorCommit(commits, messageIndex) {
  let result = null;
  for (const commit of commits) {
    if (commit.messageIndex > messageIndex) break;
    result = commit;
  }
  return result;
}

/**
 * Convert evaluator observations into the legacy `improvementRounds` shape
 * consumed by the website.  Score events are the source of truth; commits only
 * supply an optional human-readable description.
 */
export function buildTrajectoryEvaluation(messages, task, options = {}) {
  const evaluationEvents = extractScoreEvents(messages, task, options);
  const scoreSummary = buildScoreSummary(evaluationEvents, task, options);

  if (!scoreSummary) {
    return {
      evaluationEvents: evaluationEvents.map(compactEvent),
      improvementRounds: [],
      summary: null,
    };
  }

  const comparableEvents = evaluationEvents.filter(
    (event) =>
      event.metric === scoreSummary.metric &&
      event.protocol === scoreSummary.protocol &&
      event.direction === scoreSummary.direction,
  );
  const commits = collectCommits(messages);
  let lastAnnotatedCommitIndex = null;
  const improvementRounds = comparableEvents.map((event, position) => {
    const commit = nearestPriorCommit(commits, event.messageIndex);
    const index = position + 1;
    const hasFreshCommit =
      commit != null && commit.messageIndex !== lastAnnotatedCommitIndex;
    if (hasFreshCommit) lastAnnotatedCommitIndex = commit.messageIndex;
    return {
      index,
      label: `Evaluation ${index}`,
      description: hasFreshCommit ? commit.description : `Evaluation ${index}`,
      ...(hasFreshCommit ? { commitMessage: commit.commitMessage } : {}),
      messageIndex: event.messageIndex,
      score: event.score,
      scoreRaw: event.scoreRaw,
      scoreMsgIndex: event.messageIndex,
      metric: event.metric,
      direction: event.direction,
      unit: event.unit,
      protocol: event.protocol,
      source: event.source,
      confidence: event.confidence,
      ...(event.toolCallId ? { toolCallId: event.toolCallId } : {}),
      ...(event.taskId ? { taskId: event.taskId } : {}),
      ...(event.gate ? { gate: event.gate } : {}),
      ...(event.evidenceKind ? { evidenceKind: event.evidenceKind } : {}),
      ...(event.trainingStep != null ? { trainingStep: event.trainingStep } : {}),
    };
  });

  return {
    evaluationEvents: evaluationEvents.map(compactEvent),
    improvementRounds,
    summary: {
      ...scoreSummary,
      numRounds: improvementRounds.length,
    },
  };
}
