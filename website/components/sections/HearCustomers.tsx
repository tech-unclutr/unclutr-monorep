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
      // Pure black — same #000 as HeroSection (bg-black) for a seamless
      // continuation of the opening dark stack. Overlay layers below add
      // atmospheric texture without lightening the base color.
      className="relative bg-black px-6 sm:px-10 lg:px-14 py-24 sm:py-28 lg:py-32 overflow-hidden"
    >
      {/* Atmospheric image backdrop — Unsplash royalty-free, dark with
          subtle warm light. Heavy multiply mask keeps the base reading as
          pure black; the image only carries texture and depth. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/hear-customers-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.22,
          mixBlendMode: "screen",
        }}
      />
      {/* Vignette + warm-tinted radial glow at center — anchors the headline
          and prevents the image from competing with the type. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(255,122,74,0.06) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      {/* Hairline orange shimmer line crossing the section, matches the
          orange flourish on "actually" — visual continuity. */}
      <div
        aria-hidden
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,138,102,0.25) 30%, rgba(255,138,102,0.45) 50%, rgba(255,138,102,0.25) 70%, transparent 100%)",
          opacity: 0.5,
        }}
      />

      <div className="relative z-10 max-w-[820px] mx-auto text-center">
        <h2
          className="font-display font-black text-white leading-[1.06] tracking-[-0.025em] text-[clamp(36px,5vw,64px)]"
        >
          Hear what your customers are{" "}
          <span
            style={{ fontFamily: "var(--font-serif-italic), serif" }}
            className="italic font-semibold text-[#FF8A66] tracking-[-0.005em]"
          >
            actually
          </span>{" "}
          saying.
        </h2>

        <p
          className="mt-6 text-[17px] sm:text-[18px] leading-[1.7] text-white/65 max-w-[620px] mx-auto"
        >
          AI voice agents talk to your real customers. Priorities your team can
          act on. Continuous customer research, every word captured, every
          insight audit-ready.
        </p>
      </div>
    </section>
  );
}
