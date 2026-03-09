import { useRef, useState, useEffect, useCallback } from "react";
import {
  NarrativeParticle,
  HeroParticleExitEvent,
  SectionTargetsEvent,
  ParticleTarget,
} from "./particles/types";
import {
  LIGHT_COLOR_PALETTE,
  PHYSICS,
  PARTICLE_SETTINGS,
  SIZES,
  LIGHT_OPACITY,
  FOOTER_COLLECTION,
  SECTION_BEHAVIORS,
} from "./particles/config";

declare global {
  interface WindowEventMap {
    "hero-particle-exit": CustomEvent<HeroParticleExitEvent>;
    "register-particle-targets": CustomEvent<SectionTargetsEvent>;
  }
}

// Content area constants - matches max-w-[1400px] mx-auto
const CONTENT_MAX_WIDTH = 1400;

/**
 * Particle Narrative Controller
 *
 * Particles exist in DOCUMENT SPACE (scroll with the page).
 * They are rendered behind content (low z-index) and channel
 * toward margins/empty areas, creating a waterfall effect
 * that skirts around content sections.
 */
export default function ParticleNarrativeController() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<NarrativeParticle[]>([]);
  const scrollYRef = useRef(0);
  const heroHeightRef = useRef(0);
  const documentHeightRef = useRef(0);
  const timeRef = useRef(0);
  const particleIdRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Section targets for integration
  const targetsRef = useRef<Record<string, ParticleTarget[]>>({});

  // Content bounds - computed once, updated on resize
  const contentBoundsRef = useRef({ left: 0, right: 0 });

  // Create a new particle (positions in DOCUMENT SPACE)
  const createParticle = useCallback((
    x: number,
    docY: number, // document-space Y
    options: Partial<{
      vx: number;
      vy: number;
      color: string;
      targetColor: string;
      isFromHero: boolean;
      isSpecial: boolean;
      forceMargin: boolean;
    }> = {}
  ): NarrativeParticle => {
    const isSpecial = options.isSpecial ?? Math.random() > 0.85;
    const sizeRange = isSpecial ? SIZES.special : (Math.random() > 0.7 ? SIZES.accent : SIZES.standard);
    const size = Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min;
    const { width } = dimensionsRef.current;
    const { left: cLeft, right: cRight } = contentBoundsRef.current;

    // Channel particles toward margins when spawning
    let spawnX = x;
    if (options.forceMargin !== false && width > CONTENT_MAX_WIDTH + 60) {
      // 70% chance to spawn in a margin channel, 30% anywhere
      if (Math.random() > 0.3) {
        const marginWidth = cLeft;
        if (Math.random() > 0.5) {
          // Left margin
          spawnX = Math.random() * (marginWidth + 80);
        } else {
          // Right margin
          spawnX = cRight - 80 + Math.random() * (width - cRight + 80);
        }
      }
    }

    return {
      id: particleIdRef.current++,
      x: spawnX,
      y: docY,
      vx: options.vx ?? (Math.random() - 0.5) * 0.5,
      vy: options.vy ?? Math.random() * 0.4 + 0.2,
      size,
      baseSize: size,
      color: options.color ?? LIGHT_COLOR_PALETTE[Math.floor(Math.random() * LIGHT_COLOR_PALETTE.length)],
      targetColor: options.targetColor ?? LIGHT_COLOR_PALETTE[Math.floor(Math.random() * LIGHT_COLOR_PALETTE.length)],
      colorProgress: options.isFromHero ? 0 : 1,
      alpha: 1,
      baseAlpha: isSpecial ? 1.0 : Math.random() * 0.3 + 0.7,
      phase: "FLOW",
      birthTime: timeRef.current,
      sparklePhase: Math.random() * Math.PI * 2,
      sparkleSpeed: Math.random() * 0.03 + 0.015,
      isSpecial,
      isFromHero: options.isFromHero ?? false,
      integrationFactor: 0,
    };
  }, []);

  // Spawn particle from hero exit event
  const spawnFromHero = useCallback((event: CustomEvent<HeroParticleExitEvent>) => {
    if (particlesRef.current.length >= PARTICLE_SETTINGS.maxParticles) return;
    if (Math.random() > PARTICLE_SETTINGS.handoffSpawnRate) return;

    const { x, vy, color } = event.detail;
    const scrollY = scrollYRef.current;

    const particle = createParticle(
      x,
      scrollY - 20, // Just above current viewport in doc space
      {
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.max(0.2, vy * 0.4),
        color: color,
        targetColor: LIGHT_COLOR_PALETTE[Math.floor(Math.random() * LIGHT_COLOR_PALETTE.length)],
        isFromHero: true,
        forceMargin: false,
      }
    );

    particle.phase = "HANDOFF";
    particlesRef.current.push(particle);
  }, [createParticle]);

  // Interpolate between colors
  const lerpColor = useCallback((from: string, to: string, t: number): string => {
    const fromRgb = hexToRgb(from);
    const toRgb = hexToRgb(to);
    if (!fromRgb || !toRgb) return to;

    const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * t);
    const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * t);
    const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  // Compute content bounds
  const updateContentBounds = useCallback(() => {
    const { width } = dimensionsRef.current;
    if (width > CONTENT_MAX_WIDTH) {
      const margin = (width - CONTENT_MAX_WIDTH) / 2;
      contentBoundsRef.current = { left: margin, right: margin + CONTENT_MAX_WIDTH };
    } else {
      // Content fills viewport, minimal margins
      contentBoundsRef.current = { left: 16, right: width - 16 };
    }
  }, []);

  // Step 1: Set mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Step 2: Initialize and run particle system
  useEffect(() => {
    if (!mounted) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    dimensionsRef.current = { width, height };
    updateContentBounds();

    heroHeightRef.current = height * 2.5;
    documentHeightRef.current = document.documentElement.scrollHeight;

    // Initialize particles scattered around current viewport in doc space
    const scrollY = window.scrollY;
    const initialParticles: NarrativeParticle[] = [];
    for (let i = 0; i < PARTICLE_SETTINGS.initialCount; i++) {
      initialParticles.push(createParticle(
        Math.random() * width,
        scrollY + Math.random() * height * 3 - height * 0.5 // Spread around viewport in doc space
      ));
    }
    particlesRef.current = initialParticles;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Scroll handler
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Listen for hero particle exits
    const handleHeroExit = (e: CustomEvent<HeroParticleExitEvent>) => {
      spawnFromHero(e);
    };
    window.addEventListener("hero-particle-exit", handleHeroExit);

    // Listen for section targets
    const handleTargets = (e: CustomEvent<SectionTargetsEvent>) => {
      targetsRef.current[e.detail.sectionName] = e.detail.targets;
    };
    window.addEventListener("register-particle-targets", handleTargets);

    // Main render loop
    const render = () => {
      if (document.hidden) return; // Pause when tab not visible

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timeRef.current += 0.016;

      const scrollY = scrollYRef.current;
      const heroHeight = heroHeightRef.current;
      const docHeight = documentHeightRef.current;
      const { width, height } = dimensionsRef.current;
      const { left: contentLeft, right: contentRight } = contentBoundsRef.current;
      const contentCenterX = width / 2;

      // Global visibility: fade in after hero
      const fadeInStart = heroHeight * 0.5;
      const fadeInEnd = heroHeight * 0.65;

      let globalOpacity = 0;
      if (scrollY >= fadeInEnd) {
        globalOpacity = 1;
      } else if (scrollY > fadeInStart) {
        globalOpacity = (scrollY - fadeInStart) / (fadeInEnd - fadeInStart);
      }

      if (globalOpacity < 0.01) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Determine current section context
      const lightSectionStart = heroHeight;
      const totalLightHeight = docHeight - lightSectionStart;
      const lightScroll = Math.max(0, scrollY - lightSectionStart);
      const lightProgressGlobal = Math.min(1, lightScroll / totalLightHeight);

      const sectionKeys = Object.keys(SECTION_BEHAVIORS);
      const sectionIndex = Math.min(sectionKeys.length - 1, Math.floor(lightProgressGlobal * sectionKeys.length));
      const currentSectionName = sectionKeys[sectionIndex];
      const currentSectionBehavior = SECTION_BEHAVIORS[currentSectionName];
      const sectionProgress = (lightProgressGlobal * sectionKeys.length) % 1;

      const inFooter = lightProgressGlobal > 0.9;
      const footerProgress = inFooter ? (lightProgressGlobal - 0.9) / 0.1 : 0;

      // Viewport bounds for culling (document-space)
      const viewTop = scrollY - 100;
      const viewBottom = scrollY + height + 100;

      const particles = particlesRef.current;
      const sectionTargets = targetsRef.current[currentSectionName] || [];
      const toRemove: number[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // === Edge channeling: soft repulsion from content center ===
        // Push particles toward margins when they're in the content zone
        const isInContentZone = width > CONTENT_MAX_WIDTH + 40;
        if (isInContentZone) {
          const distFromCenter = p.x - contentCenterX;
          const absDistFromCenter = Math.abs(distFromCenter);
          const halfContent = CONTENT_MAX_WIDTH / 2;

          // If particle is within content area, gently push outward
          if (absDistFromCenter < halfContent - 40) {
            const pushDir = distFromCenter > 0 ? 1 : -1;
            // Stronger push the deeper inside content area
            const depth = 1 - absDistFromCenter / halfContent;
            p.vx += pushDir * depth * 0.08;
          }
        }

        // === Integration/Disintegration with section targets ===
        let targetX = p.x;
        let targetY = p.y;
        let integrationTargeted = false;

        if (currentSectionBehavior?.integrationZone && sectionTargets.length > 0) {
          const { start, end } = currentSectionBehavior.integrationZone;

          let iFactor = 0;
          if (sectionProgress >= start && sectionProgress <= end) {
            const fadeInZone = (end - start) * 0.2;
            const fadeOutZone = (end - start) * 0.2;

            if (sectionProgress < start + fadeInZone) {
              iFactor = (sectionProgress - start) / fadeInZone;
            } else if (sectionProgress > end - fadeOutZone) {
              iFactor = (end - sectionProgress) / fadeOutZone;
              p.phase = "DISINTEGRATING";
            } else {
              iFactor = 1;
              p.phase = "INTEGRATING";
            }

            p.integrationFactor = iFactor;

            if (!p.targetId || !p.targetId.startsWith(currentSectionName)) {
              const target = sectionTargets[p.id % sectionTargets.length];
              p.targetId = `${currentSectionName}-${target.id}`;
              // Targets from getBoundingClientRect are viewport-space → convert to doc-space
              p.targetX = target.x;
              p.targetY = target.y + scrollY;
            } else {
              const originalId = p.targetId.split('-')[1];
              const target = sectionTargets.find(t => t.id === originalId);
              if (target) {
                p.targetX = target.x;
                p.targetY = target.y + scrollY;
              }
            }

            if (p.targetX !== undefined && p.targetY !== undefined) {
              targetX = p.targetX;
              targetY = p.targetY;
              integrationTargeted = true;
            }
          } else {
            p.integrationFactor = Math.max(0, p.integrationFactor - 0.05);
            if (p.integrationFactor === 0) {
              p.targetId = undefined;
              p.phase = "FLOW";
            }
          }
        }

        // === Physics & Special Effects ===
        let vyMod = currentSectionBehavior?.velocityMultiplier ?? 1;

        // Special effects (orbits around viewport-center, converted to doc-space)
        if (currentSectionBehavior?.specialEffect === "parallel_streams") {
          const laneCount = 3;
          // Use margin lanes instead of full-width lanes
          const leftMargin = contentLeft;
          const rightMarginStart = contentRight;
          const laneTargets = [
            leftMargin * 0.5,              // Left channel center
            contentCenterX,                  // Center (light presence)
            rightMarginStart + (width - rightMarginStart) * 0.5, // Right channel center
          ];
          const laneIndex = p.id % laneCount;
          const lanePull = laneIndex === 1 ? 0.003 : 0.01; // Weaker pull to center
          p.vx += (laneTargets[laneIndex] - p.x) * lanePull;
        } else if (currentSectionBehavior?.specialEffect === "orbit") {
          // Orbit around viewport center (in doc space)
          const orbitCenterDocY = scrollY + height / 2;
          if (!p.orbit) {
            const angle = Math.random() * Math.PI * 2;
            const viewScale = Math.min(width, height) / 1200;
            const radius = (100 + Math.random() * 200) * viewScale;
            p.orbit = {
              radius,
              angle,
              speed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
              center: { x: contentCenterX, y: orbitCenterDocY },
            };
          }
          p.orbit.center.y = orbitCenterDocY; // Keep orbit centered on viewport
          p.orbit.angle += p.orbit.speed;
          const orbitX = p.orbit.center.x + Math.cos(p.orbit.angle) * p.orbit.radius;
          const orbitY = p.orbit.center.y + Math.sin(p.orbit.angle) * p.orbit.radius;
          p.vx += (orbitX - p.x) * 0.02;
          p.vy += (orbitY - p.y) * 0.02;
        } else if (currentSectionBehavior?.specialEffect === "heart") {
          // Rhythmic beating effect based on global time
          const beatCycle = (timeRef.current * 2) % (Math.PI * 2);
          // Rhythmic pulse: sharp beat
          const pulse = Math.pow(Math.max(0, Math.sin(beatCycle)), 8) * 0.15;

          if (!p.heartTarget) {
            // Assign a fixed parameter t along the heart curve for this particle
            p.heartTarget = {
              t: Math.random() * Math.PI * 2,
              scale: (12 + Math.random() * 4) * (Math.min(width, height) / 1200) // scale to viewport
            };
          }

          const t = p.heartTarget.t;
          const scale = p.heartTarget.scale * (1 + pulse);

          // Parametric heart equation
          const hX = 16 * Math.pow(Math.sin(t), 3);
          const hY = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

          // We map this to screen space, centered. Invert Y because canvas Y goes down
          const targetX = contentCenterX + hX * scale;
          const targetYDoc = scrollY + height / 2 - hY * scale - 50;

          p.vx += (targetX - p.x) * 0.05;
          p.vy += (targetYDoc - p.y) * 0.05;

          // Extra dampening to snap them tightly to the shape
          vyMod = 0.8;
          p.vx *= 0.85;
          p.vy *= 0.85;

          p.orbit = undefined;
        } else {
          p.orbit = undefined;
          p.heartTarget = undefined;
        }

        // Footer convergence (spiral toward bottom-center of viewport)
        if (inFooter) {
          const convergePower = easeInOutCubic(footerProgress);
          const footerTargetY = scrollY + height * 0.6;
          const dx = contentCenterX - p.x;
          const dy = footerTargetY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 10) {
            const angle = Math.atan2(dy, dx);
            const spiralAngle = angle + FOOTER_COLLECTION.spiralSpeed * timeRef.current * 15;
            const force = FOOTER_COLLECTION.convergenceStrength * convergePower;
            p.vx += Math.cos(spiralAngle) * force;
            p.vy += Math.sin(spiralAngle) * force;
            p.size = p.baseSize * (1 - convergePower * 0.6);
          }
          vyMod = 0.4;
        }

        // Base physics
        p.y += p.vy * vyMod;
        p.x += p.vx;
        p.vx += (Math.random() - 0.5) * PHYSICS.drift;
        p.vy += (Math.random() - 0.5) * 0.005;
        p.x += Math.sin(timeRef.current * PHYSICS.sineWave.frequency + p.sparklePhase) * PHYSICS.sineWave.amplitude;

        // Integration lerp (in doc space)
        if (integrationTargeted && p.integrationFactor > 0) {
          p.x = p.x + (targetX - p.x) * p.integrationFactor * 0.1;
          p.y = p.y + (targetY - p.y) * p.integrationFactor * 0.1;
        }

        // Clamp velocities
        p.vx = Math.max(-PHYSICS.maxVx * 2, Math.min(PHYSICS.maxVx * 2, p.vx));
        p.vy = Math.max(PHYSICS.minVy, Math.min(PHYSICS.maxVy * 1.5, p.vy));

        // === Wrap/recycle relative to scroll position ===
        if (p.y > viewBottom + 200) {
          if (inFooter && footerProgress > 0.9) {
            toRemove.push(i);
            continue;
          }
          // Recycle above viewport
          p.y = viewTop - Math.random() * 100;
          p.x = Math.random() * width;
          p.integrationFactor = 0;
          p.targetId = undefined;
        }
        if (p.y < viewTop - 300) {
          // Recycle below viewport
          p.y = viewBottom + Math.random() * 50;
          p.x = Math.random() * width;
          p.integrationFactor = 0;
          p.targetId = undefined;
        }
        if (p.x > width + 40) p.x = -40;
        if (p.x < -40) p.x = width + 40;

        // === Render (convert doc-space Y to screen-space for drawing) ===
        const screenY = p.y - scrollY;

        // Skip if outside viewport
        if (screenY < -50 || screenY > height + 50) continue;

        const edgeAlpha = screenY < 40 ? screenY / 40 : (screenY > height - 40 ? (height - screenY) / 40 : 1);
        const sparkle = p.isSpecial
          ? 0.7 + Math.sin(timeRef.current * p.sparkleSpeed * 100 + p.sparklePhase) * 0.3
          : 0.85 + Math.sin(timeRef.current * p.sparkleSpeed * 60 + p.sparklePhase) * 0.15;

        const finalAlpha = Math.max(0, p.baseAlpha * LIGHT_OPACITY.base * Math.max(0, edgeAlpha) * globalOpacity * sparkle);
        if (finalAlpha < 0.01) continue;

        const currentColor = p.colorProgress < 1 ? lerpColor(p.color, p.targetColor, p.colorProgress) : p.targetColor;
        p.colorProgress = Math.min(1, p.colorProgress + 0.01);

        ctx.beginPath();
        ctx.fillStyle = currentColor;
        ctx.globalAlpha = finalAlpha;

        // Only apply shadowBlur to special particles (performance optimization)
        if (p.isSpecial) {
          const glowSize = LIGHT_OPACITY.glowBlur.min + (LIGHT_OPACITY.glowBlur.max - LIGHT_OPACITY.glowBlur.min);
          ctx.shadowBlur = glowSize;
          ctx.shadowColor = currentColor;
        } else {
          ctx.shadowBlur = 0;
        }

        const drawSize = p.size * (p.isSpecial ? (1 + Math.sin(timeRef.current * 3 + p.sparklePhase) * 0.2) : 1);

        // Draw at screen coords (p.x stays in screen-X, screenY is the converted Y)
        if (drawSize < 1.5) {
          ctx.fillRect(p.x * dpr, screenY * dpr, drawSize * dpr, drawSize * dpr);
        } else {
          ctx.arc(p.x * dpr, screenY * dpr, drawSize * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Remove dead particles
      for (let i = toRemove.length - 1; i >= 0; i--) {
        particles.splice(toRemove[i], 1);
      }

      // Replenish particles near current viewport
      while (particles.length < PARTICLE_SETTINGS.initialCount && !inFooter) {
        particles.push(createParticle(
          Math.random() * width,
          viewTop - Math.random() * 100 // Spawn just above viewport
        ));
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Resume RAF when tab becomes visible again
    const onVisChange = () => {
      if (!document.hidden) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisChange);

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      canvas.width = newWidth * dpr;
      canvas.height = newHeight * dpr;
      dimensionsRef.current = { width: newWidth, height: newHeight };
      heroHeightRef.current = newHeight * 2.5;
      documentHeightRef.current = document.documentElement.scrollHeight;
      updateContentBounds();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("hero-particle-exit", handleHeroExit);
      window.removeEventListener("register-particle-targets", handleTargets);
    };
  }, [mounted, createParticle, spawnFromHero, lerpColor, updateContentBounds]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{
        width: "100vw",
        height: "100vh",
        zIndex: 5,
        opacity: mounted ? 1 : 0,
      }}
    />
  );
}

// Utility functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
