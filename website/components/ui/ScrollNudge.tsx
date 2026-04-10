"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScrollNudge() {
  const [showNudge, setShowNudge] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Check if already dismissed this session
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem("scroll-nudge-dismissed")) {
        setDismissed(true);
        return;
      }
    } catch {
      // Ignore sessionStorage access errors in restrictive incognito modes
    }

    const IDLE_THRESHOLD = 4000; // 4 seconds
    const SCROLL_THRESHOLD = 0.3; // 30% of document

    const startIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      idleTimerRef.current = setTimeout(() => {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        if (scrollPercent < SCROLL_THRESHOLD) {
          setShowNudge(true);
        }
      }, IDLE_THRESHOLD);
    };

    const handleScroll = () => {
      if (showNudge || dismissed) {
        // First scroll after nudge = dismiss forever
        setShowNudge(false);
        setDismissed(true);
        try {
          sessionStorage.setItem("scroll-nudge-dismissed", "1");
        } catch {}
        return;
      }
      startIdleTimer();
    };

    const handleInteraction = () => {
      startIdleTimer();
    };

    // Start the initial idle timer
    startIdleTimer();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [showNudge, dismissed]);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {showNudge && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none select-none"
        >
          {/* Breathing line */}
          <motion.div
            animate={{
              scaleY: [1, 1.8, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-[1px] h-6 rounded-full"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(255, 107, 0, 0.4), transparent)",
            }}
          />

          {/* Chevron */}
          <motion.div
            animate={{
              y: [0, 4, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg
              width="16"
              height="8"
              viewBox="0 0 16 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L8 7L15 1"
                stroke="rgba(255, 107, 0, 0.4)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
