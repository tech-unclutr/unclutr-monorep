"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import HeroBriefPreview from "@/components/pilot/HeroBriefPreview";
import PilotCTAButton from "@/components/pilot/PilotCTAButton";
import { useSectionVisibility, useCTATracking } from "@/lib/analytics";

const CALENDLY_URL = "https://cal.com/squareup-ai/discovery-setup-call";

const QUESTIONS = [
  "What do first-time buyers actually think when they see your brand?",
  "Is your price point a trigger or a barrier for trial?",
  "What's the #1 reason people don't come back after the first purchase?",
  "What does your target audience wish existed in this category?",
  "Are customers confused by your packaging, your SKUs, or your messaging?",
  "Which ad makes people stop scrolling — and which gets ignored?",
];

const TRUST_LOGOS = [
  "Titan Skinn",
  "Zepto",
  "Wildstone",
  "Fasttrack",
  "Andamen",
  "Mesa School of Business",
  "Mumbai Pav Company",
  "Everaw",
  "Cozy Bear",
];

export default function PilotHero() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const containerRef = useRef<HTMLElement>(null);
  useSectionVisibility("pilot_hero", containerRef);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuestionIndex((prev) => (prev + 1) % QUESTIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={containerRef} id="pilot-hero" data-section-name="pilot_hero" className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-6 lg:px-10 pt-[clamp(64px,15vw,80px)] pb-20">
      {/* Ambient background — enhanced multi-blob */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute blob-drift-1"
          style={{
            width: "60vw",
            height: "50vh",
            top: "10%",
            left: "5%",
            background:
              "radial-gradient(ellipse, rgba(255,138,76,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute blob-drift-2"
          style={{
            width: "40vw",
            height: "40vh",
            top: "30%",
            right: "5%",
            background:
              "radial-gradient(ellipse, rgba(255,183,77,0.05) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute blob-drift-3"
          style={{
            width: "50vw",
            height: "45vh",
            bottom: "5%",
            left: "25%",
            background:
              "radial-gradient(ellipse, rgba(255,138,76,0.04) 0%, transparent 70%)",
            filter: "blur(55px)",
          }}
        />
        <div
          className="absolute blob-drift-4"
          style={{
            width: "35vw",
            height: "35vh",
            top: "5%",
            right: "20%",
            background:
              "radial-gradient(ellipse, rgba(255,107,0,0.03) 0%, transparent 70%)",
            filter: "blur(45px)",
          }}
        />
      </div>

      {/* ── 2-column layout: text left, brief card right ── */}
      <div className="relative z-10 max-w-[1200px] mx-auto w-full lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:items-center">
        {/* Left column — text content */}
        <div className="text-center lg:text-left">
          {/* Eyebrow */}
          <Reveal width="100%" delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime/[0.08] border border-lime/15 mb-4 sm:mb-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-lime">
                Limited to 4 pilots this month
              </span>
            </div>
          </Reveal>

          {/* H1 */}
          <Reveal width="100%" delay={0.08}>
            <h1 className="font-display text-[clamp(28px,7vw,56px)] leading-[1.08] tracking-[-0.04em] text-maze-black">
              Make your next customer
              <br className="hidden sm:block" /> decision in 48 hours.
            </h1>
          </Reveal>

          {/* Sub */}
          <Reveal width="100%" delay={0.16}>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-maze-gray max-w-[560px] lg:max-w-none leading-relaxed mx-auto lg:mx-0">
              You give the brief. Our AI agents do the rest. They recruit,
              interview, and catch every insight a human would miss.
              Analyst-grade depth, at lightning speed.
            </p>
          </Reveal>

          {/* Question cycling */}
          <Reveal width="100%" delay={0.24}>
            <div className="max-w-[560px] lg:max-w-none mx-auto lg:mx-0 mt-8 sm:mt-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-lime mb-3">
                Ask questions like
              </p>
              <div
                className="rounded-2xl px-5 py-4 sm:px-6 sm:py-5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,138,76,0.06) 0%, rgba(255,138,76,0.02) 100%)",
                  border: "1px solid rgba(255,138,76,0.15)",
                }}
              >
                <div className="h-[52px] sm:h-[28px] flex items-center justify-center lg:justify-start">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={questionIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="text-[15px] sm:text-base font-semibold text-lime text-center lg:text-left leading-snug"
                    >
                      &ldquo;{QUESTIONS[questionIndex]}&rdquo;
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Pills */}
          <Reveal width="100%" delay={0.32}>
            <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center lg:justify-start mt-8 sm:mt-10">
              {["Launch and price-pack decisions", "Messaging and positioning that isn\u2019t landing", "Repeat and retention problems", "CX issues that keep resurfacing"].map((pill) => (
                <span
                  key={pill}
                  className="feature-pill text-[13px] sm:text-sm min-h-[40px] sm:min-h-[44px] flex items-center cursor-default"
                >
                  {pill}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-maze-gray text-center lg:text-left">
              Best fit if the decision is in the next 2–3 weeks.
            </p>
          </Reveal>

          {/* CTA */}
          <Reveal width="100%" delay={0.4}>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 sm:gap-4">
              <PilotCTAButton
                label="Book a 20-min call"
                href={CALENDLY_URL}
                section="pilot_hero"
                fullWidthMobile
              />
            </div>
          </Reveal>

          {/* Micro line */}
          <Reveal width="100%" delay={0.44}>
            <p className="mt-4 text-[13px] text-maze-gray text-center lg:text-left">
              If we&rsquo;re not a fit, we&rsquo;ll tell you in 20 minutes.
            </p>
          </Reveal>
        </div>

        {/* Right column — Brief preview card (desktop) */}
        <div className="hidden lg:block">
          <Reveal delay={0.5}>
            <HeroBriefPreview />
          </Reveal>
        </div>

        {/* Brief preview (mobile — below CTA) */}
        <div className="lg:hidden mt-10">
          <Reveal width="100%" delay={0.5}>
            <div className="max-w-[380px] mx-auto">
              <HeroBriefPreview />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Trust strip — full width below the grid */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto">
        <Reveal width="100%" delay={0.56}>
          <div className="mt-10 sm:mt-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-maze-black/50 mb-5 text-center">
              Proven with teams at
            </p>
            <div className="relative overflow-hidden py-3">
              <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-cream to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-l from-cream to-transparent z-10 pointer-events-none" />
              <div className="flex overflow-hidden">
                <div className="flex items-center gap-8 sm:gap-12 animate-scroll-left-slow shrink-0">
                  {[...TRUST_LOGOS, ...TRUST_LOGOS].map((name, i) => (
                    <span
                      key={`${name}-${i}`}
                      className="font-bold text-sm sm:text-base text-maze-black/50 whitespace-nowrap select-none shrink-0 tracking-wide"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-8 sm:gap-12 animate-scroll-left-slow shrink-0 ml-8 sm:ml-12">
                  {[...TRUST_LOGOS, ...TRUST_LOGOS].map((name, i) => (
                    <span
                      key={`${name}-dup-${i}`}
                      className="font-bold text-sm sm:text-base text-maze-black/50 whitespace-nowrap select-none shrink-0 tracking-wide"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 scroll-indicator"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ChevronDown className="w-5 h-5 text-maze-gray/50" />
      </div>
    </section>
  );
}
