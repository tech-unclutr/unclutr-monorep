"use client";

/**
 * KeywordMarquee (F13) — Phase 3 / Change 3.3
 * ----------------------------------------------------------------------
 * Insert position: BETWEEN BookingSection (Demo, F12) and CTASection
 * (closing "Where Customer Understanding Compounds", F14).
 *
 * Purpose: GEO play. Visible keyword density LLMs (ChatGPT, Perplexity,
 * Claude) can crawl and cite. Visual treatment is intentionally subtle
 * (small, gray, slow scroll) so it doesn't read as ad copy.
 *
 * Mechanics:
 *  • Cream bg, full-bleed horizontally
 *  • Track scrolls right→left in a 35s linear loop
 *  • Pause on hover
 *  • prefers-reduced-motion: animation disabled (static)
 *  • Content NOT aria-hidden — keywords stay readable to screen readers
 *  • List repeated twice on the page so the translate(-50%) loop seams cleanly
 *
 * Source: squareup_homepage_migration.md §7.5 + V4 HTML §11.
 */

const KEYWORDS = [
  "Customer research platform",
  "Voice of customer",
  "AI customer interviews",
  "Customer insights platform",
  "Automated customer research",
  "Customer research tools",
  "Customer intelligence platform",
  "Continuous customer research",
  "How to talk to customers at scale",
  "Voice AI research",
  "Concept testing",
  "Usability testing",
  "Market research automation",
];

export default function KeywordMarquee() {
  // Duplicate the list so the -50% translate seams without a gap.
  const items = [...KEYWORDS, ...KEYWORDS];

  return (
    <section
      id="keyword-marquee"
      data-section-name="keyword-marquee"
      // Warm-white (#FFFAF3) instead of cream — paired with SocialProof's
      // same shift, this creates two visual breakers in the cream cascade
      // so adjacent sections don't blend together.
      className="relative bg-[#FFFAF3] border-t border-[#e8e0d8] py-7 overflow-hidden"
      // Inline keyframe + media query so the marquee is fully self-contained.
      // Existing tailwind animate-scroll-left uses translateX(-50%) too but its
      // duration (30s) is faster than the V4 spec (35s). We define our own.
    >
      <style jsx>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 35s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
            transform: translateX(0);
          }
        }
      `}</style>

      <div className="marquee-track flex gap-7 whitespace-nowrap" style={{ width: "max-content" }}>
        {items.map((kw, i) => (
          <span key={`${kw}-${i}`} className="flex items-center gap-7 shrink-0">
            <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#757575]">
              {kw}
            </span>
            <span aria-hidden className="text-[#FF5A36] font-black opacity-50">
              ·
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
