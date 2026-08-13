"use client";

import { useEffect, useRef, useState } from "react";

import { SITE_RESOURCES } from "@/lib/site-config";

type CopyState = "idle" | "copied" | "error";

export function CitationBlock() {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  async function copyBibtex() {
    try {
      await navigator.clipboard.writeText(SITE_RESOURCES.citation.bibtex);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState("idle"), 2400);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.11em] text-accent">
          BibTeX
        </p>
        <button
          type="button"
          onClick={copyBibtex}
          className="rounded-lg border border-accent/25 bg-accent-soft px-3.5 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent/45 hover:bg-accent-soft/70"
        >
          {copyState === "copied"
            ? "Copied"
            : copyState === "error"
              ? "Copy failed"
              : "Copy BibTeX"}
        </button>
      </div>
      <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-background/70 p-4 font-mono text-[11px] leading-5 text-foreground/75 ring-1 ring-border">
        <code>{SITE_RESOURCES.citation.bibtex}</code>
      </pre>
      <p className="sr-only" aria-live="polite">
        {copyState === "copied"
          ? "BibTeX copied to clipboard."
          : copyState === "error"
            ? "BibTeX could not be copied."
            : ""}
      </p>
    </div>
  );
}
