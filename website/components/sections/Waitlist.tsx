"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence, useInView, useScroll, useTransform, useSpring } from "framer-motion";
import { Lock, Handshake, Lightning, Sparkle } from "@phosphor-icons/react";
import { useSectionVisibility, trackEvent, EventName } from "@/lib/analytics";

/**
 * Waitlist (F4.5) — net-new section inserted between Always-On fold (F4)
 * and Problems (F5) per integration spec §3 Scenario A.
 *
 * Dark cinematic section. Captures founder-tier intent at the moment of
 * peak attention before the page launches into the long pain → product →
 * trust convince. CTA opens a Google Form in a new tab (no inline form
 * — that's the entire conversion mechanic per spec §13).
 *
 * Styles live in app/globals.css under the .wl-section scope. Five
 * animations (breathe / float / wave / dot / cta) wired through CSS only.
 * All five stop under prefers-reduced-motion. See spec §7 + §9.
 *
 * Phosphor duotone icons replace the spec's emoji placeholders per
 * Param's standing instruction ("I do not want emojis").
 */

const FORM_URL = "https://forms.gle/jEB7GML5HnakvWNk8";

/* ── Customer insights — END-CONSUMER verbatims.
 *  These are what SquareUp's AI agents capture when they call the
 *  CUSTOMER of a brand (e.g. a BigBasket shopper, a Titan Skinn user)
 *  — NOT marketing testimonials from SquareUp's own clients. Reads
 *  like a real person talking about a product they bought.
 *  8 entries total, 6 positive + 2 candid negatives, 6-8 words each.
 *  Industries spread across US-relevant consumer categories: BPC,
 *  CPG, FMCG, DTC, Fintech, Retail.
 * ─────────────────────────────────────────────────────────────────── */
type Insight = { quote: string; industry: string; tone: "pos" | "neg" };
const INSIGHTS: Insight[] = [
  { quote: "This protein bar saved my mornings — repurchasing.",      industry: "CPG",     tone: "pos" },
  { quote: "Switched to your serum, breakouts finally cleared.",      industry: "BPC",     tone: "pos" },
  { quote: "App froze mid-transfer with my rent money.",              industry: "Fintech", tone: "neg" },
  { quote: "Travel-size pack is perfect for my carry-on.",            industry: "FMCG",    tone: "pos" },
  { quote: "Delivery was four days late, no updates given.",          industry: "DTC",     tone: "neg" },
  { quote: "Your packaging looks premium without feeling wasteful.",  industry: "CPG",     tone: "pos" },
  { quote: "Finally a foundation that doesn't oxidize by noon.",      industry: "BPC",     tone: "pos" },
  { quote: "Tried three brands of cleanser, yours stuck.",            industry: "BPC",     tone: "pos" },
];

/* ── 20 particles — exact positions/sizes/durations from spec §4.1 ── */
type Particle = {
  left: string;
  top: string;
  size: number;
  color: string;
  duration: number; // seconds
  delay: number;
  drift: string;
};

