import { FloatingToc, type FloatingTocSection } from "./FloatingToc";

const TRAJECTORY_SECTIONS = [
  { id: "trajectory-overview", label: "Overview" },
  { id: "task-moving-mnist-world-model", label: "Moving MNIST" },
  { id: "task-bm25-search-go", label: "BM25 search" },
  { id: "task-regex-engine", label: "Regex engine" },
  { id: "task-adaptive-compression", label: "Adaptive compression" },
  { id: "task-icp-correspondence-step-cuda", label: "ICP correspondence" },
] satisfies readonly FloatingTocSection[];

export function TrajectoryToc() {
  return (
    <FloatingToc
      pathname="/trajectories"
      label="Navigate the trajectory showcase"
      sections={TRAJECTORY_SECTIONS}
    />
  );
}
