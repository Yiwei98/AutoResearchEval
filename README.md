# Beyond Final Scores - AutoResearch Evaluation

An English, long-form project page for **Beyond Final Scores: A Systematic Evaluation of Agents for Long-Horizon AI Research and Development**.

Built with Next.js (App Router) + Tailwind. The site exports as static files and
deploys to GitHub Pages.

The site combines a paper narrative with data-driven reproductions of the main
figures, a category-aware leaderboard, and a curated comparison of 35
representative trajectories selected from 756 common-harness baseline runs.

## Local development

```bash
npm install
npm run verify:data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If Turbopack is unavailable in the local runtime, use `npx next dev --webpack`.

## Checks

```bash
npm run verify:data  # paper figure/table consistency checks
npm run verify:scores  # task-specific score extraction regression fixtures
npm run verify:trajectories  # 5-task × 7-model showcase integrity checks
npm run verify:sanitization  # internal paths, IDs, and process-output redaction
npm run lint
npx tsc --noEmit
npm run build
```

## Project layout

```text
app/                         Next.js App Router pages
components/PaperStory.tsx    Long-form paper narrative
components/paper/            Paper diagrams and quantitative figures
lib/benchmark-data.ts         Leaderboard, process, and self-improvement values
lib/paper-data.ts             Typed Figure 1/5/6/7/10/11/12 source data
lib/trajectory-showcase.mjs   Frozen task metadata and 35 representative IDs
public/data/index.json        Ordered index for the curated showcase
public/data/trajectories/     35 committed full-message trajectory shards
scripts/process-data.mjs      Extracts the showcase from the raw JSONL
scripts/lib/score-extraction.mjs
                              Task-aware evaluator-output parsers
scripts/lib/trajectory-sanitization.mjs
                              Deterministic path, identity, and call-ID redaction
scripts/reprocess-trajectories.mjs
                              Sanitizes, rebuilds scores, and prunes to 35 shards
scripts/verify-trajectory-scores.mjs
                              Compact real-output and negative extraction checks
scripts/verify-trajectory-data.mjs
                              Curated dataset and plot-contract checks
scripts/verify-trajectory-sanitization.mjs
                              Public-shard privacy and pseudonymization checks
scripts/verify-paper-data.mjs Figure/table regression checks
```

The trajectory showcase contains five tasks with one frozen representative run
per model. It is an editorial view into the 756 common-harness baseline runs,
not a complete archive. Controlled experience-erasure, transferred-lesson,
alternative-harness, and evolved-harness variants discussed in the paper are
also not represented as trajectory shards.

## Updating trajectory data

Place the raw JSONL at `data/raw/autolab_docent_all.jsonl`, then run:

```bash
npm run process-data
```

This scans the complete source but publishes only the IDs frozen in
`lib/trajectory-showcase.mjs`. The command fails if any representative ID is
missing or has unexpected task/model metadata, then atomically rewrites the
35-entry index and shard directory. Every published message is sanitized during
this extraction, including internal workspace paths and correlation IDs. Review
the generated diff and re-run all checks before committing.

If the normalized trajectory shards already exist and only evaluator extraction
logic changed, run `npm run reprocess:trajectories`. The command rebuilds the
frozen representatives, reapplies deterministic sanitization, and removes any
non-showcase public shards. Scores are accepted only from evaluator tool output.
Each task has an explicit metric, direction, correctness gate, and comparable
workload protocol; commits are annotations and do not define curve points.

## Deploying to GitHub Pages

The repository includes a GitHub Actions workflow at
`.github/workflows/pages.yml`. This repository publishes the project site at:

`https://yiwei98.github.io/AutoResearchEval/`

In the repository settings, set **Pages → Build and deployment → Source** to
**GitHub Actions**. A push to `main` builds `out/` with `output: "export"`,
uses the Pages-provided base path, and publishes the artifact. The raw JSONL is
not needed for deployment because the committed showcase index and trajectory
shards are already the web data source.

GitHub Pages publishes the site publicly even when the source repository is
private. The published data under `public/data/` is therefore directly
downloadable.
