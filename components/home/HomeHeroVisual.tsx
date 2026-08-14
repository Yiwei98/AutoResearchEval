"use client";

import { motion, useReducedMotion } from "motion/react";

export interface HomeHeroVisualProps {
  className?: string;
}

const LOOP_DURATION = 7.4;
const SOLUTION_COLOR = "#376b9d";
const EXECUTION_COLOR = "#237a3d";
const FEEDBACK_COLOR = "#9a541d";

interface SegmentSpec {
  collapsedD: string;
  d: string;
  end: number;
  start: number;
  stroke: string;
}

const RUN_A_SEGMENTS: SegmentSpec[] = [
  {
    collapsedD: "M101 239 C101 239 101 239 101 239",
    d: "M101 239 C132 191 165 151 216 130",
    start: 0.04,
    end: 0.22,
    stroke: SOLUTION_COLOR,
  },
  {
    collapsedD: "M216 130 C216 130 216 130 216 130",
    d: "M216 130 C278 111 338 123 390 153",
    start: 0.2,
    end: 0.39,
    stroke: EXECUTION_COLOR,
  },
  {
    collapsedD: "M390 153 C390 153 390 153 390 153",
    d: "M390 153 C482 159 558 207 641 246",
    start: 0.37,
    end: 0.69,
    stroke: EXECUTION_COLOR,
  },
];

const RUN_B_SEGMENTS: SegmentSpec[] = [
  {
    collapsedD: "M101 261 C101 261 101 261 101 261",
    d: "M101 261 C132 301 166 329 207 340",
    start: 0.02,
    end: 0.15,
    stroke: SOLUTION_COLOR,
  },
  {
    collapsedD: "M207 340 C207 340 207 340 207 340",
    d: "M207 340 C259 346 306 318 350 294",
    start: 0.13,
    end: 0.26,
    stroke: EXECUTION_COLOR,
  },
  {
    collapsedD: "M350 294 C350 294 350 294 350 294",
    d: "M350 294 C389 300 395 363 426 378",
    start: 0.24,
    end: 0.38,
    stroke: FEEDBACK_COLOR,
  },
  {
    collapsedD: "M426 378 C426 378 426 378 426 378",
    d: "M426 378 C469 381 455 330 486 314",
    start: 0.36,
    end: 0.51,
    stroke: FEEDBACK_COLOR,
  },
  {
    collapsedD: "M486 314 C486 314 486 314 486 314",
    d: "M486 314 C536 304 585 272 641 254",
    start: 0.49,
    end: 0.69,
    stroke: EXECUTION_COLOR,
  },
];

interface ProcessNodeSpec {
  color: string;
  revealAt: number;
  x: number;
  y: number;
}

const PROCESS_NODES: ProcessNodeSpec[] = [
  { x: 216, y: 130, color: SOLUTION_COLOR, revealAt: 0.22 },
  { x: 390, y: 153, color: EXECUTION_COLOR, revealAt: 0.39 },
  { x: 207, y: 340, color: SOLUTION_COLOR, revealAt: 0.15 },
  { x: 350, y: 294, color: EXECUTION_COLOR, revealAt: 0.26 },
  { x: 426, y: 378, color: FEEDBACK_COLOR, revealAt: 0.38 },
  { x: 486, y: 314, color: FEEDBACK_COLOR, revealAt: 0.51 },
];

interface AnimatedSegmentProps {
  reduceMotion: boolean;
  segment: SegmentSpec;
}

