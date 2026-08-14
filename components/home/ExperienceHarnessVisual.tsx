"use client";

import { useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";

import { ModelIcon } from "@/components/ModelIcon";
import { IN_TASK, INTER_TASK, MODELS } from "@/lib/benchmark-data";
import { HARNESS_COMPARISON, type HarnessKind } from "@/lib/paper-data";

const WIDTH = 820;
const HEIGHT = 520;
const ROW_START = 101;
const ROW_GAP = 34;
const SAME_ZERO = 210;
const NEW_ZERO = 526;
const NEGATIVE_WIDTH = 42;
const POSITIVE_WIDTH = 174;
const POSITIVE_MAX = 0.15;
const NEGATIVE_MAX = 0.03;

const EXPERIENCE_MODELS = MODELS.map((model) => ({
  model,
  intra: IN_TASK[model.key],
  inter: INTER_TASK[model.key],
}));

const HARNESS_MODELS = ["gpt", "kimi"] as const;

function harnessGap(model: (typeof HARNESS_MODELS)[number], kind: HarnessKind) {
  const row = HARNESS_COMPARISON.rows.find(
    (item) => item.model === model && item.kind === kind,
  );
  if (!row) throw new Error(`Missing ${kind} harness row for ${model}`);
  return row.overall.best3 - row.overall.avg3;
}

const sharedGap =
  HARNESS_MODELS.reduce((sum, model) => sum + harnessGap(model, "shared"), 0) /
  HARNESS_MODELS.length;
const nativeGap =
  HARNESS_MODELS.reduce((sum, model) => sum + harnessGap(model, "native"), 0) /
  HARNESS_MODELS.length;

const intraPositive = EXPERIENCE_MODELS.filter(({ intra }) => intra.gain > 0).length;
const interPositive = EXPERIENCE_MODELS.filter(({ inter }) => inter.gain > 0).length;

function gainLabel(gain: number) {
  return `${gain >= 0 ? "+" : ""}${gain.toFixed(3)}`;
}

function barGeometry(zero: number, gain: number) {
  if (gain >= 0) {
    return {
      x: zero,
      width: Math.max(2, (gain / POSITIVE_MAX) * POSITIVE_WIDTH),
      origin: "left center",
    };
  }

  const width = Math.max(2, (Math.abs(gain) / NEGATIVE_MAX) * NEGATIVE_WIDTH);
  return { x: zero - width, width, origin: "right center" };
}

export function ExperienceHarnessVisual() {
  const reduceMotion = useReducedMotion();
  const [activeModel, setActiveModel] = useState<string | null>(null);

  return (
    <figure
      className="home-visual-surface bg-surface/95"
      aria-labelledby="home-experience-title"
      aria-describedby="home-experience-caption"
    >
      <div className="px-4 pb-1 pt-4 sm:px-6 sm:pt-6">
        <h3 id="home-experience-title" className="text-sm font-semibold tracking-[-0.02em]">
          Experience gains and harness reliability
        </h3>
        <p className="mt-1 text-xs leading-5 text-muted">
          Signed reward change from retained experience, followed by the peak-to-average gap.
        </p>
      </div>

      <div className="space-y-7 px-4 pb-2 pt-4 sm:hidden">
        <MobileExperiencePanel
          title="Intra-Task Experience Reuse"
          summary={`${intraPositive} of 7 positive`}
          getGain={(row) => row.intra.gain}
          reduceMotion={Boolean(reduceMotion)}
        />
        <MobileExperiencePanel
          title="Inter-Task Experience Reuse"
          summary={`${interPositive} of 7 positive`}
          getGain={(row) => row.inter.gain}
          reduceMotion={Boolean(reduceMotion)}
        />
        <MobileHarnessBars reduceMotion={Boolean(reduceMotion)} />
      </div>

      <div className="hidden px-2 sm:block sm:px-4">
        <svg
          className="block h-auto w-full overflow-visible"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Diverging bars for intra-task and inter-task experience reuse across seven models, followed by two bars comparing harness reliability gaps"
        >
          <ExperiencePanelHeader
            x="166"
            zero={SAME_ZERO}
            title="Intra-Task Experience Reuse"
          />
          <ExperiencePanelHeader
            x="482"
            zero={NEW_ZERO}
            title="Inter-Task Experience Reuse"
          />

          <line
            x1={SAME_ZERO}
            x2={SAME_ZERO}
            y1="79"
            y2="324"
            stroke="color-mix(in srgb, var(--foreground) 32%, var(--border))"
            strokeWidth="1"
          />
          <line
            x1={NEW_ZERO}
            x2={NEW_ZERO}
            y1="79"
            y2="324"
            stroke="color-mix(in srgb, var(--foreground) 32%, var(--border))"
            strokeWidth="1"
          />

          {EXPERIENCE_MODELS.map(({ model, intra, inter }, index) => {
            const y = ROW_START + index * ROW_GAP;
            const dimmed = activeModel !== null && activeModel !== model.key;
            const selected = activeModel === model.key;

            return (
              <motion.g
                key={model.key}
                role="img"
                tabIndex={0}
                aria-label={`${model.name}: intra-task experience gain ${gainLabel(intra.gain)}, inter-task experience gain ${gainLabel(inter.gain)}`}
                onHoverStart={() => setActiveModel(model.key)}
                onHoverEnd={() => setActiveModel(null)}
                onFocus={() => setActiveModel(model.key)}
                onBlur={() => setActiveModel(null)}
                animate={{ opacity: dimmed ? 0.24 : 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                style={{ outline: "none" }}
              >
                <rect
                  x="7"
                  y={y - 14}
                  width="806"
                  height="28"
                  rx="8"
                  fill={selected ? "var(--accent-soft)" : "transparent"}
                />
                <foreignObject x="18" y={y - 11} width="24" height="24" aria-hidden="true">
                  <div>
                    <ModelIcon model={model} size={22} />
                  </div>
                </foreignObject>
                <text
                  x="49"
                  y={y + 3.5}
                  fill="var(--foreground)"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  {model.short}
                </text>

                <ExperienceBar
                  zero={SAME_ZERO}
                  y={y}
                  gain={intra.gain}
                  color={model.color}
                  valueX={444}
                  index={index}
                  reduceMotion={Boolean(reduceMotion)}
                  selected={selected}
                />
                <ExperienceBar
                  zero={NEW_ZERO}
                  y={y}
                  gain={inter.gain}
                  color={model.color}
                  valueX={760}
                  index={index + 2}
                  reduceMotion={Boolean(reduceMotion)}
                  selected={selected}
                />
              </motion.g>
            );
          })}

          <text x="166" y="346" fill="var(--accent)" fontSize="10" fontWeight="700">
            {intraPositive} of 7 positive
          </text>
          <text x="482" y="346" fill="var(--accent)" fontSize="10" fontWeight="700">
            {interPositive} of 7 positive
          </text>

          <line x1="18" x2="802" y1="372" y2="372" stroke="var(--border)" strokeWidth="1" />
          <text x="18" y="405" fill="var(--foreground)" fontSize="11" fontWeight="650">
            Harness reliability
          </text>
          <text x="18" y="424" fill="var(--muted)" fontSize="8.5">
            Mean best@3 minus avg@3 for GPT-5.5 and Kimi-K2.7-Code. Lower is more consistent.
          </text>

          <HarnessBars reduceMotion={Boolean(reduceMotion)} />
        </svg>
      </div>

      <figcaption
        id="home-experience-caption"
        className="px-4 pb-4 pt-2 text-[11px] leading-5 text-muted sm:px-6 sm:pb-5"
      >
        Retained experience helps six models in the intra-task setting and five in the inter-task
        setting. For GPT-5.5 and Kimi-K2.7-Code, model-native harnesses narrow the mean
        peak-to-average gap from {sharedGap.toFixed(3)} to {nativeGap.toFixed(3)}.
      </figcaption>

      <table className="sr-only">
        <caption>Experience gains and harness reliability gap</caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col">Intra-task experience gain</th>
            <th scope="col">Inter-task experience gain</th>
          </tr>
        </thead>
        <tbody>
          {EXPERIENCE_MODELS.map(({ model, intra, inter }) => (
            <tr key={model.key}>
              <th scope="row">{model.name}</th>
              <td>{intra.gain.toFixed(4)}</td>
              <td>{inter.gain.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">
              GPT-5.5 and Kimi-K2.7-Code, Claude Code mean peak-to-average gap
            </th>
            <td colSpan={2}>{sharedGap.toFixed(3)}</td>
          </tr>
          <tr>
            <th scope="row">
              GPT-5.5 and Kimi-K2.7-Code, model-native mean peak-to-average gap
            </th>
            <td colSpan={2}>{nativeGap.toFixed(3)}</td>
          </tr>
        </tfoot>
      </table>
    </figure>
  );
}

function ExperiencePanelHeader({
  x,
  zero,
  title,
}: {
  x: number | string;
  zero: number;
  title: string;
}) {
  return (
    <>
      <text x={x} y="45" fill="var(--foreground)" fontSize="10.5" fontWeight="650">
        {title}
      </text>
      <text x={zero - 8} y="67" textAnchor="end" fill="var(--muted)" fontSize="8.5">
        harms
      </text>
      <text x={zero + 8} y="67" fill="var(--muted)" fontSize="8.5">
        helps
      </text>
    </>
  );
}

function ExperienceBar({
  zero,
  y,
  gain,
  color,
  valueX,
  index,
  reduceMotion,
  selected,
}: {
  zero: number;
  y: number;
  gain: number;
  color: string;
  valueX: number;
  index: number;
  reduceMotion: boolean;
  selected: boolean;
}) {
  const geometry = barGeometry(zero, gain);
  const positive = gain >= 0;
  const transformStyle = {
    transformBox: "fill-box",
    transformOrigin: geometry.origin,
  } as CSSProperties;

  return (
    <>
      <motion.rect
        x={geometry.x}
        y={y - 5}
        width={geometry.width}
        height="10"
        rx="3"
        fill={positive ? color : "var(--surface)"}
        fillOpacity={positive ? (selected ? 1 : 0.78) : 1}
        stroke={positive ? color : "var(--foreground)"}
        strokeWidth={positive ? 0 : 1.25}
        strokeDasharray={positive ? undefined : "3 2"}
        style={transformStyle}
        initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.65 }}
        transition={{
          duration: reduceMotion ? 0 : 0.55,
          delay: reduceMotion ? 0 : index * 0.035,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
      <text
        x={valueX}
        y={y + 3.5}
        textAnchor="end"
        fill={selected ? "var(--accent)" : "var(--muted)"}
        fontFamily="var(--font-mono)"
        fontSize="8.5"
        fontWeight={selected ? "700" : "500"}
      >
        {gainLabel(gain)}
      </text>
    </>
  );
}

function MobileExperiencePanel({
  title,
  summary,
  getGain,
  reduceMotion,
}: {
  title: string;
  summary: string;
  getGain: (row: (typeof EXPERIENCE_MODELS)[number]) => number;
  reduceMotion: boolean;
}) {
  return (
    <section aria-label={`${title} gains`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <h4 className="text-xs font-semibold leading-4 text-foreground">{title}</h4>
        <span className="text-[11px] font-semibold text-accent">{summary}</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {EXPERIENCE_MODELS.map((row, index) => {
          const gain = getGain(row);
          const geometry = barGeometry(0, gain);
          const positive = gain >= 0;
          const zeroPercent = (NEGATIVE_WIDTH / (NEGATIVE_WIDTH + POSITIVE_WIDTH)) * 100;
          const widthPercent = (geometry.width / (NEGATIVE_WIDTH + POSITIVE_WIDTH)) * 100;
          const leftPercent = positive ? zeroPercent : zeroPercent - widthPercent;

          return (
            <div
              key={row.model.key}
              className="grid grid-cols-[5.6rem_minmax(0,1fr)_2.75rem] items-center gap-2"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold">
                <ModelIcon model={row.model} size={19} />
                <span className="truncate">{row.model.short}</span>
              </span>
              <span className="relative block h-4" aria-hidden="true">
                <span
                  className="absolute bottom-0 top-0 border-l border-foreground/25"
                  style={{ left: `${zeroPercent}%` }}
                />
                <motion.span
                  className="absolute top-[4px] h-2 rounded-[3px]"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: positive ? row.model.color : "var(--surface)",
                    border: positive ? undefined : "1px dashed var(--foreground)",
                    transformOrigin: positive ? "left center" : "right center",
                  }}
                  initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: positive ? 0.82 : 1 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.5,
                    delay: reduceMotion ? 0 : index * 0.035,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </span>
              <span className="text-right font-mono text-[10px] font-medium text-muted">
                {gainLabel(gain)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HarnessBars({ reduceMotion }: { reduceMotion: boolean }) {
  const baseline = 490;
  const maxHeight = 76;
  const sharedHeight = (sharedGap / 0.15) * maxHeight;
  const nativeHeight = (nativeGap / 0.15) * maxHeight;

  return (
    <g role="img" aria-label={`Harness reliability gap falls from ${sharedGap.toFixed(3)} to ${nativeGap.toFixed(3)}`}>
      <line x1="454" x2="770" y1={baseline} y2={baseline} stroke="var(--border)" strokeWidth="1" />
      <VerticalHarnessBar
        x={510}
        baseline={baseline}
        height={sharedHeight}
        value={sharedGap}
        label="Claude Code"
        reduceMotion={reduceMotion}
      />
      <motion.path
        d="M 592 451 C 610 439, 625 439, 644 451"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.75 }}
        viewport={{ once: true, amount: 0.75 }}
        transition={{ duration: reduceMotion ? 0 : 0.48, delay: reduceMotion ? 0 : 0.32 }}
      />
      <path d="M 640 447 L 645 451 L 640 455" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      <VerticalHarnessBar
        x={672}
        baseline={baseline}
        height={nativeHeight}
        value={nativeGap}
        label="Model-native"
        reduceMotion={reduceMotion}
        emphasized
      />
    </g>
  );
}

function VerticalHarnessBar({
  x,
  baseline,
  height,
  value,
  label,
  reduceMotion,
  emphasized = false,
}: {
  x: number;
  baseline: number;
  height: number;
  value: number;
  label: string;
  reduceMotion: boolean;
  emphasized?: boolean;
}) {
  const style = { transformBox: "fill-box", transformOrigin: "center bottom" } as CSSProperties;

  return (
    <g>
      <motion.rect
        x={x}
        y={baseline - height}
        width="48"
        height={height}
        rx="5"
        fill={emphasized ? "var(--accent)" : "var(--foreground)"}
        fillOpacity={emphasized ? 0.9 : 0.38}
        style={style}
        initial={reduceMotion ? false : { scaleY: 0, opacity: 0 }}
        whileInView={{ scaleY: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: reduceMotion ? 0 : 0.62, ease: [0.16, 1, 0.3, 1] }}
      />
      <text
        x={x + 24}
        y={baseline - height - 9}
        textAnchor="middle"
        fill={emphasized ? "var(--accent)" : "var(--foreground)"}
        fontFamily="var(--font-mono)"
        fontSize="10"
        fontWeight="700"
      >
        {value.toFixed(3)}
      </text>
      <text x={x + 24} y={baseline + 19} textAnchor="middle" fill="var(--muted)" fontSize="8.5">
        {label}
      </text>
    </g>
  );
}

function MobileHarnessBars({ reduceMotion }: { reduceMotion: boolean }) {
  const max = 0.15;

  return (
    <section className="pt-1" aria-label="Harness reliability comparison">
      <h4 className="text-xs font-semibold text-foreground">Harness reliability</h4>
      <p className="mt-1 text-[11px] leading-4 text-muted">
        Mean peak-to-average gap for GPT-5.5 and Kimi-K2.7-Code. Lower is more consistent.
      </p>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-4 px-5">
        {[
          { label: "Claude Code", value: sharedGap, emphasized: false },
          { label: "Model-native", value: nativeGap, emphasized: true },
        ].map((item, index) => (
          <div
            key={item.label}
            className={index === 0 ? "col-start-1" : "col-start-3"}
          >
            <span
              className={`block text-center font-mono text-sm font-semibold ${item.emphasized ? "text-accent" : "text-foreground"}`}
            >
              {item.value.toFixed(3)}
            </span>
            <div className="mt-1 flex h-16 items-end justify-center border-b border-border">
              <motion.span
                className={`block w-12 rounded-t-[5px] ${item.emphasized ? "bg-accent" : "bg-foreground/35"}`}
                style={{ height: `${(item.value / max) * 100}%`, transformOrigin: "center bottom" }}
                initial={reduceMotion ? false : { scaleY: 0, opacity: 0 }}
                whileInView={{ scaleY: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.58,
                  delay: reduceMotion ? 0 : index * 0.16,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>
            <span className="mt-2 block text-center text-[10px] leading-4 text-muted">
              {item.label}
            </span>
          </div>
        ))}
        <span className="col-start-2 row-start-1 self-center text-lg text-accent" aria-hidden="true">
          →
        </span>
      </div>
    </section>
  );
}

export default ExperienceHarnessVisual;
