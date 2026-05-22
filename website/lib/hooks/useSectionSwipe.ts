"use client";

import { useEffect } from "react";
import { NAVIGABLE_SECTIONS } from "@/lib/constants/sections";
import { useHaptic } from "@/lib/hooks/useHaptic";

const EDGE_ZONE_PX = 32; // right edge "thumb zone" where swipes are detected
const MIN_DISTANCE = 60;
const MAX_DURATION_MS = 450;
const VELOCITY_FALLBACK_PX_S = 600; // accept if fast enough even with smaller distance

/**
 * Right-edge vertical swipe → snap to next/previous navigable section.
 *
 * Avoids the left edge (iOS back-swipe), avoids horizontal swipes (carousels),
 * and only fires when the swipe begins in the right-edge thumb zone — so
 * normal page scrolls and on-screen carousels are unaffected.
 *
 * No-op on devices without touch input.
 */
export function useSectionSwipe(enabled: boolean = true) {
  const haptic = useHaptic();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let active = false;

    const findCurrentSectionIndex = () => {
      // Use the section closest to viewport top (with a bit of bias)
      const viewportMid = window.scrollY + window.innerHeight * 0.35;
      let bestIdx = 0;
      let bestDelta = Infinity;
      NAVIGABLE_SECTIONS.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const delta = Math.abs(top - viewportMid);
        if (delta < bestDelta) {
          bestDelta = delta;
          bestIdx = i;
        }
      });
      return bestIdx;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const fromRightEdge = window.innerWidth - t.clientX <= EDGE_ZONE_PX;
      if (!fromRightEdge) return;
      startX = t.clientX;
      startY = t.clientY;
      startT = performance.now();
      active = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = performance.now() - startT;

      // Reject if too horizontal or too slow
      if (Math.abs(dx) > Math.abs(dy)) return;
      if (dt > MAX_DURATION_MS) return;

      const velocity = Math.abs(dy) / Math.max(dt / 1000, 0.001);
      const enoughDistance = Math.abs(dy) >= MIN_DISTANCE;
      const enoughVelocity = velocity >= VELOCITY_FALLBACK_PX_S;
      if (!enoughDistance && !enoughVelocity) return;

      const currentIdx = findCurrentSectionIndex();
      const direction = dy < 0 ? 1 : -1; // swipe up → next (forward)
      const targetIdx = Math.max(0, Math.min(NAVIGABLE_SECTIONS.length - 1, currentIdx + direction));
      if (targetIdx === currentIdx) return;

      haptic("medium");
      const target = document.getElementById(NAVIGABLE_SECTIONS[targetIdx].id);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, haptic]);
}
