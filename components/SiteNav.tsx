"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { SITE_RESOURCES } from "@/lib/site-config";

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="site-header sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="site-brand flex items-center gap-2.5" aria-label="AutoResearch Evaluation home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBasePath("/icons/longcat.svg")}
            alt=""
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-[15px] font-semibold tracking-tight">
            AutoResearch Eval
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary navigation">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`site-nav-link ${
              pathname === "/"
                ? "bg-accent-soft text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            Blog
          </Link>
          <a
            href={withBasePath(SITE_RESOURCES.paperUrl)}
            className="site-nav-link text-muted hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            Paper
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link
            href="/trajectories"
            aria-current={pathname.startsWith("/trajectories") ? "page" : undefined}
            className={`site-nav-link ${
              pathname.startsWith("/trajectories")
                ? "bg-accent-soft text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            Trajectories
          </Link>
        </nav>
      </div>
    </header>
  );
}
