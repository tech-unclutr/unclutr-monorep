"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "../core";
import { EventName } from "../types";
import { SCROLL_DEPTH_MILESTONES } from "../constants";

export function useScrollDepth(): void {
  const firedRef = useRef<Set<number>>(new Set());
  const rafPending = useRef(false);

  useEffect(() => {
    const check = () => {
      rafPending.current = false;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const milestone of SCROLL_DEPTH_MILESTONES) {
        if (percent >= milestone && !firedRef.current.has(milestone)) {
          firedRef.current.add(milestone);
          trackEvent(EventName.SCROLL_DEPTH, {
            depth_percent: milestone,
            depth_pixels: Math.round(scrollTop),
          });
        }
      }
    };

    const handleScroll = () => {
      if (rafPending.current) return;
      rafPending.current = true;
      requestAnimationFrame(check);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
}
