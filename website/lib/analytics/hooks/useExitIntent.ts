"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "../core";
import { EventName } from "../types";
import { EXIT_INTENT_COOLDOWN, SECTION_MAP } from "../constants";

function getCurrentScrollDepth(): number {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 100;
  return Math.round((window.scrollY / docHeight) * 100);
}

function getCurrentSectionId(): string {
  const viewportMid = window.innerHeight / 2;
  for (const id of Object.keys(SECTION_MAP)) {
    const el =
      document.querySelector(`[data-section-id="${id}"]`) ||
      document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= viewportMid && rect.bottom >= viewportMid) return id;
  }
  return "unknown";
}

export function useExitIntent(): void {
  const firedRef = useRef(false);
  const pageStartRef = useRef(Date.now());

  useEffect(() => {
    const fire = (method: "mouse_leave" | "back_button") => {
      if (firedRef.current) return;
      firedRef.current = true;

      trackEvent(
        EventName.EXIT_INTENT,
        {
          method,
          section_id: getCurrentSectionId(),
          scroll_depth_percent: getCurrentScrollDepth(),
          time_on_page_seconds: Math.round((Date.now() - pageStartRef.current) / 1000),
        },
        { immediate: true }
      );

      // Cooldown
      setTimeout(() => { firedRef.current = false; }, EXIT_INTENT_COOLDOWN);
    };

    // Desktop: mouse leaves viewport from top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) fire("mouse_leave");
    };

    // Mobile: back button
    const handlePopState = () => fire("back_button");

    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
}