const PARTICLES: Particle[] = [
  { left: "8%",  top: "80%", size: 2,   color: "rgba(232,80,26,.6)",  duration: 14, delay: 0,    drift: "20px" },
  { left: "15%", top: "90%", size: 1.5, color: "rgba(255,255,255,.5)", duration: 18, delay: 2,    drift: "-15px" },
  { left: "22%", top: "85%", size: 2.5, color: "rgba(232,80,26,.4)",  duration: 16, delay: 4,    drift: "25px" },
  { left: "28%", top: "95%", size: 1.5, color: "rgba(255,255,255,.4)", duration: 20, delay: 1,    drift: "-20px" },
  { left: "34%", top: "88%", size: 2,   color: "rgba(255,122,74,.5)",  duration: 15, delay: 6,    drift: "18px" },
  { left: "42%", top: "92%", size: 2.5, color: "rgba(232,80,26,.5)",  duration: 17, delay: 3,    drift: "-25px" },
  { left: "48%", top: "78%", size: 1.5, color: "rgba(255,255,255,.45)", duration: 19, delay: 8,    drift: "30px" },
  { left: "54%", top: "96%", size: 3,   color: "rgba(232,80,26,.4)",  duration: 13, delay: 5,    drift: "-18px" },
  { left: "62%", top: "84%", size: 2,   color: "rgba(255,122,74,.55)", duration: 16, delay: 0.5,  drift: "22px" },
  { left: "68%", top: "90%", size: 1.5, color: "rgba(255,255,255,.5)",  duration: 21, delay: 7,    drift: "-22px" },
  { left: "74%", top: "82%", size: 2.5, color: "rgba(232,80,26,.45)", duration: 14, delay: 2.5,  drift: "16px" },
  { left: "81%", top: "94%", size: 2,   color: "rgba(255,255,255,.4)",  duration: 18, delay: 4.5,  drift: "-28px" },
  { left: "88%", top: "86%", size: 1.5, color: "rgba(232,80,26,.5)",  duration: 17, delay: 9,    drift: "24px" },
  { left: "5%",  top: "60%", size: 2,   color: "rgba(255,122,74,.4)",  duration: 22, delay: 3.5,  drift: "-16px" },
  { left: "92%", top: "70%", size: 2.5, color: "rgba(232,80,26,.35)", duration: 19, delay: 6.5,  drift: "20px" },
  { left: "18%", top: "50%", size: 1.5, color: "rgba(255,255,255,.4)",  duration: 24, delay: 10,   drift: "-30px" },
  { left: "76%", top: "55%", size: 2,   color: "rgba(255,122,74,.45)", duration: 20, delay: 11,   drift: "18px" },
  { left: "38%", top: "65%", size: 2.5, color: "rgba(232,80,26,.4)",  duration: 23, delay: 8.5,  drift: "-24px" },
  { left: "58%", top: "45%", size: 1.5, color: "rgba(255,255,255,.35)", duration: 25, delay: 12,   drift: "26px" },
  { left: "25%", top: "40%", size: 2,   color: "rgba(232,80,26,.4)",  duration: 26, delay: 13,   drift: "-18px" },
];

/* ── Waveform bars — heights crafted to read as a coherent audio waveform
 * rather than random noise. 60 bars (was 50) for a denser, more cinematic
 * sweep. The stagger (0.05s per bar in CSS) makes adjacent bars wave
 * together, producing a traveling sine-wave illusion across the row.
 * ──────────────────────────────────────────────────────────────────── */
const WAVE_HEIGHTS = [
  16, 22, 14, 28, 20, 34, 18, 26, 40, 24,
  30, 18, 36, 26, 20, 32, 42, 30, 18, 34,
  24, 30, 40, 22, 28, 38, 26, 32, 20, 30,
  18, 26, 36, 22, 42, 30, 24, 36, 32, 20,
  28, 36, 18, 26, 34, 22, 30, 14, 24, 18,
  // extension to 60 — gentle taper for the right edge
  20, 28, 24, 32, 26, 22, 18, 16, 14, 12,
];

/* ── InsightOrbit ─────────────────────────────────────────────────────
 * 4 text-only "live capture" slots — TWO on each side of the wave:
 *
 *      [UL]                         [UR]
 *               ────── WAVE ──────
 *      [LL]                         [LR]
 *
 * Each cycle (every 6.5s) shows 4 new end-consumer verbatims drawn
 * from the INSIGHTS pool. Within a cycle the 4 slots cascade in/out
 * one after another (staggered by ~120ms) so insights APPEAR after
 * each other — a wave of capture, not a sync flash. No overlap:
 * each slot has its own AnimatePresence with mode="wait" so the OLD
 * insight at that position fully exits before the NEW one enters.
 *
 * Cycling: step by 4 each tick so cycle 0 shows insights[0..3],
 * cycle 1 shows insights[4..7], cycle 2 wraps and shows [0..3] again
 * (with offset). 8 insights ÷ 4 slots = 2 cycles to surface all.
 *
 * Master scroll fade is applied by the parent on the wrapper div.
 * ──────────────────────────────────────────────────────────────────── */
const SLOT_POSITIONS = ["ul", "ur", "ll", "lr"] as const;
// Cascade order — top-left first, then top-right, then bottom-left,
// then bottom-right (reading order). Same delays for exit so it
// cascades out before cascading back in.
const SLOT_DELAYS = [0, 0.12, 0.24, 0.36];

