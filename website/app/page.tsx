"use client";

import { useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import LoadingScreen from "@/components/ui/LoadingScreen";
import FloatingNav from "@/components/sections/FloatingNav";
import LogoNotch from "@/components/ui/LogoNotch";
import HeroSection from "@/components/sections/HeroSection";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useScrollDepth, useExitIntent, useEngagementScore, useRageClick } from "@/lib/analytics";

// Below-fold sections — lazy loaded
const ProblemSection = dynamic(() => import("@/components/sections/ProblemSection"), { ssr: false });
const SocialProof = dynamic(() => import("@/components/sections/SocialProof"), { ssr: false });
const InterviewStudio = dynamic(() => import("@/components/sections/InterviewStudio"), { ssr: false });
const ResearchNeeds = dynamic(() => import("@/components/sections/ResearchNeeds"), { ssr: false });
const FeaturesMarquee = dynamic(() => import("@/components/sections/FeaturesMarquee"), { ssr: false });
const TrustSecurity = dynamic(() => import("@/components/sections/TrustSecurity"), { ssr: false });
const BookingSection = dynamic(() => import("@/components/sections/BookingSection"), { ssr: false });
const CTASection = dynamic(() => import("@/components/sections/CTASection"), { ssr: false });
const Footer = dynamic(() => import("@/components/sections/Footer"), { ssr: false });

// Decorative / non-critical — lazy loaded
const AmbientParticles = dynamic(() => import("@/components/ui/AmbientParticles"), { ssr: false });
const ParticleNarrativeController = dynamic(() => import("@/components/ui/ParticleNarrativeController"), { ssr: false });
const CursorParticles = dynamic(() => import("@/components/ui/CursorParticles"), { ssr: false });
const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), { ssr: false });

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  // Analytics hooks
  useScrollDepth();
  useExitIntent();
  useEngagementScore();
  useRageClick(mainRef);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    let lenis: InstanceType<typeof import("@studio-freight/lenis").default> | null = null;

    (async () => {
      const Lenis = (await import("@studio-freight/lenis")).default;
      lenis = new Lenis({
        lerp: 0.4,
        wheelMultiplier: 0.7,
        syncTouch: true,
        smoothWheel: true,
      });

      function raf(time: number) {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    })();

    // Premium anchor scroll — intercept all hash links and use Lenis
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='#']");
      if (!anchor) return;
      const target = document.querySelector(anchor.getAttribute("href")!);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target as HTMLElement, {
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
      lenis?.destroy();
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  // Keyboard navigation: Up/Down arrow keys simulate scrolling
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
    <main ref={mainRef} className="relative bg-[#FBF4EC]">
      <LoadingScreen />
      <LogoNotch />
      <FloatingNav />
      <ErrorBoundary><HeroSection /></ErrorBoundary>
      <div className="relative z-10">
        {/* Light sections with ambient floating particles */}
        <div className="relative">
          <AmbientParticles fullHeight particleCount={50} opacity={0.3} direction="ambient" />
          <Suspense fallback={<div className="min-h-[400px]" />}><ProblemSection /></Suspense>
          <Suspense fallback={<div className="min-h-[200px]" />}><SocialProof /></Suspense>
          <Suspense fallback={<div className="min-h-[400px]" />}><InterviewStudio /></Suspense>
          <Suspense fallback={<div className="min-h-[400px]" />}><ResearchNeeds /></Suspense>
          <Suspense fallback={<div className="min-h-[200px]" />}><FeaturesMarquee /></Suspense>
          <Suspense fallback={<div className="min-h-[300px]" />}><TrustSecurity /></Suspense>
          <Suspense fallback={<div className="min-h-[400px]" />}><BookingSection /></Suspense>
        </div>
        {/* Dark sections */}
        <ErrorBoundary><Suspense fallback={<div className="min-h-[400px] bg-black" />}><CTASection /></Suspense></ErrorBoundary>
        <Suspense fallback={<div className="min-h-[200px] bg-black" />}><Footer /></Suspense>
      </div>
      {/* Particle canvas */}
      <ErrorBoundary><ParticleNarrativeController /></ErrorBoundary>

      {/* Cursor effects */}
      <CursorParticles />
      <CustomCursor />
    </main>
  );
}
