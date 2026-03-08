"use client";

import { trackEvent } from "../core";
import { EventName } from "../types";

export function initErrorTracking(): void {
  if (typeof window === "undefined") return;

  // JS errors
  window.addEventListener("error", (e) => {
    // Resource load errors (img, script, link) have a target that's an element
    if (e.target && e.target !== window) {
      const el = e.target as HTMLElement;
      const src =
        (el as HTMLImageElement).src ||
        (el as HTMLScriptElement).src ||
        (el as HTMLLinkElement).href ||
        "";
      trackEvent(
        EventName.RESOURCE_LOAD_ERROR,
        {
          resource_url: src.slice(0, 100),
          resource_type: el.tagName?.toLowerCase() || "unknown",
        },
        { immediate: true }
      );
      return;
    }

    trackEvent(
      EventName.JS_ERROR,
      {
        error_message: (e.message || "Unknown error").slice(0, 100),
        error_source: (e.filename || "unknown").slice(0, 100),
        error_line: e.lineno || 0,
        error_col: e.colno || 0,
      },
      { immediate: true }
    );
  }, true); // capture phase to catch resource errors

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (e) => {
    const reason =
      e.reason instanceof Error
        ? e.reason.message
        : typeof e.reason === "string"
          ? e.reason
          : "Unknown rejection";

    trackEvent(
      EventName.UNHANDLED_REJECTION,
      { reason: reason.slice(0, 100) },
      { immediate: true }
    );
  });
}
