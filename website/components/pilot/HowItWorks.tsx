"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import PilotCTAButton from "@/components/pilot/PilotCTAButton";
import { useSectionVisibility, useCarouselTracking, trackEvent, EventName } from "@/lib/analytics";

const SAMPLE_RECORDING_URL = "/titan-sample-recording.mp3";

const STEPS = [
  {
    num: "01",
    title: "Define",
    body: "You share the question you need answered and your customer list. We lock the interview guide within hours.",
  },
  {
    num: "02",
    title: "Interview",
    body: "We reach out directly and run deep 1:1 conversations in natural Hindi, English, or Hinglish.",
  },
  {
    num: "03",
    title: "Deliver",
    body: "In 48 hours you receive a decision-ready brief with evidence you can audit and forward to your team.",
  },
];

/* ─── Audio Player ─── */
function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration);
    const onTime = () => {
      setCurrentTime(audio.duration ? audio.currentTime : 0);
      setProgress(
        audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
      );
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      trackEvent(EventName.VIDEO_PAUSE, { video_name: "pilot_sample_interview", pause_reason: "user" } as Record<string, string>);
    } else {
      audio.play();
      trackEvent(EventName.VIDEO_START, { video_name: "pilot_sample_interview" } as Record<string, string>);
    }
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-lime/[0.12]"
      style={{ background: "linear-gradient(135deg, rgba(255,138,76,0.04) 0%, rgba(255,138,76,0.01) 100%)" }}>
      <audio ref={audioRef} preload="metadata" src={SAMPLE_RECORDING_URL} />

      <div className="px-5 pt-4 pb-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-lime/70 mb-0.5">
          Listen to a real interview
        </p>
        <p className="text-[13px] text-maze-gray">
          From a recent MOM test pilot study for a perfume brand
        </p>
      </div>

      <div className="px-5 pb-5 pt-3 flex items-center gap-4">
        <button
          onClick={toggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            playing
              ? "bg-maze-black text-white"
              : "bg-lime text-white hover:scale-[1.05] active:scale-95"
          }`}
          style={{
            boxShadow: playing
              ? "0 4px 16px rgba(0,0,0,0.12)"
              : "0 6px 28px rgba(255,138,76,0.25)",
          }}
        >
          {playing ? (
            <Pause size={16} className="fill-current" />
          ) : (
            <Play size={16} className="fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div
            className="w-full h-[3px] rounded-full bg-lime/10 cursor-pointer group relative mb-2"
            onClick={seek}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-lime transition-[width] duration-75"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-lime border-2 border-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 5px)` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-maze-gray/50">
              Sample pilot interview
            </span>
            <span className="text-[11px] text-maze-gray/40 tabular-nums">
              {fmt(currentTime)}{" "}
              <span className="text-maze-gray/20">/</span>{" "}
              {duration ? fmt(duration) : "--:--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Content Variants ─── */
const contentMotion = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

function DefinePanel() {
  return (
    <motion.div {...contentMotion} className="space-y-5">
      <p className="text-[15px] sm:text-base text-maze-gray leading-relaxed">
        {STEPS[0].body}
      </p>
      <div
        className="rounded-2xl p-5 sm:p-6 border-l-[3px] border-l-lime"
        style={{
          background: "linear-gradient(135deg, rgba(255,138,76,0.03) 0%, transparent 60%)",
          border: "1px solid rgba(0,0,0,0.04)",
          borderLeft: "3px solid var(--lime)",
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-maze-gray/40 mb-2">
          Sample question
        </p>
        <p className="font-display text-base sm:text-lg text-maze-black leading-snug">
          &ldquo;Why do 60% of first-time buyers never come back for a second
          order?&rdquo;
        </p>
      </div>
    </motion.div>
  );
}

function InterviewPanel() {
  return (
    <motion.div {...contentMotion} className="space-y-5">
      <p className="text-[15px] sm:text-base text-maze-gray leading-relaxed">
        {STEPS[1].body}
      </p>
      {/* Chat transcript mockup */}
      <div className="rounded-2xl p-5 sm:p-6" style={{ background: "linear-gradient(135deg, rgba(255,138,76,0.03) 0%, transparent 60%)", border: "1px solid rgba(0,0,0,0.04)" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-maze-gray/40 mb-3">
          Live conversation
        </p>
        <div className="space-y-2.5">
          {/* AI bubble */}
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl rounded-tl-sm px-3.5 py-2 bg-lime/10 border border-lime/20">
              <p className="text-[13px] text-maze-black leading-relaxed">&ldquo;What made you try us the first time?&rdquo;</p>
            </div>
          </div>
          {/* Customer bubble */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-xl rounded-tr-sm px-3.5 py-2 bg-maze-black/[0.03] border border-maze-black/[0.06]">
              <p className="text-[13px] text-maze-gray leading-relaxed">&ldquo;A friend recommended it, but delivery took too long&rdquo;</p>
            </div>
          </div>
          {/* AI bubble */}
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl rounded-tl-sm px-3.5 py-2 bg-lime/10 border border-lime/20">
              <p className="text-[13px] text-maze-black leading-relaxed">&ldquo;Got it — was that the main reason you didn&rsquo;t reorder?&rdquo;</p>
            </div>
          </div>
          {/* Typing indicator */}
          <div className="flex justify-end">
            <div className="rounded-xl rounded-tr-sm px-3.5 py-2.5 bg-maze-black/[0.03] border border-maze-black/[0.06] flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-maze-gray/30"
                  style={{
                    animation: `waveform-bar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DeliverPanel({ onShowBrief }: { onShowBrief: () => void }) {
  return (
    <motion.div {...contentMotion} className="space-y-5">
      <p className="text-[15px] sm:text-base text-maze-gray leading-relaxed">
        {STEPS[2].body}
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(0,0,0,0.04)" }}
      >
        {/* Decision strip */}
        <div
          className="px-5 sm:px-6 py-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,138,76,0.06) 0%, rgba(255,138,76,0.02) 100%)",
            borderBottom: "1px solid rgba(255,138,76,0.1)",
          }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-lime/60 mb-1">
            Decision
          </p>
          <p className="font-display text-[15px] sm:text-base text-maze-black leading-snug">
            Launch ₹399 / 50ml entry SKU before full launch
          </p>
        </div>
        {/* Meta */}
        <div className="px-5 sm:px-6 py-3 flex items-center gap-6 bg-cream">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-maze-gray/40">
              Confidence
            </p>
            <p className="text-xs font-bold text-lime">High</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-maze-gray/40">
              Based on
            </p>
            <p className="text-xs font-bold text-maze-black">47 interviews</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-maze-gray/40">
              Owner
            </p>
            <p className="text-xs font-bold text-maze-black">Product Lead</p>
          </div>
        </div>
      </div>
      <button
        onClick={onShowBrief}
        className="min-h-[42px] px-6 py-2.5 text-[13px] font-display tracking-[-0.01em] text-lime border border-lime/25 rounded-full hover:bg-lime/[0.05] hover:border-lime/40 active:scale-[0.97] transition-all"
      >
        See the full executive summary →
      </button>
    </motion.div>
  );
}

/* ─── Main Section ─── */
export default function HowItWorks({
  onShowBrief,
}: {
  onShowBrief: () => void;
}) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLElement>(null);
  useSectionVisibility("pilot_how", containerRef);
  const stepNames = STEPS.map((s) => s.title);
  const { trackTransition } = useCarouselTracking("pilot_how_it_works", active, stepNames);

  const selectStep = (i: number) => {
    if (i === active) return;
    trackTransition(i, "click");
    setActive(i);
  };

  return (
    <section ref={containerRef} data-section-name="pilot_how" id="how-it-works" className="py-12 sm:py-16 lg:py-20 relative dot-grid-bg" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="max-w-[780px] mx-auto px-5 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <Reveal width="100%" delay={0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime/[0.08] border border-lime/15 mb-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-lime">
                How it works
              </span>
            </div>
          </Reveal>
          <Reveal width="100%" delay={0.06}>
            <h2 className="font-display text-[clamp(26px,5.5vw,48px)] tracking-[-0.035em] text-maze-black leading-[1.08]">
              Three steps. Two days.
              <br className="hidden sm:block" /> Total clarity.
            </h2>
          </Reveal>
        </div>

        {/* The interactive card */}
        <Reveal width="100%" delay={0.14}>
          <div
            className="rounded-[20px] sm:rounded-[28px] overflow-hidden min-h-[420px] flex flex-col"
            style={{
              background:
                "linear-gradient(165deg, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.32) 35%, rgba(255,255,255,0.26) 65%, rgba(255,255,255,0.50) 100%)",
              backdropFilter: "blur(48px) saturate(2.0)",
              WebkitBackdropFilter: "blur(48px) saturate(2.0)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow:
                "0 40px 100px -20px rgba(0,0,0,0.07), 0 10px 30px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.02)",
            }}
          >
            {/* ── Stepper ── */}
            <div className="relative">
              <div className="flex">
                {STEPS.map((step, i) => {
                  const isActive = active === i;
                  const isPast = i < active;
                  return (
                    <button
                      key={step.num}
                      onClick={() => selectStep(i)}
                      className={`flex-1 relative px-4 sm:px-6 pt-6 sm:pt-7 pb-5 sm:pb-6 text-left group transition-all duration-300 ${!isActive ? "hover:bg-lime/[0.03]" : ""}`}
                    >
                      {/* Step number */}
                      <span
                        className={`block text-[11px] font-bold tracking-[0.06em] mb-1 transition-all duration-500 ${
                          isActive
                            ? "text-lime"
                            : isPast
                            ? "text-lime/40"
                            : "text-maze-gray/20"
                        }`}
                      >
                        {step.num}
                      </span>

                      {/* Step title */}
                      <span
                        className={`block font-display text-[15px] sm:text-[17px] tracking-[-0.02em] transition-all duration-500 ${
                          isActive
                            ? "text-maze-black"
                            : isPast
                            ? "text-maze-black/40"
                            : "text-maze-gray/30"
                        }`}
                      >
                        {step.title}
                      </span>

                      {/* Active dot */}
                      {isActive && (
                        <motion.div
                          layoutId="step-dot"
                          className="absolute bottom-0 left-4 sm:left-6 w-1 h-1 rounded-full bg-lime"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Step indicator line */}
              <div className="h-[2px] bg-neutral-200/30">
                <div
                  className="h-full bg-lime transition-all duration-300"
                  style={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* ── Content ── */}
            <div className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {active === 0 && <DefinePanel key="define" />}
                {active === 1 && <InterviewPanel key="interview" />}
                {active === 2 && (
                  <DeliverPanel key="deliver" onShowBrief={onShowBrief} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>

        {/* Audio player — always visible */}
        <Reveal width="100%" delay={0.2}>
          <div className="mt-6">
            <AudioPlayer />
          </div>
        </Reveal>

        {/* Micro line */}
        <Reveal width="100%" delay={0.26}>
          <p className="mt-7 text-center text-[13px] text-maze-gray/60">
            No black-box insights. Every recommendation is traceable.
          </p>
        </Reveal>

        {/* CTA */}
        <Reveal width="100%" delay={0.3}>
          <div className="mt-6 flex justify-center">
            <PilotCTAButton
              label="Book a 20-min call"
              href="https://cal.com/squareup-ai/discovery-setup-call"
              section="pilot_how"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
