"use client";

import { useRef, useEffect, useState } from "react";
import { useScroll, motion, useTransform, useMotionValueEvent, useSpring, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "../ui/useIsMobile";
import { useSectionVisibility } from "@/lib/analytics";

/* ─── Copy & Neural Network Data ─── */
const SUBHEADLINES = [
  "The Customer Understanding team you wish you had",
  "We give voice to the empty chair representing the customer in Amazon's board meetings",
  "Replacing 'I think users want...' with 'Here is exactly what they need'"
];
const PARTICLE_DENSITY = 0.25;
const GLOBE_RADIUS = 320;
const TEXT_LINES = ["Stop Guessing", "Start Listening"];

const MISSION_TEXT = "We go find what your customers are saying, make sense of it, and turn it into clear priorities for the relevant teams in your organization.";

interface Particle {
  textPos: { x: number; y: number; z: number };
  globePos: { x: number; y: number; z: number };
  currentPos: { x: number; y: number; z: number };
  flyOutDir: { x: number; y: number; z: number };
  color: string;
  size: number;
  hasExited?: boolean; // Track if particle has dispatched exit event
}


/* ═══════════════════════════════════════════════════════════
   HeroSection - Disintegrating Particle Globe + Intelligence Stream
   ═══════════════════════════════════════════════════════════ */
export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  useSectionVisibility("hero", containerRef);
  const [mounted, setMounted] = useState(false);
  const [subheadlineIndex, setSubheadlineIndex] = useState(0);

  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  const [isHoveringGlobe, setIsHoveringGlobe] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTextIndex, setActiveTextIndex] = useState(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    if (isHoveringGlobe) return;

    // Alternate between headline (0) and mission (1) every 4 seconds
    const interval = setInterval(() => {
      setActiveTextIndex((prev) => (prev === 0 ? 1 : 0));
    }, 4000);

    return () => clearInterval(interval);
  }, [isHoveringGlobe]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubheadlineIndex((prev) => (prev + 1) % SUBHEADLINES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const showMission = activeTextIndex === 1;

  // 1. Scroll tracking over a 250vh section for a punchy, cinematic experience
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    mass: 0.5,
  });

  const progressRef = useRef(0);
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    progressRef.current = latest;
  });

  const timeRef = useRef(0);

  // 2. Initialize Particles
  useEffect(() => {
    if (!canvasRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMounted(true);
      return;
    }
    setMounted(true);

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    setDimensions({ width, height });

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Offscreen canvas to get text pixels
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const octx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!octx) return;

    octx.fillStyle = "#ffffff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";

    // Draw "STOP GUESSING" and "Start Listening"
    const isMobileSize = width < 768;
    const font1 = isMobileSize ? width * 0.1 : Math.min(width * 0.08, 120);
    const font2 = isMobileSize ? width * 0.12 : Math.min(width * 0.1, 150);

    octx.font = `600 ${font1}px 'Space Grotesk', sans-serif`;
    octx.fillText(TEXT_LINES[0], width / 2, isMobileSize ? height * 0.42 : height * 0.4);

    octx.font = `700 ${font2}px 'Space Grotesk', sans-serif`;
    octx.fillText(TEXT_LINES[1], width / 2, isMobileSize ? height * 0.5 : height * 0.55);

    const imgData = octx.getImageData(0, 0, width, height).data;
    const newParticles: Particle[] = [];
    const colors = ["#ffffff", "#cccccc", "#ff6b00", "#ff9f43"];

    // Scan pixels - use higher density for smaller text but less jitter
    const effectiveDensity = isMobileSize ? PARTICLE_DENSITY * 1.5 : PARTICLE_DENSITY;
    const step = Math.max(1, Math.floor(1 / effectiveDensity));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const alpha = imgData[index + 3];

        if (alpha > 128) {
          const isHighlight = Math.random() > 0.95;
          const rColor = isHighlight ? colors[2] : (Math.random() > 0.5 ? colors[0] : colors[1]);

          // Bias fly-out direction downward for transition continuity
          const flyOutVector = {
            x: (Math.random() - 0.5) * 0.6,
            y: Math.random() * 0.8 + 0.2, // Strongly bias downward (positive Y = down)
            z: (Math.random() - 0.5) * 0.4
          };
          const flyOutLen = Math.sqrt(flyOutVector.x ** 2 + flyOutVector.y ** 2 + flyOutVector.z ** 2) || 1;

          newParticles.push({
            textPos: {
              x: x - width / 2 + (Math.random() - 0.5) * (isMobileSize ? 1.5 : 4),
              y: y - height / 2 + (Math.random() - 0.5) * (isMobileSize ? 1.5 : 4),
              z: (Math.random() - 0.5) * (isMobileSize ? 8 : 20)
            },
            globePos: { x: 0, y: 0, z: 0 },
            currentPos: { x: 0, y: 0, z: 0 },
            flyOutDir: {
              x: (flyOutVector.x / flyOutLen) * (Math.random() * 2000 + 1000),
              y: (flyOutVector.y / flyOutLen) * (Math.random() * 2000 + 1000),
              z: (flyOutVector.z / flyOutLen) * (Math.random() * 2000 + 1000)
            },
            color: rColor,
            size: isMobileSize
              ? (isHighlight ? Math.random() * 1.2 + 0.8 : Math.random() * 0.8 + 0.4)
              : (isHighlight ? Math.random() * 2 + 1.5 : Math.random() * 1.5 + 0.5),
          });
        }
      }
    }

    // Generate Globe positions (Fibonacci sphere)
    const numParticles = newParticles.length;
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < numParticles; i++) {
      const y = 1 - (i / (numParticles - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const noiseScale = 5;
      const noiseX = (Math.random() - 0.5) * noiseScale;
      const noiseY = (Math.random() - 0.5) * noiseScale;
      const noiseZ = (Math.random() - 0.5) * noiseScale;

      newParticles[i].globePos = {
        x: x * GLOBE_RADIUS + noiseX,
        y: y * GLOBE_RADIUS + noiseY,
        z: z * GLOBE_RADIUS + noiseZ
      };
    }

    // Shuffle globe targets to create continuous crossing paths during disintegration
    for (let i = newParticles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = newParticles[i].globePos;
      newParticles[i].globePos = newParticles[j].globePos;
      newParticles[j].globePos = temp;
    }

    particlesRef.current = newParticles;

  }, []);

  // 3. Render Loop (Canvas Animation)
  useEffect(() => {
    if (!canvasRef.current || particlesRef.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const dpr = window.devicePixelRatio || 1;

    // Visibility gating — skip rendering when offscreen
    const isVisibleRef = { current: true };
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0 });
    if (containerRef.current) observer.observe(containerRef.current);

    const render = () => {
      if (!isVisibleRef.current) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      // Always reset base alpha before clearing the canvas to prevent smudging and trailing artifacts
      ctx.globalAlpha = 1;

      // Full opaque clear to prevent background bleed-through
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const width = dimensions.width;
      const height = dimensions.height;

      // Map global scroll to particle progress. 
      // 0 to 0.4 overall scroll = 0 to 1 text->globe transition
      const rawProgress = Math.min(progressRef.current * 2.5, 1);

      timeRef.current += 0.003;

      const rotY = timeRef.current;
      const rotX = 0.2 + rawProgress * 0.3;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Easing for the disintegration (Start slow, explode, settle)
      const ease = rawProgress < 0.5 ? 4 * rawProgress * rawProgress * rawProgress : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        // Globe Target with Rotation
        let gx = p.globePos.x * cosY - p.globePos.z * sinY;
        let gz = p.globePos.x * sinY + p.globePos.z * cosY;

        let gy = p.globePos.y * cosX - gz * sinX;
        gz = p.globePos.y * sinX + gz * cosX;

        // Disintegration explosion force
        const explosionForce = Math.sin(ease * Math.PI) * 200;
        const noiseX = (Math.random() - 0.5) * explosionForce;
        const noiseY = (Math.random() - 0.5) * explosionForce;
        const noiseZ = (Math.random() - 0.5) * explosionForce;

        // Globe Disintegration on scroll out
        // progress > 0.6 means we are scrolling out.
        const flyOutProgress = progressRef.current > 0.6 ? Math.min((progressRef.current - 0.6) / 0.4, 1) : 0;
        const flyOutEase = flyOutProgress * flyOutProgress * flyOutProgress; // aggressive exponential curve for flying out

        const currentX = p.textPos.x + (gx - p.textPos.x) * ease + noiseX + p.flyOutDir.x * flyOutEase;
        const currentY = p.textPos.y + (gy - p.textPos.y) * ease + noiseY + p.flyOutDir.y * flyOutEase;
        const currentZ = p.textPos.z + (gz - p.textPos.z) * ease + noiseZ + p.flyOutDir.z * flyOutEase;

        p.currentPos = { x: currentX, y: currentY, z: currentZ };

        // 3D Projection
        const fov = 1200;
        const viewZ = currentZ + fov;
        if (viewZ <= 0) continue;

        const scale = fov / viewZ;
        const projX = currentX * scale + width / 2;

        // Remove manual translation since the element physically scrolls up
        const scrollOffset = 0;
        const projY = currentY * scale + (height / 2) - scrollOffset;

        // Dispatch exit event for particles exiting bottom during fly-out
        if (flyOutProgress > 0.2 && projY > height * 0.9 && !p.hasExited) {
          p.hasExited = true;
          // Dispatch event for ParticleNarrativeController to spawn continuation particles
          if (typeof window !== 'undefined' && Math.random() < 0.4) { // 40% of exiting particles spawn
            window.dispatchEvent(new CustomEvent('hero-particle-exit', {
              detail: {
                x: projX,
                y: height,
                vx: (p.flyOutDir.x / 2000) * flyOutEase,
                vy: Math.max(0.3, (p.flyOutDir.y / 2000) * flyOutEase * 0.5),
                color: p.color
              }
            }));
          }
        }

        // Illumination and Depth (Fade back of globe)
        let alpha = 1;
        if (rawProgress > 0.5) {
          const minZ = -GLOBE_RADIUS;
          const maxZ = GLOBE_RADIUS;
          const normalizedZ = Math.max(0, Math.min(1, (currentZ - minZ) / (maxZ - minZ)));
          alpha = 0.4 + normalizedZ * 0.6; // More solid 3D feel
        }

        // Global fade out as we transition to next section (0.7 - 1.0)
        let opacityMultiplier = 1;
        if (progressRef.current > 0.7) {
          opacityMultiplier = Math.max(0, 1 - ((progressRef.current - 0.7) / 0.3));
        }

        const isMobileRender = width < 768;
        const rawSize = (p.size + 0.5) * scale * (rawProgress > 0.8 ? 1.5 : 1.0);
        // Make mobile particles tightly grouped but very bright
        const finalSize = isMobileRender ? Math.min(rawSize, 1.8) : rawSize;

        ctx.beginPath();
        // Give the brightest particles a white core
        const isBright = p.color === "#ffffff" || p.color === "#ff9f43";
        ctx.fillStyle = isBright ? '#ffffff' : p.color;

        // Boost alpha significantly on mobile so the tight points glow
        const baseAlpha = isMobileRender ? Math.min(1, alpha * 2.5) : alpha;

        // Use a single, clean alpha value without double-multiplying
        ctx.globalAlpha = isBright ? baseAlpha * opacityMultiplier : baseAlpha * (isMobileRender ? 0.9 : 0.6) * opacityMultiplier;

        if (finalSize < 1.5) {
          ctx.fillRect(projX * dpr, projY * dpr, finalSize * dpr, finalSize * dpr);
        } else {
          ctx.arc(projX * dpr, projY * dpr, finalSize * dpr, 0, Math.PI * 2);
          ctx.fill();
        }

        // Optional Glow on large particles (limited to ~10% for performance)
        if (isBright && finalSize > 2 && i % 10 === 0) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [dimensions]);

  /* ═══ Scroll Triggers for HTML Elements ═══ */
  const textSubOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);
  const textSubY = useTransform(smoothProgress, [0, 0.1], [0, 20]);

  // New hooks for Interactive Globe Overlay
  // Sync appearance with globe formation completion (rawProgress ~1.0 at scroll 0.4)
  const overlayOpacity = useTransform(smoothProgress, [0.4, 0.45, 0.6, 0.75], [0, 1, 1, 0]);
  const overlayY = useTransform(smoothProgress, [0.4, 0.45], [40, 0]);

  return (
    <section id="hero" ref={containerRef} className="relative z-0 h-[250vh] bg-black text-white font-sans selection:bg-brand-orange/30">

      {/* Sticky Container for the full Screen viewport */}
      <div className="sticky top-0 w-full h-screen overflow-hidden left-0 flex items-center justify-center">

        {/* Ambient Dark Canvas Background */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.12)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
        </div>

        {/* The Particle Canvas */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        />

        {/* ═══ Phase 1: Static Hook Text (disappears immediately as scroll starts) ═══ */}
        {mounted && (
          <motion.div
            style={{ opacity: textSubOpacity, y: textSubY }}
            className="absolute z-20 top-[65%] w-full flex flex-col items-center justify-center px-4"
          >
            <div className="relative h-20 sm:h-24 w-full max-w-2xl mx-auto flex items-center justify-center">
              <AnimatePresence>
                <motion.h2
                  key={subheadlineIndex}
                  initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  exit={{ opacity: 0, filter: "blur(10px)", y: -10 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute w-full text-center font-display text-xl sm:text-2xl font-medium text-white leading-tight text-balance tracking-wide"
                >
                  {SUBHEADLINES[subheadlineIndex]}
                </motion.h2>
              </AnimatePresence>
            </div>

            <div className="absolute top-[18vh] flex flex-col items-center gap-2 text-white/60 font-medium text-[11px] tracking-[0.2em] uppercase">
              <span>Scroll to Ignite</span>
              <ChevronDown className="w-3 h-3 animate-bounce" />
            </div>
          </motion.div>
        )}

        {/* ═══ Phase 2 & 3: Interactive Globe Overlay ═══ */}
        {mounted && (
          <motion.div
            style={{
              opacity: overlayOpacity,
              y: overlayY,
            }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-auto"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
              setIsHoveringGlobe(dist <= GLOBE_RADIUS);
              setMousePos({ x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => {
              setIsHoveringGlobe(false);
            }}
          >
            <div className="relative w-full max-w-5xl px-6 flex flex-col items-center text-center group">
              {/* Mission Content */}
              <div className="relative h-[400px] flex items-center justify-center w-full">

                {/* Headline Mode */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: showMission ? 0 : 1,
                    scale: showMission ? 0.98 : 1,
                    y: showMission ? -10 : 0,
                    filter: showMission ? "blur(20px)" : "blur(0px)",
                    pointerEvents: showMission ? "none" : "auto"
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <h1 className="text-[clamp(36px,10vw,64px)] md:text-7xl lg:text-8xl font-display font-semibold tracking-tight text-white mb-4">
                    Designed for<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-orange via-white to-white/80">
                      Consumer Companies
                    </span>
                  </h1>
                </motion.div>

                {/* Mission Mode (Glassmorphism) */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: showMission ? 1 : 0,
                    scale: showMission ? 1 : 1.05,
                    y: showMission ? 0 : 10,
                    filter: showMission ? "blur(0px)" : "blur(20px)",
                    pointerEvents: showMission ? "auto" : "none"
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="relative p-6 xs:p-8 md:p-16 rounded-[40px] overflow-hidden">
                    {/* Glass Layer - Darkened and increased blur for maximum readability against particles */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[40px] border border-white/10 shadow-[0_12px_64px_0_rgba(0,0,0,0.8)]" />

                    {/* Inner Content */}
                    <p className="relative text-xl md:text-3xl font-display font-medium text-white leading-tight md:leading-snug max-w-2xl text-balance tracking-tight">
                      {MISSION_TEXT}
                    </p>

                    {/* Subtle Internal Glow */}
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand-orange/10 blur-[100px] pointer-events-none" />
                  </div>
                </motion.div>
              </div>

              {/* Polish note: Removed CTA and excessive hints for a cleaner "Apple" feel */}
            </div>
          </motion.div>
        )}

        {/* Bottom edge fade */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent pointer-events-none z-[5]" />

        {/* Option 4: Hover Tooltip */}
        <motion.div
          animate={{
            opacity: isHoveringGlobe ? 1 : 0,
            scale: isHoveringGlobe ? 1 : 0.95,
            x: mousePos.x + 20,
            y: mousePos.y + 20,
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed top-0 left-0 z-50 pointer-events-none flex flex-col gap-2 px-4 py-3 bg-black/60 border border-white/10 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] w-max"
        >
          <span className="text-sm text-white font-medium max-w-[260px] sm:max-w-[280px] leading-relaxed">
            Each particle represents a direct data point from your actual customers, which forms your customer intelligence.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
