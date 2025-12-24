"use client";

import { useAnalytics, useAutoTrackInteractions } from "@/lib/analytics";

export function AnalyticsListener() {
    useAnalytics(); // Page views
    useAutoTrackInteractions(); // Clicks
    return null;
}
