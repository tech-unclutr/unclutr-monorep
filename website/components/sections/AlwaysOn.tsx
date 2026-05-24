"use client";

import { motion } from "framer-motion";

/**
 * AlwaysOn (F4)
 * ----------------------------------------------------------------------
 * Insert position: AFTER HearCustomers (V4 hero block, F3), BEFORE
 * ProblemSectionSticky (the 4 fundamental flaws).
 *
 * Two-column layout on desktop (50/50). Left = positioning headline +
 * stats. Right = dark card with eyebrow, H3 statement, and 3 checkmark
 * pointers. The only motion in the section is the 2s pulsing green dot
 * on the eyebrow — that intentional restraint is the point.
 *
 * Source of truth: squareup_homepage_migration.md §5.4 + squareup_homepage_v4.html
 * Phase 1 / Change 1.2.
 */
export default function AlwaysOn() {
  return (
    <section
      id="alwayson"
      data-section-name="alwayson"
      className="relative bg-[#FBF4EC] px-6 sm:px-10 lg:px-14 py-20 sm:py-24 lg:py-28 overflow-hidden"
    >
      <div className="max-w-[1100px] mx-auto grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
        {/* ── LEFT COLUMN ── */}
        <div>
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#FF5A36] mb-5">
            Why always-on research changes everything
          </div>

          <h2 className="font-display font-black text-[#0b132b] leading-[1.12] tracking-[-0.025em] text-[clamp(30px,4vw,48px)] mb-5">
            Most teams run customer research once a quarter. Yours can run it{" "}
            <span className="text-[#FF5A36]">every day.</span>
          </h2>

          <p className="text-[16px] text-[rgba(11,19,43,0.65)] leading-[1.75] mb-8">
            Traditional customer research tools deliver snapshots. By the time
            the insights reach you, the market has moved. SquareUp&apos;s customer
            intelligence platform talks to customers daily, spots patterns, and
            routes what matters.
          </p>

          <div className="flex gap-8 flex-wrap">
            <div>
              <div className="text-[36px] font-black text-[#FF5A36] leading-none">
                10-15
              </div>
              <div className="text-[12px] text-[#757575] mt-1.5 font-medium">
                min interviews, daily
              </div>
            </div>
            <div>
              <div className="text-[36px] font-black text-[#FF5A36] leading-none">
                100%
              </div>
              <div className="text-[12px] text-[#757575] mt-1.5 font-medium">
                verbatim transcripts
              </div>
            </div>
            <div>
              <div className="text-[36px] font-black text-[#FF5A36] leading-none">
                0
              </div>
              <div className="text-[12px] text-[#757575] mt-1.5 font-medium">
                leading questions
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN — DARK CARD ── */}
        <div className="relative">
          <div className="relative bg-[#0a0a0a] rounded-[24px] p-9 sm:p-10 text-white overflow-hidden">
            {/* Subtle radial glow in the top-right corner (V4 .ao-card::before) */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-[60px] -right-[60px] w-[200px] h-[200px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(232,80,26,0.2), transparent 70%)",
              }}
            />

            {/* Eyebrow with pulsing green dot (the only motion in the section) */}
            <div className="relative flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] uppercase text-[#FF5A36] mb-3.5">
              <motion.span
                aria-hidden
                className="block w-2 h-2 rounded-full bg-[#22c55e] flex-shrink-0"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              Powered by AI voice agents
            </div>

            <h3 className="relative text-[22px] font-extrabold text-white leading-[1.25] mb-3">
              Your AI research team conducts customer interviews at scale, every
              day, with zero fatigue.
            </h3>

            {/* 3 checkmark pointers */}
            <div className="relative flex flex-col gap-4 mt-6">
              <Pointer
                title="Structured conversations"
                desc="Same depth and rigor on every customer call."
              />
              <Pointer
                title="Zero interviewer bias"
                desc="No leading questions. No fatigue. No filtered interpretations."
              />
              <Pointer
                title="Voice of customer, captured"
                desc="Every word transcribed and analyzed automatically."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Pointer ─────────────────────────────────────────────────────────── */
function Pointer({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div
        aria-hidden
        className="w-[22px] h-[22px] rounded-full bg-[rgba(232,80,26,0.18)] text-[#FF8A66] flex items-center justify-center text-[11px] flex-shrink-0 font-bold mt-[1px]"
      >
        ✓
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-bold text-white mb-0.5 leading-[1.3]">
          {title}
        </div>
        <div className="text-[12px] text-white/55 leading-[1.55]">{desc}</div>
      </div>
    </div>
  );
}
