const PROCESS_LISTING_REDACTION = "[Internal process listing redacted]";

const PATH_SEGMENT = "[A-Za-z0-9._-]+";
const INTERNAL_MOUNT_PATTERN = /\/mnt\/[A-Za-z0-9._~/-]+/g;
const INTERNAL_SERVICE_ACCOUNT_PATTERN = /\bhadoop-[a-z0-9-]+\b/gi;
const INTERNAL_RUN_PATTERN = /\b(?:autolab-test-exp-[a-z0-9._-]+|autolab-seed-\d+|test-hope)\b/gi;
const PROVIDER_TEMP_PATTERN = /\/tmp\/[A-Za-z]+-\d+(?:\/[A-Za-z0-9._~/-]*)?/g;
const BACKGROUND_OUTPUT_PATTERN = /\/tasks\/([A-Za-z0-9_-]+)\.output\b/g;
const GPU_UUID_PATTERN = /\b(?:GPU-[0-9a-f-]{20,}|MIG-(?:GPU-)?[0-9a-f/-]{20,})\b/gi;

const PROCESS_LISTING_MARKERS = [
  /\/dev\/docker-init\/init/i,
  /\/workdir\/docker-run\.sh/i,
  /pod-common-env/i,
  /java\.security\.krb5\.conf=/i,
  /-Dafo\.orc\.jni\.class=/i,
];

