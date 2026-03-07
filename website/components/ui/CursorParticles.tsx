"use client";

import { useRef, useEffect, useState } from "react";
import { LIGHT_COLOR_PALETTE } from "./particles/config";

interface CursorParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

const CURSOR_PARTICLE_CONFIG = {
  maxParticles: 30,
  spawnRate: 3, // particles per frame when moving
  particleLife: { min: 20, max: 40 }, // frames
  size: { min: 1.5, max: 3.5 },
  velocity: { min: 0.3, max: 1.2 },
  spread: 15, // spawn radius around cursor
  glowBlur: 8,
};

export default function CursorParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<CursorParticle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Skip on mobile
    if (window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.lastX = mouseRef.current.x;
      mouseRef.current.lastY = mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const createParticle = (x: number, y: number, velocityX: number, velocityY: number): CursorParticle => {
      const angle = Math.random() * Math.PI * 2;
      const spread = Math.random() * CURSOR_PARTICLE_CONFIG.spread;
      const speed = Math.random() * (CURSOR_PARTICLE_CONFIG.velocity.max - CURSOR_PARTICLE_CONFIG.velocity.min) + CURSOR_PARTICLE_CONFIG.velocity.min;

      // Inherit some velocity from cursor movement, add random spread
      const baseVx = velocityX * 0.3;
      const baseVy = velocityY * 0.3;

      return {
        x: x + Math.cos(angle) * spread,
        y: y + Math.sin(angle) * spread,
        vx: baseVx + Math.cos(angle) * speed,
        vy: baseVy + Math.sin(angle) * speed,
        size: Math.random() * (CURSOR_PARTICLE_CONFIG.size.max - CURSOR_PARTICLE_CONFIG.size.min) + CURSOR_PARTICLE_CONFIG.size.min,
        alpha: 1,
        color: LIGHT_COLOR_PALETTE[Math.floor(Math.random() * LIGHT_COLOR_PALETTE.length)],
        life: 0,
        maxLife: Math.random() * (CURSOR_PARTICLE_CONFIG.particleLife.max - CURSOR_PARTICLE_CONFIG.particleLife.min) + CURSOR_PARTICLE_CONFIG.particleLife.min,
      };
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x, y, lastX, lastY } = mouseRef.current;
      const velocityX = x - lastX;
      const velocityY = y - lastY;
      const isMoving = Math.abs(velocityX) > 0.5 || Math.abs(velocityY) > 0.5;

      // Spawn new particles when cursor is moving
      if (isMoving && particlesRef.current.length < CURSOR_PARTICLE_CONFIG.maxParticles) {
        const spawnCount = Math.min(
          CURSOR_PARTICLE_CONFIG.spawnRate,
          CURSOR_PARTICLE_CONFIG.maxParticles - particlesRef.current.length
        );
        for (let i = 0; i < spawnCount; i++) {
          particlesRef.current.push(createParticle(x, y, velocityX, velocityY));
        }
      }

      // Update and render particles
      const particles = particlesRef.current;
      const toRemove: number[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Update life
        p.life++;
        if (p.life >= p.maxLife) {
          toRemove.push(i);
          continue;
        }

        // Calculate alpha based on life (fade in quickly, fade out slowly)
        const lifeProgress = p.life / p.maxLife;
        if (lifeProgress < 0.1) {
          p.alpha = lifeProgress / 0.1;
        } else {
          p.alpha = 1 - ((lifeProgress - 0.1) / 0.9);
        }

        // Update position with slight deceleration
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;

        // Slight gravity pull toward cursor when close
        const dx = x - p.x;
        const dy = y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80 && dist > 5) {
          p.vx += (dx / dist) * 0.02;
          p.vy += (dy / dist) * 0.02;
        }

        // Render
        const finalAlpha = p.alpha * 0.7;
        if (finalAlpha < 0.01) continue;

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = finalAlpha;
        ctx.shadowBlur = CURSOR_PARTICLE_CONFIG.glowBlur;
        ctx.shadowColor = p.color;

        // Shrink as particle ages
        const sizeMod = 1 - lifeProgress * 0.5;
        const drawSize = p.size * sizeMod;

        ctx.arc(p.x * dpr, p.y * dpr, drawSize * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Remove dead particles (reverse order to maintain indices)
      for (let i = toRemove.length - 1; i >= 0; i--) {
        particles.splice(toRemove[i], 1);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        width: "100vw",
        height: "100vh",
        zIndex: 9999, // Above everything so cursor particles are always visible
      }}
    />
  );
}
