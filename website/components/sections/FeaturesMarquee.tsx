"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useSectionVisibility, trackEvent, EventName } from "@/lib/analytics";

// SEO-optimized keywords across research, AI, and business categories
const seoKeywords = {
  row1: [
    "User interviews",
    "Customer intelligence",
    "AI moderator",
    "Market research",
    "Usability testing",
    "Automated insights",
    "Consumer research",
    "Card sorting",
    "Voice AI",
  ],
  row2: [
    "Product decisions",
    "AI transcripts",
    "Concept testing",
    "Brand research",
    "Smart recruiting",
    "User insights",
    "Competitive analysis",
    "Tree testing",
    "Auto-synthesis",
  ],
  row3: [
    "Pricing research",
    "Conversation intelligence",
    "Surveys",
    "NPS analysis",
    "Prototype testing",
    "Autonomous research",
    "Churn analysis",
    "Focus groups",
    "AI-powered analysis",
  ],
};

// Ambient keyword row - subliminal SEO texture
function AmbientKeywordRow({
  keywords,
  speed = 90,
  reverse = false,
  yOffset = 0,
}: {
  keywords: string[];
  speed?: number;
  reverse?: boolean;
  yOffset?: number;
}) {
  // Triple the keywords for seamless loop
  const tripled = [...keywords, ...keywords, ...keywords];

  return (
    <div
      className="absolute left-0 right-0 flex overflow-hidden pointer-events-none select-none"
      style={{
        top: `${yOffset}%`,
        opacity: 0.09,
        filter: "blur(0.4px)",
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      <div
        className={`flex gap-10 shrink-0 ${reverse ? "animate-scroll-right" : "animate-scroll-left"
          }`}
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {tripled.map((keyword, i) => (
          <span
            key={`${keyword}-${i}`}
            className="text-[13px] font-medium text-[#0b132b] whitespace-nowrap tracking-[0.02em]"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FeaturesMarquee() {
  const sectionRef = useRef<HTMLDivElement>(null);
  useSectionVisibility("cta_text", sectionRef);

  // Mouse tracking for magnetic glow
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  // Scroll-driven animations
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

  // Headline animations
  const headlineY = useTransform(scrollYProgress, [0, 0.6], [80, 0]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const headlineSpringY = useSpring(headlineY, { stiffness: 100, damping: 30 });

  // Subhead animations (delayed)
  const subheadY = useTransform(scrollYProgress, [0.15, 0.65], [50, 0]);
  const subheadOpacity = useTransform(scrollYProgress, [0.15, 0.55], [0, 1]);
  const subheadSpringY = useSpring(subheadY, { stiffness: 100, damping: 30 });

  // CTA animations (more delayed)
  const ctaY = useTransform(scrollYProgress, [0.25, 0.7], [30, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.25, 0.6], [0, 1]);
  const ctaScale = useTransform(scrollYProgress, [0.25, 0.7], [0.95, 1]);
  const ctaSpringY = useSpring(ctaY, { stiffness: 100, damping: 30 });

  return (
    <section
      ref={sectionRef}
      data-section-name="cta-text"
      className="relative py-24 sm:py-32 lg:py-40 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FBF4EC 0%, #FFFFFF 25%, #FFFFFF 65%, #FBF4EC 100%)",
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Subtle grain texture for premium depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient SEO keyword texture - 2 rows at top */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <AmbientKeywordRow
          keywords={seoKeywords.row1}
          speed={90}
          yOffset={4}
        />
        <AmbientKeywordRow
          keywords={seoKeywords.row2}
          speed={110}
          reverse
          yOffset={8}
        />
      </div>

      {/* Magnetic glow that follows cursor */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100
            }%, rgba(255,90,54,0.06), transparent 40%)`,
          transition: "background 0.15s ease-out",
        }}
      />


      {/* Main content */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-6 sm:px-8 lg:px-10 text-center flex flex-col items-center">
        <motion.h2
          style={{ y: headlineSpringY, opacity: headlineOpacity }}
          className="font-display text-[clamp(24px,6vw,76px)] leading-[1.05] tracking-[-0.04em] text-[#0b132b] max-w-4xl mx-auto"
        >
          SquareUp makes customer
          <br className="hidden sm:block" />
          understanding <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A36] to-[#FF8A66]">a system.</span>
        </motion.h2>

        {/* Subhead */}
        <motion.p
          style={{
            y: subheadSpringY,
            opacity: subheadOpacity,
            color: "rgba(11,19,43,0.65)",
          }}
          className="mt-8 text-[clamp(16px,1.8vw,21px)] leading-[1.65] tracking-[-0.015em] font-medium max-w-2xl mx-auto"
        >
          Recruit participants effortlessly. Conduct research autonomously.
          <br className="hidden sm:block" />
          <span className="text-[#0b132b] font-semibold relative inline-block group mt-1">
            Deliver insights that drive decisions - at lightning speed.
            <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF5A36]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </span>
        </motion.p>

        {/* CTA */}
        <motion.div
          style={{ y: ctaSpringY, opacity: ctaOpacity, scale: ctaScale }}
          className="mt-12 relative group inline-block"
        >
          {/* Ambient Glow Behind Button */}
          <div className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-[#FF5A36] via-[#FF8A66] to-[#FF5A36] opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-700 animate-pulse pointer-events-none" />

          <a
            href="/pilot"
            onClick={() => trackEvent(EventName.CTA_CLICK, { cta_text: "See it in action", cta_href: "/pilot", source_section: "cta_text", cta_position: "main" })}
            className="group relative flex items-center gap-3 px-8 py-4 text-[16px] font-semibold rounded-full overflow-hidden transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(180deg, #1a243a 0%, #0b132b 100%)",
              color: "#fff",
              boxShadow: "0 12px 32px -8px rgba(11,19,43,0.5), inset 0 1px 1.5px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.5)"
            }}
          >
            {/* Ambient inner glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "radial-gradient(120px circle at center, rgba(255,90,54,0.25) 0%, transparent 100%)" }} />

            <span className="relative z-10 tracking-wide text-white/95 group-hover:text-white transition-colors">See it in <span className="text-[#FF5A36]">action</span></span>
            <div className="relative z-10 w-7 h-7 rounded-full bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/20 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <ArrowRight className="w-3.5 h-3.5 text-white/90" />
            </div>
          </a>
        </motion.div>

        {/* Coral accent line - integrated into the magic */}
        <motion.div
          style={{ opacity: ctaOpacity }}
          className="mx-auto mt-16 w-16 h-[1.5px] rounded-full relative overflow-hidden"
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,90,54,0.6), transparent)",
            }}
          />
          {/* Shimmering highlight on the line */}
          <motion.div
            className="absolute top-0 bottom-0 left-0 w-4 bg-white/60 blur-[1px]"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }}
          />
        </motion.div>
      </div>
    </section>
  );
}
