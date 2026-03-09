"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import PilotNav from "@/components/pilot/PilotNav";
import PilotHero from "@/components/pilot/PilotHero";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useScrollDepth, useExitIntent, useEngagementScore, useRageClick } from "@/lib/analytics";

// Below-fold sections — lazy loaded
const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), { ssr: false });
const PilotFloatingCTA = dynamic(() => import("@/components/pilot/PilotFloatingCTA"), { ssr: false });
const PilotTestimonials = dynamic(() => import("@/components/pilot/PilotTestimonials"), { ssr: false });
const PilotMetrics = dynamic(() => import("@/components/pilot/PilotMetrics"), { ssr: false });
const HowItWorks = dynamic(() => import("@/components/pilot/HowItWorks"), { ssr: false });
const PilotPricing = dynamic(() => import("@/components/pilot/PilotPricing"), { ssr: false });
const PilotFAQ = dynamic(() => import("@/components/pilot/PilotFAQ"), { ssr: false });
const PilotFinalCTA = dynamic(() => import("@/components/pilot/PilotFinalCTA"), { ssr: false });
const PilotFooter = dynamic(() => import("@/components/pilot/PilotFooter"), { ssr: false });
const SampleBriefModal = dynamic(() => import("@/components/pilot/SampleBriefModal"), { ssr: false });

export default function PilotPage() {
  const [showBrief, setShowBrief] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<InstanceType<
    typeof import("@studio-freight/lenis").default
  > | null>(null);

  // Analytics hooks
  useScrollDepth();
  useExitIntent();
  useEngagementScore();
  useRageClick(mainRef);

  // Lenis smooth scroll (desktop only)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    (async () => {
      const Lenis = (await import("@studio-freight/lenis")).default;
      const instance = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenisRef.current = instance;

      function raf(time: number) {
        instance.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    })();

    // Anchor click interception for smooth scroll
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='#']");
      if (!anchor) return;
      const target = document.querySelector(anchor.getAttribute("href")!);
      if (!target) return;
      e.preventDefault();
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target as HTMLElement, {
          offset: -40,
          duration: 1.6,
          easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -12 * t)),
        });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
    };
    document.addEventListener("click", handleAnchorClick);

    return () => {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  // Stop Lenis when modal is open so scroll stays inside the modal
  useEffect(() => {
    if (showBrief) {
      lenisRef.current?.stop();
    } else {
      lenisRef.current?.start();
    }
  }, [showBrief]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      e.preventDefault();
      const distance = window.innerHeight * 0.3;
      window.scrollBy({
        top: e.key === "ArrowDown" ? distance : -distance,
        behavior: "smooth",
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main ref={mainRef} className="relative">
      <CustomCursor />
      <PilotNav />
      <PilotFloatingCTA />
      <ErrorBoundary><PilotHero /></ErrorBoundary>
      <div className="relative z-10">
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <PilotTestimonials />
        </Suspense>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <PilotMetrics />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <HowItWorks onShowBrief={() => setShowBrief(true)} />
        </Suspense>
        <Suspense fallback={<div className="min-h-[300px]" />}>
          <PilotPricing />
        </Suspense>
        <Suspense fallback={<div className="min-h-[300px]" />}>
          <PilotFAQ />
        </Suspense>
        <Suspense fallback={<div className="min-h-[300px]" />}>
          <PilotFinalCTA onShowBrief={() => setShowBrief(true)} />
        </Suspense>
        <Suspense fallback={<div className="min-h-[100px]" />}>
          <PilotFooter />
        </Suspense>
      </div>
      {showBrief && <SampleBriefModal onClose={() => setShowBrief(false)} />}
    </main>
  );
}
