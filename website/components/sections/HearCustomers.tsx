"use client";

/**
 * HearCustomers (V4 Hero Block — F3)
 * ----------------------------------------------------------------------
 * Insert position: AFTER HeroSection (live dark hero + sub-hero with the
 * particle ball), BEFORE ProblemSectionSticky (the 4 fundamental flaws).
 *
 * Purpose: a typographic bridge from the dark particle hero stack to the
 * cream cascade below. Intentionally restrained — no canvas, no animation,
 * no CTA. The italic Playfair emphasis on "actually" carries the entire
 * emotional lift of the headline.
 *
 * Source of truth: squareup_homepage_migration.md §5.3 + squareup_homepage_v4.html
 * Phase 1 / Change 1.1.
 */
export default function HearCustomers() {
  return (
    <section
      id="hear-customers"
      data-section-name="hear-customers"
      // Match the live site's cream backdrop (same as <main> wrapper)
      className="relative bg-[#FBF4EC] px-6 sm:px-10 lg:px-14 py-24 sm:py-28 lg:py-32"
    >
      <div className="max-w-[820px] mx-auto text-center">
        <h2
          // Display font (Space Grotesk) to match other section H2s.
          // Size + weight aligned with the doc's V4 hero block spec.
          className="font-display font-black text-[#0b132b] leading-[1.06] tracking-[-0.025em] text-[clamp(36px,5vw,64px)]"
        >
          Hear what your customers are{" "}
          <span
            // The single typographic flourish: Playfair Display italic, weight 600,
            // orange-light color (matched to the live site's orange-light gradient stop).
            // Do not extend this span style anywhere else on the page.
            style={{ fontFamily: "var(--font-serif-italic), serif" }}
            className="italic font-semibold text-[#FF8A66] tracking-[-0.005em]"
          >
            actually
          </span>{" "}
          saying.
        </h2>

        <p
          // Subline: body font (Inter), centered, max-width ~620px.
          // Color uses the same muted-dark tone the live site uses for body text on cream.
          className="mt-6 text-[17px] sm:text-[18px] leading-[1.7] text-[rgba(11,19,43,0.65)] max-w-[620px] mx-auto"
        >
          AI voice agents talk to your real customers. Priorities your team can
          act on. Continuous customer research, every word captured, every
          insight audit-ready.
        </p>
      </div>
    </section>
  );
}
