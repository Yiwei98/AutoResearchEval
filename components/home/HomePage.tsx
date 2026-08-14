import Link from "next/link";
import { LegacyBlogHashRedirect } from "@/components/LegacyBlogHashRedirect";
import { PAPER_SCALE } from "@/lib/paper-data";
import { withBasePath } from "@/lib/base-path";
import { SITE_RESOURCES } from "@/lib/site-config";
import { ExperienceHarnessVisual } from "./ExperienceHarnessVisual";
import { HomeEndmatter } from "./HomeEndmatter";
import { HomeHeroVisual } from "./HomeHeroVisual";
import { HomeProcessVisual } from "./HomeProcessVisual";
import { HomeReveal } from "./HomeReveal";
import { HomeTrajectoryShell } from "./HomeTrajectoryShell";
import { NoveltyVisual } from "./NoveltyVisual";
import { ReliabilityGapVisual } from "./ReliabilityGapVisual";

const scaleFacts = [
  { value: PAPER_SCALE.models.toLocaleString(), label: "frontier models" },
  { value: PAPER_SCALE.tasks.toLocaleString(), label: "long-horizon tasks" },
  {
    value: PAPER_SCALE.baselineTrajectories.toLocaleString(),
    label: "baseline trajectories",
  },
] as const;

const homeResourceButtonClass =
  "home-cta inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-foreground/15 bg-background/80 px-5 py-3 text-sm font-semibold text-foreground transition-[transform,border-color,background-color] duration-200 hover:border-foreground/35 hover:bg-surface active:translate-y-px";

