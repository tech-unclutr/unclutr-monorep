"use client";

import { useCallback, useRef } from "react";

type HapticPattern = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 8,
  medium: 14,
  heavy: 22,
  selection: 4,
  success: [8, 30, 12],
  warning: [12, 50, 12],
  error: [20, 40, 20, 40, 20],
};

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Lightweight haptic feedback for mobile/tablet interactions.
 *
 * Uses the Vibration API on Android Chrome / Firefox / Edge. iOS Safari does
 * not expose Vibration, but it auto-translates short non-zero haptics on
 * `<button>` taps via the standard taptic engine — keeping our calls cheap
 * and short means we get correct behavior on both platforms.
 *
 * No-op on desktop / non-touch devices and when the user has reduced motion.
 */
export function useHaptic() {
  const lastFireRef = useRef(0);

  return useCallback((pattern: HapticPattern = "light") => {
    if (typeof window === "undefined") return;
    if (!isTouchDevice()) return;

    // Throttle: skip if fired within last 40ms (prevents repeat-fire on scroll/swipe)
    const now = Date.now();
    if (now - lastFireRef.current < 40) return;
    lastFireRef.current = now;

    // Respect reduced-motion preference
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    try {
      navigator.vibrate?.(PATTERNS[pattern]);
    } catch {
      // some browsers throw on long patterns; ignore
    }
  }, []);
}
