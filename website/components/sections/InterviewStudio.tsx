"use client";

import { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useSectionVisibility, useVideoTracking } from "@/lib/analytics";

/* ─────────────────────────────────────────────────────────────────────
   InterviewStudio (F8) — Phase 2 / Change 2.2
   ─────────────────────────────────────────────────────────────────────
   Replaces the live carousel with a 3-2 staggered grid per migration
   doc §6.4 + V4 spec (lines 120-124). All 5 agents visible at once.
   Card content (role / name / first-person intro / capability tags /
   LIVE badge) is preserved per doc directive.

   Removed (carousel-only machinery): activeIndex state, auto-advance
   timer, swipe / keyboard / wheel handlers, prev/next arrows, progress
   dots, agent counter, ambient orb that tracked active agent color.

   Videos: each card lazy-mounts its <video> and plays-loops once the
   card enters the viewport (IntersectionObserver via framer-motion's
   useInView). Pauses when off-screen to keep the page light.
   ───────────────────────────────────────────────────────────────────── */

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const STUDIO_TEAM = [
  {
    name: "Pulse",
    role: "Scheduler & AI Caller",
    // V4 canonical copy (doc §6.4)
    intro:
      "I book calls with your customers and connect you automatically. When you need more AI customer interviews, I run them myself.",
    attributes: ["Books high-intent calls", "Connects you directly", "Runs AI interviews"],
    video: "/agent-videos/pulse.mp4",
    poster: "/posters/pulse.webp",
    color: "#FF6B00",
  },
  {
    name: "Yoda",
    role: "Interview Copilot",
    intro:
      "I help you ask better questions during interviews. I suggest follow-ups and flag important moments so you never miss what matters.",
    attributes: ["Live question prompts", "Suggests follow-ups", "Flags key moments"],
    video: "/agent-videos/yoda.mp4",
    poster: "/posters/yoda.webp",
    color: "#6366F1",
  },
  {
    name: "Atlas",
    role: "Call Library",
    intro:
      "I store and transcribe every customer call in one place. Search anything a customer said and find it instantly.",
    attributes: ["Auto-transcribes calls", "One place for all calls", "Search any quote"],
    video: "/agent-videos/atlas.mp4",
    poster: "/posters/atlas.webp",
    color: "#10B981",
  },
  {
    name: "Sage",
    role: "Intelligence Analyst",
    // V4 canonical copy — includes "customer intelligence platform" keyword
    intro:
      "I find what you'd miss. Hidden patterns, emerging themes, the thing 50 customers said differently but meant the same. Your customer intelligence platform in action.",
    attributes: ["Spots hidden patterns", "Connects the dots", "Deep insight reports"],
    video: "/agent-videos/sage.mp4",
    poster: "/posters/sage.webp",
    color: "#FF5A36",
  },
  {
    name: "Kairo",
    role: "Team Sync",
    intro:
      "I make sure every team knows what customers are saying. Product gets product feedback. Sales gets buying signals. Everyone stays in the loop.",
    attributes: ["Routes insights by team", "Regular updates", "Keeps everyone aligned"],
    video: "/agent-videos/kairo.mp4",
    poster: "/posters/kairo.webp",
    color: "#F59E0B",
  },
] as const;

