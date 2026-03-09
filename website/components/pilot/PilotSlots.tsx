"use client";

import { useRef } from "react";
import Reveal from "@/components/ui/Reveal";
import { useSectionVisibility, useCTATracking } from "@/lib/analytics";

const TOTAL_SLOTS = 4;
const FILLED_SLOTS = 2;
const OPEN_SLOTS = TOTAL_SLOTS - FILLED_SLOTS;

export default function PilotSlots() {
  const sectionRef = useRef<HTMLDivElement>(null);
  useSectionVisibility("pilot_slots", sectionRef);
  const { trackCTA } = useCTATracking();

  return (
    <section
      ref={sectionRef}
      data-section-name="pilot_slots"
      className="relative overflow-hidden py-12 sm:py-16 lg:py-20"
      style={{ backgroundColor: "#212121" }}
    >
      {/* Soft orange radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,138,76,0.12) 0%, transparent 70%)",
        }}
      />

      {/* ── content ── */}
      <div className="relative z-10 max-w-[800px] mx-auto px-5 sm:px-6 lg:px-10 text-center">
        {/* Proven badge */}
        <Reveal width="100%" delay={0}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 mb-6">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white">
              Slots filling up
            </span>
          </div>
        </Reveal>

        <Reveal width="100%" delay={0.04}>
          <h2 className="font-display text-[clamp(24px,6vw,48px)] tracking-[-0.03em] text-white leading-[1.1]">
            Your first study ships
            <br className="hidden sm:block" /> in 48 hours. Then you decide.
          </h2>
        </Reveal>

        <Reveal width="100%" delay={0.1}>
          <p className="mt-4 text-base sm:text-lg text-white/80 max-w-[560px] mx-auto">
            The pilot is a single study on a real decision. If the brief
            changes how your team thinks, we keep going. If it doesn&rsquo;t,
            you walk away — no contracts, no obligations.
          </p>
        </Reveal>

        {/* Slot indicators */}
        <Reveal width="100%" delay={0.16}>
          <div className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 border border-white/15">
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < FILLED_SLOTS
                      ? "bg-white/20"
                      : "bg-lime animate-pulse"
                  }`}
                  style={
                    i >= FILLED_SLOTS
                      ? { animationDelay: `${(i - FILLED_SLOTS) * 0.4}s` }
                      : undefined
                  }
                />
              ))}
            </div>
            <span className="text-sm font-bold text-white ml-2">
              {OPEN_SLOTS} of {TOTAL_SLOTS} slots left
            </span>
          </div>
        </Reveal>

        <Reveal width="100%" delay={0.2}>
          <p className="mt-5 text-sm text-white/50">
            Each pilot is hands-on. We only take {TOTAL_SLOTS} at a time to
            guarantee quality.
          </p>
        </Reveal>

        <Reveal width="100%" delay={0.24}>
          <a
            href="https://cal.com/squareup-ai/discovery-setup-call"
            onClick={() => trackCTA("Claim your pilot slot", "https://cal.com/squareup-ai/discovery-setup-call", "pilot_slots", "main")}
            className="inline-flex items-center justify-center mt-8 bg-lime text-white rounded-xl font-display text-base min-h-[56px] w-full sm:w-auto sm:min-w-[240px] px-8 hover:brightness-110 active:scale-[0.97] transition-all"
          >
            Claim your pilot slot →
          </a>
        </Reveal>
      </div>
    </section>
  );
}
