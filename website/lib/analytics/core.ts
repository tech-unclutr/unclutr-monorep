"use client";

import { GA4_LIMITS } from "./constants";
import type { GtagEventParams, TrackEventOptions } from "./types";

// ── Globals ──────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_MEASUREMENT_ID = "G-367H1C279N";

// ── Privacy & Consent ────────────────────────────────────────────────────────

function isDoNotTrack(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    navigator.doNotTrack === "1" ||
    (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  );
}

function hasConsentBlocked(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("sq_analytics_consent") === "denied";
}

export function isTrackingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (isDoNotTrack()) return false;
  if (hasConsentBlocked()) return false;
  return true;
}

// ── Debug Mode ───────────────────────────────────────────────────────────────

function isDebugMode(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem("sq_analytics_debug") === "true";
}

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

// ── Idle Scheduling ──────────────────────────────────────────────────────────

const scheduleIdle: (cb: () => void) => void =
  typeof window !== "undefined" && typeof window.requestIdleCallback === "function"
    ? (cb) => window.requestIdleCallback(cb)
    : (cb) => setTimeout(cb, 1);

// ── Validation ───────────────────────────────────────────────────────────────

function validateEvent(name: string, params?: GtagEventParams): boolean {
  if (name.length > GA4_LIMITS.EVENT_NAME_MAX_LENGTH) {
    if (isDev()) console.warn(`[SQ Analytics] Event name "${name}" exceeds ${GA4_LIMITS.EVENT_NAME_MAX_LENGTH} chars`);
    return false;
  }

  if (params) {
    const keys = Object.keys(params);
    if (keys.length > GA4_LIMITS.MAX_PARAMS_PER_EVENT) {
      if (isDev()) console.warn(`[SQ Analytics] Event "${name}" has ${keys.length} params (max ${GA4_LIMITS.MAX_PARAMS_PER_EVENT})`);
      return false;
    }

    for (const key of keys) {
      if (key.length > GA4_LIMITS.PARAM_NAME_MAX_LENGTH) {
        if (isDev()) console.warn(`[SQ Analytics] Param name "${key}" exceeds ${GA4_LIMITS.PARAM_NAME_MAX_LENGTH} chars`);
        return false;
      }
      const val = params[key];
      if (typeof val === "string" && val.length > GA4_LIMITS.PARAM_VALUE_MAX_LENGTH) {
        if (isDev()) console.warn(`[SQ Analytics] Param "${key}" value exceeds ${GA4_LIMITS.PARAM_VALUE_MAX_LENGTH} chars`);
        return false;
      }
    }
  }

  return true;
}

// ── Core Send ────────────────────────────────────────────────────────────────

function sendToGA(eventName: string, params?: GtagEventParams): void {
  if (typeof window === "undefined" || !window.gtag) return;

  const debugMode = isDebugMode();
  window.gtag("event", eventName, {
    ...params,
    ...(debugMode ? { debug_mode: true } : {}),
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

export function trackEvent(
  eventName: string,
  params?: GtagEventParams,
  options?: TrackEventOptions
): void {
  if (!isTrackingEnabled()) return;
  if (!validateEvent(eventName, params)) return;

  // Dev logging
  if (isDev() || isDebugMode()) {
    console.log(`[SQ Analytics] ${eventName}`, params ?? "");
  }

  // In dev mode, only send to GA if debug flag is explicitly set
  if (isDev() && !isDebugMode()) return;

  if (options?.immediate) {
    sendToGA(eventName, params);
  } else {
    scheduleIdle(() => sendToGA(eventName, params));
  }
}

export function setUserProperties(props: GtagEventParams): void {
  if (!isTrackingEnabled()) return;
  if (typeof window === "undefined" || !window.gtag) return;

  if (isDev() || isDebugMode()) {
    console.log("[SQ Analytics] Set user properties", props);
  }

  if (isDev() && !isDebugMode()) return;

  window.gtag("set", "user_properties", props);
}

// ── Initialize (call once from AnalyticsProvider) ────────────────────────────

let initialized = false;

export function initAnalytics(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  // Enable GA4 debug mode if flag is set
  if (isDebugMode() && window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, { debug_mode: true });
  }
}
