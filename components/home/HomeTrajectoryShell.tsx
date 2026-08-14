"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  type MotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

export interface HomeTrajectoryShellProps {
  children: ReactNode;
  className?: string;
}

interface TrajectoryPoint {
  x: number;
  y: number;
}

interface TrajectorySegment {
  d: string;
  start: number;
  end: number;
}

interface TrajectoryNode extends TrajectoryPoint {
  at: number;
}

interface TrajectoryGeometry {
  width: number;
  height: number;
  segments: TrajectorySegment[];
  nodes: TrajectoryNode[];
}

const KEYWORD_SELECTOR = ".home-trajectory-keyword[data-trajectory-keyword]";
const TANGENT_DIRECTIONS = [0.52, -0.34, 0.42, -0.4, 0.52, 0.16, -0.12] as const;

/**
 * A responsive trajectory that follows the Home narrative itself. Its points
 * are measured from the hero score and the highlighted words, so the curve
 * remains meaningful when headings wrap or a section changes height.
 */
export function HomeTrajectoryShell({
  children,
  className = "",
}: HomeTrajectoryShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<TrajectoryGeometry | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: shellRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    let frame = 0;
    let disposed = false;

    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (disposed) return;
        const nextGeometry = measureTrajectory(shell);
        if (nextGeometry) setGeometry(nextGeometry);
      });
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(shell);
    shell
      .querySelectorAll<HTMLElement>(`${KEYWORD_SELECTOR}, .home-hero`)
      .forEach((element) => resizeObserver.observe(element));

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);
    measure();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      viewport?.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className={`home-trajectory-shell relative isolate overflow-clip ${className}`.trim()}
    >
      <div
        aria-hidden="true"
        className="home-trajectory-spine pointer-events-none absolute inset-0"
      >
        {geometry ? (
          <svg
            className="home-trajectory-canvas"
            width={geometry.width}
            height={geometry.height}
            viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          >
            {geometry.segments.map((segment, index) => (
              <TrajectoryPath
                key={`${index}-${segment.d}`}
                segment={segment}
                progress={scrollYProgress}
                reduceMotion={Boolean(reduceMotion)}
              />
            ))}
            {geometry.nodes.map((node, index) => (
              <KeywordNode
                key={`${index}-${node.x}-${node.y}`}
                node={node}
                progress={scrollYProgress}
                reduceMotion={Boolean(reduceMotion)}
              />
            ))}
          </svg>
        ) : null}
      </div>

      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

