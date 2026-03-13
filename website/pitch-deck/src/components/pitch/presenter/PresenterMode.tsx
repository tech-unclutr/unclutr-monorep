import { useState, useEffect, useCallback, useRef } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { type SlideDefinition } from "@/lib/slides";
import { SLIDE_COMPONENTS } from "@/lib/slideComponents";

interface PresenterModeProps {
  onExit: () => void;
  slides: SlideDefinition[];
}

export default function PresenterMode({ onExit, slides }: PresenterModeProps) {
  const [current, setCurrent] = useState(0);
  const [revealStep, setRevealStep] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [showToggle, setShowToggle] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const { theme, setTheme } = useTheme();

  // Listen for fullscreen exit (fullscreen itself is requested from the click handler)
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) onExitRef.current();
    };
    document.addEventListener("fullscreenchange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

  // Auto-hide toggle after 3s of inactivity
  useEffect(() => {
    const resetHideTimer = () => {
      setShowToggle(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowToggle(false), 3000);
    };
    resetHideTimer();
    window.addEventListener("mousemove", resetHideTimer);
    window.addEventListener("touchstart", resetHideTimer);
    return () => {
      window.removeEventListener("mousemove", resetHideTimer);
      window.removeEventListener("touchstart", resetHideTimer);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const goTo = useCallback((idx: number) => {
    if (transitioning || idx < 0 || idx >= slides.length) return;
    setTransitioning(true);
    setRevealStep(1);
    setTimeout(() => { setCurrent(idx); setTransitioning(false); }, 750); // Apple-style transition duration
  }, [transitioning, slides.length]);

  useEffect(() => { setCurrent(0); setRevealStep(1); }, [slides]);

  const maxRevealSteps = slides[current]?.revealSteps ?? 0;

  const handleNext = useCallback(() => {
    if (transitioning) return;
    if (maxRevealSteps > 0 && revealStep < maxRevealSteps) {
      setRevealStep(prev => prev + 1);
    } else {
      goTo(current + 1);
    }
  }, [transitioning, maxRevealSteps, revealStep, goTo, current]);

  const handlePrev = useCallback(() => {
    if (transitioning) return;
    if (maxRevealSteps > 0 && revealStep > 1) {
      setRevealStep(prev => prev - 1);
    } else {
      if (current > 0) {
        const prevSlide = slides[current - 1];
        const prevMaxSteps = prevSlide?.revealSteps ?? 0;
        setTransitioning(true);
        setRevealStep(prevMaxSteps);
        setTimeout(() => { setCurrent(current - 1); setTransitioning(false); }, 750); // Apple-style transition duration
      }
    }
  }, [transitioning, maxRevealSteps, revealStep, current, slides]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onExitRef.current();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [handleNext, handlePrev]);

  const slide = slides[current];
  const SlideComp = slide ? SLIDE_COMPONENTS[slide.id] : null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100]"
      style={{ background: "hsl(var(--sq-off-white))" }}
    >
      {/* Slide area — full viewport */}
      <div
        className={`absolute inset-0 overflow-hidden ${transitioning ? "opacity-0 scale-[0.98] blur-[8px]" : "opacity-100 scale-100 blur-0"}`}
        style={{ transition: "opacity 750ms cubic-bezier(0.16, 1, 0.3, 1), transform 750ms cubic-bezier(0.16, 1, 0.3, 1), filter 750ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        id={`presenter-slide-${current}`}
      >
        {SlideComp && <SlideComp mode="presenter" revealStep={revealStep} />}
      </div>

      {/* Invisible click zones for navigation */}
      <div
        className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-w-resize"
        onClick={handlePrev}
      />
      <div
        className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-e-resize"
        onClick={handleNext}
      />

      {/* Light/dark toggle — upper right, auto-hides */}
      <button
        onClick={(e) => { e.stopPropagation(); setTheme(theme === "dark" ? "light" : "dark"); }}
        className={`absolute top-5 right-5 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-md ${showToggle ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{
          background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
        }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
        ) : (
          <Moon size={18} style={{ color: "rgba(0,0,0,0.5)" }} />
        )}
      </button>
    </div>
  );
}
