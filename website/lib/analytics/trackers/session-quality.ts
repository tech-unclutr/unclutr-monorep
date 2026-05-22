"use client";

import { trackEvent } from "../core";
import { EventName } from "../types";

export function initSessionQuality(): void {
  if (typeof window === "undefined") return;

  const startTime = Date.now();
  let sectionsViewed = 0;
  let hasInteracted = false;
  let reported = false;

  // Count section views via custom event
  const handleSectionView = () => { sectionsViewed++; };
  window.addEventListener("sq:section_view", handleSectionView);

  // Any click = interaction
  const handleClick = () => { hasInteracted = true; };
  window.addEventListener("click", handleClick, { once: true });

  // Report on page unload
  const report = () => {
    if (reported) return;
    reported = true;

    const timeOnPage = Math.round((Date.now() - startTime) / 1000);
    const engaged = sectionsViewed >= 2 || timeOnPage >= 30 || hasInteracted;

    trackEvent(
      EventName.PAGE_TIME_SPENT,
      {
        duration_seconds: timeOnPage,
        engaged,
      },
      { immediate: true }
    );
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") report();
  });
  window.addEventListener("beforeunload", report);
}
