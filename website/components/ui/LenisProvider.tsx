"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePerformance } from "@/lib/context/PerformanceContext";

type LenisInstance = InstanceType<typeof import("@studio-freight/lenis").default>;

const LenisContext = createContext<LenisInstance | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export default function LenisProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<LenisInstance | null>(null);
  const rafRef = useRef<number>(0);
  const tier = usePerformance();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile || tier === "low") return;

    let instance: LenisInstance | null = null;

    (async () => {
      const Lenis = (await import("@studio-freight/lenis")).default;
      instance = new Lenis({
        lerp: tier === "medium" ? 0.6 : 0.4,
        wheelMultiplier: 0.7,
        syncTouch: true,
        smoothWheel: true,
      });

      setLenis(instance);

      function raf(time: number) {
        instance?.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      }
      rafRef.current = requestAnimationFrame(raf);
    })();

    return () => {
      cancelAnimationFrame(rafRef.current);
      instance?.destroy();
    };
  }, [tier]);

  // Intercept hash links and use Lenis for smooth anchor scrolling
  useEffect(() => {
    if (!lenis) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='#']");
      if (!anchor) return;
      const target = document.querySelector(anchor.getAttribute("href")!);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, {
        offset: -40,
        duration: 1.6,
        easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -12 * t)),
      });
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, [lenis]);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
