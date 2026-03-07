"use client";

import { useEffect } from "react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import FloatingNav from "@/components/sections/FloatingNav";
import LogoNotch from "@/components/ui/LogoNotch";
import ParticleNarrativeController from "@/components/ui/ParticleNarrativeController";

import CustomCursor from "@/components/ui/CustomCursor";
import CursorParticles from "@/components/ui/CursorParticles";
import AmbientParticles from "@/components/ui/AmbientParticles";
import HeroSection from "@/components/sections/HeroSection";
// import CoreFeatures from "@/components/sections/CoreFeatures";
import InterviewStudio from "@/components/sections/InterviewStudio";
import FeaturesMarquee from "@/components/sections/FeaturesMarquee";
import AgentsSection from "@/components/sections/AgentsSection";
import ResearchNeeds from "@/components/sections/ResearchNeeds";
import SocialProof from "@/components/sections/SocialProof";
import TrustSecurity from "@/components/sections/TrustSecurity";
import BookingSection from "@/components/sections/BookingSection";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/sections/Footer";
import ProblemSection from "@/components/sections/ProblemSection";

export default function Home() {

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    let lenis: InstanceType<typeof import("@studio-freight/lenis").default> | null = null;

    (async () => {
      const Lenis = (await import("@studio-freight/lenis")).default;
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      function raf(time: number) {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    })();

    return () => {
      lenis?.destroy();
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
    <main className="relative bg-[#FBF4EC]">
      <LoadingScreen />
      <LogoNotch />
      <FloatingNav />
      <HeroSection />
      <div className="relative z-10">
        {/* Light sections with ambient floating particles */}
        <div className="relative">
          <AmbientParticles fullHeight particleCount={50} opacity={0.3} direction="ambient" />
          <ProblemSection />
          <SocialProof />
          <InterviewStudio />
          <ResearchNeeds />
          {/* <CoreFeatures /> */}
          <FeaturesMarquee />
          {/* <AgentsSection /> */}
          <TrustSecurity />
          <BookingSection />
        </div>
        {/* Dark sections */}
        <CTASection />
        <Footer />
      </div>
      {/* Particle canvas */}
      <ParticleNarrativeController />

      {/* Cursor effects */}
      <CursorParticles />
      <CustomCursor />
    </main>
  );
}