export function HomePage() {
  return (
    <>
      <LegacyBlogHashRedirect />
      <HomeTrajectoryShell>
        <article className="home-story relative overflow-hidden">
          <section className="home-hero mx-auto grid max-w-[90rem] items-center gap-6 px-5 py-7 sm:px-8 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-6 lg:px-12 lg:py-14">
            <HomeReveal className="relative z-10 max-w-[38rem]">
              <h1 className="home-title text-balance text-[clamp(3.05rem,5.7vw,5.35rem)] font-semibold leading-[0.96] tracking-[-0.045em]">
                Beyond
                <br />
                Final Scores
              </h1>
              <p className="mt-6 max-w-[36ch] text-pretty text-sm font-semibold leading-6 text-foreground/75 sm:text-base">
                A systematic evaluation of agents for long-horizon AI research and development.
              </p>
              <p className="mt-3 max-w-[25ch] text-pretty text-xl leading-7 tracking-[-0.025em] text-muted sm:text-2xl sm:leading-8">
                The path reveals what the score hides.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/blog" className={homeResourceButtonClass}>
                  Blog
                </Link>
                <a
                  href={withBasePath(SITE_RESOURCES.paperUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className={homeResourceButtonClass}
                >
                  Paper
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <Link href="/trajectories" className={homeResourceButtonClass}>
                  Trajectories
                </Link>
              </div>
            </HomeReveal>

            <HomeHeroVisual />
          </section>

          <section
            aria-label="Study scale"
            className="relative z-10 mx-auto max-w-[82rem] px-5 pb-24 sm:px-8 sm:pb-32 lg:px-12"
          >
            <HomeReveal>
              <dl className="home-scale-ledger grid items-end gap-x-8 gap-y-7 border-l border-accent/35 pl-5 sm:grid-cols-[0.65fr_1fr_1.55fr] sm:pl-7">
                {scaleFacts.map((fact) => (
                  <div key={fact.label} className="min-w-0">
                    <dt className="text-sm leading-5 text-muted">{fact.label}</dt>
                    <dd className="mt-1 font-mono text-[clamp(2rem,5vw,4.4rem)] font-medium leading-none tracking-[-0.07em] text-accent">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </HomeReveal>
          </section>

          <section className="home-scene relative z-10 mx-auto grid max-w-[86rem] items-center gap-10 px-5 py-[clamp(4rem,7vw,7rem)] sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-12">
            <HomeReveal className="max-w-[31rem]">
              <h2 className="text-balance text-[clamp(2.4rem,4.8vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
                Peak performance is not{" "}
                <span className="home-trajectory-keyword" data-trajectory-keyword="reliability">
                  reliability.
                </span>
              </h2>
              <p className="mt-6 max-w-[38ch] text-pretty text-base leading-7 text-muted sm:text-lg">
                Many models can find a strong solution once. Reaching it consistently is what
                separates them.
              </p>
              <div className="mt-9 grid max-w-sm grid-cols-[1fr_auto_1fr] items-end gap-4" aria-label="Reliability gap summary">
                <div>
                  <span className="block font-mono text-3xl font-medium tracking-[-0.05em] text-accent">0.237</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">avg@3 spread</span>
                </div>
                <span className="pb-6 text-border" aria-hidden="true">/</span>
                <div>
                  <span className="block font-mono text-3xl font-medium tracking-[-0.05em]">0.122</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">best@3 spread</span>
                </div>
              </div>
            </HomeReveal>
            <HomeReveal className="home-visual-lift" delay={0.08}>
              <ReliabilityGapVisual />
            </HomeReveal>
          </section>

          <section className="home-scene home-process-scene relative z-10 mx-auto max-w-[88rem] px-5 py-[clamp(4rem,7vw,7rem)] sm:px-8 lg:px-12">
            <HomeReveal className="mx-auto max-w-[47rem] text-center">
              <h2 className="text-balance text-[clamp(2.5rem,5vw,4.9rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
                Look inside the{" "}
                <span className="home-trajectory-keyword" data-trajectory-keyword="loop">
                  loop.
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-[52ch] text-pretty text-base leading-7 text-muted sm:text-lg">
                Similar outcomes can hide different choices, implementation quality, and recovery
                behavior.
              </p>
            </HomeReveal>
            <HomeReveal className="mt-10 sm:mt-12" delay={0.06}>
              <HomeProcessVisual />
            </HomeReveal>
          </section>

          <section className="home-scene relative z-10 mx-auto grid max-w-[88rem] items-center gap-12 px-5 py-[clamp(4rem,7vw,7rem)] sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-12">
            <HomeReveal className="max-w-[32rem]">
              <h2 className="text-balance text-[clamp(2.4rem,4.8vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
                The{" "}
                <span className="home-trajectory-keyword" data-trajectory-keyword="path">
                  path
                </span>{" "}
                is shaped by what surrounds it.
              </h2>
              <p className="mt-6 max-w-[40ch] text-pretty text-base leading-7 text-muted sm:text-lg">
                Experience can help or mislead. Harnesses mainly make existing capability more
                reliable.
              </p>
              <p className="mt-8 max-w-[36ch] border-l border-accent/40 pl-5 text-sm leading-6 text-foreground/75">
                Six of seven models benefit from retained intra-task experience, while transfer
                across tasks remains unstable.
              </p>
            </HomeReveal>
            <HomeReveal className="home-visual-lift" delay={0.08}>
              <ExperienceHarnessVisual />
            </HomeReveal>
          </section>

          <section className="home-scene relative z-10 mx-auto max-w-[88rem] px-5 py-[clamp(4rem,7vw,7rem)] sm:px-8 lg:px-12">
            <div className="grid items-start gap-12 lg:grid-cols-[0.65fr_1.35fr]">
              <HomeReveal className="max-w-[31rem] lg:pt-16">
                <h2 className="text-balance text-[clamp(2.5rem,5vw,4.9rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
                  Improvement rarely means{" "}
                  <span className="home-trajectory-keyword" data-trajectory-keyword="invention">
                    invention.
                  </span>
                </h2>
                <p className="mt-6 max-w-[39ch] text-pretty text-base leading-7 text-muted sm:text-lg">
                  Agents usually recombine established techniques. Only three solutions remain
                  novel after manual review.
                </p>
              </HomeReveal>
              <HomeReveal className="home-visual-lift" delay={0.08}>
                <NoveltyVisual />
              </HomeReveal>
            </div>

            <HomeReveal className="home-conclusion mt-16 sm:mt-24">
              <div className="mx-auto max-w-[86rem] text-center">
                <div className="home-conclusion-line" aria-hidden="true">
                  <span className="home-conclusion-line-node" />
                </div>
                <p className="relative mx-auto max-w-[86rem] text-balance text-[clamp(1.62rem,2.25vw,2.35rem)] font-medium leading-[1.08] tracking-[-0.035em] xl:whitespace-nowrap">
                  Current agents operate more like engineering optimizers
                  <span
                    className="home-trajectory-keyword text-accent"
                    data-trajectory-keyword="researchers"
                  >
                    {" "}than fully autonomous researchers.
                  </span>
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  <Link href="/blog" className={homeResourceButtonClass}>
                    Blog
                  </Link>
                  <a
                    href={withBasePath(SITE_RESOURCES.paperUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className={homeResourceButtonClass}
                  >
                    Paper
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  <Link href="/trajectories" className={homeResourceButtonClass}>
                    Trajectories
                  </Link>
                </div>
              </div>
            </HomeReveal>
          </section>

          <HomeReveal className="relative z-10">
            <HomeEndmatter />
          </HomeReveal>
        </article>
      </HomeTrajectoryShell>
    </>
  );
}
