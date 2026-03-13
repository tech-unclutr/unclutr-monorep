import { useState, useRef } from "react";
import { flushSync } from "react-dom";
import Nav from "@/components/pitch/Nav";
import HeroSection from "@/components/pitch/sections/HeroSection";
import CostSection from "@/components/pitch/sections/CostSection";
import ProblemSection from "@/components/pitch/sections/ProblemSection";
import LandscapeSection from "@/components/pitch/sections/LandscapeSection";
import SolutionSection from "@/components/pitch/sections/SolutionSection";
import WhoIsItForSection from "@/components/pitch/sections/WhoIsItForSection";
import HowItWorksSection from "@/components/pitch/sections/HowItWorksSection";
import AIDemoSection from "@/components/pitch/sections/AIDemoSection";
import WhyNowSection from "@/components/pitch/sections/WhyNowSection";
import TractionSection from "@/components/pitch/sections/TractionSection";
import MarketSection from "@/components/pitch/sections/MarketSection";
import BusinessModelSection from "@/components/pitch/sections/BusinessModelSection";
import TeamSection from "@/components/pitch/sections/TeamSection";
import TheAskSection from "@/components/pitch/sections/TheAskSection";
import FAQSection from "@/components/pitch/sections/FAQSection";
import CTASection from "@/components/pitch/sections/CTASection";
import InsightBriefSection from "@/components/pitch/sections/InsightBriefSection";

import PresenterMode from "@/components/pitch/presenter/PresenterMode";
import PresenterBuilder from "@/components/pitch/presenter/PresenterBuilder";
import { ALL_SLIDES, type SlideMode, type DeckLength, type SlideDefinition } from "@/lib/slides";

import DownloadMode from "@/components/pitch/download/DownloadMode";
import PrintTemplate from "@/components/pitch/download/PrintTemplate";
import { useFullPageScroll } from "@/lib/useFullPageScroll";

// 10-Slide Founder Pitch (Short Mode)
// Story: Hook → Pain → Solution → Product → Timing → Proof → Market → Team → Ask → Close
const FOUNDER_SECTIONS = [
  <HeroSection key="hero" mode="detailed" />,
  <CostSection key="cost" mode="detailed" />,
  <ProblemSection key="problem" mode="detailed" />,
  <SolutionSection key="solution" mode="detailed" />,
  <InsightBriefSection key="insightbrief" mode="detailed" />,
  <AIDemoSection key="aidemo" mode="detailed" />,
  <WhyNowSection key="whynow" mode="detailed" />,
  <TractionSection key="traction" mode="detailed" />,
  <MarketSection key="market" mode="detailed" />,
  <TeamSection key="team" mode="detailed" />,
  <TheAskSection key="ask" mode="detailed" />,
  <CTASection key="cta" mode="detailed" />,
];

// 12-Slide Master Pitch (Detailed Mode)
const MASTER_SECTIONS = [
  <HeroSection key="hero" mode="detailed" />,
  <CostSection key="cost" mode="detailed" />,
  <ProblemSection key="problem" mode="detailed" />,
  <LandscapeSection key="landscape" mode="detailed" />,
  <SolutionSection key="solution" mode="detailed" />,
  <WhoIsItForSection key="whofor" mode="detailed" />,
  <HowItWorksSection key="howitworks" mode="detailed" />,
  <AIDemoSection key="aidemo" mode="detailed" />,
  <InsightBriefSection key="insightbrief-master" mode="detailed" />,
  <WhyNowSection key="whynow" mode="detailed" />,
  <TractionSection key="traction" mode="detailed" />,
  <MarketSection key="market" mode="detailed" />,
  <BusinessModelSection key="businessmodel" mode="detailed" />,
  <TeamSection key="team" mode="detailed" />,
  <TheAskSection key="ask" mode="detailed" />,
  // Optional appendix/closers
  <FAQSection key="faq" mode="detailed" />,
  <CTASection key="cta" mode="detailed" />,
];

export default function Index() {
  const [mode, setMode] = useState<SlideMode>("short");
  const [deckLength, setDeckLength] = useState<DeckLength>(8); // Default to 8-slide
  const [sessionSlides, setSessionSlides] = useState<SlideDefinition[] | null>(null);
  const [printSlides, setPrintSlides] = useState<SlideDefinition[] | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  useFullPageScroll(mainRef, mode === "short" || mode === "detailed");

  const handleStartPresentation = (slides: SlideDefinition[]) => {
    if (slides.length > 0) {
      // Find the stable wrapper
      const el = document.querySelector<HTMLElement>("[data-presenter]");
      if (el) {
        el.requestFullscreen({ navigationUI: "hide" })
          .then(() => {
            setSessionSlides(slides);
            setMode("presenter");
          })
          .catch((err) => {
            console.error("Fullscreen request failed", err);
            // Fallback: still show the mode even if fullscreen fails
            setSessionSlides(slides);
            setMode("presenter");
          });
      } else {
        // Fallback if el not found
        setSessionSlides(slides);
        setMode("presenter");
      }
    }
  };

  if (printSlides) {
    return <PrintTemplate slides={printSlides} onFinish={() => setPrintSlides(null)} />;
  }

  if (mode === "presenter" && !sessionSlides) {
    return (
      <PresenterBuilder
        onExit={() => setMode("short")}
        onStartPresentation={handleStartPresentation}
        onDownloadPDF={setPrintSlides}
      />
    );
  }

  const isPresenting = mode === "presenter" && !!sessionSlides;

  return (
    <div className="font-sans" style={{ background: "hsl(var(--sq-off-white))" }}>
      {!isPresenting && (
        <Nav
          mode={mode}
          onModeChange={setMode}
          deckLength={deckLength}
          onDeckLengthChange={setDeckLength}
        />
      )}

      {!isPresenting && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              const slides = ALL_SLIDES.filter((s) => s.lengths.includes(deckLength));
              handleStartPresentation(slides);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-foreground text-background font-bold text-sm tracking-wide shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            Presenter Mode
          </button>
        </div>
      )}

      <main ref={mainRef}>
        {mode === "download" ? (
          <DownloadMode onDownloadPDF={setPrintSlides} />
        ) : mode === "short" ? (
          FOUNDER_SECTIONS
        ) : mode === "detailed" ? (
          MASTER_SECTIONS
        ) : null}
      </main>

      {/* Stable Presenter wrapper — always in DOM to anchor the fullscreen gesture reliably */}
      <div 
        data-presenter
        className={`fixed inset-0 z-[100] bg-[hsl(var(--sq-off-white))] transition-opacity duration-300 ${isPresenting ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {isPresenting && (
          <PresenterMode
            onExit={() => { setSessionSlides(null); setMode("short"); }}
            slides={sessionSlides}
          />
        )}
      </div>
    </div>
  );
}
