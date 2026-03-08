"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "../core";
import { EventName } from "../types";
import { SECTION_MAP, type SectionId } from "../constants";

export function useSectionVisibility(
  sectionId: SectionId,
  ref: React.RefObject<HTMLElement | null>
): void {
  const enterTimeRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Tag element for scroll-behavior tracker
    el.setAttribute("data-section-id", sectionId);

    lastScrollYRef.current = window.scrollY;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.5 && enterTimeRef.current === null) {
            enterTimeRef.current = Date.now();
            lastScrollYRef.current = window.scrollY;

            trackEvent(EventName.SECTION_VIEW, {
              section_id: sectionId,
              section_index: SECTION_MAP[sectionId],
            });

            // Dispatch for session-quality tracker
            window.dispatchEvent(new CustomEvent("sq:section_view"));
          } else if (entry.intersectionRatio < 0.5 && enterTimeRef.current !== null) {
            const dwell = Math.round((Date.now() - enterTimeRef.current) / 1000);
            const direction = window.scrollY > lastScrollYRef.current ? "down" : "up";

            trackEvent(EventName.SECTION_EXIT, {
              section_id: sectionId,
              dwell_seconds: dwell,
              scroll_direction: direction as "down" | "up",
            });

            enterTimeRef.current = null;
          }
        }
      },
      { threshold: [0, 0.5, 1.0] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionId, ref]);
}