function AnimatedSegment({
  reduceMotion,
  segment,
}: AnimatedSegmentProps) {
  return (
    <motion.path
      d={reduceMotion ? segment.d : segment.collapsedD}
      fill="none"
      stroke={segment.stroke}
      strokeWidth="2.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      initial={reduceMotion ? false : { d: segment.collapsedD, opacity: 0 }}
      animate={
        reduceMotion
          ? { d: segment.d, opacity: 0.92 }
          : {
              d: [
                segment.collapsedD,
                segment.collapsedD,
                segment.d,
                segment.d,
                segment.d,
                segment.collapsedD,
              ],
              opacity: [0, 0, 0.94, 0.94, 0, 0],
            }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: LOOP_DURATION,
              times: [0, segment.start, segment.end, 0.91, 0.97, 1],
              repeat: Infinity,
              ease: "linear",
            }
      }
    />
  );
}

interface ProcessNodeProps extends ProcessNodeSpec {
  reduceMotion: boolean;
  regression?: boolean;
}

function ProcessNode({
  color,
  reduceMotion,
  regression = false,
  revealAt,
  x,
  y,
}: ProcessNodeProps) {
  return (
    <motion.g
      initial={reduceMotion ? false : { opacity: 0, scale: 0.64 }}
      animate={
        reduceMotion
          ? { opacity: 1, scale: 1 }
          : {
              opacity: [0, 0, 1, 1, 0, 0],
              scale: [0.64, 0.64, 1.12, 1, 0.88, 0.88],
            }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: LOOP_DURATION,
              times: [0, Math.max(0, revealAt - 0.018), revealAt, 0.91, 0.97, 1],
              repeat: Infinity,
              ease: "linear",
            }
      }
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <circle
        cx={x}
        cy={y}
        r="11"
        fill="var(--background)"
        stroke={color}
        strokeWidth="1.45"
        vectorEffect="non-scaling-stroke"
      />
      {regression ? (
        <>
          <circle
            cx={x}
            cy={y}
            r="3.4"
            fill="var(--background)"
            stroke={color}
            strokeWidth="1.45"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M${x - 5} ${y - 14} L${x} ${y - 9} L${x + 5} ${y - 14}`}
            fill="none"
            stroke={color}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : (
        <circle cx={x} cy={y} r="3.7" fill={color} />
      )}
    </motion.g>
  );
}

function ArtifactGlyph() {
  return (
    <g>
      <circle
        cx="82"
        cy="250"
        r="34"
        fill="var(--background)"
        stroke="color-mix(in srgb, var(--accent) 35%, var(--border))"
        strokeWidth="1.15"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M68 243 L82 235 L96 243 L82 251 Z M68 243 V259 L82 267 V251 M96 243 V259 L82 267"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function ScoreTarget({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <>
      <g opacity="0.72">
        <circle
          cx="646"
          cy="250"
          r="43"
          fill="none"
          stroke="color-mix(in srgb, var(--accent) 18%, var(--border))"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx="646"
          cy="250"
          r="31"
          fill="none"
          stroke="color-mix(in srgb, var(--accent) 38%, var(--border))"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          data-home-trajectory-anchor="final-score"
          cx="646"
          cy="250"
          r="19"
          fill="var(--accent-soft)"
          stroke="var(--accent)"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </g>

      <motion.circle
        cx="646"
        cy="250"
        r="27"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.15"
        vectorEffect="non-scaling-stroke"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
        animate={
          reduceMotion
            ? { opacity: 0.55, scale: 1 }
            : {
                opacity: [0, 0, 0.72, 0, 0],
                scale: [0.7, 0.7, 1, 1.35, 1.35],
              }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                duration: LOOP_DURATION,
                times: [0, 0.67, 0.71, 0.86, 1],
                repeat: Infinity,
                ease: "linear",
              }
        }
        style={{ transformOrigin: "646px 250px" }}
      />

      <motion.g
        initial={reduceMotion ? false : { opacity: 0, scale: 0.74 }}
        animate={
          reduceMotion
            ? { opacity: 1, scale: 1 }
            : {
                opacity: [0, 0, 1, 1, 0, 0],
                scale: [0.74, 0.74, 1.08, 1, 0.88, 0.88],
              }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                duration: LOOP_DURATION,
                times: [0, 0.675, 0.705, 0.91, 0.97, 1],
                repeat: Infinity,
                ease: "linear",
              }
        }
        style={{ transformOrigin: "646px 250px" }}
      >
        <circle cx="642" cy="246" r="4.2" fill={EXECUTION_COLOR} />
        <circle cx="650" cy="254" r="4.2" fill={EXECUTION_COLOR} />
      </motion.g>
    </>
  );
}

export function HomeHeroVisual({ className = "" }: HomeHeroVisualProps) {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <div
      className={`relative aspect-[720/500] w-full overflow-hidden ${className}`.trim()}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 720 500"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="home-hero-visual-title home-hero-visual-description"
      >
        <title id="home-hero-visual-title">Same outcome, different process</title>
        <desc id="home-hero-visual-description">
          Two research runs begin with the same artifact and reach nearly the same
          final score. One advances directly. The other regresses, uses feedback,
          and recovers.
        </desc>

        <defs>
          <radialGradient id="hero-artifact-wash">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.12" />
            <stop offset="0.62" stopColor="var(--accent)" stopOpacity="0.035" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <motion.circle
          cx="82"
          cy="250"
          r="66"
          fill="url(#hero-artifact-wash)"
          initial={reduceMotion ? false : { opacity: 0.2, scale: 0.86 }}
          animate={
            reduceMotion
              ? { opacity: 0.62, scale: 1 }
              : {
                  opacity: [0.2, 0.72, 0.28, 0.2],
                  scale: [0.86, 1.06, 1, 0.86],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: LOOP_DURATION,
                  times: [0, 0.07, 0.2, 1],
                  repeat: Infinity,
                  ease: "linear",
                }
          }
          style={{ transformOrigin: "82px 250px" }}
        />

        {RUN_A_SEGMENTS.map((segment) => (
          <AnimatedSegment
            key={segment.d}
            reduceMotion={reduceMotion}
            segment={segment}
          />
        ))}
        {RUN_B_SEGMENTS.map((segment) => (
          <AnimatedSegment
            key={segment.d}
            reduceMotion={reduceMotion}
            segment={segment}
          />
        ))}

        {PROCESS_NODES.map((node, index) => (
          <ProcessNode
            key={`${node.x}-${node.y}`}
            {...node}
            reduceMotion={reduceMotion}
            regression={index === 4}
          />
        ))}

        <ArtifactGlyph />
        <ScoreTarget reduceMotion={reduceMotion} />
      </svg>

      <div className="pointer-events-none absolute left-[3%] top-[51%] text-[0.62rem] font-medium tracking-[0.02em] text-muted sm:text-xs">
        Artifact
      </div>
      <div className="pointer-events-none absolute left-[10%] top-[15%] text-[0.68rem] font-semibold tracking-[0.06em] text-foreground/70 sm:text-xs">
        Run A
      </div>
      <div className="pointer-events-none absolute left-[10%] top-[73%] text-[0.68rem] font-semibold tracking-[0.06em] text-foreground/70 sm:text-xs">
        Run B
      </div>
      <div
        className="pointer-events-none absolute left-[25%] top-[12%] text-[0.61rem] font-semibold text-[#376b9d] sm:text-[0.7rem]"
      >
        Solution Framing
      </div>
      <div
        className="pointer-events-none absolute left-[49%] top-[18%] text-[0.61rem] font-semibold text-[#237a3d] sm:text-[0.7rem]"
      >
        Execution
      </div>
      <div
        className="pointer-events-none absolute left-[54%] top-[79%] text-[0.61rem] font-semibold text-[#9a541d] sm:text-[0.7rem]"
      >
        Feedback Control
      </div>
      <div className="pointer-events-none absolute right-[1.5%] top-[40%] text-[0.64rem] font-semibold tracking-[0.04em] text-accent sm:right-[2%] sm:text-xs">
        Final score
      </div>
    </div>
  );
}

export default HomeHeroVisual;
