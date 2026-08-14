"use client";

import { useEffect, useRef, useState } from "react";

import { SITE_RESOURCES } from "@/lib/site-config";

type CopyState = "idle" | "copied" | "error";

const actionClass =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-foreground/15 bg-background/80 px-5 py-3 text-sm font-semibold text-foreground transition-[transform,border-color,background-color] duration-200 hover:border-foreground/35 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:translate-y-px";

export function HomeEndmatter() {
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

  const copyLabel =
    copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy BibTeX";

  return (
    <section
      aria-label="Citation and recruitment"
      className="mx-auto w-full max-w-[88rem] border-t border-accent/25 px-5 py-14 sm:px-8 sm:py-18 lg:px-12 lg:py-20"
    >
      <div className="grid gap-14 md:grid-cols-[3fr_2fr] md:gap-16 lg:gap-24">
        <div className="max-w-[46rem]">
          <h2 className="text-[clamp(1.75rem,2.8vw,2.7rem)] font-semibold leading-tight tracking-[-0.04em]">
            Cite this work
          </h2>
          <p className="mt-6 max-w-[65ch] text-sm leading-6 text-muted sm:text-base sm:leading-7">
            Yiwei Li, Wanli Yang, Hexiang Tan, et al. (2026).
            <cite className="mt-1 block font-medium not-italic text-foreground">
              Beyond Final Scores: A Systematic Evaluation of Agents for Long-Horizon AI Research
              and Development.
            </cite>
          </p>
          <div className="mt-7 flex items-center gap-4">
            <button type="button" onClick={copyBibtex} className={actionClass}>
              {copyLabel}
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            {copyState === "copied"
              ? "BibTeX copied to clipboard."
              : copyState === "error"
                ? "BibTeX could not be copied."
                : ""}
          </p>
        </div>

        <div className="max-w-[34rem] md:justify-self-end">
          <h2 className="text-[clamp(1.75rem,2.8vw,2.7rem)] font-semibold leading-tight tracking-[-0.04em] text-accent">
            Join LongCat
          </h2>
          <p className="mt-6 text-lg font-medium leading-7 tracking-[-0.02em] text-foreground">
            Researcher, LLM Self-Improvement and Automated Research Agents
          </p>
          <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
            Campus hiring in Beijing and Shanghai.
          </p>
          <a
            href={SITE_RESOURCES.recruitmentUrl}
            target="_blank"
            rel="noreferrer"
            className={`${actionClass} mt-7`}
          >
            View open position
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
