"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const INTERACTIVE_SELECTORS = "a, button, [role='button'], input, textarea, select, .cursor-pointer, [data-cursor-hover]";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const triangleRef = useRef<SVGSVGElement>(null);
  const squareRef = useRef<SVGSVGElement>(null);
  const [mounted, setMounted] = useState(false);
  const positionRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<"default" | "scrolling" | "hover">("default");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply visual state via direct DOM manipulation (no React re-render)
  const applyVisualState = useCallback((state: "default" | "scrolling" | "hover") => {
    const triangle = triangleRef.current;
    const square = squareRef.current;
    if (!triangle || !square) return;

    if (state === "hover") {
      triangle.style.opacity = "0";
      triangle.style.transform = "translate(-50%, -50%) rotate(-15deg) scale(0.75)";
      square.style.opacity = "1";
      square.style.transform = "translate(-50%, -50%) rotate(-15deg) scale(1)";
    } else {
      triangle.style.opacity = "1";
      triangle.style.transform = "translate(-50%, -50%) rotate(-15deg) scale(1)";
      square.style.opacity = "0";
      square.style.transform = "translate(-50%, -50%) rotate(-15deg) scale(0.75)";
    }
  }, []);

  const updateCursorPosition = useCallback(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    positionRef.current.x += (targetRef.current.x - positionRef.current.x) * 0.15;
    positionRef.current.y += (targetRef.current.y - positionRef.current.y) * 0.15;

    cursor.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;

    rafRef.current = requestAnimationFrame(updateCursorPosition);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (window.innerWidth < 768 || "ontouchstart" in window) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
    };

    const handleScroll = () => {
      if (stateRef.current !== "hover") {
        stateRef.current = "scrolling";
        // No visual change needed for scrolling - just track state
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (stateRef.current === "scrolling") {
          stateRef.current = "default";
        }
      }, 150);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(INTERACTIVE_SELECTORS)) {
        stateRef.current = "hover";
        applyVisualState("hover");
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement | null;

      const wasInteractive = target.closest(INTERACTIVE_SELECTORS);
      const stillInteractive = relatedTarget?.closest(INTERACTIVE_SELECTORS);

      if (wasInteractive && !stillInteractive) {
        stateRef.current = "default";
        applyVisualState("default");
      }
    };

    positionRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    targetRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    rafRef.current = requestAnimationFrame(updateCursorPosition);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [mounted, updateCursorPosition, applyVisualState]);

  if (!mounted) return null;

  if (typeof window !== "undefined" && (window.innerWidth < 768 || "ontouchstart" in window)) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[10000]"
      style={{ willChange: "transform" }}
    >
      {/* Triangle shape (default) */}
      <svg
        ref={triangleRef}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="absolute"
        style={{
          transform: "translate(-50%, -50%) rotate(-15deg)",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
          transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
          opacity: 1,
        }}
      >
        <defs>
          <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF3131" />
            <stop offset="100%" stopColor="#FF914D" />
          </linearGradient>
        </defs>
        <path
          d="M12 2L22 20H2L12 2Z"
          fill="url(#triangleGradient)"
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* Square shape (hover) */}
      <svg
        ref={squareRef}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="absolute"
        style={{
          transform: "translate(-50%, -50%) rotate(-15deg) scale(0.75)",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
          transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
          opacity: 0,
        }}
      >
        <defs>
          <linearGradient id="squareGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFDE59" />
            <stop offset="100%" stopColor="#FF914D" />
          </linearGradient>
        </defs>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="4"
          fill="url(#squareGradient)"
          stroke="white"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
