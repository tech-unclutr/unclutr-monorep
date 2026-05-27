"use client";

import { useRef, useEffect, useState } from "react";
import { useScroll, motion, useSpring, useTransform } from "framer-motion";
import { useSectionVisibility } from "@/lib/analytics";

const PARTICLE_COUNT = 55000;
const BASE_SCALE = 220; // Direct scale in pixels

interface Particle {
  scatterPos: { x: number; y: number; z: number };
  heartPos: { x: number; y: number; z: number }; // Already in screen-space units
  color: string;
  size: number;
}

export default function CTASection() {
  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  useSectionVisibility("cta", containerRef);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });
  // Viewport tracked separately for hover-tooltip clamping. Initial {0, 0}
  // avoids React #418: server and client first-paint both render with 0,
  // then a useEffect below sets the real values post-mount. The previous
  // pattern (`typeof window !== 'undefined' ? window.innerWidth : 1200`)
  // produced different values on server (1200) vs client (real width),
  // triggering hydration mismatch.
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const particlesRef = useRef<Particle[]>([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  const assembleProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
  });

  const timeRef = useRef(0);

  // Initialize particles
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

    const newParticles: Particle[] = [];
    const colors = ["#ffffff", "#cccccc", "#ff6b00", "#ff9f43"];

    let count = 0;
    const targetCount = width < 768 ? 6000 : PARTICLE_COUNT;

    while (count < targetCount) {
      // Sample random point in a unit cube
      const mx = (Math.random() - 0.5) * 2.4;
      const my = (Math.random() - 0.5) * 2.4;
      const mz = (Math.random() - 0.5) * 2.4;

      const mx2 = mx * mx;
      const my2 = my * my;
      const mz2 = mz * mz;

      // This standard 3D heart equation uses:
      //  mx = left/right,  mz = vertical UP,  my = depth
      const mz3 = mz2 * mz;
      const term = mx2 + 2.25 * my2 + mz2 - 1;
      const val = term * term * term - mx2 * mz3 - 0.1125 * my2 * mz3;

      if (val <= 0.0) {
        const isHighlight = Math.random() > 0.88;
        const color = isHighlight ? colors[0] : colors[Math.floor(Math.random() * colors.length)];

        // Map math coords → screen coords:
        // Screen X = mx (horizontal width)  — widened slightly
        // Screen Y = -mz (mz is up, screen Y is down)
        // Screen Z = my (y is depth, goes into screen)
        const hx = mx * BASE_SCALE * 1.1;  // slightly wider
        const hy = -mz * BASE_SCALE;       // vertical correctly inverted
        const hz = my * BASE_SCALE;        // depth

        const scatterRange = Math.max(width, height) * 2.2;
        const scatterX = (Math.random() - 0.5) * scatterRange;
        const scatterY = (Math.random() - 0.5) * scatterRange;
        const scatterZ = (Math.random() - 0.5) * 2800 + 800;

        newParticles.push({
          scatterPos: { x: scatterX, y: scatterY, z: scatterZ },
          heartPos: { x: hx, y: hy, z: hz },
          color,
          size: isHighlight ? Math.random() * 2.2 + 1.8 : Math.random() * 1.4 + 0.7,
        });
        count++;
      }
    }

    // Shuffle heart positions for organic weave-in animation
    for (let i = newParticles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newParticles[i].heartPos, newParticles[j].heartPos] =
        [newParticles[j].heartPos, newParticles[i].heartPos];
    }

    particlesRef.current = newParticles;
  }, []);

  // Render loop
  useEffect(() => {
    if (!canvasRef.current || particlesRef.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    // Visibility gating — skip rendering when offscreen
    const isVisibleRef = { current: true };
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0 });
    if (containerRef.current) observer.observe(containerRef.current);

    const render = () => {
      if (!isVisibleRef.current) {
        animId = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { width, height } = dimensions;
      const rawEase = assembleProgress.get();
      const ease = Math.max(0, Math.min(1, rawEase * 1.4));

      timeRef.current += 0.004;
      // Faster, constant rotation for more energy like the hero
      const angle = timeRef.current * 0.8;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Gentle heartbeat pulse
      const beatPhase = (timeRef.current * 1.8) % (Math.PI * 2);
      const pulse = 1 + Math.pow(Math.max(0, Math.sin(beatPhase)), 10) * 0.05 * ease;

      const fov = 1100;

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        // Rotate around screen-Y (vertical) axis
        // heartPos is already in screen space: x=horizontal, y=vertical(down), z=depth
        const hx = p.heartPos.x;
        const hy = p.heartPos.y;
        const hz = p.heartPos.z;

        const rx = hx * cosA - hz * sinA;
        const rz = hx * sinA + hz * cosA;
        const ry = hy; // vertical unchanged by Y-axis rotation

        // Apply pulse
        const tx = rx * pulse;
        const ty = ry * pulse;
        const tz = rz * pulse;

        // Lerp from scatter → heart
        const cx = p.scatterPos.x + (tx - p.scatterPos.x) * ease;
        const cy = p.scatterPos.y + (ty - p.scatterPos.y) * ease;
        const cz = p.scatterPos.z + (tz - p.scatterPos.z) * ease;

        // Perspective project
        const viewZ = cz + fov;
        if (viewZ <= 10) continue;
        const scale = fov / viewZ;
        if (scale > 40) continue;

        const projX = cx * scale + width / 2;
        const projY = cy * scale + height / 2;

        // Depth-based alpha (front particles brightest)
        const depthRange = BASE_SCALE * 2.5;
        const normalizedZ = Math.max(0, Math.min(1, (cz + depthRange) / (depthRange * 2)));
        const depthAlpha = 0.08 + normalizedZ * 0.92;

        const isBright = p.color === "#FF5A36" || p.color === "#D4582A" || p.color === "#E86830";
        const baseAlpha = 0.35 + 0.65 * ease;
        const alpha = isBright
          ? baseAlpha * depthAlpha
          : baseAlpha * depthAlpha * 0.55;

        ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
        ctx.fillStyle = p.color;

        const dotSize = p.size * scale;

        // Glow for front bright particles (limited to ~10% for performance)
        if (isBright && dotSize > 1.2 && ease > 0.7 && normalizedZ > 0.7 && i % 10 === 0) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        if (dotSize < 1.5) {
          ctx.fillRect(
            projX * dpr - dotSize * dpr * 0.5,
            projY * dpr - dotSize * dpr * 0.5,
            Math.max(0.5, dotSize * dpr),
            Math.max(0.5, dotSize * dpr)
          );
        } else {
          ctx.arc(projX * dpr, projY * dpr, dotSize * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, [dimensions, assembleProgress]);

  // Mouse parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mousePosPixel, setMousePosPixel] = useState({ x: 0, y: 0 });
  const [isHoveringHeart, setIsHoveringHeart] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: (e.clientY / window.innerHeight) * 2 - 1,
    });
    setMousePosPixel({ x: e.clientX, y: e.clientY });

    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);

    // Show tooltip when mostly assembled and hovering near center
    const currentProgress = assembleProgress.get();
    setIsHoveringHeart(dist <= 350 && currentProgress > 0.6);
  };

  const springCfg = { damping: 28, stiffness: 100, mass: 1 };
  const parallaxX = useSpring(mousePos.x * -14, springCfg);
  const parallaxY = useSpring(mousePos.y * -14, springCfg);

  const textOpacity = useTransform(assembleProgress, [0.55, 0.85], [0, 1]);
  const textY = useTransform(assembleProgress, [0.55, 0.9], [20, 0]);

  const lineAnim = {
    hidden: { opacity: 0, y: 18, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 1.3, ease: [0.16, 1, 0.3, 1] as const },
    },
  } as any;

  const textContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.18, delayChildren: 0.5 } },
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      data-section-name="cta"
      className="relative z-0 h-[120vh] sm:h-[140vh] md:h-[200vh] w-full bg-black"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">

        {/* Cinematic Underglow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-[80vw] h-[60vh] bg-brand-orange/10 rounded-[50%] blur-[120px]" />
        </div>

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          style={{ width: "100vw", height: "100vh" }}
        />

        {mounted && (
          <motion.div
            style={{ opacity: textOpacity, y: textY, x: parallaxX }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <motion.h1
              variants={textContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.6 }}
              className="flex flex-col items-center text-center font-display font-semibold tracking-tight leading-[1.05] pointer-events-auto"
            >
              {/* V4 italic sub-line above the headline (Phase 3 / Change 3.4, doc §7.6) */}
              <motion.span
                variants={lineAnim}
                className="block text-[13px] sm:text-[15px] italic font-medium text-white/40 mb-4 tracking-normal"
              >
                Giving voice to the empty chair.
              </motion.span>

              {/* Hero-matching White top line */}
              <motion.span
                variants={lineAnim}
                className="block text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-2"
              >
                Where Customer
              </motion.span>

              {/* Hero-matching Gradient bottom line */}
              <motion.span
                variants={lineAnim}
                className="block text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-brand-orange via-white to-white/80 pb-2"
              >
                Understanding Compounds.
              </motion.span>

              {/* "Book a Pilot ⚡" CTA was previously here (Phase 3 / Change 3.4)
                  — removed per Param's review. The italic sub-line above plus
                  the headline plus the particle heart canvas now carry the
                  closing moment alone, without a competing conversion CTA. */}
            </motion.h1>
          </motion.div>
        )}

        {/* Particle footnote */}
        <div className="absolute top-[80%] left-0 w-full flex justify-center z-40 pointer-events-none text-center px-4">
          <span className="text-[11px] sm:text-[12px] font-sans text-white/30 tracking-widest uppercase md:max-w-max max-w-sm">
            * Each particle represents a direct data point from your actual customers, which forms your customer intelligence.
          </span>
        </div>

        {/* Option 4: Hover Tooltip */}
        <motion.div
          animate={{
            opacity: isHoveringHeart ? 1 : 0,
            scale: isHoveringHeart ? 1 : 0.95,
            x: viewport.w ? Math.min(mousePosPixel.x + 20, viewport.w - 320) : 0,
            y: viewport.h ? Math.min(mousePosPixel.y + 20, viewport.h - 100) : 0,
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed top-0 left-0 z-50 pointer-events-none flex flex-col gap-2 px-4 py-3 bg-black/60 border border-white/10 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] w-max"
        >
          <span className="text-sm text-white font-medium max-w-[280px] leading-relaxed">
            Each particle represents a direct data point from your actual customers, which forms your customer intelligence.
          </span>
        </motion.div>

      </div>
    </section>
  );
}
