import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { withBasePath } from "@/lib/base-path";

export const metadata: Metadata = {
  title:
    "Beyond Final Scores: A Systematic Evaluation of Agents for Long-Horizon AI Research and Development",
  description:
    "Follow how seven frontier agents frame, execute, revise, and reuse experience across 36 long-horizon research tasks.",
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
        <footer className="border-t border-border/80 py-7 text-sm text-muted">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-center sm:flex-row sm:px-6 sm:text-left">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBasePath("/icons/longcat.svg")}
                alt=""
                width={24}
                height={24}
                className="rounded-md"
              />
              <span className="font-medium text-foreground">AutoResearch Eval</span>
            </div>
            <a
              href="https://autolab.moe/"
              className="text-accent hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              7 models, 36 tasks, 756 trajectories on AutoLab
            </a>{" "}
          </div>
        </footer>
      </body>
    </html>
  );
}
