"use client";

import { motion, useReducedMotion } from "motion/react";

import { ModelIcon } from "@/components/ModelIcon";
import { MODEL_BY_KEY, MODELS } from "@/lib/benchmark-data";
import { SOLUTION_NATURE, type SolutionNatureKey } from "@/lib/paper-data";

const novelty = SOLUTION_NATURE.novelty;

function totalForCategory(key: SolutionNatureKey) {
  return SOLUTION_NATURE.rows.reduce((total, row) => total + row[key], 0);
}

type Branch = {
  key: SolutionNatureKey;
  label: string;
  mobileLabel: readonly [string, string?];
  count: number;
  color: string;
  desktopY: number;
  mobileX: number;
  mobileY: number;
};

const BRANCHES: readonly Branch[] = [
  {
    key: "compositionStacking",
    label: "Composition stacking",
    mobileLabel: ["Composition stacking"],
    count: totalForCategory("compositionStacking"),
    color: "#72a985",
    desktopY: 44,
    mobileX: 88,
    mobileY: 286,
  },
  {
    key: "structuralSwap",
    label: "Structural swap",
    mobileLabel: ["Structural swap"],
    count: totalForCategory("structuralSwap"),
    color: "#c8914c",
    desktopY: 103,
    mobileX: 272,
    mobileY: 286,
  },
  {
    key: "trainingSignal",
    label: "Training signal / data engineering",
    mobileLabel: ["Training signal", "/ data engineering"],
    count: totalForCategory("trainingSignal"),
    color: "#62aaa8",
    desktopY: 162,
    mobileX: 88,
    mobileY: 374,
  },
  {
    key: "paramTune",
    label: "Parameter tuning",
    mobileLabel: ["Parameter tuning"],
    count: totalForCategory("paramTune"),
    color: "#6e9fba",
    desktopY: 221,
    mobileX: 272,
    mobileY: 374,
  },
  {
    key: "searchHardcode",
    label: "Search and hardcode",
    mobileLabel: ["Search and hardcode"],
    count: totalForCategory("searchHardcode"),
    color: "#8795bd",
    desktopY: 280,
    mobileX: 88,
    mobileY: 462,
  },
  {
    key: "evaluationHacking",
    label: "Evaluation hacking",
    mobileLabel: ["Evaluation hacking"],
    count: totalForCategory("evaluationHacking"),
    color: "#b26a2b",
    desktopY: 339,
    mobileX: 272,
    mobileY: 462,
  },
  {
    key: "other",
    label: "Other",
    mobileLabel: ["Other"],
    count: totalForCategory("other"),
    color: "#a9aeaa",
    desktopY: 398,
    mobileX: 88,
    mobileY: 550,
  },
  {
    key: "novelApproach",
    label: "Validated novelty",
    mobileLabel: ["Validated novelty"],
    count: totalForCategory("novelApproach"),
    color: "#278846",
    desktopY: 457,
    mobileX: 272,
    mobileY: 550,
  },
] as const;

const solutionRows = SOLUTION_NATURE.rows.map((row) => {
  const model = MODEL_BY_KEY[row.model];
  if (!model) throw new Error(`Missing model metadata for ${row.model}`);

  const total =
    row.paramTune +
    row.trainingSignal +
    row.structuralSwap +
    row.compositionStacking +
    row.searchHardcode +
    row.evaluationHacking +
    row.other +
    row.novelApproach;
  return {
    model,
    total,
    paramTune: row.paramTune,
    trainingSignal: row.trainingSignal,
    structuralSwap: row.structuralSwap,
    compositionStacking: row.compositionStacking,
    searchHardcode: row.searchHardcode,
    evaluationHacking: row.evaluationHacking,
    other: row.other,
    novelApproach: row.novelApproach,
  };
});

