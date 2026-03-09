"use client";

import { useCallback, useRef, useEffect } from "react";
import { trackEvent } from "../core";
import { EventName } from "../types";

type InteractionMethod = "click" | "swipe" | "keyboard" | "autoplay" | "dot";

interface CarouselTrackers {
  trackTransition: (toIndex: number, method: InteractionMethod) => void;
  trackAutoplay: (state: "start" | "pause" | "resume", reason?: "hover" | "click" | "offscreen") => void;
}

export function useCarouselTracking(
  carouselId: string,
  activeIndex: number,
  itemNames: string[]
): CarouselTrackers {
  const prevIndexRef = useRef(activeIndex);
  const dwellStartRef = useRef(Date.now());

  // Fire dwell event when index changes
  useEffect(() => {
    if (activeIndex !== prevIndexRef.current) {
      const dwellSeconds = Math.round((Date.now() - dwellStartRef.current) / 1000);
      if (dwellSeconds > 0) {
        trackEvent(EventName.CAROUSEL_DWELL, {
          carousel_id: carouselId,
          item_index: prevIndexRef.current,
          item_name: itemNames[prevIndexRef.current] ?? "unknown",
          dwell_seconds: dwellSeconds,
        });
      }
      prevIndexRef.current = activeIndex;
      dwellStartRef.current = Date.now();
    }
  }, [activeIndex, carouselId, itemNames]);

  const trackTransition = useCallback(
    (toIndex: number, method: InteractionMethod) => {
      const fromIndex = prevIndexRef.current;
      const action =
        toIndex > fromIndex ? "next" : toIndex < fromIndex ? "prev" : "select";

      trackEvent(EventName.CAROUSEL_INTERACT, {
        carousel_id: carouselId,
        action,
        method,
        from_index: fromIndex,
        to_index: toIndex,
        item_name: itemNames[toIndex] ?? "unknown",
      });
    },
    [carouselId, itemNames]
  );

  const trackAutoplay = useCallback(
    (state: "start" | "pause" | "resume", reason?: "hover" | "click" | "offscreen") => {
      trackEvent(EventName.CAROUSEL_AUTOPLAY, {
        carousel_id: carouselId,
        state,
        ...(reason ? { pause_reason: reason } : {}),
      });
    },
    [carouselId]
  );

  return { trackTransition, trackAutoplay };
}
