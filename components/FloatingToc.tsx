"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

export type FloatingTocSection = {
  id: string;
  label: string;
};

export type FloatingTocProps = {
  pathname: string;
  label: string;
  sections: readonly FloatingTocSection[];
  progress?: boolean;
};

function normalizePathname(pathname: string) {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

function sectionFromHash(sections: readonly FloatingTocSection[]) {
  if (typeof window === "undefined") return null;
  let id = window.location.hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    return null;
  }
  return sections.some((section) => section.id === id) ? id : null;
}

export function FloatingToc({
  pathname: targetPathname,
  label,
  sections,
  progress = false,
}: FloatingTocProps) {
  const currentPathname = usePathname();
  const isCurrentPage =
    normalizePathname(currentPathname) === normalizePathname(targetPathname);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const navigationTargetRef = useRef<string | null>(null);
  const navigationEndTimerRef = useRef<number | null>(null);
  const updateActiveSectionRef = useRef<() => void>(() => undefined);
  const componentId = useId().replace(/:/g, "");
  const sheetId = `floating-contents-${componentId}`;
  const sheetTitleId = `${sheetId}-title`;

  const closeMobile = useCallback((restoreFocus = true) => {
    setMobileOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => mobileTriggerRef.current?.focus());
    }
  }, []);

  const finishSectionNavigation = useCallback(() => {
    navigationTargetRef.current = null;
    navigationEndTimerRef.current = null;
    updateActiveSectionRef.current();
  }, []);

  const scheduleNavigationEnd = useCallback((delay = 180) => {
    if (navigationEndTimerRef.current !== null) {
      window.clearTimeout(navigationEndTimerRef.current);
    }
    navigationEndTimerRef.current = window.setTimeout(
      finishSectionNavigation,
      delay,
    );
  }, [finishSectionNavigation]);

  const beginSectionNavigation = useCallback((id: string) => {
    navigationTargetRef.current = id;
    setActiveId(id);
    // A fallback covers same-position links that produce no scroll event.
    scheduleNavigationEnd(400);
  }, [scheduleNavigationEnd]);

  useEffect(() => {
    if (!isCurrentPage) return;

    const sectionElements = sections
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    const updateActiveSection = () => {
      const navigationTarget = navigationTargetRef.current;
      if (navigationTarget) {
        setActiveId(navigationTarget);
        return;
      }

      // Hash targets settle below the sticky header plus the section's
      // scroll-margin. Keep the reading line just below that landing point so
      // the destination is considered current as soon as navigation ends.
      const readingLine = Math.min(180, window.innerHeight * 0.28);
      const atPageEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;
      const current = atPageEnd
        ? sectionElements.at(-1)
        : sectionElements.reduce<HTMLElement | null>((candidate, element) => {
            return element.getBoundingClientRect().top <= readingLine
              ? element
              : candidate;
          }, null) ?? sectionElements[0];

      if (current) setActiveId(current.id);
    };
    updateActiveSectionRef.current = updateActiveSection;

    let scrollFrame = 0;
    const requestActiveSectionUpdate = () => {
      if (navigationTargetRef.current) scheduleNavigationEnd();
      if (!scrollFrame) {
        scrollFrame = window.requestAnimationFrame(() => {
          scrollFrame = 0;
          updateActiveSection();
        });
      }
    };

    const observer = new IntersectionObserver(updateActiveSection, {
      rootMargin: "-88px 0px -58% 0px",
      threshold: [0, 0.01, 0.25, 0.75],
    });
    sectionElements.forEach((element) => observer.observe(element));

    const syncHash = () => {
      const id = sectionFromHash(sections);
      if (id) beginSectionNavigation(id);
      else updateActiveSection();
    };
    const initialFrame = window.requestAnimationFrame(() => {
      syncHash();
      updateActiveSection();
    });
    window.addEventListener("scroll", requestActiveSectionUpdate, {
      passive: true,
    });
    window.addEventListener("resize", requestActiveSectionUpdate);
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (navigationEndTimerRef.current !== null) {
        window.clearTimeout(navigationEndTimerRef.current);
        navigationEndTimerRef.current = null;
      }
      navigationTargetRef.current = null;
      updateActiveSectionRef.current = () => undefined;
      observer.disconnect();
      window.removeEventListener("scroll", requestActiveSectionUpdate);
      window.removeEventListener("resize", requestActiveSectionUpdate);
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, [beginSectionNavigation, isCurrentPage, scheduleNavigationEnd, sections]);

  useEffect(() => {
    if (!isCurrentPage || !progress) return;

    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable > 0 ? window.scrollY / scrollable : 0;
      setReadingProgress(Math.min(1, Math.max(0, next)));
    };
    const requestProgressUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", requestProgressUpdate, { passive: true });
    window.addEventListener("resize", requestProgressUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestProgressUpdate);
      window.removeEventListener("resize", requestProgressUpdate);
    };
  }, [isCurrentPage, progress]);

  useEffect(() => {
    if (!mobileOpen) return;
    if (!isCurrentPage) {
      const closeFrame = window.requestAnimationFrame(() =>
        setMobileOpen(false),
      );
      return () => window.cancelAnimationFrame(closeFrame);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(
        mobilePanelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    const focusFrame = window.requestAnimationFrame(() =>
      focusable()[0]?.focus(),
    );
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobile();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const desktopQuery = window.matchMedia("(min-width: 1180px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) closeMobile(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", closeAtDesktop);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", closeAtDesktop);
    };
  }, [closeMobile, isCurrentPage, mobileOpen]);

  if (!isCurrentPage || sections.length === 0) return null;

  const contents = (mobile = false) => (
    <ol
      className={
        mobile ? "floating-toc-mobile-list" : "floating-toc-list"
      }
    >
      {sections.map((section, index) => {
        const active = activeId === section.id;
        return (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={active ? "location" : undefined}
              onClick={() => {
                beginSectionNavigation(section.id);
                if (mobile) closeMobile();
              }}
            >
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {section.label}
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {progress ? (
        <div
          className="floating-reading-progress"
          style={{ transform: `scaleX(${readingProgress})` }}
          aria-hidden="true"
        />
      ) : null}

      <aside className="floating-toc-desktop" aria-label={label}>
        <div className="floating-toc-card">
          <div className="floating-toc-heading">
            <span>Contents</span>
          </div>
          <nav aria-label={label}>{contents()}</nav>
        </div>
      </aside>

      <button
        ref={mobileTriggerRef}
        type="button"
        className="floating-toc-mobile-trigger"
        aria-expanded={mobileOpen}
        aria-controls={sheetId}
        onClick={() => setMobileOpen(true)}
      >
        <ContentsIcon />
        <span>Contents</span>
      </button>

      {mobileOpen ? (
        <div className="floating-toc-mobile-layer">
          <button
            type="button"
            className="floating-toc-mobile-scrim"
            aria-label="Close contents"
            onClick={() => closeMobile()}
          />
          <div
            ref={mobilePanelRef}
            id={sheetId}
            className="floating-toc-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={sheetTitleId}
          >
            <div className="floating-toc-mobile-heading">
              <div>
                <p className="floating-toc-eyebrow">{label}</p>
                <h2 id={sheetTitleId}>Contents</h2>
              </div>
              <button
                type="button"
                className="floating-toc-mobile-close"
                aria-label="Close contents"
                onClick={() => closeMobile()}
              >
                <CloseIcon />
              </button>
            </div>
            <nav aria-label={label}>{contents(true)}</nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ContentsIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M4 5h12M4 10h12M4 15h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="m5 5 10 10M15 5 5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
