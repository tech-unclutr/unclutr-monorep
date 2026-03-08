"use client";

import { trackEvent } from "../core";
import { EventName } from "../types";
import {
  SCROLL_VELOCITY_THRESHOLD,
  SCROLL_DIRECTION_CHANGE_THRESHOLD,
  SCROLL_DIRECTION_CHANGE_WINDOW,
  SECTION_MAP,
} from "../constants";

function getCurrentSectionId(): string {
  const sections = Object.keys(SECTION_MAP);
  const viewportMid = window.innerHeight / 2;

  for (const id of sections) {
    const el =
      document.querySelector(`[data-section-id="${id}"]`) ||
      document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= viewportMid && rect.bottom >= viewportMid) return id;
  }
  return "unknown";
}

export function initScrollBehaviorTracking(): (() => void) | void {
  if (typeof window === "undefined") return;

  let lastScrollY = window.scrollY;
  let lastTime = Date.now();
  let lastDirection: "up" | "down" | null = null;
  const directionChanges: number[] = [];
  let velocitySpikeReported = false;

  const intervalId = setInterval(() => {
    const now = Date.now();
    const currentY = window.scrollY;
    const dt = (now - lastTime) / 1000; // seconds
    if (dt === 0) return;

    const dy = currentY - lastScrollY;
    const velocity = Math.abs(dy / dt);
    const direction: "up" | "down" = dy >= 0 ? "down" : "up";

    // Velocity spike detection
    if (velocity > SCROLL_VELOCITY_THRESHOLD && !velocitySpikeReported) {
      velocitySpikeReported = true;
      trackEvent(EventName.SCROLL_VELOCITY_SPIKE, {
        velocity_px_per_sec: Math.round(velocity),
        section_id: getCurrentSectionId(),
        direction,
      });
      // Reset after 5s cooldown
      setTimeout(() => { velocitySpikeReported = false; }, 5000);
    }

    // Direction change detection
    if (lastDirection && direction !== lastDirection) {
      directionChanges.push(now);
    }
    lastDirection = direction;

    // Prune old direction changes outside window
    while (
      directionChanges.length > 0 &&
      now - directionChanges[0] > SCROLL_DIRECTION_CHANGE_WINDOW
    ) {
      directionChanges.shift();
    }

    if (directionChanges.length >= SCROLL_DIRECTION_CHANGE_THRESHOLD) {
      const sectionId = getCurrentSectionId();
      trackEvent(EventName.SCROLL_DIRECTION_CHANGE, {
        change_count: directionChanges.length,
        section_id: sectionId,
      });

      // If also fast, it's rage scrolling
      if (velocity > SCROLL_VELOCITY_THRESHOLD * 0.5) {
        trackEvent(EventName.SCROLL_RAGE, {
          section_id: sectionId,
          velocity: Math.round(velocity),
        });
      }

      // Clear to prevent spamming
      directionChanges.length = 0;
    }

    lastScrollY = currentY;
    lastTime = now;
  }, 100);

  return () => clearInterval(intervalId);
}