function TrajectoryPath({
  segment,
  progress,
  reduceMotion,
}: {
  segment: TrajectorySegment;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const pathLength = useTransform(
    progress,
    [segment.start, segment.end],
    [0, 1],
    { clamp: true },
  );

  return (
    <>
      <path className="home-trajectory-guide" d={segment.d} />
      <motion.path
        className="home-trajectory-active"
        d={segment.d}
        style={{ pathLength: reduceMotion ? 1 : pathLength }}
      />
    </>
  );
}

function KeywordNode({
  node,
  progress,
  reduceMotion,
}: {
  node: TrajectoryNode;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const opacity = useTransform(
    progress,
    [Math.max(0, node.at - 0.018), node.at],
    [0, 0.66],
    { clamp: true },
  );

  return (
    <motion.circle
      className="home-trajectory-node"
      cx={node.x}
      cy={node.y}
      r="5.5"
      style={{ opacity: reduceMotion ? 0.36 : opacity }}
    />
  );
}

function measureTrajectory(shell: HTMLDivElement): TrajectoryGeometry | null {
  const shellRect = shell.getBoundingClientRect();
  const width = Math.max(1, shell.clientWidth);
  const height = Math.max(1, shell.scrollHeight);
  const heroPoint = measureHeroScore(shell, shellRect) ?? {
    x: width * 0.82,
    y: Math.min(height * 0.1, 520),
  };
  const keywordPoints = Array.from(
    shell.querySelectorAll<HTMLElement>(KEYWORD_SELECTOR),
  ).map((element) => {
    const keyword = element.dataset.trajectoryKeyword ?? "";
    const rect = measureKeyword(element, keyword);
    return {
      x: clamp(rect.left - shellRect.left + rect.width * 0.52, 18, width - 18),
      y: clamp(rect.top - shellRect.top + rect.height * 0.58, 18, height - 18),
    };
  });

  if (keywordPoints.length === 0) return null;

  const lastKeyword = keywordPoints.at(-1)!;
  const tailRoom = Math.max(24, height - lastKeyword.y - 20);
  const tailPoint = {
    x: clamp(width * (width < 640 ? 0.76 : 0.58), 18, width - 18),
    y: clamp(lastKeyword.y + Math.min(220, tailRoom), lastKeyword.y, height - 12),
  };
  const points = [heroPoint, ...keywordPoints, tailPoint];
  const paths = points.slice(0, -1).map((point, index) =>
    curvedSegment(
      point,
      points[index + 1],
      width,
      TANGENT_DIRECTIONS[index] ?? 0.2,
      TANGENT_DIRECTIONS[index + 1] ?? -0.12,
    ),
  );
  const maxScroll = Math.max(1, height - window.innerHeight);
  const pointProgress = (point: TrajectoryPoint) =>
    clamp((point.y - window.innerHeight * 0.56) / maxScroll, 0, 1);
  const segments = paths.map((d, index) => {
    const naturalStart = index === 0 ? 0 : pointProgress(points[index]);
    const naturalEnd = pointProgress(points[index + 1]);
    return {
      d,
      start: Math.min(naturalStart, 0.985),
      end: clamp(Math.max(naturalEnd, naturalStart + 0.035), 0.035, 1),
    };
  });

  return {
    width,
    height,
    segments,
    nodes: keywordPoints.map((point) => ({
      ...point,
      at: pointProgress(point),
    })),
  };
}

function measureHeroScore(
  shell: HTMLDivElement,
  shellRect: DOMRect,
): TrajectoryPoint | null {
  const heroSvg = shell.querySelector<SVGSVGElement>(
    'svg[aria-labelledby~="home-hero-visual-title"]',
  );
  if (!heroSvg) return null;

  const scoreTarget = heroSvg.querySelector<SVGGraphicsElement>(
    '[data-home-trajectory-anchor="final-score"]',
  );
  if (!scoreTarget) return null;

  const rect = scoreTarget.getBoundingClientRect();
  return {
    x: rect.left - shellRect.left + rect.width / 2,
    y: rect.top - shellRect.top + rect.height / 2,
  };
}

function measureKeyword(element: HTMLElement, keyword: string): DOMRect {
  const needle = keyword.toLocaleLowerCase();
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const value = node.textContent ?? "";
    const index = value.toLocaleLowerCase().indexOf(needle);
    if (index >= 0 && needle.length > 0) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + needle.length);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }
    node = walker.nextNode();
  }

  return element.getBoundingClientRect();
}

function curvedSegment(
  start: TrajectoryPoint,
  end: TrajectoryPoint,
  width: number,
  startDirection: number,
  endDirection: number,
): string {
  const deltaY = Math.max(80, end.y - start.y);
  const verticalReach = clamp(deltaY * 0.34, 84, width < 640 ? 190 : 360);
  const lateralReach = clamp(
    deltaY * (width < 640 ? 0.1 : 0.2),
    width < 640 ? 38 : 110,
    width * (width < 640 ? 0.28 : 0.4),
  );
  const edge = width < 640 ? 10 : 24;
  const controlOneX = clamp(
    start.x + startDirection * lateralReach,
    edge,
    width - edge,
  );
  const controlTwoX = clamp(
    end.x - endDirection * lateralReach,
    edge,
    width - edge,
  );

  return [
    `M ${round(start.x)} ${round(start.y)}`,
    `C ${round(controlOneX)} ${round(start.y + verticalReach)}`,
    `${round(controlTwoX)} ${round(end.y - verticalReach)}`,
    `${round(end.x)} ${round(end.y)}`,
  ].join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export default HomeTrajectoryShell;
