"use client";

import { trackEvent, setUserProperties } from "../core";
import { EventName } from "../types";

function getDeviceType(width: number): "mobile" | "tablet" | "desktop" {
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function initDeviceTracking(): void {
  if (typeof window === "undefined") return;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const deviceType = getDeviceType(w);

  trackEvent(EventName.VIEWPORT_INFO, {
    viewport_width: w,
    viewport_height: h,
    device_type: deviceType,
    pixel_ratio: Math.round(window.devicePixelRatio * 10) / 10,
  });

  setUserProperties({ device_type: deviceType });

  // Orientation changes
  const mql = window.matchMedia("(orientation: portrait)");
  const handleChange = () => {
    trackEvent(EventName.ORIENTATION_CHANGE, {
      orientation: mql.matches ? "portrait" : "landscape",
      viewport_width: window.innerWidth,
    });
  };
  mql.addEventListener("change", handleChange);
}
