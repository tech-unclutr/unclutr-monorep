"use client";

/**
 * SystemSummary (F6)
 * ----------------------------------------------------------------------
 * Insert position: AFTER ProblemSectionSticky (the 4 fundamental flaws),
 * BEFORE SocialProof. The pain frame should hand off to the system promise
 * before any social validation.
 *
 * Design: cream background, centered, H2 with orange-gradient "a system.",
 * 2-line subline, then a 3-step grid (Recruit / Conduct / Deliver) with
 * white cards separated by 2px gutters that render as subtle border dividers
 * via the grid container's tinted background. CTA below.
 *
 * The previous live System Summary lived inside FeaturesMarquee.tsx (a
 * misnamed file). That component is unwired in page.tsx in this change.
 *
 * Source of truth: squareup_homepage_migration.md §5.6 + squareup_homepage_v4.html
 * Phase 1 / Change 1.4.
 */
export default function SystemSummary() {
  return (
    <section
      id="system"
      data-section-name="system-summary"
      className="relative bg-[#FBF4EC] px-6 sm:px-10 lg:px-14 pt-16 sm:pt-20 lg:pt-24 pb-24 sm:pb-28 lg:pb-32 text-center"
    >
      <div className="max-w-[1100px] mx-auto">
        {/* H2 — preserves the live gradient-orange "a system." treatment */}
        <h2 className="font-display font-black text-[#0b132b] leading-[1.1] tracking-[-0.025em] text-[clamp(28px,3.8vw,48px)] mb-4">
          SquareUp makes customer understanding{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A36] to-[#FF8A66]">
            a system.
          </span>
        </h2>

        {/* Subline — V4 refined copy. <br> kept per V4 source. Phase 1 / Change 1.4. */}
        <p className="text-[16px] text-[rgba(11,19,43,0.65)] leading-[1.65] mb-14 max-w-[680px] mx-auto">
          Find the right customers. Run automated customer research without you.
          <br className="hidden sm:block" />
          Route the decisions to the teams that need them.
        </p>

        {/* 3-step grid — subtle elevation per design review:
            • Each card now has a thin orange top accent bar
            • Faint watermark "01/02/03" sits behind the content
            • Hover lifts card 2px and softens the shadow
            • Grid container gains a soft drop shadow to lift from the section
            Layout (3-col on desktop, stack on mobile) preserved. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2px] max-w-[900px] mx-auto bg-[#e8e0d8] rounded-[20px] overflow-hidden mb-14 shadow-[0_20px_60px_-30px_rgba(11,19,43,0.18)]">
          <Step idx={1} title="Recruit"
            body="We find and qualify the right customers from your base. No panel providers, no cold outreach, no scheduling back-and-forth."
          />
          <Step idx={2} title="Conduct"
            body="AI voice agents run in-depth AI customer interviews daily. Consistent, unbiased, and verbatim, every single time."
          />
          <Step idx={3} title="Deliver"
            body="Decision-ready insights from your customer intelligence platform, routed to the right team, not buried in a PDF."
          />
        </div>

        {/* CTA — black + orange, hover glow halo + 2px shift.
            Matches the premium "money button" treatment from the original
            FeaturesMarquee CTA so the action reads as deliberate, not soft. */}
        <a
          href="/pilot"
          className="group relative inline-flex items-center gap-3 pl-7 pr-2 py-2 rounded-full text-white text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(180deg, #1a243a 0%, #0b132b 100%)",
            boxShadow:
              "0 12px 32px -8px rgba(11,19,43,0.5), inset 0 1px 1.5px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {/* Hover ambient orange glow halo behind the button */}
          <span
            aria-hidden
            className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-[#FF5A36] via-[#FF8A66] to-[#FF5A36] opacity-0 group-hover:opacity-25 blur-xl transition-opacity duration-500 pointer-events-none -z-10"
          />
          <span className="relative tracking-wide">
            See how it{" "}
            <span className="text-[#FF8A66] group-hover:text-[#FF5A36] transition-colors">works</span>
          </span>
          <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/10 group-hover:bg-white/20 group-hover:translate-x-1 transition-all duration-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white/90">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}

/* ── Step card ───────────────────────────────────────────────────────── */
function Step({ idx, title, body }: { idx: number; title: string; body: string }) {
  const num = `Step ${String(idx).padStart(2, "0")}`;
  return (
    <div className="group relative bg-white p-8 sm:p-10 text-left overflow-hidden transition-all duration-300 hover:bg-gradient-to-b hover:from-white hover:to-[#fffaf5]">
      {/* Top thin orange accent — gives each card its own identity without
          competing with the section header. */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background: "linear-gradient(90deg, #FF5A36 0%, #FF8A66 100%)",
          opacity: 0.7,
        }}
      />
      {/* Faint watermark numeral behind the content — gives depth without
          shouting. Subtle enough that you only register it on focus. */}
      <span
        aria-hidden
        className="absolute -top-4 right-4 text-[88px] font-display font-black leading-none select-none pointer-events-none"
        style={{ color: "rgba(255, 90, 54, 0.05)" }}
      >
        {String(idx).padStart(2, "0")}
      </span>

      <div className="relative">
        <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#FF5A36] mb-3 flex items-center gap-2">
          {/* Small dot connecting the step number visually */}
          <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-[#FF5A36]" />
          {num}
        </div>
        <div className="text-[22px] font-extrabold text-[#0b132b] mb-3 tracking-[-0.01em] transition-transform duration-300 group-hover:translate-x-0.5">
          {title}
        </div>
        <p className="text-[14px] text-[#4a4a4a] leading-[1.7]">{body}</p>
      </div>
    </div>
  );
}
