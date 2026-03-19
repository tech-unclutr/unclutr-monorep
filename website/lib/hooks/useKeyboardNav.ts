"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useLenis } from "@/components/ui/LenisProvider";
import { NAVIGABLE_SECTIONS } from "@/lib/constants/sections";

// Matches LenisProvider.tsx:60 and SectionNav.tsx:112 exactly
const EASING = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -12 * t));

function isSuppressed(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target as HTMLElement;
  return (
    ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
    el.isContentEditable
  );
}

/**
 * Returns the index of the currently visible section in NAVIGABLE_SECTIONS.
 * A section is "current" when its offsetTop is within the upper 40% of the viewport —
 * mirrors SectionNav's IntersectionObserver rootMargin "-40% 0px -40% 0px".
 */
function getActiveSectionIndex(): number {
  const threshold = window.scrollY + window.innerHeight * 0.4;
  let active = 0;
  for (let i = 0; i < NAVIGABLE_SECTIONS.length; i++) {
    const el = document.getElementById(NAVIGABLE_SECTIONS[i].id);
    if (el && el.offsetTop <= threshold) active = i;
  }
  return active;
}

export interface UseKeyboardNavReturn {
  showShortcuts: boolean;
  setShowShortcuts: (v: boolean) => void;
}

export function useKeyboardNav(): UseKeyboardNavReturn {
  const lenis = useLenis();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Ref so Escape handler reads fresh value without re-registering the listener
  const showShortcutsRef = useRef(false);
  useEffect(() => {
    showShortcutsRef.current = showShortcuts;
  }, [showShortcuts]);

  const scrollBy = useCallback(
    (distance: number) => {
      if (lenis) {
        lenis.scrollTo(window.scrollY + distance, { duration: 0.8, easing: EASING });
      } else {
        window.scrollBy({ top: distance, behavior: "smooth" });
      }
    },
    [lenis]
  );

  const scrollToSection = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenis) {
        lenis.scrollTo(el, { offset: -40, duration: 1.6, easing: EASING });
      } else {
        el.scrollIntoView({ behavior: "smooth" });
      }
    },
    [lenis]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: close shortcuts overlay only; FloatingNav handles its own Escape
      if (e.key === "Escape") {
        if (showShortcutsRef.current) {
          setShowShortcuts(false);
          e.preventDefault();
        }
        return;
      }

      // Let form elements receive all other keys normally
      if (isSuppressed(e.target)) return;

      const distance = window.innerHeight * 0.3;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        if (e.shiftKey || e.key === "PageDown") {
          const idx = getActiveSectionIndex();
          const next = NAVIGABLE_SECTIONS[Math.min(idx + 1, NAVIGABLE_SECTIONS.length - 1)];
          if (next) scrollToSection(next.id);
        } else {
          scrollBy(distance);
        }
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        if (e.shiftKey || e.key === "PageUp") {
          const idx = getActiveSectionIndex();
          const prev = NAVIGABLE_SECTIONS[Math.max(idx - 1, 0)];
          if (prev) scrollToSection(prev.id);
        } else {
          scrollBy(-distance);
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.6, easing: EASING });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToSection("book-call");
      } else if (e.key === "/" && !e.shiftKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("squareup:nav-toggle"));
      } else if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lenis, scrollBy, scrollToSection]);

  return { showShortcuts, setShowShortcuts };
}