function InsightOrbit() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3, once: false });
  const [cycle, setCycle] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!inView || reduced) return;
    // 6.5s gives: 0.36s max cascade-in + 0.55s transition + ~4.7s read +
    // 0.36s cascade-out window. Feels paced, not rushed.
    const id = window.setInterval(() => setCycle((c) => c + 1), 6500);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  const n = INSIGHTS.length;
  const startIdx = (cycle * 4) % n;
  const insights: Insight[] = [
    INSIGHTS[startIdx % n],
    INSIGHTS[(startIdx + 1) % n],
    INSIGHTS[(startIdx + 2) % n],
    INSIGHTS[(startIdx + 3) % n],
  ];

  return (
    <div ref={ref} className="contents" aria-hidden>
      {SLOT_POSITIONS.map((pos, i) => (
        <div key={pos} className={`wl-float wl-float-${pos}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${cycle}-${pos}`}
              initial={{ opacity: 0, filter: "blur(10px)", y: 8 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(8px)", y: -6 }}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
                // delay applies to BOTH enter and exit, producing the
                // cascade: UL leaves first → UR → LL → LR; new content
                // arrives in the same order.
                delay: SLOT_DELAYS[i],
              }}
              style={{ willChange: "transform, opacity, filter" }}
            >
              <InsightContent insight={insights[i]} />
            </motion.div>
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ── InsightContent ───────────────────────────────────────────────────
 * The actual typography inside each slot. Pure presentational.
 * ──────────────────────────────────────────────────────────────────── */
function InsightContent({ insight }: { insight: Insight }) {
  return (
    <>
      <div className="wl-float-label">
        <span className={`wl-float-dot ${insight.tone}`} />
        <span>Live capture</span>
      </div>
      <p className="wl-float-quote">&ldquo;{insight.quote}&rdquo;</p>
      <p className="wl-float-industry">
        <span className="wl-float-industry-accent">·</span> {insight.industry}
      </p>
    </>
  );
}

export default function Waitlist() {
  const sectionRef = useRef<HTMLDivElement>(null);
  useSectionVisibility("waitlist", sectionRef);

  // Master scroll-driven fade for the floating insight system.
  // Tracks the section's scroll progress through the viewport.
  // Mapping:
  //   0.00–0.15  insights hidden (user just saw the section, give them
  //              time to take in the waveform first)
  //   0.15–0.30  insights fade IN smoothly
  //   0.30–0.78  insights at full opacity, cycling
  //   0.78–0.95  insights fade OUT as user scrolls toward exit
  //   0.95–1.00  fully collapsed before next section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const rawOpacity = useTransform(
    scrollYProgress,
    [0.0, 0.15, 0.30, 0.78, 0.95, 1.0],
    [0,   0,    1,    1,    0,    0]
  );
  // Spring-smooth the opacity so scroll-driven changes feel buttery, not
  // 1:1 jittery with raw scroll input.
  const insightsOpacity = useSpring(rawOpacity, { stiffness: 90, damping: 26 });
  const rawY = useTransform(
    scrollYProgress,
    [0.0, 0.15, 0.30, 0.78, 0.95, 1.0],
    [16,  10,   0,    0,    -10,  -16]
  );
  const insightsY = useSpring(rawY, { stiffness: 90, damping: 26 });

  return (
    <section
      ref={sectionRef}
      id="waitlist"
      data-section-name="waitlist"
      className="wl-section"
      aria-labelledby="wl-title"
    >
      {/* Atmospheric layers (decorative) */}
      <div className="wl-bg" aria-hidden />
      <div className="wl-grain" aria-hidden />

      {/* 20 floating particles (decorative) */}
      <div className="wl-particles" aria-hidden>
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="wl-particle"
            style={
              {
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: p.color,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                ["--drift" as string]: p.drift,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Content */}
      <div className="wl-content">
        <div className="wl-eyebrow">
          <span className="wl-eyebrow-dot" aria-hidden />
          Founding Cohort · Now Applying
        </div>

        <h2 id="wl-title" className="wl-title">
          Join the <span className="wl-title-em">Waitlist.</span>
        </h2>
      </div>

      {/* ── Audio waveform + orbital customer insights ────────────────
          PULLED OUT of .wl-content (which is 760px max) so the zone can
          claim the section's full width (capped at 1180px). Wave stays
          centered at 540px; the LEFT + RIGHT insight slots now have
          ~290px of gutter on each side — well clear of the wave's flank.

          Insight orbit is wrapped in a motion.div carrying the
          scroll-driven master opacity + y values: hidden initially,
          fades in after slight scroll, collapses when scrolled past.
          ──────────────────────────────────────────────────────────── */}
      <motion.div
        className="wl-waveform-zone"
        style={{ opacity: insightsOpacity, y: insightsY }}
      >
        {/* Synced insight orbit — left + right slots fade together */}
        <InsightOrbit />

        {/* The waveform itself — centered inside the zone */}
        <div className="wl-waveform" aria-hidden>
          <div className="wl-waveform-glow" />
          <div className="wl-waveform-stack">
            <div className="wl-waveform-bars">
              {WAVE_HEIGHTS.map((h, i) => (
                <div
                  key={`bar-${i}`}
                  className="wl-wave-bar"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${(i * 0.05).toFixed(2)}s`,
                  }}
                />
              ))}
            </div>
            <div className="wl-waveform-bars wl-waveform-mirror">
              {WAVE_HEIGHTS.map((h, i) => (
                <div
                  key={`mirror-${i}`}
                  className="wl-wave-bar"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${(i * 0.05).toFixed(2)}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Second wl-content block for everything below the waveform —
          keeps text centered + bounded at 760px again. */}
      <div className="wl-content">
        <p className="wl-sub">
          We work hands-on with a small cohort each quarter. Founding members{" "}
          <em>lock in launch pricing</em>, get a{" "}
          <em>direct line to the team</em>, and see{" "}
          <em>every new agent before it ships</em>. We read every application.
        </p>

        {/* Benefit chips — Phosphor duotone icons replace spec's emoji placeholders */}
        <div className="wl-chips">
          <div className="wl-chip">
            <span className="wl-chip-icon" aria-hidden>
              <Lock weight="duotone" size={14} color="#ff7a4a" />
            </span>
            Founding pricing locked
          </div>
          <div className="wl-chip">
            <span className="wl-chip-icon" aria-hidden>
              <Handshake weight="duotone" size={14} color="#ff7a4a" />
            </span>
            Direct founder access
          </div>
          <div className="wl-chip">
            <span className="wl-chip-icon" aria-hidden>
              <Lightning weight="duotone" size={14} color="#ff7a4a" />
            </span>
            Priority queue
          </div>
          <div className="wl-chip">
            <span className="wl-chip-icon" aria-hidden>
              <Sparkle weight="duotone" size={14} color="#ff7a4a" />
            </span>
            First to new agents
          </div>
        </div>

        {/* CTA card — opens Google Form in new tab */}
        <div className="wl-card">
          <div className="wl-card-header">
            <div className="wl-card-title">Apply for the next intake</div>
            <div className="wl-card-meta">Q1 · 2026</div>
          </div>
          <p className="wl-card-context">
            Tell us about your brand. We read every application and reply within
            48 hours.
          </p>
          <a
            className="wl-submit"
            href={FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent(EventName.CTA_CLICK, {
                cta_text: "Join the Waitlist",
                cta_href: FORM_URL,
                source_section: "waitlist",
                cta_position: "card",
              })
            }
          >
            Join the Waitlist <span aria-hidden>→</span>
          </a>
          <p className="wl-fineprint">
            Opens our application form · 2 minutes
          </p>
        </div>

        {/* Trust footer */}
        <div className="wl-foot">
          <div className="wl-foot-status">Q1 2026 cohort · Now filling</div>
          <div className="wl-foot-logos">
            <span>Trusted by founders at</span>
            <strong>BigBasket</strong>
            <span aria-hidden className="wl-foot-divider" />
            <strong>Titan Skinn</strong>
            <span aria-hidden className="wl-foot-divider" />
            <span>+ four more</span>
          </div>
        </div>
      </div>
    </section>
  );
}