/* ── AgentCard ─────────────────────────────────────────────────────── */
function AgentCard({
  agent,
  index,
}: {
  agent: (typeof STUDIO_TEAM)[number];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(cardRef, { amount: 0.4 });

  // V4 staggered 3-2 grid (lines 123-124):
  //   row 1: cards 1-3 → cols 1/3, 3/5, 5/7
  //   row 2: cards 4-5 → cols 2/4, 4/6
  // Mobile: stack single-column.
  const colClass = [
    "sm:col-start-1 sm:col-end-3",
    "sm:col-start-3 sm:col-end-5",
    "sm:col-start-5 sm:col-end-7",
    "sm:col-start-2 sm:col-end-4",
    "sm:col-start-4 sm:col-end-6",
  ][index];

  useVideoTracking(videoRef, {
    name: agent.name,
    sourceCarousel: "interview_studio",
    cardIndex: index,
  });

  // Play when visible, pause when off-screen
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [inView]);

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.05, ease: EASE_OUT_EXPO }}
      className={`${colClass} bg-white rounded-[18px] border border-[#e8e0d8] overflow-hidden flex flex-col transition-shadow duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.07)]`}
    >
      {/* Video / poster (aspect 16:9) with LIVE badge */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50">
        <video
          ref={videoRef}
          src={agent.video}
          poster={agent.poster}
          muted
          playsInline
          loop
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay tinted with agent color */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 50%, ${agent.color}10 100%)`,
          }}
        />
        {/* LIVE badge with pulsing dot */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1a1a] text-white text-[9px] font-bold tracking-[0.08em]"
        >
          <motion.span
            aria-hidden
            className="w-[5px] h-[5px] rounded-full bg-[#22c55e] flex-shrink-0"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          LIVE
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Role pill (orange dot + role text) */}
        <div className="text-[10px] font-bold tracking-[0.1em] uppercase mb-1.5 flex items-center gap-1.5" style={{ color: agent.color }}>
          <span aria-hidden className="w-1 h-1 rounded-full" style={{ background: agent.color }} />
          {agent.role}
        </div>

        {/* Name */}
        <div className="font-display text-[20px] font-extrabold text-[#0b132b] mb-1.5">
          {agent.name}
        </div>

        {/* First-person intro */}
        <p className="text-[13px] text-[#4a4a4a] leading-[1.65] flex-1 mb-3">
          {agent.intro}
        </p>

        {/* Capability tags */}
        <div className="flex flex-wrap gap-1">
          {agent.attributes.map((attr) => (
            <span
              key={attr}
              className="text-[10px] text-[#757575] border border-[#e8e0d8] rounded-full px-2 py-0.5"
            >
              {attr}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

/* ── InterviewStudio ───────────────────────────────────────────────── */
export default function InterviewStudio() {
  const sectionRef = useRef<HTMLDivElement>(null);
  useSectionVisibility("interview_studio", sectionRef);
  const headerInView = useInView(sectionRef, { once: true, amount: 0.2 });

  return (
    <section
      ref={sectionRef}
      id="interview-studio"
      data-section-name="interview-studio"
      className="relative bg-[#FBF4EC] px-6 sm:px-10 lg:px-14 py-20 sm:py-24 lg:py-28 overflow-hidden"
    >
      {/* Subtle ambient orb backdrop — preserved as a softened static version
          of the live page's tinted atmosphere (design language continuity). */}
      <div
        aria-hidden
        className="absolute pointer-events-none rounded-full blur-[120px] opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(255,107,0,0.12), transparent 70%)",
          width: 600,
          height: 600,
          right: "-8%",
          top: "10%",
        }}
      />

      <div className="relative max-w-[1100px] mx-auto">
        {/* ── Header ── */}
        <div className="mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full border border-[#e8e0d8] bg-white/40"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#757575]">
              Intelligence Platform
            </span>
            <span className="text-[11px] text-[#FF5A36] font-bold">|</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#757575]">
              Interview Studio
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.05, ease: EASE_OUT_EXPO }}
            className="font-display font-black text-[#0b132b] tracking-[-0.025em] leading-[1.05] text-[clamp(28px,3.8vw,48px)] mb-2.5"
          >
            Interview Studio
          </motion.h2>

          {/* V4 subtitle — adds "customer research tools" keyword (doc §6.4) */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.12, ease: EASE_OUT_EXPO }}
            className="text-[17px] text-[#757575] leading-[1.55] max-w-[680px]"
          >
            The research team that never clocks out. Five AI-powered customer
            research tools working together to replace the entire research ops
            stack.
          </motion.p>
        </div>

        {/* ── 3-2 staggered grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3.5">
          {STUDIO_TEAM.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
