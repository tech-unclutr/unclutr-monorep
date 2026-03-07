"use client";

import { useRef, useEffect, useState } from "react";

interface FlowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  // Color variants for different backgrounds
  darkColor: string;
  lightColor: string;
  // Sparkle properties
  sparklePhase: number;
  sparkleSpeed: number;
  isSpecial: boolean;
}

/**
 * Global Particle Stream - Flows from hero through entire website
 * Represents customer touchpoints/data flowing through the product story
 */
export default function GlobalParticleStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<FlowParticle[]>([]);
  const scrollYRef = useRef(0);
  const heroHeightRef = useRef(0);
  const timeRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Calculate hero section height (250vh as defined in HeroSection)
    heroHeightRef.current = height * 2.5;

    // Particle colors
    // Dark background (hero): whites and oranges
    const darkColors = ["#ffffff", "#e8e8e8", "#ff6b00", "#ff9f43", "#ffbe76"];
    // Light background (peach sections): cherry delight - merry & vibrant!
    const lightColors = [
      "#FF5A36", // Square Up orange
      "#E63946", // Cherry red - aha!
      "#FF6B35", // Bright coral
      "#F77F00", // Merry orange
      "#FF9F1C", // Golden delight
      "#E85D04", // Vibrant orange
      "#DC2F02", // Cherry coral
      "#FF7B54", // Peachy keen
    ];

    const particleCount = 220; // More particles for fuller, merrier effect
    const particles: FlowParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isDarkHighlight = Math.random() > 0.75;
      const isSpecial = Math.random() > 0.8; // More special sparkle particles

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.4 + 0.2, // Slower, more graceful flow
        size: isSpecial ? Math.random() * 5 + 3 : (isDarkHighlight ? Math.random() * 4 + 2 : Math.random() * 3 + 1.5),
        baseAlpha: isSpecial ? 1.0 : (isDarkHighlight ? 0.9 : Math.random() * 0.5 + 0.5),
        darkColor: isDarkHighlight
          ? darkColors[Math.floor(Math.random() * 3) + 2]
          : darkColors[Math.floor(Math.random() * 2)],
        lightColor: lightColors[Math.floor(Math.random() * lightColors.length)],
        sparklePhase: Math.random() * Math.PI * 2,
        sparkleSpeed: Math.random() * 0.03 + 0.015,
        isSpecial,
      });
    }

    particlesRef.current = particles;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timeRef.current += 0.016; // ~60fps time increment

      const scrollY = scrollYRef.current;
      const heroHeight = heroHeightRef.current;

      // DEBUG: Log every 60 frames (~1 second)
      if (Math.floor(timeRef.current * 60) % 60 === 0) {
        console.log('[Particles] scrollY:', scrollY, 'heroHeight:', heroHeight, 'fadeInEnd:', heroHeight * 0.65);
      }

      // Simple visibility logic:
      // - Hero is 250vh (heroHeight)
      // - Start showing particles at 50% through hero (125vh scroll)
      // - Fully visible by 65% through hero (162.5vh scroll)
      // - ALWAYS fully visible in all light sections after that
      const fadeInStart = heroHeight * 0.5;
      const fadeInEnd = heroHeight * 0.65;

      let globalOpacity = 0;
      if (scrollY >= fadeInEnd) {
        // Past hero transition - ALWAYS VISIBLE
        globalOpacity = 1;
      } else if (scrollY > fadeInStart) {
        // Fading in during hero->light transition
        globalOpacity = (scrollY - fadeInStart) / (fadeInEnd - fadeInStart);
      }

      // DEBUG: Force particles visible for testing
      globalOpacity = Math.max(globalOpacity, 0.8);

      // Are we in the light section? (for color switching)
      const inLightSection = scrollY > heroHeight * 0.6;

      // Skip rendering only during early hero
      if (globalOpacity < 0.01) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      for (const p of particlesRef.current) {
        // Update position - flowing downward
        p.y += p.vy;
        p.x += p.vx;

        // Gentle organic drift with slight wave motion
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.008;

        // Add subtle sine wave for more organic feel
        p.x += Math.sin(timeRef.current * 0.5 + p.sparklePhase) * 0.15;

        // Clamp velocities
        p.vx = Math.max(-0.6, Math.min(0.6, p.vx));
        p.vy = Math.max(0.15, Math.min(0.7, p.vy));

        // Wrap around
        if (p.y > height + 30) {
          p.y = -30;
          p.x = Math.random() * width;
        }
        if (p.x > width + 30) p.x = -30;
        if (p.x < -30) p.x = width + 30;

        // Minimal edge fade - keep particles visible throughout
        let edgeAlpha = 1;
        const edgeFade = 20;
        if (p.y < edgeFade) {
          edgeAlpha *= 0.5 + (p.y / edgeFade) * 0.5;
        } else if (p.y > height - edgeFade) {
          edgeAlpha *= 0.5 + ((height - p.y) / edgeFade) * 0.5;
        }

        // Color based on section - vibrant cherry colors in light sections
        const color = inLightSection ? p.lightColor : p.darkColor;

        // Sparkle/twinkle effect - more pronounced pulsing
        const sparkle = p.isSpecial
          ? 0.7 + Math.sin(timeRef.current * p.sparkleSpeed * 80 + p.sparklePhase) * 0.3
          : 0.85 + Math.sin(timeRef.current * p.sparkleSpeed * 50 + p.sparklePhase) * 0.15;

        // Final alpha - full visibility throughout (boosted for visibility)
        const finalAlpha = Math.max(0, Math.min(1, p.baseAlpha * edgeAlpha * globalOpacity * sparkle * 1.5));

        // Dynamic size with subtle pulse for special particles
        let drawSize = p.size;
        if (p.isSpecial) {
          drawSize = p.size * (0.9 + Math.sin(timeRef.current * 2 + p.sparklePhase) * 0.2);
        }

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = finalAlpha;

        // Add glow effect for particles on light background - cherry delight!
        if (inLightSection) {
          if (p.isSpecial) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
          } else if (p.size > 2) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = color;
          } else {
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
          }
        } else {
          ctx.shadowBlur = 0;
        }

        if (drawSize < 1.5) {
          ctx.fillRect(p.x * dpr, p.y * dpr, drawSize * dpr, drawSize * dpr);
        } else {
          ctx.arc(p.x * dpr, p.y * dpr, drawSize * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Reset shadow
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      canvas.width = newWidth * dpr;
      canvas.height = newHeight * dpr;
      heroHeightRef.current = newHeight * 2.5;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        width: "100vw",
        height: "100vh",
        zIndex: 100, // Above content AND above the z-50 grain overlays in sections
        // DEBUG: red border to confirm canvas is rendering - REMOVE after testing
        // border: "4px solid red",
      }}
    />
  );
}
