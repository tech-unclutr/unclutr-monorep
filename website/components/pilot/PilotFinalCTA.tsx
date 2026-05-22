"use client";

import { useRef } from "react";
import Reveal from "@/components/ui/Reveal";
import PilotCTAButton from "@/components/pilot/PilotCTAButton";
import { useSectionVisibility } from "@/lib/analytics";

const CALENDLY_URL = "https://calendar.app.google/WyiQUVRZxAdJJ5Yu7";
const TOTAL_SLOTS = 4;
const FILLED_SLOTS = 2;
const OPEN_SLOTS = TOTAL_SLOTS - FILLED_SLOTS;

export default function PilotFinalCTA({
  onShowBrief,
}: {
  onShowBrief: () => void;
}) {
  const containerRef = useRef<HTMLElement>(null);
  useSectionVisibility("pilot_final_cta", containerRef);

  return (
    <section
      ref={containerRef}
      data-section-name="pilot_final_cta"
      id="book-call"
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
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

      <div className="relative z-10 max-w-[800px] mx-auto px-5 sm:px-6 lg:px-10 text-center">
        <Reveal width="100%" delay={0}>
          <h2 className="font-display text-[clamp(28px,7vw,56px)] tracking-[-0.04em] text-white leading-[1.08]">
            Your first study ships
            <br className="hidden sm:block" /> in 48 hours. Then you decide.
          </h2>
        </Reveal>

        <Reveal width="100%" delay={0.08}>
          <p className="mt-4 text-base sm:text-lg text-white/80 max-w-[560px] mx-auto">
            The pilot is a single study on a real decision. If the brief
            changes how your team thinks, we keep going. If it doesn&rsquo;t,
            you walk away — no contracts, no obligations.
          </p>
        </Reveal>

        {/* Slot indicators */}
        <Reveal width="100%" delay={0.14}>
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

        <Reveal width="100%" delay={0.18}>
          <p className="mt-5 text-sm text-white/50">
            Each pilot is hands-on. We only take {TOTAL_SLOTS} at a time to
            guarantee quality.
          </p>
        </Reveal>

        <Reveal width="100%" delay={0.22}>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <PilotCTAButton
              label="Book a 20-min call"
              href={CALENDLY_URL}
              section="pilot_final_cta"
              variant="primary-orange"
              fullWidthMobile
            />
            <PilotCTAButton
              label="See an executive summary"
              onClick={onShowBrief}
              section="pilot_final_cta"
              position="secondary"
              variant="ghost"
              fullWidthMobile
            />
          </div>
        </Reveal>

        {/* Testimonial */}
        <Reveal width="100%" delay={0.26}>
          <div className="mt-10 max-w-[480px] mx-auto px-5 py-4 rounded-2xl bg-white/10 border border-white/15">
            <p className="text-[15px] text-white/90 leading-relaxed italic">
              &ldquo;I&rsquo;ve worked at Myntra and Titan. I know what research looks like. This was genuinely the first time I got a research output and immediately put it to use.&rdquo;
            </p>
            <p className="mt-2 text-[13px] text-white/60 font-semibold">
              Saket, Brand Lead at Titan Skinn
            </p>
          </div>
        </Reveal>

        <Reveal width="100%" delay={0.3}>
          <p className="mt-6 text-sm text-white/50">
            Prefer email?{" "}
            <a
              href="mailto:hello@joinsquareup.com?subject=48-Hour%20Pilot"
              className="text-lime underline hover:text-lime-bright transition-colors"
            >
              hello@joinsquareup.com
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
