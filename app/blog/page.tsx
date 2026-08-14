import type { Metadata } from "next";
import { PaperStory } from "@/components/PaperStory";
import { PaperToc } from "@/components/PaperToc";

export const metadata: Metadata = {
  title: "Blog | AutoResearch Eval",
  description:
    "The findings behind our evaluation of agents for long-horizon AI research and development.",
};

export default function BlogPage() {
  return (
    <>
      <PaperToc />
      <PaperStory />
    </>
  );
}