const FORBIDDEN_PUBLIC_PATTERNS = Object.freeze([
  { label: "internal mount path", pattern: /\/mnt\/[A-Za-z0-9._-]+\//i },
  { label: "internal service account", pattern: INTERNAL_SERVICE_ACCOUNT_PATTERN },
  { label: "internal run name", pattern: INTERNAL_RUN_PATTERN },
  { label: "provider temp path", pattern: /\/tmp\/[A-Za-z]+-\d+\//i },
  {
    label: "raw background task output ID",
    pattern: /\/tasks\/(?!task-\d{4}\.output\b)[A-Za-z0-9_-]+\.output\b/i,
  },
  { label: "GPU UUID", pattern: GPU_UUID_PATTERN },
  { label: "container process listing", pattern: /\/dev\/docker-init\/init/i },
  { label: "container launch script", pattern: /\/workdir\/docker-run\.sh/i },
  { label: "pod environment path", pattern: /pod-common-env/i },
  { label: "internal Java process arguments", pattern: /-Dafo\.orc\.jni\.class=/i },
  {
    label: "internal Kerberos installation path",
    pattern: /\/opt\/[^/\s]+\/hadoop\/etc\/hadoop\/krb5\.conf/i,
  },
  {
    label: "private key material",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  },
  {
    label: "credential-like key prefix",
    pattern:
      /(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[A-Za-z0-9_-]{30,}|xox[baprs]-[A-Za-z0-9-]{20,})/,
  },
  {
    label: "bearer credential",
    pattern: /Bearer\s+[A-Za-z0-9._~+/-]{10,}/i,
  },
  {
    label: "JWT-like credential",
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function visitStrings(value, visitor) {
  if (typeof value === "string") {
    visitor(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) visitStrings(item, visitor);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    visitor(key);
    visitStrings(item, visitor);
  }
}

function addInOrder(map, value, prefix, width) {
  if (value == null || String(value).length === 0) return;
  const source = String(value);
  if (map.has(source)) return;
  map.set(source, `${prefix}-${String(map.size + 1).padStart(width, "0")}`);
}

function collectContext(messages, task) {
  const toolCallIds = new Map();
  const taskIds = new Map();
  const serviceAccounts = new Set();
  const operatorIds = new Set();
  const runIds = new Set();
  const taskPattern = escapeRegExp(task);
  const workspaceRootPattern = new RegExp(
    `/mnt/(?:${PATH_SEGMENT}/)+${taskPattern}/workspace`,
    "g",
  );
  const identityPattern = new RegExp(
    `/mnt/${PATH_SEGMENT}/${PATH_SEGMENT}/docker/user/(${PATH_SEGMENT})/(${PATH_SEGMENT})/`,
    "g",
  );

  for (const message of messages) {
    for (const toolCall of message?.tool_calls ?? []) {
      addInOrder(toolCallIds, toolCall?.id, "call", 5);
      collectTaskIds(toolCall?.arguments, taskIds);
    }
    addInOrder(toolCallIds, message?.tool_call_id, "call", 5);
  }

  visitStrings(messages, (text) => {
    for (const match of text.matchAll(identityPattern)) {
      serviceAccounts.add(match[1]);
      operatorIds.add(match[2]);
    }

    for (const match of text.matchAll(workspaceRootPattern)) {
      const segments = match[0].split("/").filter(Boolean);
      const dockerIndex = segments.findIndex(
        (segment, index) => segment === "docker" && segments[index + 1] === "user",
      );
      const taskIndex = segments.lastIndexOf(task);
      if (dockerIndex >= 0 && taskIndex > dockerIndex + 3) {
        for (const segment of segments.slice(dockerIndex + 4, taskIndex)) {
          runIds.add(segment);
        }
      }
    }

    for (const match of text.matchAll(BACKGROUND_OUTPUT_PATTERN)) {
      if (match[1].length >= 4) addInOrder(taskIds, match[1], "task", 4);
    }
  });

  return {
    operatorIds,
    runIds,
    serviceAccounts,
    taskIds,
    toolCallIds,
    workspaceRootPattern,
  };
}

function collectTaskIds(value, taskIds, key = "") {
  if (Array.isArray(value)) {
    for (const item of value) collectTaskIds(item, taskIds, key);
    return;
  }
  if (!value || typeof value !== "object") {
    if ((key === "taskId" || key === "task_id") && value != null) {
      const source = String(value);
      if (source.length >= 4) addInOrder(taskIds, source, "task", 4);
    }
    return;
  }
  for (const [childKey, childValue] of Object.entries(value)) {
    collectTaskIds(childValue, taskIds, childKey);
  }
}

function countAndReplace(text, pattern, replacement, stats, statKey) {
  return text.replace(pattern, (...args) => {
    stats[statKey] += 1;
    return typeof replacement === "function" ? replacement(...args) : replacement;
  });
}

function replaceExact(text, replacements, stats, statKey, minimumLength = 1) {
  let next = text;
  const entries = [...replacements.entries()].sort(([a], [b]) => b.length - a.length);
  for (const [source, replacement] of entries) {
    if (source.length < minimumLength || !next.includes(source)) continue;
    const parts = next.split(source);
    stats[statKey] += parts.length - 1;
    next = parts.join(replacement);
  }
  return next;
}

function sanitizeValue(value, sanitizeString, taskIds, key = "") {
  if ((key === "taskId" || key === "task_id") && value != null) {
    const mapped = taskIds.get(String(value));
    if (mapped) return mapped;
  }
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, sanitizeString, taskIds, key));
  }
  if (!value || typeof value !== "object") return value;

  const sanitized = {};
  for (const [key, item] of Object.entries(value)) {
    sanitized[sanitizeString(key)] = sanitizeValue(item, sanitizeString, taskIds, key);
  }
  return sanitized;
}

function sanitizeNumericTaskIdReferences(text, taskIds, stats) {
  let next = text;
  for (const [source, replacement] of taskIds) {
    if (!/^\d+$/.test(source)) continue;
    if (next.trim() === source) {
      stats.backgroundTaskIdsReplaced += 1;
      next = next.replace(source, replacement);
      continue;
    }

    const escaped = escapeRegExp(source);
    for (const pattern of [
      new RegExp(`(<task_id>\\s*)${escaped}(\\s*</task_id>)`, "gi"),
      new RegExp(`((?:task[_ ]?id|ID)\\s*[:=]\\s*["']?)${escaped}\\b`, "gi"),
    ]) {
      next = next.replace(pattern, (_match, prefix, suffix = "") => {
        stats.backgroundTaskIdsReplaced += 1;
        return `${prefix}${replacement}${suffix}`;
      });
    }
  }
  return next;
}

function isInternalProcessListing(message) {
  if (message?.role !== "tool" || typeof message.content !== "string") return false;
  const markerCount = PROCESS_LISTING_MARKERS.reduce(
    (count, pattern) => count + Number(pattern.test(message.content)),
    0,
  );
  return markerCount >= 2;
}

export function sanitizeTrajectoryMessages(messages, { task }) {
  const context = collectContext(messages ?? [], task);
  const stats = {
    backgroundTaskIdsReplaced: 0,
    gpuUuidsRedacted: 0,
    internalIdentityTokensReplaced: 0,
    internalMountPathsRedacted: 0,
    processListingsRedacted: 0,
    providerTempPathsRedacted: 0,
    runIdsReplaced: 0,
    stringsChanged: 0,
    toolCallIdsReplaced: 0,
  };

  function sanitizeString(source) {
    let next = source;

    next = countAndReplace(
      next,
      new RegExp(
        `/tmp/[A-Za-z]+-\\d+/[A-Za-z0-9._~/-]*?/tasks/([A-Za-z0-9_-]+)\\.output\\b`,
        "g",
      ),
      (_match, rawTaskId) =>
        `/tmp/trajectory/tasks/${context.taskIds.get(rawTaskId) ?? "task-redacted"}.output`,
      stats,
      "providerTempPathsRedacted",
    );
    next = countAndReplace(
      next,
      PROVIDER_TEMP_PATTERN,
      "[TEMP_PATH]",
      stats,
      "providerTempPathsRedacted",
    );
    next = countAndReplace(
      next,
      new RegExp(context.workspaceRootPattern.source, "g"),
      `/workspace/${task}`,
      stats,
      "internalMountPathsRedacted",
    );
    next = countAndReplace(
      next,
      new RegExp(`/mnt/(?:(?:${PATH_SEGMENT}|\\.\\.)/)+workspace`, "g"),
      `/workspace/${task}`,
      stats,
      "internalMountPathsRedacted",
    );
    next = countAndReplace(
      next,
      INTERNAL_MOUNT_PATTERN,
      "[INTERNAL_PATH]",
      stats,
      "internalMountPathsRedacted",
    );
    next = countAndReplace(
      next,
      GPU_UUID_PATTERN,
      "[GPU_UUID]",
      stats,
      "gpuUuidsRedacted",
    );
    next = replaceExact(
      next,
      new Map([...context.serviceAccounts].map((value) => [value, "[SERVICE_USER]"])),
      stats,
      "internalIdentityTokensReplaced",
    );
    next = replaceExact(
      next,
      new Map([...context.operatorIds].map((value) => [value, "[OPERATOR]"])),
      stats,
      "internalIdentityTokensReplaced",
    );
    next = replaceExact(
      next,
      new Map([...context.runIds].map((value) => [value, "[RUN_ID]"])),
      stats,
      "runIdsReplaced",
    );
    next = countAndReplace(
      next,
      INTERNAL_SERVICE_ACCOUNT_PATTERN,
      "[SERVICE_USER]",
      stats,
      "internalIdentityTokensReplaced",
    );
    next = countAndReplace(
      next,
      INTERNAL_RUN_PATTERN,
      "[RUN_ID]",
      stats,
      "runIdsReplaced",
    );
    next = replaceExact(
      next,
      context.toolCallIds,
      stats,
      "toolCallIdsReplaced",
      4,
    );
    next = replaceExact(
      next,
      new Map(
        [...context.taskIds].filter(([source]) => /[A-Za-z_-]/.test(source)),
      ),
      stats,
      "backgroundTaskIdsReplaced",
      4,
    );
    next = sanitizeNumericTaskIdReferences(next, context.taskIds, stats);

    if (next !== source) stats.stringsChanged += 1;
    return next;
  }

  const sanitizedMessages = (messages ?? []).map((message) => {
    const processListing = isInternalProcessListing(message);
    const sanitized = {
      ...message,
      ...(message.content != null
        ? {
            content: processListing
              ? PROCESS_LISTING_REDACTION
              : sanitizeString(String(message.content)),
          }
        : {}),
    };

    if (processListing) stats.processListingsRedacted += 1;
    if (Array.isArray(message.tool_calls)) {
      sanitized.tool_calls = message.tool_calls.map((toolCall) => ({
        ...toolCall,
        id: context.toolCallIds.get(String(toolCall.id)) ?? sanitizeString(String(toolCall.id)),
        arguments: sanitizeValue(toolCall.arguments, sanitizeString, context.taskIds),
      }));
    }
    if (message.tool_call_id != null) {
      sanitized.tool_call_id =
        context.toolCallIds.get(String(message.tool_call_id)) ??
        sanitizeString(String(message.tool_call_id));
    }
    return sanitized;
  });

  return {
    messages: sanitizedMessages,
    stats: {
      ...stats,
      backgroundTaskIdsMapped: context.taskIds.size,
      toolCallIdsMapped: context.toolCallIds.size,
    },
  };
}

export function findTrajectorySanitizationViolations(trajectory) {
  const serialized = JSON.stringify(trajectory.messages ?? []);
  const violations = [];
  for (const { label, pattern } of FORBIDDEN_PUBLIC_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(serialized)) violations.push(label);
  }
  return violations;
}

export { PROCESS_LISTING_REDACTION };
