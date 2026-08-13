import { EVALUATION_FRAMEWORK } from "@/lib/paper-data";

import { ChartFrame } from "./ChartFrame";

const AXIS = "#c8cfca";
const MUTED = "#6b7280";

const PROCESS_STYLES = {
  c1: {
    border: "ring-[#d5e2ee]",
    badge: "bg-[#e9f1f8] text-[#3f678d]",
    accent: "#4f7ca8",
  },
  c2: {
    border: "ring-[#d4e5d9]",
    badge: "bg-[#e9f4ec] text-[#3f7650]",
    accent: "#4f9a67",
  },
  c3: {
    border: "ring-[#eadccf]",
    badge: "bg-[#f8eee6] text-[#915526]",
    accent: "#b36b2c",
  },
} as const;

const PROCESS_DESCRIPTIONS = {
  c1: "Captures how quickly the agent reaches a strong solution direction.",
  c2: "Proposed changes must execute correctly and pass task checks.",
  c3: "Rewards preserving the best result and recovering after regressions.",
} as const;

const EXPERIENCE_DESCRIPTIONS = {
  "in-task": "The next commit is compared with and without prior exploration from the same task.",
  "inter-task": "Distilled lessons from a source task are tested on a held-out target.",
} as const;

type ProcessKey = keyof typeof PROCESS_STYLES;
type ExperienceKey = "in-task" | "inter-task";

