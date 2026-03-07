"use client";

import { useRef, useEffect } from "react";
import { useScroll, useTransform, motion, useInView } from "framer-motion";

export default function Footer() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const isInView = useInView(containerRef, { amount: 0.05 });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("footerVisibilityChange", { detail: isInView }));
  }, [isInView]);

  // The massive wordmark rises from below and fades in — blended/ghosted
  const y = useTransform(scrollYProgress, [0, 1], [-80, 0]);
  const opacity = useTransform(scrollYProgress, [0.3, 0.85], [0, 1]);


  return (
    <footer
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        height: "30vh",
        maxHeight: "360px",
        minHeight: "240px",
        background: "black",
      }}
      data-section-name="footer"
    >
      {/* Ghost wordmark — blends into background */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pointer-events-none overflow-hidden pb-4 md:pb-8 px-8 md:px-20">
        <motion.div
          style={{ y, opacity }}
          className="w-full flex justify-center items-end"
        >
          <svg
            viewBox="0 0 1200 260"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMax meet"
            aria-hidden="true"
          >
            <defs>
              {/* Gradient that fades letter bottoms into background */}
              <linearGradient id="wordmarkFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.18" />
                <stop offset="60%" stopColor="white" stopOpacity="0.12" />
                <stop offset="100%" stopColor="white" stopOpacity="0.06" />
              </linearGradient>

              {/* Subtle noise texture mask for organic blending */}
              <mask id="wordmarkMask">
                <rect width="100%" height="100%" fill="white" />
                <linearGradient id="maskFade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="white" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="white" stopOpacity="1" />
                </linearGradient>
              </mask>
            </defs>

            <text
              x="50%"
              y="88%"
              dominantBaseline="alphabetic"
              textAnchor="middle"
              fill="url(#wordmarkFade)"
              mask="url(#wordmarkMask)"
              style={{
                fontSize: '240px',
                letterSpacing: '-0.04em',
                fontFamily: 'var(--font-display, system-ui)',
                fontWeight: 800,
              }}
            >
              SQUAREUP
            </text>
          </svg>
        </motion.div>
      </div>

      {/* Subtle ambient glow at bottom center */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[180px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(255,140,80,0.04) 0%, transparent 70%)",
        }}
      />
    </footer>
  );
}
