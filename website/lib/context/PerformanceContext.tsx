"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { usePerformanceTier, PerformanceTier } from "@/lib/hooks/usePerformanceTier";

const PerformanceContext = createContext<PerformanceTier>("high");

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const { tier } = usePerformanceTier();

  // Write tier to <html data-perf-tier="..."> for CSS-based gating
  useEffect(() => {
    document.documentElement.setAttribute("data-perf-tier", tier);
  }, [tier]);

  return (
    <PerformanceContext.Provider value={tier}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance(): PerformanceTier {
  return useContext(PerformanceContext);
}
