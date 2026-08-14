"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

const LEGACY_BLOG_HASHES = new Set([
  "overview",
  "outcomes",
  "process",
  "experience",
  "harness",
  "innovation",
  "implications",
  "citation",
]);

/**
 * Keeps links to the former Blog-at-root anchors working after Home moves to `/`.
 * Render this once on the new Home page. A hashless visit is left untouched.
 */
export function LegacyBlogHashRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const redirectLegacyHash = () => {
      let sectionId = window.location.hash.slice(1);
      try {
        sectionId = decodeURIComponent(sectionId);
      } catch {
        return;
      }

      if (!LEGACY_BLOG_HASHES.has(sectionId)) return;

      window.location.replace(
        `${withBasePath("/blog/")}#${encodeURIComponent(sectionId)}`,
      );
    };

    redirectLegacyHash();
    window.addEventListener("hashchange", redirectLegacyHash);
    return () => window.removeEventListener("hashchange", redirectLegacyHash);
  }, [pathname]);

  return null;
}
