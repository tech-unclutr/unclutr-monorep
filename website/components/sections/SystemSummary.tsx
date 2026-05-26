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

        {/* 3-step grid. Tinted border-gray grid bg + white cards + 2px gap = subtle dividers. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2px] max-w-[900px] mx-auto bg-[#e8e0d8] rounded-[20px] overflow-hidden mb-12">
          <Step
            num="Step 01"
            title="Recruit"
            body="We find and qualify the right customers from your base. No panel providers, no cold outreach, no scheduling back-and-forth."
          />
          <Step
            num="Step 02"
            title="Conduct"
            body="AI voice agents run in-depth AI customer interviews daily. Consistent, unbiased, and verbatim, every single time."
          />
          <Step
            num="Step 03"
            title="Deliver"
            body="Decision-ready insights from your customer intelligence platform, routed to the right team, not buried in a PDF."
          />
        </div>

        {/* CTA — routes to the dedicated /pilot landing page (the existing
            "book a pilot" flow). Matches the original FeaturesMarquee CTA
            convention that this SystemSummary replaced. */}
        <a
          href="/pilot"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#e8e0d8] text-[#0b132b] text-[14px] font-semibold transition-colors duration-200 hover:border-[#FF5A36] hover:text-[#FF5A36]"
        >
          See how it works
          <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}

/* ── Step card ───────────────────────────────────────────────────────── */
function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="bg-white p-8 sm:p-9 text-left">
      <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#FF5A36] mb-3">
        {num}
      </div>
      <div className="text-[20px] font-extrabold text-[#0b132b] mb-2.5">
        {title}
      </div>
      <p className="text-[14px] text-[#757575] leading-[1.65]">{body}</p>
    </div>
  );
}
