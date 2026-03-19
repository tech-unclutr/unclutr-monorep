"use client";

import { useState, useEffect } from "react";

export type PerformanceTier = "low" | "medium" | "high";

function detectPerformanceTier(): PerformanceTier {
  const cores = navigator.hardwareConcurrency ?? 4;
  const ram = (navigator as any).deviceMemory ?? 4;
  const connection = (navigator as any).connection;
  const effectiveType: string = connection?.effectiveType ?? "4g";
  const dpr = window.devicePixelRatio ?? 1;
  const screenPixels = window.screen.width * window.screen.height;

  let gpuTier: "low" | "medium" | "high" = "medium";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        const renderer = (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string).toLowerCase();
        if (/nvidia|radeon|amd|rx\s?\d|rtx|gtx|apple gpu|apple m\d|adreno [6-9]/.test(renderer)) {
          gpuTier = "high";
        } else if (/adreno [0-2]|mali-4|sgx|vivante/.test(renderer)) {
          gpuTier = "low";
        } else {
          gpuTier = "medium";
        }
      }
    }
  } catch (_) {
    // WebGL unavailable — leave gpuTier as "medium"
  }

  let score = 0;

  // CPU cores
  if (cores >= 8) score += 2;
  else if (cores >= 6) score += 1;
  else if (cores <= 4) score -= 1;

  // RAM
  if (ram >= 8) score += 2;
  else if (ram >= 4) score += 1;
  else if (ram <= 1) score -= 2;
  else if (ram <= 2) score -= 1;

  // GPU
  if (gpuTier === "high") score += 2;
  else if (gpuTier === "low") score -= 2;

  // Network (low bandwidth strongly correlates with low-end devices)
  if (effectiveType === "3g") score -= 1;
  else if (effectiveType !== "4g") score -= 2; // slow-2g or 2g

  // High DPR on non-high GPU is catastrophic (rendering 3x pixels with weak GPU)
  if (dpr >= 3 && gpuTier !== "high") score -= 1;

  // Very low screen resolution = definitely low-end
  if (screenPixels < 360 * 640) score -= 1;

  if (score <= -2) return "low";
  if (score >= 2) return "high";
  return "medium";
}

export function usePerformanceTier(): { tier: PerformanceTier; isDetected: boolean } {
  const [tier, setTier] = useState<PerformanceTier>("high");
  const [isDetected, setIsDetected] = useState(false);

  useEffect(() => {
    const detected = detectPerformanceTier();
    setTier(detected);
    setIsDetected(true);

    // FPS monitor: fires 1s after mount to avoid measuring loading jank.
    // If P50 frame time exceeds 33ms (< 30 fps), downgrade one tier.
    const timeout = setTimeout(() => {
      if (detected === "low") return;
      const frames: number[] = [];
      let last = performance.now();
      let rafId: number;
      const startTime = performance.now();

      const tick = (now: number) => {
        frames.push(now - last);
        last = now;
        if (now - startTime < 3000) {
          rafId = requestAnimationFrame(tick);
        } else {
          const sorted = [...frames].sort((a, b) => a - b);
          const p50 = sorted[Math.floor(sorted.length / 2)];
          if (p50 > 33) {
            setTier((prev) => (prev === "high" ? "medium" : "low"));
          }
        }
      };
      rafId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return { tier, isDetected };
}
