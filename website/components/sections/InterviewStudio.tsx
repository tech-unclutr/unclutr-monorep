"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useInView,
} from "framer-motion";

/* ─────────────────────────────────────────────────────────────
   EASING & PHYSICS
───────────────────────────────────────────────────────────── */
const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 0.8 };
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const AUTO_ADVANCE_INTERVAL = 5000;

/* ─────────────────────────────────────────────────────────────
   STUDIO TEAM - Your Customer Understanding Department
───────────────────────────────────────────────────────────── */
const STUDIO_TEAM = [
    {
        name: "Pulse",
        role: "Scheduler & AI Caller",
        intro: "I book calls with your customers and connect you automatically. When you need more interviews, I run them myself using AI.",
        attributes: ["Books high-intent calls", "Connects you directly", "Runs AI interviews"],
        video: "/agent-videos/pulse.mp4",
        poster: "/pulse-frames/frame-117.webp",
        color: "#FF6B00",
    },
    {
        name: "Yoda",
        role: "Interview Copilot",
        intro: "I help you ask better questions during interviews. I suggest follow-ups and flag important moments so you never miss what matters.",
        attributes: ["Live question prompts", "Suggests follow-ups", "Flags key moments"],
        video: "/agent-videos/yoda.mp4",
        poster: "/yoda-frames/frame-106.webp",
        color: "#6366F1",
    },
    {
        name: "Atlas",
        role: "Call Library",
        intro: "I store and transcribe every customer call in one place. Search anything a customer said and find it instantly.",
        attributes: ["Auto-transcribes calls", "One place for all calls", "Search any quote"],
        video: "/agent-videos/atlas.mp4",
        poster: "/atlas-frames/frame-111.webp",
        color: "#10B981",
    },
    {
        name: "Sage",
        role: "Intelligence Analyst",
        intro: "I find what you'd miss. Hidden patterns, emerging themes, the thing 50 customers said differently but meant the same. I turn noise into clarity.",
        attributes: ["Spots hidden patterns", "Connects the dots", "Deep insight reports"],
        video: "/agent-videos/sage.mp4",
        poster: "/sage2-frames/frame-106.webp",
        color: "#FF5A36",
    },
    {
        name: "Kairo",
        role: "Team Sync",
        intro: "I make sure every team knows what their customers are saying. Product gets product feedback. Sales gets buying signals. Everyone stays in the loop.",
        attributes: ["Routes insights by team", "Regular updates", "Keeps everyone aligned"],
        video: "/agent-videos/kairo.mp4",
        poster: "/kairo-frames/frame-124.webp",
        color: "#F59E0B",
    },
];

