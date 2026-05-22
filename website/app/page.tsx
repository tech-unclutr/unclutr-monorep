"use client";

import { useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import LoadingScreen from "@/components/ui/LoadingScreen";
import FloatingNav from "@/components/sections/FloatingNav";
import LogoNotch from "@/components/ui/LogoNotch";
import LenisProvider from "@/components/ui/LenisProvider";
import HeroSection from "@/components/sections/HeroSection";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useScrollDepth, useExitIntent, useEngagementScore, useRageClick } from "@/lib/analytics";
import { useKeyboardNav } from "@/lib/hooks/useKeyboardNav";
import { useSectionSwipe } from "@/lib/hooks/useSectionSwipe";
import KeyboardShortcutsOverlay from "@/components/ui/KeyboardShortcutsOverlay";
import { PerformanceProvider, usePerformance } from "@/lib/context/PerformanceContext";

// Below-fold sections — lazy loaded
const ProblemSectionSticky = dynamic(() => import("@/components/sections/ProblemSectionSticky"), { ssr: false });
const SocialProof = dynamic(() => import("@/components/sections/SocialProof"), { ssr: false });
const InterviewStudio = dynamic(() => import("@/components/sections/InterviewStudio"), { ssr: false });
const ResearchNeeds = dynamic(() => import("@/components/sections/ResearchNeeds"), { ssr: false });
const FeaturesMarquee = dynamic(() => import("@/components/sections/FeaturesMarquee"), { ssr: false });
const TrustSecurity = dynamic(() => import("@/components/sections/TrustSecurity"), { ssr: false });
const BookingSection = dynamic(() => import("@/components/sections/BookingSection"), { ssr: false });
const CTASection = dynamic(() => import("@/components/sections/CTASection"), { ssr: false });
const Footer = dynamic(() => import("@/components/sections/Footer"), { ssr: false });

// Decorative / non-critical — lazy loaded
const ParticleNarrativeController = dynamic(() => import("@/components/ui/ParticleNarrativeController"), { ssr: false });
const CursorParticles = dynamic(() => import("@/components/ui/CursorParticles"), { ssr: false });
const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), { ssr: false });

// Scroll experience components
const ScrollProgressBar = dynamic(() => import("@/components/ui/ScrollProgressBar"), { ssr: false });
const SectionNav = dynamic(() => import("@/components/ui/SectionNav"), { ssr: false });
const ScrollNudge = dynamic(() => import("@/components/ui/ScrollNudge"), { ssr: false });

// Mobile-native UX
const MobileSectionDrawer = dynamic(() => import("@/components/ui/MobileSectionDrawer"), { ssr: false });
const PWAInstallPrompt = dynamic(() => import("@/components/ui/PWAInstallPrompt"), { ssr: false });

function HomeContent() {
  const mainRef = useRef<HTMLDivElement>(null);
  const tier = usePerformance();

  // Analytics hooks
  useScrollDepth();
  useExitIntent();
  useEngagementScore();
  useRageClick(mainRef);

  // Keyboard navigation: all keys handled via useKeyboardNav (Lenis-native)
  const { showShortcuts, setShowShortcuts } = useKeyboardNav();
  // Right-edge vertical swipe → jump between sections on touch devices
  useSectionSwipe();

  return (
    <LenisProvider>
    <main ref={mainRef} className="relative bg-[#FBF4EC]">
      <LoadingScreen />
      <LogoNotch />
      <FloatingNav />
      <ErrorBoundary><HeroSection /></ErrorBoundary>
      <div className="relative z-10">
        {/* Light sections */}
        <div className="relative">
          <Suspense fallback={<div className="min-h-[400px]" />}><ProblemSectionSticky /></Suspense>
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
      {/* Particle canvas — skip on low tier */}
      {tier !== "low" && <ErrorBoundary><ParticleNarrativeController /></ErrorBoundary>}

      {/* Scroll experience */}
      <ScrollProgressBar />
      <SectionNav />
      <ScrollNudge />

      {/* Mobile-native UX */}
      <MobileSectionDrawer />
      <PWAInstallPrompt />

      {/* Cursor effects — cursor particles only on high tier */}
      {tier === "high" && <CursorParticles />}
      <CustomCursor />

      {/* Keyboard shortcuts overlay (? key) */}
      <KeyboardShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </main>
    </LenisProvider>
  );
}

export default function Home() {
  return (
    <PerformanceProvider>
      <HomeContent />
    </PerformanceProvider>
  );
}
