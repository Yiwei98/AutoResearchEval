"use client";

import { useState } from "react";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown> | string;
}
export interface RawMessage {
  role: "user" | "assistant" | "tool" | string;
  content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

const PREVIEW_CHARS = 600;

export function MessageFlow({ messages }: { messages: RawMessage[] }) {
  // Keep the ORIGINAL index (for anchor ids the timeline links to), but skip
  // fully-empty assistant messages (no content, no tool_calls).
  const rendered = messages
    .map((m, originalIndex) => ({ m, originalIndex }))
    .filter(
      ({ m }) =>
        (m.content && m.content.length > 0) ||
        (m.tool_calls && m.tool_calls.length > 0),
    );

  return (
    <div className="space-y-3">
      {rendered.map(({ m, originalIndex }) => (
        <div key={originalIndex} id={`msg-${originalIndex}`} className="scroll-mt-4">
          <MessageBlock m={m} />
        </div>
      ))}
    </div>
  );
}

function MessageBlock({ m }: { m: RawMessage }) {
  if (m.role === "user") {
    return (
      <Bubble
        role="User"
        color="border-l-blue-400"
        badge="bg-blue-50 text-blue-600"
      >
        {m.content && <Collapsible text={m.content} />}
      </Bubble>
    );
  }

  if (m.role === "assistant") {
    return (
      <Bubble
        role="Assistant"
        color="border-l-accent"
        badge="bg-accent-soft text-accent"
      >
        {m.content && <Collapsible text={m.content} />}
        {m.tool_calls?.map((tc) => (
          <ToolCallView key={tc.id} tc={tc} />
        ))}
      </Bubble>
    );
  }

  // tool result
  return (
    <Bubble
      role="Tool result"
      color="border-l-gray-300"
      badge="bg-gray-100 text-gray-500"
      dim
    >
      {m.content && <Collapsible text={m.content} mono initiallyOpen={false} />}
    </Bubble>
  );
}

function Bubble({
  role,
  color,
  badge,
  dim,
  children,
}: {
  role: string;
  color: string;
  badge: string;
  dim?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border border-border border-l-[3px] ${color} bg-surface ${
        dim ? "bg-surface/60" : ""
      } p-3.5`}
    >
      <div
        className={`mb-2 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${badge}`}
      >
        {role}
      </div>
      {children}
    </div>
  );
}

function ToolCallView({ tc }: { tc: ToolCall }) {
  const [open, setOpen] = useState(false);
  const args =
    typeof tc.arguments === "string"
      ? tc.arguments
      : JSON.stringify(tc.arguments, null, 2);

  return (
    <div className="mt-2 overflow-hidden rounded-md border border-border bg-background">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent-soft/30"
      >
        <span className="text-muted">{open ? "▾" : "▸"}</span>
        <span className="font-mono text-xs font-semibold text-accent">
          {tc.name}
        </span>
        <span className="truncate font-mono text-xs text-muted">
          {argPreview(tc.arguments)}
        </span>
      </button>
      {open && (
        <pre className="overflow-x-auto border-t border-border bg-surface px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
          {args}
        </pre>
      )}
    </div>
  );
}

function argPreview(args: ToolCall["arguments"]): string {
  if (typeof args === "string") return args.slice(0, 80);
  const obj = args as Record<string, unknown>;
  const key = obj.command ?? obj.file_path ?? obj.path ?? obj.description;
  if (typeof key === "string") return key.slice(0, 80);
  return JSON.stringify(obj).slice(0, 80);
}

function Collapsible({
  text,
  mono,
  initiallyOpen = true,
}: {
  text: string;
  mono?: boolean;
  initiallyOpen?: boolean;
}) {
  const long = text.length > PREVIEW_CHARS;
  const [open, setOpen] = useState(initiallyOpen || !long);

  const shown = open ? text : text.slice(0, PREVIEW_CHARS);

  return (
    <div>
      <pre
        className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground ${
          mono ? "font-mono text-xs" : "font-sans"
        }`}
      >
        <span>{shown}</span>
        {!open && long && <span className="text-muted">…</span>}
      </pre>
      {long && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-1.5 text-xs font-medium text-accent hover:underline"
        >
          {open ? "Show less" : `Show more (${text.length.toLocaleString()} chars)`}
        </button>
      )}
    </div>
  );
}