/* ─────────────────────────────────────────────────────────────
   STUDIO CARD COMPONENT
───────────────────────────────────────────────────────────── */
function StudioCard({
    agent,
    index,
    activeIndex,
    totalCards,
    isRevealed,
    cardSpacing,
    onHover,
    onLeave,
    onClick,
    onSwipe,
}: {
    agent: typeof STUDIO_TEAM[0];
    index: number;
    activeIndex: number;
    totalCards: number;
    isRevealed: boolean;
    cardSpacing: number;
    onHover: () => void;
    onLeave: () => void;
    onClick: () => void;
    onSwipe: (direction: "left" | "right") => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isActive = index === activeIndex;
    const isFuture = index > activeIndex;
    const isAdjacent = Math.abs(index - activeIndex) === 1;

    // Calculate stack position - enhanced for larger cards
    const stackOffset = index - activeIndex;
    const xOffset = stackOffset * cardSpacing;
    const yOffset = Math.abs(stackOffset) * 6;
    const scale = 1 - Math.abs(stackOffset) * 0.05;
    const zIndex = totalCards - Math.abs(stackOffset);
    const rotateY = stackOffset * -3;
    // Use brightness instead of opacity to avoid transparency stacking
    const brightness = isActive ? 1 : 1 - Math.abs(stackOffset) * 0.25;

    // Video playback control
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive && isRevealed) {
            video.currentTime = 0;
            video.playbackRate = 2;
            const timer = setTimeout(() => {
                video.play().catch(() => { });
            }, 400);
            return () => clearTimeout(timer);
        } else {
            video.pause();
            video.currentTime = 0;
        }
    }, [isActive, isRevealed]);

    const handlePanEnd = (e: any, info: any) => {
        if (!isActive) return;

        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            onSwipe("left"); // Swiped left -> Next card
        } else if (info.offset.x > swipeThreshold) {
            onSwipe("right"); // Swiped right -> Previous card
        }
    };

    return (
        <motion.div
            className="absolute cursor-pointer touch-none"
            style={{
                zIndex,
                transformOrigin: "center center",
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
            }}
            initial={{
                x: 500,
                y: 40,
                opacity: 0,
                scale: 0.7,
                rotateY: -20,
            }}
            animate={{
                x: xOffset,
                y: yOffset,
                opacity: isFuture && !isRevealed ? 0 : 1,
                scale: Math.max(0.82, scale),
                rotateY,
                filter: `brightness(${Math.max(0.5, brightness)})`,
            }}
            transition={{
                type: "spring",
                ...SPRING_CONFIG,
                delay: isRevealed ? 0 : index * 0.12,
            }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
            onPanEnd={handlePanEnd}
        >
            <motion.div
                className="relative w-[calc(100vw-32px)] xs:w-[327px] sm:w-[400px] lg:w-[440px] rounded-[28px] overflow-hidden"
                style={{
                    background: isActive
                        ? "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.95) 100%)"
                        : "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                    backdropFilter: "blur(48px) saturate(2.0)",
                    WebkitBackdropFilter: "blur(48px) saturate(2.0)",
                    border: isActive
                        ? `2px solid ${agent.color}50`
                        : "1px solid rgba(255,255,255,0.65)",
                    boxShadow: isActive
                        ? `0 40px 80px -20px ${agent.color}35, 0 24px 48px -12px rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,1)`
                        : "0 20px 50px -15px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.85)",
                }}
                whileHover={isActive ? {
                    scale: 1.015,
                    y: -3,
                } : {}}
                whileTap={{ scale: 0.985 }}
            >
                {/* Video Container */}
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50">
                    {/* Video */}
                    <video
                        ref={videoRef}
                        src={agent.video}
                        poster={agent.poster}
                        muted
                        playsInline
                        loop
                        preload={isActive ? "auto" : isAdjacent ? "metadata" : "none"}
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Gradient overlay for text legibility */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `linear-gradient(180deg, transparent 50%, ${agent.color}08 100%)`,
                        }}
                    />

                    {/* Playing indicator */}
                    {isActive && (
                        <motion.div
                            className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{
                                background: "rgba(0,0,0,0.5)",
                                backdropFilter: "blur(8px)",
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-green-400"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <span className="text-[10px] font-medium text-white/90 uppercase tracking-wider">
                                Live
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Content Area */}
                <div className="relative p-5 sm:p-6 lg:p-7">
                    {/* Accent glow blob */}
                    <motion.div
                        className="absolute -top-16 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                        style={{
                            background: `radial-gradient(circle, ${agent.color}18, transparent 70%)`,
                        }}
                        animate={isActive ? {
                            scale: [1, 1.25, 1],
                            opacity: [0.5, 0.85, 0.5],
                        } : {}}
                        transition={{ duration: 3.5, repeat: Infinity }}
                    />

                    {/* Header row: Role badge + Agent name */}
                    <div className="flex items-center gap-3 mb-3">
                        {/* Role badge */}
                        <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{
                                background: `${agent.color}12`,
                                border: `1px solid ${agent.color}25`,
                            }}
                        >
                            <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: agent.color }}
                            />
                            <span
                                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                                style={{ color: agent.color }}
                            >
                                {agent.role}
                            </span>
                        </div>
                    </div>

                    {/* Agent name */}
                    <h3 className="font-display text-[28px] sm:text-[32px] lg:text-[36px] font-bold text-[#1d1d1f] tracking-[-0.02em] leading-[1.05] mb-3">
                        {agent.name}
                    </h3>

                    {/* Agent intro */}
                    <p className="text-[14px] sm:text-[15px] text-[#3a3a3a] font-medium leading-[1.5] mb-4">
                        {agent.intro}
                    </p>

                    {/* Attributes - i-card style */}
                    <div className="flex flex-wrap gap-1.5">
                        {agent.attributes.map((attr, i) => (
                            <span
                                key={i}
                                className="text-[10px] sm:text-[11px] font-medium px-2.5 py-1 rounded-full"
                                style={{
                                    background: `${agent.color}10`,
                                    color: agent.color,
                                    border: `1px solid ${agent.color}20`,
                                }}
                            >
                                {attr}
                            </span>
                        ))}
                    </div>

                    {/* Active indicator line */}
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 h-[3px]"
                        style={{ backgroundColor: agent.color }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isActive ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────
   PROGRESS DOTS
───────────────────────────────────────────────────────────── */
function ProgressDots({
    total,
    active,
    onSelect,
    isPaused,
}: {
    total: number;
    active: number;
    onSelect: (idx: number) => void;
    isPaused: boolean;
}) {
    return (
        <div className="flex items-center gap-2.5">
            {Array.from({ length: total }).map((_, idx) => (
                <motion.button
                    key={idx}
                    onClick={() => onSelect(idx)}
                    className="relative h-[6px] rounded-full overflow-hidden cursor-pointer"
                    style={{
                        backgroundColor: "rgba(0,0,0,0.08)",
                    }}
                    animate={{
                        width: idx === active ? 32 : 12,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    whileHover={{ scale: 1.15 }}
                >
                    {idx === active && (
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                backgroundColor: STUDIO_TEAM[idx].color,
                            }}
                            initial={{ scaleX: 0, transformOrigin: "left" }}
                            animate={{ scaleX: 1 }}
                            transition={{
                                duration: isPaused ? 99999 : AUTO_ADVANCE_INTERVAL / 1000,
                                ease: "linear",
                            }}
                            key={`progress-${active}-${isPaused}`}
                        />
                    )}
                    {idx < active && (
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                backgroundColor: STUDIO_TEAM[idx].color,
                                opacity: 0.65,
                            }}
                        />
                    )}
                </motion.button>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function InterviewStudio() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [hasRevealed, setHasRevealed] = useState(false);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
    const [cardSpacing, setCardSpacing] = useState(55);

    // Responsive card stack spacing
    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            setCardSpacing(w < 640 ? 25 : w < 1024 ? 40 : 55);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const isInView = useInView(sectionRef, { once: false, amount: 0.35 });

    // Start reveal sequence when in view
    useEffect(() => {
        if (isInView && !hasRevealed) {
            const timer = setTimeout(() => {
                setHasRevealed(true);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isInView, hasRevealed]);

    // Auto-cycle through agents
    useEffect(() => {
        if (!isInView || !hasRevealed || isPaused) {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
            return;
        }

        autoPlayRef.current = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % STUDIO_TEAM.length);
        }, AUTO_ADVANCE_INTERVAL);

        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [isInView, hasRevealed, isPaused]);

    const handleSelect = useCallback((idx: number) => {
        setActiveIndex(idx);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 12000);
    }, []);

    const handleHover = useCallback(() => {
        setIsPaused(true);
    }, []);

    const handleLeave = useCallback(() => {
        setIsPaused(false);
    }, []);

    // Keyboard navigation for left/right arrows
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = activeIndex === 0 ? STUDIO_TEAM.length - 1 : activeIndex - 1;
            handleSelect(prevIndex);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = (activeIndex + 1) % STUDIO_TEAM.length;
            handleSelect(nextIndex);
        }
    }, [activeIndex, handleSelect]);

    // Parallax transforms
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });

    const headlineY = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
    const headlineOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
    const smoothY = useSpring(headlineY, { stiffness: 100, damping: 30 });

    return (
        <section
            ref={sectionRef}
            id="interview-studio"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClick={() => sectionRef.current?.focus()}
            className="relative overflow-hidden bg-transparent outline-none min-h-[600px] sm:min-h-[700px] lg:min-h-[800px] h-screen max-h-[1000px]"
        >
            {/* Subtle grain texture */}
            <div
                className="absolute inset-0 pointer-events-none z-50 opacity-[0.012]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Ambient orb - follows active agent color */}
            <motion.div
                className="absolute w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${STUDIO_TEAM[activeIndex].color}10, transparent 70%)`,
                    right: "-8%",
                    top: "15%",
                }}
                animate={{
                    opacity: [0.35, 0.65, 0.35],
                    scale: [1, 1.12, 1],
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Secondary ambient orb */}
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${STUDIO_TEAM[(activeIndex + 2) % STUDIO_TEAM.length].color}08, transparent 70%)`,
                    left: "5%",
                    bottom: "10%",
                }}
                animate={{
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col justify-center max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
                {/* Header */}
                <motion.div
                    className="mb-8 sm:mb-10 lg:mb-12"
                    style={{ y: smoothY, opacity: headlineOpacity }}
                >
                    {/* Badge */}
                    <motion.div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                        style={{
                            background: "linear-gradient(135deg, rgba(255,107,0,0.12) 0%, rgba(255,90,54,0.08) 100%)",
                            border: "1px solid rgba(255,107,0,0.2)",
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                    >
                        <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#FF6B00]">
                            5 AI Agents
                        </span>
                        <span className="text-[12px] text-[#FF6B00]/60">|</span>
                        <span className="text-[12px] font-medium text-[#FF6B00]/80">
                            Zero Overhead
                        </span>
                    </motion.div>

                    <motion.h2
                        className="font-display text-[clamp(28px,8vw,80px)] tracking-[-0.04em] text-[#1d1d1f] leading-[0.95] font-bold"
                        initial={{ opacity: 0, y: 50 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
                    >
                        Interview Studio
                    </motion.h2>
                    <motion.p
                        className="mt-4 text-[17px] sm:text-[20px] text-[#6e6e73] font-medium max-w-[540px] leading-relaxed"
                        initial={{ opacity: 0, y: 25 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT_EXPO }}
                    >
                        The research team that never clocks out.
                    </motion.p>
                </motion.div>

                {/* Horizontal Card Stack with Navigation Arrows */}
                <div
                    className="relative flex items-center justify-center"
                    style={{ perspective: "1800px" }}
                >
                    {/* Left Arrow */}
                    <button
                        onClick={() => handleSelect(activeIndex === 0 ? STUDIO_TEAM.length - 1 : activeIndex - 1)}
                        className="absolute left-0 sm:-left-4 lg:-left-8 z-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-black/[0.06] shadow-sm hidden sm:flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:shadow-md hover:bg-white transition-all duration-300 cursor-pointer"
                        aria-label="Previous agent"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>

                    <div className="relative w-full h-[400px] xs:h-[440px] sm:h-[520px] lg:h-[540px] flex items-center justify-center">
                        {STUDIO_TEAM.map((agent, idx) => (
                            <StudioCard
                                key={agent.name}
                                agent={agent}
                                index={idx}
                                activeIndex={activeIndex}
                                totalCards={STUDIO_TEAM.length}
                                isRevealed={hasRevealed}
                                cardSpacing={cardSpacing}
                                onHover={handleHover}
                                onLeave={handleLeave}
                                onClick={() => handleSelect(idx)}
                                onSwipe={(dir) => {
                                    if (dir === "left") {
                                        handleSelect((activeIndex + 1) % STUDIO_TEAM.length)
                                    } else {
                                        handleSelect(activeIndex === 0 ? STUDIO_TEAM.length - 1 : activeIndex - 1)
                                    }
                                }}
                            />
                        ))}
                    </div>

                    {/* Right Arrow */}
                    <button
                        onClick={() => handleSelect((activeIndex + 1) % STUDIO_TEAM.length)}
                        className="absolute right-0 sm:-right-4 lg:-right-8 z-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-black/[0.06] shadow-sm hidden sm:flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:shadow-md hover:bg-white transition-all duration-300 cursor-pointer"
                        aria-label="Next agent"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>

                {/* Bottom Controls */}
                <motion.div
                    className="flex items-center justify-between mt-4 sm:mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView && hasRevealed ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    {/* Progress dots */}
                    <ProgressDots
                        total={STUDIO_TEAM.length}
                        active={activeIndex}
                        onSelect={handleSelect}
                        isPaused={isPaused}
                    />

                    {/* Agent counter */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="text-[13px] font-semibold tracking-wide"
                            style={{ color: STUDIO_TEAM[activeIndex].color }}
                            key={activeIndex}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {STUDIO_TEAM[activeIndex].name}
                        </motion.div>
                        <div className="flex items-center gap-2 text-[13px] text-[#86868b]">
                            <span className="font-mono font-medium">
                                {String(activeIndex + 1).padStart(2, "0")}
                            </span>
                            <div className="w-6 h-[1.5px] bg-[#d2d2d7] rounded-full" />
                            <span className="font-mono">
                                {String(STUDIO_TEAM.length).padStart(2, "0")}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Hint */}
                <motion.div
                    className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2 text-[11px] text-[#86868b]/60"
                    initial={{ opacity: 0 }}
                    animate={isInView && hasRevealed ? { opacity: 1 } : {}}
                    transition={{ delay: 1.8 }}
                >
                    <span>← → to navigate</span>
                    <span className="text-[#86868b]/30">|</span>
                    <span>Click to explore</span>
                </motion.div>
            </div>
        </section>
    );
}
