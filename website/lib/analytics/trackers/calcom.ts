"use client";

import { trackEvent } from "../core";
import { EventName } from "../types";

export function initCalcomTracking(): (() => void) | void {
  if (typeof window === "undefined") return;

  const handleMessage = (e: MessageEvent) => {
    // Cal.com embed sends postMessage events
    if (!e.data || typeof e.data !== "object") return;

    const data = e.data as { action?: string; type?: string };
    const action = data.action || data.type;
    if (!action) return;

    // Cal.com embed uses "Cal:" prefixed events or specific action strings
    switch (action) {
      case "linkReady":
      case "Cal:linkReady":
        trackEvent(EventName.BOOKING_CALENDAR_LOAD, {
          load_seconds: Math.round(performance.now() / 1000),
        });
        break;

      case "__routeChanged":
      case "Cal:__routeChanged": {
        // Route changes indicate navigation through booking flow
        const url = (e.data as { data?: { url?: string } }).data?.url || "";
        if (url.includes("/slots")) {
          trackEvent(EventName.BOOKING_DATE_SELECT, {
            date: new Date().toISOString().split("T")[0],
          });
        }
        break;
      }

      case "bookingSuccessful":
      case "Cal:bookingSuccessful":
        trackEvent(
          EventName.BOOKING_COMPLETE,
          {},
          { immediate: true }
        );
        // Dispatch for engagement score
        window.dispatchEvent(new CustomEvent("sq:booking_reached"));
        break;
    }
  };

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}