const DESKTOP_WIDTH = 1000;
const DESKTOP_HEIGHT = 500;
const DESKTOP_CENTER_X = 405;
const DESKTOP_CENTER_Y = 250;
const DESKTOP_MODEL_Y = [70, 130, 190, 250, 310, 370, 430] as const;
const DESKTOP_INPUT_OFFSETS = [-18, -12, -6, 0, 6, 12, 18] as const;
const DESKTOP_BRANCH_OFFSETS = [-28, -20, -12, -4, 4, 12, 20, 28] as const;

const MOBILE_WIDTH = 360;
const MOBILE_HEIGHT = 620;
const MOBILE_CENTER_X = 180;
const MOBILE_CENTER_Y = 170;
const MOBILE_MODEL_X = [28, 79, 130, 180, 230, 281, 332] as const;
const MOBILE_BRANCH_OFFSETS = [-28, 28, -20, 20, -12, 12, -4, 4] as const;

function branchWidth(count: number) {
  return 1.75 + 8.25 * Math.sqrt(count / Math.max(...BRANCHES.map((item) => item.count)));
}

function percentOfTotal(count: number) {
  return `${Math.round((count / novelty.total) * 100)}%`;
}

function FlowPath({
  d,
  color,
  width,
  delay,
  reduceMotion,
  opacity = 0.66,
}: {
  d: string;
  color: string;
  width: number;
  delay: number;
  reduceMotion: boolean | null;
  opacity?: number;
}) {
  return (
    <>
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeOpacity={opacity}
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{
          pathLength: {
            duration: reduceMotion ? 0 : 0.82,
            delay: reduceMotion ? 0 : delay,
            ease: [0.16, 1, 0.3, 1],
          },
          opacity: {
            duration: reduceMotion ? 0 : 0.24,
            delay: reduceMotion ? 0 : delay,
          },
        }}
      />
      {width > 3 ? (
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.92 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{
            pathLength: {
              duration: reduceMotion ? 0 : 0.82,
              delay: reduceMotion ? 0 : delay,
              ease: [0.16, 1, 0.3, 1],
            },
            opacity: {
              duration: reduceMotion ? 0 : 0.24,
              delay: reduceMotion ? 0 : delay,
            },
          }}
        />
      ) : null}
    </>
  );
}

