"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "../core";
import { EventName } from "../types";
import { HOVER_DWELL_THRESHOLD } from "../constants";

export function useHoverTracking(
  ref: React.RefObject<HTMLElement | null>,
  elementId: string,
  sectionId: string
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleEnter = () => {
      timerRef.current = setTimeout(() => {
        trackEvent(EventName.HOVER_DWELL, {
          element_type: el.tagName.toLowerCase(),
          element_id: elementId,
          section_id: sectionId,
          dwell_seconds: Math.round(HOVER_DWELL_THRESHOLD / 1000),
        });
      }, HOVER_DWELL_THRESHOLD);
    };

    const handleLeave = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      handleLeave();
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [ref, elementId, sectionId]);
}
