"use client";

import { useEffect, useRef, useState, MouseEvent } from "react";
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { useSectionVisibility } from "@/lib/analytics";

/* ── Testimonial data ──────────────────────────────────────────────────
 * Placeholders per migration doc §8.5. Param will swap with real quotes.
 * Keep specific numbers — replace `[Name, Title]` brackets with real
 * attribution as they come in. Don't soften the specificity.
 * ──────────────────────────────────────────────────────────────────── */
type Testimonial = {
  quote: string;
  name: string;
  company: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Pulse called 80 of our churned customers in 6 days. The real reason they left was delivery delays in tier-2 cities, not pricing. We rebuilt the delivery promise. NPS went from 32 to 51 in 8 weeks.",
    name: "[Name, Head of Growth]",
    company: "BigBasket",
  },
  {
    quote:
      "We were three weeks from launching a new SKU at the wrong price. SquareUp ran 45 voice interviews with our category buyers in a week. Willingness-to-pay was 22% lower than our pricing brief. We held launch and re-priced.",
    name: "[Name, Brand Manager]",
    company: "Titan Skinn",
  },
  {
    quote:
      "Before SquareUp, the voice of customer was one person's job and everyone else's guess. Now product, growth, and leadership are working from the same source of truth.",
    name: "[Name, Title]",
    company: "[Company Placeholder]",
  },
  {
    quote:
      "We used to wait 4 weeks for a research readout. SquareUp got us there in 3 days, and the customer insights were sharper because they came directly from the customer, not a researcher's summary.",
    name: "[Name, Title]",
    company: "[Company Placeholder]",
  },
  {
    quote:
      "The thing that surprised us wasn't the speed. It was what the AI voice agents caught that our team had been missing in manual interviews for months. Things customers had been trying to tell us, in their own words.",
    name: "[Name, Title]",
    company: "[Company Placeholder]",
  },
];

const AUTOPLAY_MS = 6000;

/* ── TestimonialSlider ─────────────────────────────────────────────────
 * React port of the vanilla JS scaffold in migration doc §8.6–§8.8.
 * Mechanics: 5 cards, auto-advance every 6s, pause on hover, arrows on
 * desktop, dots always visible, touch/swipe (50px threshold) on mobile.
 * Loops infinitely. One card visible at a time, track translates by
 * -currentIndex * 100%.
 * ──────────────────────────────────────────────────────────────────── */
function TestimonialSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = (i: number) => {
    setCurrentIndex(((i % TESTIMONIALS.length) + TESTIMONIALS.length) % TESTIMONIALS.length);
  };
  const next = () => goTo(currentIndex + 1);
  const prev = () => goTo(currentIndex - 1);

  // Autoplay — pauses while hovered
  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(() => {
      setCurrentIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [isPaused]);

  // Touch / swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) (diff > 0 ? next : prev)();
  };

  return (
    <div
      ref={sliderRef}
      className="relative max-w-[1100px] mx-auto mb-12 px-4 sm:px-12 lg:px-16"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
    >
      {/* Viewport — clips overflow, rounds corners */}
      <div className="overflow-hidden rounded-[20px]">
        {/* Track — flex row, translates left */}
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {TESTIMONIALS.map((t, i) => (
            <article
              key={i}
              className="flex-shrink-0 w-full bg-white rounded-[20px] border border-[#e8e0d8] p-8 sm:p-9 flex flex-col gap-[18px]"
              style={{ minHeight: 280 }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${TESTIMONIALS.length}`}
              aria-hidden={i !== currentIndex}
            >
              <span
                aria-hidden
                className="text-[48px] leading-none text-[#FF5A36] font-serif select-none"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                ❝
              </span>
              <p className="text-[14px] sm:text-[15px] leading-[1.7] text-[rgba(11,19,43,0.65)] italic flex-1">
                {t.quote}
              </p>
              <div className="border-t border-[#e8e0d8] pt-4">
                <div className="text-[14px] font-bold text-[#0b132b]">
                  {t.name}
                </div>
                <div className="text-[12px] text-[#757575] mt-0.5">
                  {t.company}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Prev / Next — hidden under 720px per doc spec */}
      <button
        type="button"
        aria-label="Previous testimonial"
        onClick={prev}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-[#e8e0d8] text-[#0b132b] items-center justify-center text-[20px] transition-all duration-200 hover:border-[#FF5A36] hover:text-[#FF5A36] hover:shadow-[0_4px_12px_rgba(232,80,26,0.15)] z-10"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next testimonial"
        onClick={next}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-[#e8e0d8] text-[#0b132b] items-center justify-center text-[20px] transition-all duration-200 hover:border-[#FF5A36] hover:text-[#FF5A36] hover:shadow-[0_4px_12px_rgba(232,80,26,0.15)] z-10"
      >
        ›
      </button>

      {/* Dot indicators */}
      <div role="tablist" className="flex justify-center gap-2 mt-5">
        {TESTIMONIALS.map((_, i) => {
          const active = i === currentIndex;
          return (
            <button
              key={i}
              role="tab"
              aria-selected={active}
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                active
                  ? "w-6 bg-[#FF5A36]"
                  : "w-2 bg-[#e8e0d8] hover:bg-[#cfc4b4]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── LogoStrip ─────────────────────────────────────────────────────────
 * BigBasket + Titan Skinn (real) + 2 partner placeholders. Replaces the
 * removed Mesa + Entrepreneurs First wordmarks (those are investor logos
 * and don't belong on the front page after a pain narrative — see doc §6.3).
 * ──────────────────────────────────────────────────────────────────── */
function LogoStrip() {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <LogoChip label="BigBasket" />
      <LogoChip label="Titan Skinn" dotOpacity={0.6} />
      <LogoChip label="Partner Logo" placeholder />
      <LogoChip label="Partner Logo" placeholder />
    </div>
  );
}

function LogoChip({
  label,
  dotOpacity = 0.8,
  placeholder = false,
}: {
  label: string;
  dotOpacity?: number;
  placeholder?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-[18px] py-2.5 rounded-[12px] bg-white border ${
        placeholder
          ? "border-dashed border-[#e8e0d8] opacity-45"
          : "border-[#e8e0d8]"
      }`}
    >
      <span
        aria-hidden
        className="w-[22px] h-[22px] rounded-[5px] flex-shrink-0"
        style={{
          background: placeholder ? "#aaa" : "#FF5A36",
          opacity: placeholder ? 0.5 : dotOpacity,
        }}
      />
      <span
        className={`text-[14px] font-bold ${
          placeholder ? "text-[#aaa]" : "text-[#0b132b]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* ── SocialProof (F7) ──────────────────────────────────────────────────
 * Phase 2 / Change 2.1 — REPLACES the previous SocialProof.
 * Was: "Validated by leaders from 120+ customer-centric teams" + headline
 *      + Mesa / Entrepreneurs First wordmarks.
 * Now: new pill + new H2 + 5-slide testimonial slider + 4-chip logo strip.
 * Mesa + Entrepreneurs First (investor logos) removed — to be relocated
 * to a Backed-by footer/About block per separate decision.
 *
 * The live mouse-spotlight + static center glow backdrop is preserved
 * (design language continuity — doc §1.2 / §1.4).
 * ──────────────────────────────────────────────────────────────────── */
export default function SocialProof() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.2 });
  useSectionVisibility("social_proof", containerRef);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  const spotlightColor = "rgba(255, 140, 100, 0.12)";
  const spotlightStyle = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`;

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      data-section-name="social-proof"
      className="relative z-10 w-full py-20 sm:py-24 lg:py-28 overflow-hidden"
      style={{ background: "#FBF4EC" }}
    >
      {/* Interactive spotlight backdrop (preserved from live design) */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700"
        style={{ background: spotlightStyle }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Static subtle center glow (preserved from live design) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none w-full h-full overflow-hidden z-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 0.15, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="w-[800px] h-[300px] bg-gradient-to-r from-orange-400 via-orange-200 to-transparent rounded-[100%] blur-[100px]"
          style={{ transform: "translateY(-20%)" }}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6">
        {/* ── Header: pill + H2 ── */}
        <div className="text-center mb-12 lg:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative group overflow-hidden inline-block py-2 px-6 rounded-full border border-orange-200/50 bg-white/40 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.03)] mb-8"
          >
            <span className="relative z-10 text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase text-orange-600">
              Trusted by consumer teams building what&apos;s next
            </span>
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 1 }}
              className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/70 to-transparent w-1/2 skew-x-[-20deg]"
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
            animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 1.2, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[clamp(24px,3.2vw,40px)] font-black tracking-[-0.02em] text-[#0b132b] leading-[1.2] max-w-[820px] mx-auto text-balance"
          >
            The sharpest consumer teams
            <br className="hidden sm:block" />
            don&apos;t guess. They build on{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A36] to-[#FF8C64]">
              SquareUp.
            </span>
          </motion.h2>
        </div>

        {/* ── Testimonial slider ── */}
        <TestimonialSlider />

        {/* ── Logo strip ── */}
        <LogoStrip />
      </div>
    </section>
  );
}
