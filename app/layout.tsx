import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title:
    "Beyond Final Scores: A Systematic Evaluation of Agents for Long-Horizon AI Research and Development",
  description:
    "A systematic process- and experience-based evaluation of seven frontier models across 36 long-horizon AutoLab research tasks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SiteNav />
        <main id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <footer className="border-t border-border py-8 text-center text-sm text-muted">
          <p>
            Data & metrics from{" "}
            <span className="font-medium text-foreground">
              &ldquo;Beyond Final Scores: A Systematic Evaluation of Agents for Long-Horizon AI
              Research and Development&rdquo;
            </span>{" "}
          </p>
          <p className="mt-1">
            Benchmark:{" "}
            <a
              href="https://autolab.moe/"
              className="text-accent hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              AutoLab
            </a>{" "}
            · 7 models × 36 tasks × 3 rollouts
          </p>
        </footer>
      </body>
    </html>
  );
}
