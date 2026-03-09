"use client";

import { useEffect } from "react";
import { trackEvent } from "../core";
import { EventName } from "../types";
import { RAGE_CLICK_THRESHOLD, RAGE_CLICK_WINDOW, SECTION_MAP } from "../constants";

function getClosestSectionId(el: HTMLElement): string {
  const section = el.closest("[data-section-id]");
  if (section) return section.getAttribute("data-section-id") || "unknown";

  // Fallback: check known section IDs
  for (const id of Object.keys(SECTION_MAP)) {
    const sectionEl = document.getElementById(id) || document.querySelector(`[data-section-id="${id}"]`);
    if (sectionEl?.contains(el)) return id;
  }
  return "unknown";
}

export function useRageClick(ref: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clicks: { time: number; target: EventTarget | null }[] = [];

    const handleClick = (e: MouseEvent) => {
      const now = Date.now();

      // Prune old clicks
      while (clicks.length > 0 && now - clicks[0].time > RAGE_CLICK_WINDOW) {
        clicks.shift();
      }

      clicks.push({ time: now, target: e.target });

      // Cap buffer
      if (clicks.length > 10) clicks.shift();

      // Check for rage clicks on same element
      const recentOnSame = clicks.filter(
        (c) => c.target === e.target && now - c.time <= RAGE_CLICK_WINDOW
      );

      if (recentOnSame.length >= RAGE_CLICK_THRESHOLD) {
        const target = e.target as HTMLElement;
        trackEvent(EventName.RAGE_CLICK, {
          element_tag: target.tagName?.toLowerCase() || "unknown",
          element_text: (target.textContent || "").trim().slice(0, 50),
          section_id: getClosestSectionId(target),
          click_count: recentOnSame.length,
        });
        // Clear to prevent re-firing
        clicks.length = 0;
      }
    };

    el.addEventListener("click", handleClick, true);
    return () => el.removeEventListener("click", handleClick, true);
  }, [ref]);
}
