"use client";

import { trackEvent } from "../core";
import { EventName } from "../types";

type VitalRating = "good" | "needs_improvement" | "poor";

function getRating(name: string, value: number): VitalRating {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    INP: [200, 500],
    TTFB: [800, 1800],
  };
  const [good, poor] = thresholds[name] ?? [0, 0];
  if (value <= good) return "good";
  if (value <= poor) return "needs_improvement";
  return "poor";
}

export function initPerformanceTracking(): void {
  if (typeof window === "undefined") return;

  import("web-vitals").then(({ onLCP, onCLS, onINP, onTTFB }) => {
    onLCP((metric) => {
      trackEvent(EventName.WEB_VITAL_LCP, {
        value_ms: Math.round(metric.value),
        rating: getRating("LCP", metric.value),
      });
    });

    onCLS((metric) => {
      trackEvent(EventName.WEB_VITAL_CLS, {
        value_ms: Math.round(metric.value * 1000), // CLS is unitless, multiply for precision
        rating: getRating("CLS", metric.value),
      });
    });

    onINP((metric) => {
      trackEvent(EventName.WEB_VITAL_INP, {
        value_ms: Math.round(metric.value),
        rating: getRating("INP", metric.value),
      });
    });

    onTTFB((metric) => {
      trackEvent(EventName.WEB_VITAL_TTFB, {
        value_ms: Math.round(metric.value),
        rating: getRating("TTFB", metric.value),
      });
    });
  }).catch(() => {
    // web-vitals not available — silently skip
  });
}
