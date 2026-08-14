"use client";

import { motion, useReducedMotion } from "motion/react";

import { MODELS, PROCESS } from "@/lib/benchmark-data";

import { ModelIcon } from "../ModelIcon";

export interface HomeProcessVisualProps {
  className?: string;
}

const PROCESS_STEPS = [
  {
    key: "c1",
    label: "Solution Framing",
    description: "Choose a direction that can meaningfully improve the artifact.",
    color: "#376b9d",
    scale: { min: 0.45, max: 0.65 },
  },
  {
    key: "c2",
    label: "Execution",
    description: "Turn the chosen direction into working, verified changes.",
    color: "#237a3d",
    scale: { min: 0.86, max: 0.98 },
  },
  {
    key: "c3",
    label: "Feedback Control",
    description: "Keep real gains, catch regressions, and recover when needed.",
    color: "#9a541d",
    scale: { min: 0.74, max: 0.95 },
  },
] as const;

type StepKey = (typeof PROCESS_STEPS)[number]["key"];
type ProcessStep = (typeof PROCESS_STEPS)[number];

const EASE = [0.16, 1, 0.3, 1] as const;

const moduleVariants = {
  hidden: { opacity: 0, y: 14 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, delay, ease: EASE },
  }),
};

const markVariants = {
  hidden: { opacity: 0, scale: 0.72 },
  show: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.38, delay, ease: EASE },
  }),
};

const barVariants = {
  hidden: { opacity: 0, scaleY: 0 },
  show: (delay: number) => ({
    opacity: 1,
    scaleY: 1,
    transition: { duration: 0.72, delay, ease: EASE },
  }),
};

interface SequenceCue {
  at: number;
  delay: number;
  drawFor?: number;
  duration: number;
  repeatDelay: number;
}

interface SegmentCue extends SequenceCue {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const traceSegmentVariants = {
  hidden: ({ x1, y1 }: SegmentCue) => ({
    opacity: 0,
    x2: x1,
    y2: y1,
  }),
  show: ({
    at,
    delay,
    drawFor = 0.28,
    duration,
    repeatDelay,
    x1,
    y1,
    x2,
    y2,
  }: SegmentCue) => {
    const start = at / duration;
    const visible = Math.min(0.89, start + 0.001);
    const end = Math.min(0.9, (at + drawFor) / duration);
    return {
      opacity: [0, 0, 1, 1, 1, 0],
      x2: [x1, x1, x1, x2, x2, x2],
      y2: [y1, y1, y1, y2, y2, y2],
      transition: {
        duration,
        delay,
        times: [0, start, visible, end, 0.94, 1],
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay,
        ease: "easeInOut" as const,
      },
    };
  },
};

const tracePointVariants = {
  hidden: { opacity: 0, scale: 0.72 },
  show: ({ at, delay, duration, repeatDelay }: SequenceCue) => {
    const start = at / duration;
    const end = Math.min(0.91, start + 0.045);
    return {
      opacity: [0, 0, 1, 1, 0],
      scale: [0.72, 0.72, 1, 1, 0.94],
      transition: {
        duration,
        delay,
        times: [0, start, end, 0.94, 1],
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay,
        ease: "easeOut" as const,
      },
    };
  },
};

const DIAGRAM_SEQUENCE = {
  c1: {
    duration: 3.65,
    repeatDelay: 0.28,
    firstPointAt: 0.08,
    firstSegmentAt: 0.3,
    drawFor: 0.25,
    step: 0.4,
  },
  c2: {
    duration: 4.05,
    repeatDelay: 0.42,
    firstPointAt: 0.1,
    firstSegmentAt: 0.34,
    drawFor: 0.28,
    step: 0.45,
  },
  c3: {
    duration: 4.55,
    repeatDelay: 0.55,
    firstPointAt: 0.12,
    firstSegmentAt: 0.36,
    drawFor: 0.29,
    step: 0.46,
  },
} as const;

function pointOnCircle(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Number((cx + radius * Math.cos(radians)).toFixed(3)),
    y: Number((cy + radius * Math.sin(radians)).toFixed(3)),
  };
}

function circularArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = pointOnCircle(cx, cy, radius, startAngle);
  const end = pointOnCircle(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

const ARTIFACT_LOOP_DURATION = 6.4;
const ARTIFACT_LOOP_RADIUS = 151;
const ARTIFACT_LOOP_NODES = [
  { angle: 150, color: PROCESS_STEPS[0].color, delay: 0.18 },
  { angle: 270, color: PROCESS_STEPS[1].color, delay: 0.31 },
  { angle: 30, color: PROCESS_STEPS[2].color, delay: 0.44 },
] as const;
const ARTIFACT_LOOP_ARCS = [
  {
    key: PROCESS_STEPS[0].key,
    color: PROCESS_STEPS[0].color,
    startAngle: 160,
    endAngle: 260,
    startAt: 0.05,
    endAt: 0.22,
  },
  {
    key: PROCESS_STEPS[1].key,
    color: PROCESS_STEPS[1].color,
    startAngle: 280,
    endAngle: 380,
    startAt: 0.25,
    endAt: 0.42,
  },
  {
    key: PROCESS_STEPS[2].key,
    color: PROCESS_STEPS[2].color,
    startAngle: 40,
    endAngle: 140,
    startAt: 0.45,
    endAt: 0.62,
  },
].map((arc) => ({
  ...arc,
  d: circularArc(210, 210, ARTIFACT_LOOP_RADIUS, arc.startAngle, arc.endAngle),
  length:
    ARTIFACT_LOOP_RADIUS *
    ((arc.endAngle - arc.startAngle) * Math.PI / 180),
}));

export function HomeProcessVisual({ className = "" }: HomeProcessVisualProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.figure
      className={`relative mx-auto w-full max-w-[80rem] ${className}`.trim()}
      aria-labelledby="home-process-visual-title"
      aria-describedby="home-process-visual-description"
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "show"}
      viewport={{ once: true, amount: 0.14 }}
    >
      <figcaption className="sr-only">
        <span id="home-process-visual-title">Three measurements around an evolving artifact</span>
        <span id="home-process-visual-description">
          Solution Framing measures how quickly a run reaches a strong direction. Execution checks
          whether proposed changes run and pass task checks. Feedback Control measures whether a run
          preserves gains and recovers after regressions. The accompanying charts compare all seven
          models on zoomed, explicitly labelled score ranges.
        </span>
      </figcaption>

      <div className="grid grid-cols-1 gap-9 md:grid-cols-2 md:items-start md:gap-x-10 md:gap-y-10 lg:grid-cols-[minmax(15rem,1fr)_minmax(18rem,1.08fr)_minmax(15rem,1fr)] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-[clamp(1.5rem,3vw,3.5rem)] lg:gap-y-2">
        <motion.div
          className="relative mx-auto aspect-square w-full max-w-[18rem] md:col-span-2 md:max-w-[20rem] lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:max-w-[21rem]"
          variants={moduleVariants}
          custom={0.02}
        >
          <ArtifactLoop reduceMotion={Boolean(reduceMotion)} />
        </motion.div>

        <ProcessDimension
          step={PROCESS_STEPS[0]}
          delay={0.18}
          reduceMotion={Boolean(reduceMotion)}
          className="lg:col-start-1 lg:row-start-1"
        />
        <ProcessDimension
          step={PROCESS_STEPS[1]}
          delay={0.32}
          reduceMotion={Boolean(reduceMotion)}
          className="lg:col-start-3 lg:row-start-1"
        />
        <ProcessDimension
          step={PROCESS_STEPS[2]}
          delay={0.46}
          reduceMotion={Boolean(reduceMotion)}
          className="md:col-span-2 md:max-w-[24rem] lg:col-span-1 lg:col-start-2 lg:row-start-2 lg:mt-1 lg:max-w-[18rem]"
        />
      </div>

      <table className="sr-only">
        <caption>Process scores across seven models</caption>
        <thead>
          <tr>
            <th>Model</th>
            {PROCESS_STEPS.map((step) => (
              <th key={step.key}>{step.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODELS.map((model) => (
            <tr key={model.key}>
              <th>{model.name}</th>
              {PROCESS_STEPS.map((step) => (
                <td key={step.key}>{PROCESS[model.key][step.key].toFixed(3)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.figure>
  );
}

function ArtifactLoop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="block h-full w-full overflow-visible"
      viewBox="0 0 420 420"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {PROCESS_STEPS.map((step) => (
          <marker
            key={step.key}
            id={`home-process-arrow-${step.key}`}
            markerWidth="8"
            markerHeight="8"
            refX="6.2"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0 0 L7 3.5 L0 7 Z" fill={step.color} />
          </marker>
        ))}
        <radialGradient id="home-process-artifact-glow">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.14" />
          <stop offset="0.58" stopColor="var(--accent)" stopOpacity="0.045" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        {ARTIFACT_LOOP_ARCS.map((arc) => (
          <mask
            key={arc.key}
            id={`home-process-reveal-${arc.key}`}
            x="0"
            y="0"
            width="420"
            height="420"
            maskUnits="userSpaceOnUse"
          >
            <rect width="420" height="420" fill="black" />
            <motion.path
              d={arc.d}
              fill="none"
              stroke="white"
              strokeWidth="28"
              strokeLinecap="round"
              strokeDasharray={`${arc.length} ${arc.length}`}
              initial={
                reduceMotion
                  ? false
                  : { strokeDashoffset: arc.length, opacity: 1 }
              }
              animate={
                reduceMotion
                  ? { strokeDashoffset: 0, opacity: 1 }
                  : {
                      strokeDashoffset: [
                        arc.length,
                        arc.length,
                        0,
                        0,
                        0,
                        0,
                      ],
                      opacity: [1, 1, 1, 1, 0, 0],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      duration: ARTIFACT_LOOP_DURATION,
                      times: [0, arc.startAt, arc.endAt, 0.86, 0.93, 1],
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }
              }
            />
          </mask>
        ))}
      </defs>

      <circle cx="210" cy="210" r="190" fill="url(#home-process-artifact-glow)" />
      {ARTIFACT_LOOP_ARCS.map((arc) => (
        <path
          key={arc.key}
          d={arc.d}
          fill="none"
          stroke={arc.color}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeDasharray="none"
          markerEnd={`url(#home-process-arrow-${arc.key})`}
          mask={`url(#home-process-reveal-${arc.key})`}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {ARTIFACT_LOOP_NODES.map((node) => {
        const point = pointOnCircle(210, 210, ARTIFACT_LOOP_RADIUS, node.angle);
        return (
          <motion.g
            key={node.angle}
            variants={markVariants}
            custom={node.delay}
            style={{ transformOrigin: `${point.x}px ${point.y}px` }}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r="14"
              fill="var(--background)"
              stroke={node.color}
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={point.x} cy={point.y} r="5" fill={node.color} />
          </motion.g>
        );
      })}

      <motion.g variants={markVariants} custom={0.08} style={{ transformOrigin: "210px 210px" }}>
        <circle
          cx="210"
          cy="210"
          r="90"
          fill="color-mix(in srgb, var(--background) 76%, transparent)"
          stroke="color-mix(in srgb, var(--accent) 24%, var(--border))"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx="210"
          cy="210"
          r="69"
          fill="var(--background)"
          stroke="color-mix(in srgb, var(--accent) 38%, var(--border))"
          strokeWidth="1"
          strokeOpacity="0.64"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M157 195 L210 166 L263 195 L210 225 Z"
          fill="var(--accent-soft)"
          stroke="var(--accent)"
          strokeWidth="1.8"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M157 195 V238 L210 269 V225 M263 195 V238 L210 269"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M173 177 L210 156 L247 177 L210 198 Z"
          fill="var(--background)"
          stroke="color-mix(in srgb, var(--accent) 72%, var(--border))"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>

      <motion.text
        x="210"
        y="310"
        textAnchor="middle"
        fill="var(--muted)"
        fontSize="11"
        fontWeight="600"
        letterSpacing="0.09em"
        variants={moduleVariants}
        custom={0.26}
      >
        EVOLVING ARTIFACT
      </motion.text>
    </svg>
  );
}

function ProcessDimension({
  step,
  delay,
  reduceMotion,
  className = "",
}: {
  step: ProcessStep;
  delay: number;
  reduceMotion: boolean;
  className?: string;
}) {
  return (
    <motion.section
      className={`mx-auto w-full max-w-[25rem] lg:max-w-[17rem] ${className}`.trim()}
      variants={moduleVariants}
      custom={delay}
      aria-labelledby={`home-process-${step.key}-title`}
    >
      <div className="flex items-start gap-3 lg:block">
        <span
          aria-hidden="true"
          className="mt-1 block h-8 w-0.5 shrink-0 rounded-full lg:mb-3 lg:mt-0 lg:h-0.5 lg:w-9"
          style={{ backgroundColor: step.color }}
        />
        <div className="min-w-0">
          <h3
            id={`home-process-${step.key}-title`}
            className="text-[1rem] font-semibold leading-5 tracking-[-0.025em]"
            style={{ color: step.color }}
          >
            {step.label}
          </h3>
          <p className="mt-1 max-w-[34ch] text-xs leading-[1.18rem] text-muted">
            {step.description}
          </p>
        </div>
      </div>

      <div className="mt-3 sm:mt-4">
        <ProcessDiagram
          stepKey={step.key}
          color={step.color}
          delay={delay + 0.08}
          reduceMotion={reduceMotion}
        />
        <DimensionBars step={step} delay={delay + 0.32} />
      </div>
    </motion.section>
  );
}

function ProcessDiagram({
  stepKey,
  color,
  delay,
  reduceMotion,
}: {
  stepKey: StepKey;
  color: string;
  delay: number;
  reduceMotion: boolean;
}) {
  if (stepKey === "c1") {
    const points = [
      [22, 124],
      [47, 82],
      [75, 58],
      [106, 45],
      [141, 39],
      [176, 36],
      [212, 34],
    ] as const;
    const sequence = DIAGRAM_SEQUENCE.c1;
    const segments = points.slice(1).map(([x, y], index) => ({
      x1: points[index][0],
      y1: points[index][1],
      x2: x,
      y2: y,
      at: sequence.firstSegmentAt + index * sequence.step,
    }));
    return (
      <svg
        viewBox="0 0 240 150"
        className="block h-auto w-full"
        role="img"
        aria-labelledby="home-process-c1-svg-title home-process-c1-svg-description"
      >
        <title id="home-process-c1-svg-title">Solution Framing example</title>
        <desc id="home-process-c1-svg-description">
          A reward curve rises quickly and reaches a high plateau, rewarding both solution quality
          and how early the direction was found.
        </desc>
        <DiagramAxes />
        {segments.map((segment) => (
          <motion.line
            key={`${segment.x1}-${segment.y1}-${segment.x2}-${segment.y2}`}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke={color}
            strokeWidth="2.7"
            strokeLinecap="round"
            strokeDasharray="none"
            vectorEffect="non-scaling-stroke"
            variants={reduceMotion ? undefined : traceSegmentVariants}
            custom={{
              at: segment.at,
              delay,
              drawFor: sequence.drawFor,
              duration: sequence.duration,
              repeatDelay: sequence.repeatDelay,
              x1: segment.x1,
              y1: segment.y1,
              x2: segment.x2,
              y2: segment.y2,
            }}
          />
        ))}
        {points.map(([x, y], index) => (
          <motion.circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="3.2"
            fill={color}
            variants={reduceMotion ? undefined : tracePointVariants}
            custom={{
              at: index === 0 ? sequence.firstPointAt : segments[index - 1].at + sequence.drawFor,
              delay,
              duration: sequence.duration,
              repeatDelay: sequence.repeatDelay,
            }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        ))}
        <text x="73" y="111" fill="var(--muted)" fontSize="9" fontWeight="600">
          high reward, reached fast
        </text>
      </svg>
    );
  }

  if (stepKey === "c2") {
    const points = [
      [22, 124],
      [50, 78],
      [78, 94],
      [110, 60],
      [144, 77],
      [177, 39],
      [208, 124],
    ] as const;
    const sequence = DIAGRAM_SEQUENCE.c2;
    const segments = points.slice(1).map(([x, y], index) => ({
      x1: points[index][0],
      y1: points[index][1],
      x2: x,
      y2: y,
      at: sequence.firstSegmentAt + index * sequence.step,
    }));
    return (
      <svg
        viewBox="0 0 240 150"
        className="block h-auto w-full"
        role="img"
        aria-labelledby="home-process-c2-svg-title home-process-c2-svg-description"
      >
        <title id="home-process-c2-svg-title">Execution example</title>
        <desc id="home-process-c2-svg-description">
          A promising sequence ends in failed delivery, showing that a good direction still needs
          correct execution.
        </desc>
        <DiagramAxes />
        {segments.map((segment) => (
          <motion.line
            key={`${segment.x1}-${segment.y1}-${segment.x2}-${segment.y2}`}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke={color}
            strokeWidth="2.7"
            strokeLinecap="round"
            strokeDasharray="none"
            vectorEffect="non-scaling-stroke"
            variants={reduceMotion ? undefined : traceSegmentVariants}
            custom={{
              at: segment.at,
              delay,
              drawFor: sequence.drawFor,
              duration: sequence.duration,
              repeatDelay: sequence.repeatDelay,
              x1: segment.x1,
              y1: segment.y1,
              x2: segment.x2,
              y2: segment.y2,
            }}
          />
        ))}
        {points.slice(0, -1).map(([x, y], index) => (
          <motion.circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="3.2"
            fill={color}
            variants={reduceMotion ? undefined : tracePointVariants}
            custom={{
              at: index === 0 ? sequence.firstPointAt : segments[index - 1].at + sequence.drawFor,
              delay,
              duration: sequence.duration,
              repeatDelay: sequence.repeatDelay,
            }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        ))}
        <motion.g
          variants={reduceMotion ? undefined : tracePointVariants}
          custom={{
            at: segments.at(-1)!.at + sequence.drawFor,
            delay,
            duration: sequence.duration,
            repeatDelay: sequence.repeatDelay,
          }}
          style={{ transformOrigin: "208px 124px" }}
        >
          <circle cx="208" cy="124" r="8.5" fill="var(--background)" stroke={color} strokeWidth="2.2" />
          <path d="M203 119 L213 129 M213 119 L203 129" stroke={color} strokeWidth="2.2" />
        </motion.g>
        <text x="96" y="113" fill="var(--muted)" fontSize="9" fontWeight="600">
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
  const sequence = DIAGRAM_SEQUENCE.c3;
  const segments = points.slice(1).map(([x, y], index) => ({
    x1: points[index][0],
    y1: points[index][1],
    x2: x,
    y2: y,
    at: sequence.firstSegmentAt + index * sequence.step,
  }));
  return (
    <svg
      viewBox="0 0 240 150"
      className="block h-auto w-full"
      role="img"
      aria-labelledby="home-process-c3-svg-title home-process-c3-svg-description"
    >
      <title id="home-process-c3-svg-title">Feedback Control example</title>
      <desc id="home-process-c3-svg-description">
        Reward falls after a failed try, then recovers toward the best result seen earlier.
      </desc>
      <DiagramAxes />
      <line
        x1="22"
        y1="35"
        x2="220"
        y2="35"
        stroke={color}
        opacity={reduceMotion ? 0.55 : 0.34}
      />
      {segments.map((segment) => (
        <motion.line
          key={`${segment.x1}-${segment.y1}-${segment.x2}-${segment.y2}`}
          x1={segment.x1}
          y1={segment.y1}
          x2={segment.x2}
          y2={segment.y2}
          stroke={color}
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeDasharray="none"
          vectorEffect="non-scaling-stroke"
          variants={reduceMotion ? undefined : traceSegmentVariants}
          custom={{
            at: segment.at,
            delay,
            drawFor: sequence.drawFor,
            duration: sequence.duration,
            repeatDelay: sequence.repeatDelay,
            x1: segment.x1,
            y1: segment.y1,
            x2: segment.x2,
            y2: segment.y2,
          }}
        />
      ))}
      {points.map(([x, y], index) => {
        const cue = {
          at: index === 0 ? sequence.firstPointAt : segments[index - 1].at + sequence.drawFor,
          delay,
          duration: sequence.duration,
          repeatDelay: sequence.repeatDelay,
        };
        return index === 4 ? (
          <motion.g
            key={`${x}-${y}`}
            variants={reduceMotion ? undefined : tracePointVariants}
            custom={cue}
            style={{ transformOrigin: `${x}px ${y}px` }}
          >
            <circle cx={x} cy={y} r="7" fill="var(--background)" stroke={color} strokeWidth="2.2" />
            <circle cx={x} cy={y} r="2" fill={color} />
          </motion.g>
        ) : (
          <motion.circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="3.2"
            fill={color}
            variants={reduceMotion ? undefined : tracePointVariants}
            custom={cue}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        );
      })}
      <text x="149" y="27" fill="var(--muted)" fontSize="9" fontWeight="600">
        best-so-far
      </text>
      <text x="99" y="116" fill="var(--muted)" fontSize="9" fontWeight="600">
        failed try, then recovery
      </text>
    </svg>
  );
}

function DiagramAxes() {
  return (
    <path
      d="M22 20 V124 H220"
      fill="none"
      stroke="color-mix(in srgb, var(--border) 82%, var(--foreground))"
      strokeWidth="1.2"
      vectorEffect="non-scaling-stroke"
    />
  );
}

function DimensionBars({ step, delay }: { step: ProcessStep; delay: number }) {
  const span = step.scale.max - step.scale.min;

  return (
    <div className="mt-2" role="img" aria-label={`${step.label} scores for seven models`}>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[0.61rem] leading-4 text-muted">
        <span>Seven models</span>
        <span className="font-mono">
          zoomed {step.scale.min.toFixed(2)}-{step.scale.max.toFixed(2)}
        </span>
      </div>
      <div className="grid grid-cols-[1.7rem_minmax(0,1fr)] gap-1.5">
        <div className="flex h-[6.6rem] flex-col justify-between pb-[1.2rem] text-right font-mono text-[0.52rem] leading-none text-muted/80">
          <span>{step.scale.max.toFixed(2)}</span>
          <span>{step.scale.min.toFixed(2)}</span>
        </div>
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 border-t border-dashed border-foreground/10"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-[1.2rem] border-t border-foreground/12"
          />
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {MODELS.map((model, index) => {
              const value = PROCESS[model.key][step.key];
              const normalized = Math.min(1, Math.max(0, (value - step.scale.min) / span));
              return (
                <div key={model.key} className="flex min-w-0 flex-col items-center">
                  <div className="flex h-[5.4rem] w-full items-end justify-center">
                    <motion.span
                      className="block w-[7px] origin-bottom rounded-t-[2px] sm:w-2"
                      style={{ height: `${Math.max(3, normalized * 100)}%`, backgroundColor: step.color }}
                      variants={barVariants}
                      custom={delay + index * 0.045}
                      title={`${model.short}: ${value.toFixed(3)}`}
                    />
                  </div>
                  <ModelIcon model={model} size={17} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeProcessVisual;
