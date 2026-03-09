"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics/core";
import { initPerformanceTracking } from "@/lib/analytics/trackers/performance";
import { initErrorTracking } from "@/lib/analytics/trackers/errors";
import { initDeviceTracking } from "@/lib/analytics/trackers/device";
import { initScrollBehaviorTracking } from "@/lib/analytics/trackers/scroll-behavior";
import { initSessionQuality } from "@/lib/analytics/trackers/session-quality";
import { initCalcomTracking } from "@/lib/analytics/trackers/calcom";

export default function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
    initErrorTracking();
    initDeviceTracking();
    initPerformanceTracking();
    initSessionQuality();

    const cleanupScroll = initScrollBehaviorTracking();
    const cleanupCalcom = initCalcomTracking();

    return () => {
      if (typeof cleanupScroll === "function") cleanupScroll();
      if (typeof cleanupCalcom === "function") cleanupCalcom();
    };
  }, []);

  return null;
}
