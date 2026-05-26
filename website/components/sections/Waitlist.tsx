"use client";

import { useRef } from "react";
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

export default function Waitlist() {
  const sectionRef = useRef<HTMLDivElement>(null);
  useSectionVisibility("waitlist", sectionRef);

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

        {/* ── Audio waveform — multi-layer, brand connection to voice AI ─
            Layer 1 (.wl-waveform-glow) — soft radial bloom behind the bars
            Layer 2 (.wl-waveform-bars)  — main animated bars with peak glow
            Layer 3 (.wl-waveform-mirror) — reflected bars at 25% opacity,
                                            faded with mask — "audio software"
                                            console look
            Layer 4 (.wl-waveform-scan)   — vertical light bar that sweeps
                                            horizontally, mix-blend-mode screen
                                            highlights bars it passes through
            All layers animate independently. Scan + glow + breath combine to
            make the waveform feel like a live signal, not a CSS loop.
            ──────────────────────────────────────────────────────────────── */}
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
          <div className="wl-waveform-scan" />
        </div>

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
