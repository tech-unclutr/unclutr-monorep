import { useEffect, useRef } from "react";
import { useLenis } from "@/components/ui/LenisProvider";
import { MotionValue } from "framer-motion";

/**
 * useScrollSnap
 * 
 * Automatically snaps the scroll position to the nearest "meaningful" state
 * within a sticky section after the user stops scrolling.
 * 
 * @param scrollYProgress - The MotionValue representing scroll progress (0-1)
 * @param containerRef - Ref to the section container (used to calculate absolute scroll offsets)
 * @param snapPoints - Array of progress values (0-1) where the scroll should rest
 * @param options - Configuration for threshold, delay, and animation duration
 */
export function useScrollSnap(
  scrollYProgress: MotionValue<number>,
  containerRef: React.RefObject<HTMLElement | null>,
  snapPoints: number[],
  options = { threshold: 0.1, delay: 450, duration: 1.2 }
) {
  const lenis = useLenis();
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammaticScrollRef = useRef(false);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      // Don't trigger if we are already snapping or scrolling programmatically
      if (isProgrammaticScrollRef.current) return;

      // Clear existing timer as user is still active
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);

      scrollIdleTimerRef.current = setTimeout(() => {
        // Find the nearest snap point in the provided array
        let nearestPoint = snapPoints[0];
        let minDiff = Math.abs(latest - nearestPoint);

        for (let i = 1; i < snapPoints.length; i++) {
          const diff = Math.abs(latest - snapPoints[i]);
          if (diff < minDiff) {
            minDiff = diff;
            nearestPoint = snapPoints[i];
          }
        }

        // Only snap if:
        // 1. We're not already at the point (minDiff > 0.001)
        // 2. We're within the trigger threshold (minDiff < options.threshold)
        if (minDiff > 0.005 && minDiff < options.threshold) {
          if (containerRef.current && lenis) {
            isProgrammaticScrollRef.current = true;
            
            // Calculate pixel target
            // offsetTop is usually sufficient for top-level sections
            const sectionTop = containerRef.current.offsetTop;
            const sectionHeight = containerRef.current.offsetHeight;
            const targetScroll = sectionTop + sectionHeight * nearestPoint;

            lenis.scrollTo(targetScroll, {
              duration: options.duration,
              easing: (t: number) => 1 - Math.pow(1 - t, 3), // easeOutCubic
              onComplete: () => {
                // Buffer to prevent immediate re-trigger by momentum
                setTimeout(() => {
                  isProgrammaticScrollRef.current = false;
                }, 150);
              },
            });
          }
        }
      }, options.delay);
    });

    return () => {
      unsubscribe();
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    };
  }, [scrollYProgress, lenis, containerRef, snapPoints, options.threshold, options.delay, options.duration]);

  return { isSnapping: isProgrammaticScrollRef.current };
}
