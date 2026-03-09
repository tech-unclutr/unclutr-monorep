"use client";

import { useCallback } from "react";
import { trackEvent } from "../core";
import { EventName } from "../types";

export function useCTATracking() {
  const trackCTA = useCallback(
    (
      ctaText: string,
      ctaHref: string,
      sourceSection: string,
      ctaPosition?: string
    ) => {
      trackEvent(EventName.CTA_CLICK, {
        cta_text: ctaText,
        cta_href: ctaHref,
        source_section: sourceSection,
        ...(ctaPosition ? { cta_position: ctaPosition } : {}),
      });
    },
    []
  );

  return { trackCTA };
}
