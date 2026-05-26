"use client";

import { useRef, MouseEvent } from "react";
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { useSectionVisibility } from "@/lib/analytics";


/* ── LogoStrip ─────────────────────────────────────────────────────────
 * Customer-style chips: BigBasket + Titan Skinn (real) + 2 partner
 * placeholders. Investor logos (Mesa + Entrepreneurs First) live in
 * the BackedBy band below — see comment on BackedBy.
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

/* ── BackedBy ──────────────────────────────────────────────────────────
 * Thin band sitting just below the customer LogoStrip. Houses the two
 * investor wordmarks (Mesa School of Business + Entrepreneurs First)
 * with a small "Backed by" label above. Visually subordinate to the
 * customer logos — smaller height, muted backdrop, less prominence —
 * so the hierarchy reads:
 *   1. Real customers we work with  (LogoStrip)
 *   2. Who funded us, much smaller  (BackedBy)
 * ──────────────────────────────────────────────────────────────────── */
function BackedBy() {
  return (
    <div className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-[#e8e0d8]/70">
      <p className="text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#757575] mb-6">
        Backed by
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 sm:gap-x-14 lg:gap-x-16 gap-y-5">
        {/* Mesa School of Business — vector logo from public/ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mesa-school-logo.svg"
          alt="Mesa School of Business"
          className="h-8 sm:h-9 w-auto opacity-80"
        />

        {/* Entrepreneurs First — typographic wordmark, brand colors preserved */}
        <div className="flex flex-col items-center leading-none">
          <span className="font-display text-[18px] sm:text-[22px] font-black tracking-[-0.02em] leading-none whitespace-nowrap">
            <span className="text-[#6A1FE5]">Entrepreneurs</span>{" "}
            <span className="text-[#F26D1F]">First</span>
          </span>
          <span className="text-[9px] sm:text-[10px] italic font-medium text-[#6B6B6B] mt-1">
            Spring 2026 Cohort
          </span>
        </div>
      </div>
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
 * Phase 2 / Change 2.1 + later refinements.
 * Was: "Validated by leaders from 120+ customer-centric teams" + headline
 *      + Mesa / Entrepreneurs First wordmarks.
 * Currently: pill + H2 + customer logo chips + "Backed by" investor band.
 *
 * The testimonial slider that briefly lived here has been removed —
 * showed placeholder copy and read as a fake-quote slot rather than
 * actual social proof. Will return once real testimonials are signed
 * off; the slider component code was removed cleanly to avoid drift.
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

        {/* ── Customer logo strip ── */}
        <LogoStrip />

        {/* ── Backed-by investor band (Mesa + Entrepreneurs First) ── */}
        <BackedBy />
      </div>
    </section>
  );
}
