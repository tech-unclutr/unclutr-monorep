"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "../core";
import { EventName } from "../types";
import { ENGAGEMENT_WEIGHTS } from "../constants";

export function useEngagementScore(): void {
  const scoreRef = useRef(0);
  const sectionsViewedRef = useRef(0);
  const interactionsRef = useRef(0);
  const maxScrollDepthRef = useRef(0);
  const reportedRef = useRef(false);
  const pageStartRef = useRef(Date.now());
  const timeAccruedRef = useRef(0);

  useEffect(() => {
    // Section view: +5
    const handleSectionView = () => {
      sectionsViewedRef.current++;
      scoreRef.current += ENGAGEMENT_WEIGHTS.SECTION_VIEW;
    };

    // Carousel interact: +3
    const handleCarousel = () => {
      interactionsRef.current++;
      scoreRef.current += ENGAGEMENT_WEIGHTS.CAROUSEL_INTERACT;
    };

    // Video start: +8
    const handleVideoStart = () => {
      interactionsRef.current++;
      scoreRef.current += ENGAGEMENT_WEIGHTS.VIDEO_START;
    };

    // Video complete: +15
    const handleVideoComplete = () => {
      scoreRef.current += ENGAGEMENT_WEIGHTS.VIDEO_COMPLETE;
    };

    // Study modal: +5
    const handleStudyModal = () => {
      interactionsRef.current++;
      scoreRef.current += ENGAGEMENT_WEIGHTS.STUDY_MODAL;
    };

    // CTA click: +20
    const handleCTA = () => {
      interactionsRef.current++;
      scoreRef.current += ENGAGEMENT_WEIGHTS.CTA_CLICK;
    };

    // Booking reached: +10
    const handleBooking = () => {
      scoreRef.current += ENGAGEMENT_WEIGHTS.BOOKING_REACHED;
    };

    // Scroll depth
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const depth = Math.round((window.scrollY / docHeight) * 100);
      if (depth > maxScrollDepthRef.current) {
        const oldTens = Math.floor(maxScrollDepthRef.current / 10);
        const newTens = Math.floor(depth / 10);
        const newPoints = Math.min(
          (newTens - oldTens) * ENGAGEMENT_WEIGHTS.SCROLL_PER_10,
          ENGAGEMENT_WEIGHTS.SCROLL_MAX - Math.floor(maxScrollDepthRef.current / 10) * ENGAGEMENT_WEIGHTS.SCROLL_PER_10
        );
        if (newPoints > 0) scoreRef.current += newPoints;
        maxScrollDepthRef.current = depth;
      }
    };

    // Time on page: +1 per 15s, max +20
    const timeInterval = setInterval(() => {
      if (timeAccruedRef.current < ENGAGEMENT_WEIGHTS.TIME_MAX) {
        timeAccruedRef.current += ENGAGEMENT_WEIGHTS.TIME_PER_15S;
        scoreRef.current += ENGAGEMENT_WEIGHTS.TIME_PER_15S;
      }
    }, 15000);

    // Listen for custom analytics events
    window.addEventListener("sq:section_view", handleSectionView);
    window.addEventListener("sq:carousel_interact", handleCarousel);
    window.addEventListener("sq:video_start", handleVideoStart);
    window.addEventListener("sq:video_complete", handleVideoComplete);
    window.addEventListener("sq:study_modal", handleStudyModal);
    window.addEventListener("sq:cta_click", handleCTA);
    window.addEventListener("sq:booking_reached", handleBooking);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Report on page unload
    const report = () => {
      if (reportedRef.current) return;
      reportedRef.current = true;

      trackEvent(
        EventName.ENGAGEMENT_SCORE,
        {
          score: scoreRef.current,
          sections_viewed: sectionsViewedRef.current,
          interactions: interactionsRef.current,
          time_seconds: Math.round((Date.now() - pageStartRef.current) / 1000),
          max_scroll_depth: maxScrollDepthRef.current,
        },
        { immediate: true }
      );
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") report();
    });
    window.addEventListener("beforeunload", report);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener("sq:section_view", handleSectionView);
      window.removeEventListener("sq:carousel_interact", handleCarousel);
      window.removeEventListener("sq:video_start", handleVideoStart);
      window.removeEventListener("sq:video_complete", handleVideoComplete);
      window.removeEventListener("sq:study_modal", handleStudyModal);
      window.removeEventListener("sq:cta_click", handleCTA);
      window.removeEventListener("sq:booking_reached", handleBooking);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
}
