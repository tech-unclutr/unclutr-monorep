import { useEffect, useRef, useState, useCallback, type RefObject } from "react";

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

const DURATION = 700; // ms — Apple-style timing
const WHEEL_THRESHOLD = 50; // minimum deltaY to trigger navigation
const TOUCH_THRESHOLD = 50; // minimum swipe distance in px

export function useFullPageScroll(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean
) {
  const [currentSection, setCurrentSection] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const isAnimating = useRef(false);
  const animationId = useRef<number>(0);
  const wheelAccumulator = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);

  const getSections = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(":scope > section"));
  }, [containerRef]);

  const animateScrollTo = useCallback((targetY: number) => {
    if (animationId.current) cancelAnimationFrame(animationId.current);

    const startY = window.scrollY;
    const delta = targetY - startY;
    if (Math.abs(delta) < 1) { isAnimating.current = false; return; }

    const startTime = performance.now();
    isAnimating.current = true;

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = easeOutQuint(progress);
      window.scrollTo(0, startY + delta * eased);

      if (progress < 1) {
        animationId.current = requestAnimationFrame(step);
      } else {
        isAnimating.current = false;
        animationId.current = 0;
      }
    }

    animationId.current = requestAnimationFrame(step);
  }, []);

  const goToSection = useCallback(
    (index: number) => {
      const sections = getSections();
      if (index < 0 || index >= sections.length) return;

      const target = sections[index];
      const targetY = target.getBoundingClientRect().top + window.scrollY;
      setCurrentSection(index);
      animateScrollTo(targetY);
    },
    [getSections, animateScrollTo]
  );

  const goNext = useCallback(() => {
    const sections = getSections();
    if (currentSection < sections.length - 1) goToSection(currentSection + 1);
  }, [currentSection, getSections, goToSection]);

  const goPrev = useCallback(() => {
    if (currentSection > 0) goToSection(currentSection - 1);
  }, [currentSection, goToSection]);

  // Lock body scroll when enabled
  useEffect(() => {
    if (!enabled) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [enabled]);

  // Count sections
  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    setTotalSections(getSections().length);
  }, [enabled, containerRef, getSections]);

  // Wheel listener — intercept and navigate one slide per gesture
  useEffect(() => {
    if (!enabled) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();

      if (isAnimating.current) return;

      wheelAccumulator.current += e.deltaY;

      // Reset accumulator after a pause (new gesture)
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        wheelAccumulator.current = 0;
      }, 200);

      if (Math.abs(wheelAccumulator.current) >= WHEEL_THRESHOLD) {
        if (wheelAccumulator.current > 0) {
          goNext();
        } else {
          goPrev();
        }
        wheelAccumulator.current = 0;
        if (wheelTimer.current) clearTimeout(wheelTimer.current);
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [enabled, goNext, goPrev]);

  // Touch listeners — swipe up/down to navigate
  useEffect(() => {
    if (!enabled) return;

    function onTouchStart(e: TouchEvent) {
      touchStartY.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      // Prevent native scroll during touch
      e.preventDefault();
    }

    function onTouchEnd(e: TouchEvent) {
      if (isAnimating.current) return;

      const deltaY = touchStartY.current - e.changedTouches[0].clientY;

      if (Math.abs(deltaY) >= TOUCH_THRESHOLD) {
        if (deltaY > 0) {
          goNext();
        } else {
          goPrev();
        }
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, goNext, goPrev]);

  // Keyboard listener
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (isAnimating.current) {
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) {
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          goNext();
          break;
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          goPrev();
          break;
        case "Home":
          e.preventDefault();
          goToSection(0);
          break;
        case "End":
          e.preventDefault();
          goToSection(getSections().length - 1);
          break;
        case " ":
          e.preventDefault();
          if (e.shiftKey) goPrev();
          else goNext();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, goNext, goPrev, goToSection, getSections]);

  return { currentSection, totalSections, goToSection, goNext, goPrev };
}