export function ProcessEvaluationFramework() {
  return (
    <ChartFrame
      id="evaluation-framework"
      title="Three measurements of one research loop"
      subtitle=""
      summary="Solution Framing, Execution, and Feedback Control describe behavior inside a research run."
      source={EVALUATION_FRAMEWORK.source}
      plain
      showSourceLabel={false}
    >
      <section
        className=""
        aria-labelledby="evaluation-process-title"
      >
        <h4 id="evaluation-process-title" className="sr-only">
          Process evaluation dimensions
        </h4>

        <div className="grid gap-3 md:grid-cols-3">
          {EVALUATION_FRAMEWORK.process.map((dimension) => {
            const styles = PROCESS_STYLES[dimension.key];
            return (
              <article
                key={dimension.key}
                className={`flex min-w-0 flex-col rounded-xl bg-surface p-4 shadow-sm ring-1 ring-inset ${styles.border}`}
              >
                <header className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${styles.badge}`}
                  >
                    {dimension.key.toUpperCase()}
                  </span>
                  <h5 className="text-xs font-semibold leading-tight">{dimension.label}</h5>
                </header>

                <div className="mt-3">
                  <ProcessDiagram kind={dimension.key} accent={styles.accent} />
                </div>
                <p className="mt-2.5 text-[10px] leading-4 text-muted sm:text-[11px]">
                  {PROCESS_DESCRIPTIONS[dimension.key]}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </ChartFrame>
  );
}

export function ExperienceEvaluationFramework() {
  return (
    <ChartFrame
      id="experience-framework"
      title="Experience within and across tasks"
      subtitle=""
      summary="Intra-task and inter-task comparisons isolate whether accumulated experience improves later decisions."
      source={EVALUATION_FRAMEWORK.source}
      plain
      showSourceLabel={false}
    >
      <section
        className="w-full"
        aria-labelledby="evaluation-experience-title"
      >
        <h4 id="evaluation-experience-title" className="sr-only">
          Intra-task and inter-task experience comparisons
        </h4>

        <div className="grid gap-3 sm:grid-cols-2">
          {EVALUATION_FRAMEWORK.experience.map((view) => (
            <article
              key={view.key}
              className="flex min-w-0 flex-col rounded-xl bg-surface p-4 shadow-sm ring-1 ring-inset ring-[#dfd6e8]"
            >
              <header>
                <h5 className="inline-flex max-w-full rounded-lg bg-[#7755a6]/10 px-3 py-2 text-xs font-semibold leading-4 text-[#67458f]">
                  {view.label}
                </h5>
              </header>

              <div className="mt-2">
                <ExperienceDiagram kind={view.key} />
              </div>
              <p className="mt-2.5 text-[10px] leading-4 text-muted sm:text-[11px]">
                {EXPERIENCE_DESCRIPTIONS[view.key]}
              </p>
            </article>
          ))}
        </div>
      </section>
    </ChartFrame>
  );
}

function ProcessDiagram({ kind, accent }: { kind: ProcessKey; accent: string }) {
  if (kind === "c1") {
    const points = [
      [22, 124],
      [47, 82],
      [75, 58],
      [106, 45],
      [141, 39],
      [176, 36],
      [212, 34],
    ] as const;
    return (
      <svg
        viewBox="0 0 240 150"
        className="h-auto w-full"
        role="img"
        aria-labelledby="process-c1-svg-title process-c1-svg-description"
      >
        <title id="process-c1-svg-title">Solution Framing process dimension</title>
        <desc id="process-c1-svg-description">
          A reward curve that rises quickly and reaches a high plateau, rewarding both height and speed.
        </desc>
        <Axes />
        <path
          d="M22 124 L47 82 L75 58 L106 45 L141 39 L176 36 L212 34 L212 124 Z"
          fill={accent}
          opacity="0.13"
        />
        <polyline
          points={points.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke={accent}
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill={accent} />
        ))}
        <text x="75" y="112" fill={MUTED} fontSize="9" fontWeight="600">
          high reward, reached fast
        </text>
      </svg>
    );
  }

  if (kind === "c2") {
    const points = [
      [22, 124],
      [50, 78],
      [78, 94],
      [110, 60],
      [144, 77],
      [177, 39],
      [208, 124],
    ] as const;
    return (
      <svg
        viewBox="0 0 240 150"
        className="h-auto w-full"
        role="img"
        aria-labelledby="process-c2-svg-title process-c2-svg-description"
      >
        <title id="process-c2-svg-title">Execution process dimension</title>
        <desc id="process-c2-svg-description">
          A jagged reward curve ends in a failed delivery, showing that promising ideas still require correct execution.
        </desc>
        <Axes />
        <polyline
          points={points.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke={accent}
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.slice(0, -1).map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill={accent} />
        ))}
        <circle cx="208" cy="124" r="8.5" fill="white" stroke={accent} strokeWidth="2.2" />
        <path d="M203 119 L213 129 M213 119 L203 129" stroke={accent} strokeWidth="2.2" />
        <text x="94" y="112" fill={MUTED} fontSize="9" fontWeight="600">
          delivery fails
        </text>
      </svg>
    );
  }

  const points = [
    [22, 124],
    [52, 82],
    [82, 56],
    [108, 35],
    [132, 96],
    [160, 68],
    [190, 44],
    [216, 36],
  ] as const;
  return (
    <svg
      viewBox="0 0 240 150"
      className="h-auto w-full"
      role="img"
      aria-labelledby="process-c3-svg-title process-c3-svg-description"
    >
      <title id="process-c3-svg-title">Feedback Control process dimension</title>
      <desc id="process-c3-svg-description">
        The curve falls after a failed try, then recovers toward the best-so-far result.
      </desc>
      <defs>
        <marker id="process-c3-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={accent} />
        </marker>
      </defs>
      <Axes />
      <line x1="22" y1="35" x2="220" y2="35" stroke={accent} strokeDasharray="5 5" opacity="0.55" />
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke={accent}
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill={accent} />
      ))}
      <circle cx="132" cy="96" r="7" fill="white" stroke={accent} strokeWidth="2.2" />
      <path
        d="M145 103 C164 106 181 86 181 61"
        fill="none"
        stroke={accent}
        strokeWidth="1.7"
        markerEnd="url(#process-c3-arrow)"
        opacity="0.8"
      />
      <text x="149" y="28" fill={MUTED} fontSize="9" fontWeight="600">
        best-so-far
      </text>
      <text x="101" y="116" fill={MUTED} fontSize="9" fontWeight="600">
        failed try, then recovery
      </text>
    </svg>
  );
}

function ExperienceDiagram({ kind }: { kind: ExperienceKey }) {
  if (kind === "in-task") {
    const prefix = [
      [22, 124],
      [48, 96],
      [76, 82],
      [104, 72],
      [132, 60],
    ] as const;
    return (
      <svg
        viewBox="0 0 240 150"
        className="h-auto w-full sm:h-48 lg:h-52"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="experience-in-svg-title experience-in-svg-description"
      >
        <title id="experience-in-svg-title">Intra-task experience comparison</title>
        <desc id="experience-in-svg-description">
          From the same branch point, the trajectory with accumulated experience finishes above the trajectory without it.
        </desc>
        <Axes />
        <line x1="132" y1="29" x2="132" y2="124" stroke={AXIS} strokeDasharray="5 5" />
        <polyline
          points={prefix.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="#5f6871"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {prefix.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#5f6871" />
        ))}
        <path d="M132 60 L205 34" fill="none" stroke="#735a9f" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M132 60 L205 73" fill="none" stroke="#b28a3a" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="132" cy="60" r="3.5" fill="#1f2937" />
        <circle cx="205" cy="34" r="3.8" fill="#735a9f" />
        <circle cx="205" cy="73" r="3.8" fill="#b28a3a" />
        <text x="143" y="26" fill="#735a9f" fontSize="9" fontWeight="700">
          with experience
        </text>
        <text x="143" y="91" fill="#9b7326" fontSize="9" fontWeight="700">
          without experience
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 240 160"
      className="h-auto w-full sm:h-48 lg:h-52"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="experience-inter-svg-title experience-inter-svg-description"
    >
      <title id="experience-inter-svg-title">Inter-task experience comparison</title>
      <desc id="experience-inter-svg-description">
        A source-task trajectory is distilled into a lesson, then a target task is solved with and without that lesson.
      </desc>
      <defs>
        <marker id="experience-inter-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#b45d4f" />
        </marker>
      </defs>
      <path d="M22 72 V20 M22 72 H102" fill="none" stroke={AXIS} strokeWidth="1.5" />
      <polyline
        points="22,72 43,49 64,36 84,29 98,24"
        fill="none"
        stroke="#467aa5"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[["22", "72"], ["43", "49"], ["64", "36"], ["84", "29"], ["98", "24"]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#467aa5" />
      ))}
      <text x="29" y="87" fill="#467aa5" fontSize="9" fontWeight="700">
        source task
      </text>

      <path
        d="M104 34 H153"
        fill="none"
        stroke="#b45d4f"
        strokeWidth="1.8"
        markerEnd="url(#experience-inter-arrow)"
      />
      <rect x="156" y="20" width="62" height="38" rx="6" fill="white" stroke="#b45d4f" strokeWidth="1.5" />
      <text x="187" y="36" fill="#a34f43" fontSize="9" fontWeight="700" textAnchor="middle">
        distilled
      </text>
      <text x="187" y="48" fill="#a34f43" fontSize="9" fontWeight="700" textAnchor="middle">
        lesson
      </text>
      <path
        d="M187 58 V88 H112"
        fill="none"
        stroke="#b45d4f"
        strokeWidth="1.8"
        markerEnd="url(#experience-inter-arrow)"
      />

      <path d="M22 142 V91 M22 142 H102" fill="none" stroke={AXIS} strokeWidth="1.5" />
      <path d="M22 142 L48 115 L73 104 L98 98" fill="none" stroke="#b45d4f" strokeWidth="2.7" strokeLinecap="round" />
      <path d="M22 142 L48 128 L73 119 L98 114" fill="none" stroke="#b28a3a" strokeWidth="2.7" strokeLinecap="round" />
      <circle cx="98" cy="98" r="3.5" fill="#b45d4f" />
      <circle cx="98" cy="114" r="3.5" fill="#b28a3a" />
      <text x="29" y="157" fill="#1f2937" fontSize="9" fontWeight="700">
        target task
      </text>
      <text x="112" y="101" fill="#a34f43" fontSize="9" fontWeight="700">
        with experience
      </text>
      <text x="112" y="124" fill="#9b7326" fontSize="9" fontWeight="700">
        without experience
      </text>
    </svg>
  );
}

function Axes() {
  return (
    <path
      d="M22 124 V28 M22 124 H220"
      fill="none"
      stroke={AXIS}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  );
}
