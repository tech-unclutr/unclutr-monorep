"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "../core";
import { EventName } from "../types";

interface VideoMeta {
  name: string;
  sourceCarousel: string;
  cardIndex: number;
}

export function useVideoTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  meta: VideoMeta
): void {
  const milestonesRef = useRef<Set<number>>(new Set());
  const startedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (!startedRef.current) {
        startedRef.current = true;
        trackEvent(EventName.VIDEO_START, {
          video_name: meta.name,
          source_carousel: meta.sourceCarousel,
          card_index: meta.cardIndex,
        });
      }
    };

    const handleTimeUpdate = () => {
      if (!video.duration || video.duration === Infinity) return;
      const pct = (video.currentTime / video.duration) * 100;

      for (const milestone of [25, 50, 75, 100] as const) {
        if (pct >= milestone && !milestonesRef.current.has(milestone)) {
          milestonesRef.current.add(milestone);
          trackEvent(EventName.VIDEO_PROGRESS, {
            video_name: meta.name,
            percent: milestone,
          });
        }
      }
    };

    const handlePause = () => {
      if (video.ended) return; // ended fires separately
      const pct = video.duration
        ? Math.round((video.currentTime / video.duration) * 100)
        : 0;
      trackEvent(EventName.VIDEO_PAUSE, {
        video_name: meta.name,
        pause_percent: pct,
        pause_reason: document.hidden ? "offscreen" : "user",
      });
    };

    const handleEnded = () => {
      trackEvent(EventName.VIDEO_COMPLETE, {
        video_name: meta.name,
        watch_seconds: Math.round(video.currentTime),
      });
      // Reset for loop playback
      milestonesRef.current.clear();
      startedRef.current = false;
    };

    const handleSeeked = () => {
      // If seeking back to start (loop), reset milestones
      if (video.currentTime < 1) {
        milestonesRef.current.clear();
        startedRef.current = false;
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [videoRef, meta.name, meta.sourceCarousel, meta.cardIndex]);
}
