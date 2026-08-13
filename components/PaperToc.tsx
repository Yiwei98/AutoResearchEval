import { FloatingToc, type FloatingTocSection } from "./FloatingToc";

const PAPER_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "outcomes", label: "Outcome landscape" },
  { id: "process", label: "Process evaluation" },
  { id: "experience", label: "Learning from experience" },
  { id: "harness", label: "Agent harness" },
  { id: "innovation", label: "Solution nature & novelty" },
  { id: "implications", label: "Discussion" },
  { id: "citation", label: "Cite" },
] satisfies readonly FloatingTocSection[];

export function PaperToc() {
  return (
    <FloatingToc
      pathname="/"
      label="Navigate the paper"
      sections={PAPER_SECTIONS}
      progress
    />
  );
}