function DesktopFlow({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <svg
      className="block h-auto w-full"
      viewBox={`0 0 ${DESKTOP_WIDTH} ${DESKTOP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Seven model trajectories converge into 252 solutions, classified as 111 composition-stacking, 56 structural-swap, 22 training-signal and data-engineering, 19 parameter-tuning, 18 search-hardcode, 16 evaluation-hacking, seven other, and three validated novel-approach solutions."
    >
      {solutionRows.map(({ model }, index) => {
        const y = DESKTOP_MODEL_Y[index];
        const endY = DESKTOP_CENTER_Y + DESKTOP_INPUT_OFFSETS[index];
        const d = `M 116 ${y} C 210 ${y}, 267 ${endY}, 349 ${endY}`;

        return (
          <g key={model.key} aria-hidden="true">
            <FlowPath
              d={d}
              color={model.color}
              width={1.75}
              delay={0.05 + index * 0.045}
              reduceMotion={reduceMotion}
              opacity={0.58}
            />
            <motion.g
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{
                duration: reduceMotion ? 0 : 0.42,
                delay: reduceMotion ? 0 : index * 0.035,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <foreignObject x="17" y={y - 12} width="26" height="26">
                <div className="flex h-[26px] w-[26px] items-center justify-center">
                  <ModelIcon model={model} size={22} />
                </div>
              </foreignObject>
              <text
                x="50"
                y={y + 4}
                fill="var(--foreground)"
                fontSize="10.5"
                fontWeight="600"
              >
                {model.short}
              </text>
              <circle cx="116" cy={y} r="2.8" fill={model.color} />
            </motion.g>
          </g>
        );
      })}

      {BRANCHES.map((branch, index) => {
        const startY = DESKTOP_CENTER_Y + DESKTOP_BRANCH_OFFSETS[index];
        const d = `M 461 ${startY} C 538 ${startY}, 602 ${branch.desktopY}, 675 ${branch.desktopY}`;
        const isHacking = branch.key === "evaluationHacking";
        const isNovel = branch.key === "novelApproach";
        const isEmphasized = isHacking || isNovel;

        return (
          <g key={branch.key} aria-hidden="true">
            <FlowPath
              d={d}
              color={branch.color}
              width={branchWidth(branch.count)}
              delay={0.58 + index * 0.075}
              reduceMotion={reduceMotion}
              opacity={branch.key === "other" ? 0.45 : 0.52}
            />
            <motion.g
              initial={reduceMotion ? false : { opacity: 0, x: -7 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{
                duration: reduceMotion ? 0 : 0.46,
                delay: reduceMotion ? 0 : 0.92 + index * 0.075,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <circle
                cx="675"
                cy={branch.desktopY}
                r="5"
                fill="var(--surface)"
                stroke={branch.color}
                strokeWidth="1.4"
              />
              <circle cx="675" cy={branch.desktopY} r="2" fill={branch.color} />
              <text
                x="698"
                y={branch.desktopY + 1}
                dominantBaseline="middle"
                fill={isEmphasized ? branch.color : "var(--foreground)"}
                fontFamily="var(--font-mono)"
                fontSize={isNovel ? "24" : "19"}
                fontWeight={isEmphasized ? "720" : "650"}
                letterSpacing="-0.04em"
              >
                {branch.count}
              </text>
              <text
                x="750"
                y={branch.desktopY + 1}
                dominantBaseline="middle"
                fill={isEmphasized ? branch.color : "var(--foreground)"}
                fontSize={isNovel ? "24" : "10.8"}
                fontWeight={isEmphasized ? "700" : "600"}
              >
                {branch.label}
              </text>
              <text
                x="978"
                y={branch.desktopY + 1}
                dominantBaseline="middle"
                textAnchor="end"
                fill="var(--muted)"
                fontFamily="var(--font-mono)"
                fontSize="9.5"
              >
                {percentOfTotal(branch.count)}
              </text>
            </motion.g>
          </g>
        );
      })}

      <motion.g
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.82 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{
          duration: reduceMotion ? 0 : 0.52,
          delay: reduceMotion ? 0 : 0.43,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ transformOrigin: `${DESKTOP_CENTER_X}px ${DESKTOP_CENTER_Y}px` }}
      >
        <circle
          cx={DESKTOP_CENTER_X}
          cy={DESKTOP_CENTER_Y}
          r="66"
          fill="var(--accent-soft)"
          fillOpacity="0.42"
        />
        <circle
          cx={DESKTOP_CENTER_X}
          cy={DESKTOP_CENTER_Y}
          r="55"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeOpacity="0.32"
          strokeWidth="1.1"
        />
        <circle
          cx={DESKTOP_CENTER_X}
          cy={DESKTOP_CENTER_Y}
          r="44"
          fill="none"
          stroke="var(--border)"
          strokeOpacity="0.72"
          strokeWidth="0.8"
        />
        <text
          x={DESKTOP_CENTER_X}
          y={DESKTOP_CENTER_Y - 3}
          textAnchor="middle"
          fill="var(--foreground)"
          fontFamily="var(--font-mono)"
          fontSize="27"
          fontWeight="650"
          letterSpacing="-0.055em"
        >
          252
        </text>
        <text
          x={DESKTOP_CENTER_X}
          y={DESKTOP_CENTER_Y + 18}
          textAnchor="middle"
          fill="var(--muted)"
          fontSize="9.5"
          fontWeight="600"
          letterSpacing="0.03em"
        >
          SOLUTIONS
        </text>
      </motion.g>
    </svg>
  );
}

function MobileFlow({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <svg
      className="block h-auto w-full"
      viewBox={`0 0 ${MOBILE_WIDTH} ${MOBILE_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Seven model trajectories converge into 252 solutions, classified as 111 composition-stacking, 56 structural-swap, 22 training-signal and data-engineering, 19 parameter-tuning, 18 search-hardcode, 16 evaluation-hacking, seven other, and three validated novel-approach solutions."
    >
      {MODELS.map((model, index) => {
        const x = MOBILE_MODEL_X[index];
        const endX = MOBILE_CENTER_X + (index - 3) * 7;
        const d = `M ${x} 57 C ${x} 102, ${endX} 102, ${endX} 124`;

        return (
          <g key={model.key} aria-hidden="true">
            <FlowPath
              d={d}
              color={model.color}
              width={1.45}
              delay={0.04 + index * 0.04}
              reduceMotion={reduceMotion}
              opacity={0.58}
            />
            <motion.g
              initial={reduceMotion ? false : { opacity: 0, y: -5 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{
                duration: reduceMotion ? 0 : 0.38,
                delay: reduceMotion ? 0 : index * 0.03,
              }}
            >
              <foreignObject x={x - 12} y="24" width="24" height="24">
                <div className="flex h-6 w-6 items-center justify-center">
                  <ModelIcon model={model} size={21} />
                </div>
              </foreignObject>
              <circle cx={x} cy="57" r="2.4" fill={model.color} />
            </motion.g>
          </g>
        );
      })}

      {BRANCHES.map((branch, index) => {
        const startX = MOBILE_CENTER_X + MOBILE_BRANCH_OFFSETS[index];
        const startY = MOBILE_CENTER_Y + 47;
        const endY = branch.mobileY - 12;
        const d = `M ${startX} ${startY} C ${startX} ${startY + 35}, ${branch.mobileX} ${endY - 38}, ${branch.mobileX} ${endY}`;
        const isHacking = branch.key === "evaluationHacking";
        const isNovel = branch.key === "novelApproach";
        const isEmphasized = isHacking || isNovel;
        const hasSecondLine = Boolean(branch.mobileLabel[1]);

        return (
          <g key={branch.key} aria-hidden="true">
            <FlowPath
              d={d}
              color={branch.color}
              width={branchWidth(branch.count) * 0.78}
              delay={0.55 + index * 0.065}
              reduceMotion={reduceMotion}
              opacity={branch.key === "other" ? 0.45 : 0.52}
            />
            <motion.g
              initial={reduceMotion ? false : { opacity: 0, y: -5 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{
                duration: reduceMotion ? 0 : 0.44,
                delay: reduceMotion ? 0 : 0.86 + index * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <circle
                cx={branch.mobileX}
                cy={endY}
                r="5"
                fill="var(--surface)"
                stroke={branch.color}
                strokeWidth="1.3"
              />
              <circle cx={branch.mobileX} cy={endY} r="2" fill={branch.color} />
              <text
                x={branch.mobileX}
                y={branch.mobileY + 11}
                textAnchor="middle"
                fill={isEmphasized ? branch.color : "var(--foreground)"}
                fontFamily="var(--font-mono)"
                fontSize={isNovel ? "18" : "20"}
                fontWeight={isEmphasized ? "720" : "650"}
                letterSpacing="-0.04em"
              >
                {branch.count}
              </text>
              <text
                x={branch.mobileX}
                y={branch.mobileY + 32}
                textAnchor="middle"
                fill={isEmphasized ? branch.color : "var(--foreground)"}
                fontSize={isNovel ? "18" : "9.5"}
                fontWeight={isEmphasized ? "700" : "600"}
              >
                {branch.mobileLabel.map((line, lineIndex) => (
                  <tspan
                    key={`${branch.key}-${lineIndex}`}
                    x={branch.mobileX}
                    dy={lineIndex === 0 ? 0 : 12}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
              <text
                x={branch.mobileX}
                y={branch.mobileY + (hasSecondLine ? 58 : 49)}
                textAnchor="middle"
                fill="var(--muted)"
                fontFamily="var(--font-mono)"
                fontSize="8.5"
              >
                {percentOfTotal(branch.count)}
              </text>
            </motion.g>
          </g>
        );
      })}

      <motion.g
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.82 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{
          duration: reduceMotion ? 0 : 0.5,
          delay: reduceMotion ? 0 : 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ transformOrigin: `${MOBILE_CENTER_X}px ${MOBILE_CENTER_Y}px` }}
      >
        <circle
          cx={MOBILE_CENTER_X}
          cy={MOBILE_CENTER_Y}
          r="53"
          fill="var(--accent-soft)"
          fillOpacity="0.4"
        />
        <circle
          cx={MOBILE_CENTER_X}
          cy={MOBILE_CENTER_Y}
          r="45"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeOpacity="0.32"
        />
        <text
          x={MOBILE_CENTER_X}
          y={MOBILE_CENTER_Y - 2}
          textAnchor="middle"
          fill="var(--foreground)"
          fontFamily="var(--font-mono)"
          fontSize="25"
          fontWeight="650"
          letterSpacing="-0.05em"
        >
          252
        </text>
        <text
          x={MOBILE_CENTER_X}
          y={MOBILE_CENTER_Y + 17}
          textAnchor="middle"
          fill="var(--muted)"
          fontSize="8.5"
          fontWeight="600"
          letterSpacing="0.03em"
        >
          SOLUTIONS
        </text>
      </motion.g>
    </svg>
  );
}

export function NoveltyVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <figure
      className="relative overflow-hidden"
      aria-labelledby="home-novelty-title"
      aria-describedby="home-novelty-caption"
    >
      <h3 id="home-novelty-title" className="sr-only">
        Solution nature across 252 solutions
      </h3>

      <div className="hidden md:block">
        <DesktopFlow reduceMotion={reduceMotion} />
      </div>
      <div className="md:hidden">
        <MobileFlow reduceMotion={reduceMotion} />
      </div>

      <figcaption
        id="home-novelty-caption"
        className="mx-auto max-w-[62ch] px-1 pt-3 text-[11px] leading-5 text-muted md:pt-1"
      >
        Most solutions reuse or recombine established techniques. Three task-specific approaches
        remain novel after fixed-rubric classification and manual review.
      </figcaption>

      <table className="sr-only">
        <caption>Solution nature among 252 solutions</caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col">Total</th>
            <th scope="col">Parameter tuning</th>
            <th scope="col">Training signal / data engineering</th>
            <th scope="col">Structural swap</th>
            <th scope="col">Composition stacking</th>
            <th scope="col">Search and hardcode</th>
            <th scope="col">Evaluation hacking</th>
            <th scope="col">Other</th>
            <th scope="col">Validated novel approaches</th>
          </tr>
        </thead>
        <tbody>
          {solutionRows.map((row) => (
            <tr key={row.model.key}>
              <th scope="row">{row.model.name}</th>
              <td>{row.total}</td>
              <td>{row.paramTune}</td>
              <td>{row.trainingSignal}</td>
              <td>{row.structuralSwap}</td>
              <td>{row.compositionStacking}</td>
              <td>{row.searchHardcode}</td>
              <td>{row.evaluationHacking}</td>
              <td>{row.other}</td>
              <td>{row.novelApproach}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Total</th>
            <td>{novelty.total}</td>
            <td>{totalForCategory("paramTune")}</td>
            <td>{totalForCategory("trainingSignal")}</td>
            <td>{totalForCategory("structuralSwap")}</td>
            <td>{totalForCategory("compositionStacking")}</td>
            <td>{totalForCategory("searchHardcode")}</td>
            <td>{totalForCategory("evaluationHacking")}</td>
            <td>{totalForCategory("other")}</td>
            <td>{totalForCategory("novelApproach")}</td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}

export default NoveltyVisual;
