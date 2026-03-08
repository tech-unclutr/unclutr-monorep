"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useScroll, useTransform, motion, useInView } from "framer-motion";
import { useSectionVisibility } from "@/lib/analytics";

export default function Footer() {
  const containerRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useSectionVisibility("footer", containerRef);
  const [isHovered, setIsHovered] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const isInView = useInView(containerRef, { amount: 0.05 });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("footerVisibilityChange", { detail: isInView }));
  }, [isInView]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    if (!isHovered) setIsHovered(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (!containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    });
    if (!isHovered) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // The massive wordmark rises from below and fades in
  const y = useTransform(scrollYProgress, [0, 1], [-80, 0]);
  const opacity = useTransform(scrollYProgress, [0.3, 0.85], [0, 1]);

  // Generate some static random positions for tiny stardust particles only on client to avoid hydration mismatch
  const [particles, setParticles] = useState<{ id: number, left: string, bottom: string, size: number, duration: number, delay: number }[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        bottom: `${Math.random() * 100}%`,
        size: Math.random() * 2.5 + 0.5,
        duration: Math.random() * 5 + 4,
        delay: Math.random() * 4,
      }))
    );
  }, []);

  return (
    <footer
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleMouseLeave}
      className="relative overflow-hidden w-full h-[180px] sm:h-[30vh] sm:min-h-[240px] sm:max-h-[360px] bg-black"
      data-section-name="footer"
    >
      {/* Interactive Cursor Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-out"
        style={{
          background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.015), transparent 70%)`,
          opacity: isHovered ? 1 : 0
        }}
      />

      {/* Upward Floating Stardust */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-white/10"
            style={{
              left: p.left,
              bottom: p.bottom,
              width: p.size,
              height: p.size,
              opacity: 0,
            }}
            animate={{
              y: [0, -120],
              opacity: [0, 0.4, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Ghost wordmark — blends into background */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pointer-events-none overflow-hidden h-full z-10 w-full pb-0 md:pb-4">
        <motion.div
          style={{ y, opacity }}
          className="w-[90%] flex justify-center items-end relative overflow-hidden group"
        >
          {/* Sweeping Shine Overlay */}
          <motion.div
            className="absolute inset-y-0 z-20 pointer-events-none opacity-0"
            style={{
              width: "100%",
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 70%, transparent 100%)",
              mixBlendMode: "overlay",
              transform: "skewX(-20deg)",
            }}
            animate={isInView ? { x: ["-150%", "150%"], opacity: [0, 1, 0] } : { x: "-150%", opacity: 0 }}
            transition={{ duration: 3, ease: "easeInOut", delay: 0.2 }}
          />

          <svg
            viewBox="0 0 2400 350"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMax meet"
            aria-hidden="true"
          >
            <defs>
              {/* Gradient that fades letter bottoms into background */}
              <linearGradient id="wordmarkFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.12" />
                <stop offset="60%" stopColor="white" stopOpacity="0.08" />
                <stop offset="100%" stopColor="white" stopOpacity="0.03" />
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
              y="90%"
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

      {/* Animated Core Glow at bottom center */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(255,140,80,0.03) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </footer>
  );
}
