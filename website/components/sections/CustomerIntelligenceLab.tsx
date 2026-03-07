"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useInView,
} from "framer-motion";
import {
    Phone,
    Sparkles,
    Database,
    FileText,
    Brain,
    Zap,
} from "lucide-react";
import { useRegisterParticleTargets } from "@/components/ui/particles/useRegisterParticleTargets";
import { RefObject } from "react";

/* ─────────────────────────────────────────────────────────────
   EASING & PHYSICS
───────────────────────────────────────────────────────────── */
const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 0.8 };
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─────────────────────────────────────────────────────────────
   MVP FEATURES - The core platform capabilities
───────────────────────────────────────────────────────────── */
const MVP_FEATURES = [
    {
        id: "call",
        icon: Phone,
        title: "Instant Outreach",
        tagline: "One click. Connected to customers.",
        color: "#FF6B00",
    },
    {
        id: "copilot",
        icon: Sparkles,
        title: "Interview Copilot",
        tagline: "Real-time guidance. No missed insights.",
        color: "#FF9F43",
    },
    {
        id: "repository",
        icon: Database,
        title: "Call Repository",
        tagline: "Every conversation. Instantly searchable.",
        color: "#6366F1",
    },
    {
        id: "reports",
        icon: FileText,
        title: "Insight Reports",
        tagline: "Intelligence that reaches the right teams.",
        color: "#FF5A36",
    },
    {
        id: "ai",
        icon: Brain,
        title: "AI Interviews",
        tagline: "Qualitative depth at quantitative scale.",
        color: "#FF6B00",
    },
];

/* ─────────────────────────────────────────────────────────────
   STACKED CARD COMPONENT
───────────────────────────────────────────────────────────── */
function StackedCard({
    feature,
    index,
    activeIndex,
    totalCards,
    isRevealed,
    cardSpacing,
    onHover,
    onLeave,
}: {
    feature: typeof MVP_FEATURES[0];
    index: number;
    activeIndex: number;
    totalCards: number;
    isRevealed: boolean;
    cardSpacing: number;
    onHover: () => void;
    onLeave: () => void;
}) {
    const Icon = feature.icon;
    const isActive = index === activeIndex;
    const isFuture = index > activeIndex;

    // Calculate stack position
    const stackOffset = index - activeIndex;
    const xOffset = stackOffset * cardSpacing;
    const scale = 1 - Math.abs(stackOffset) * 0.04;
    const zIndex = totalCards - Math.abs(stackOffset);
    const rotateY = stackOffset * -2; // Subtle perspective
    const opacity = isFuture && !isRevealed ? 0 : 1 - Math.abs(stackOffset) * 0.15;

    return (
        <motion.div
            className="absolute"
            style={{
                zIndex,
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
            }}
            initial={{
                x: 400,
                opacity: 0,
                scale: 0.8,
                rotateY: -15,
            }}
            animate={{
                x: xOffset,
                opacity: Math.max(0.3, opacity),
                scale: Math.max(0.85, scale),
                rotateY,
            }}
            transition={{
                type: "spring",
                ...SPRING_CONFIG,
                delay: isRevealed ? 0 : index * 0.15,
            }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
        >
            <motion.div
                style={{
                    background: isActive
                        ? "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))"
                        : "linear-gradient(145deg, rgba(255,255,255,0.7), rgba(255,255,255,0.5))",
                    backdropFilter: "blur(40px) saturate(1.8)",
                    WebkitBackdropFilter: "blur(40px) saturate(1.8)",
                    border: isActive
                        ? `2px solid ${feature.color}40`
                        : "1px solid rgba(255,255,255,0.6)",
                    boxShadow: isActive
                        ? `0 32px 64px -16px ${feature.color}30, 0 16px 32px -8px rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,1)`
                        : "0 16px 40px -12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
                className={`relative w-[calc(100vw-48px)] xs:w-[300px] sm:w-[380px] lg:w-[380px] h-[180px] xs:h-[200px] sm:h-[220px] rounded-[28px] p-5 xs:p-6 sm:p-8 cursor-pointer overflow-hidden ${isActive ? 'particle-target-lab' : ''}`}
                whileHover={{
                    scale: 1.02,
                    y: -4,
                }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Accent gradient blob */}
                <motion.div
                    className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl"
                    style={{
                        background: `radial-gradient(circle, ${feature.color}15, transparent 70%)`,
                    }}
                    animate={isActive ? {
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity }}
                />

                {/* Icon */}
                <motion.div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                        background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}08)`,
                        border: `1px solid ${feature.color}30`,
                        boxShadow: isActive
                            ? `0 8px 24px -4px ${feature.color}25`
                            : "none",
                    }}
                >
                    <Icon
                        className="w-7 h-7"
                        style={{ color: feature.color }}
                        strokeWidth={2}
                    />
                </motion.div>

                {/* Content */}
                <h3 className="font-display text-[22px] sm:text-[26px] font-bold text-[#1d1d1f] tracking-tight mb-2">
                    {feature.title}
                </h3>
                <p className="text-[14px] sm:text-[15px] text-[#6e6e73] font-medium leading-relaxed">
                    {feature.tagline}
                </p>

                {/* Active indicator line */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-[28px]"
                    style={{ backgroundColor: feature.color }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isActive ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                />
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
        <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, idx) => (
                <motion.button
                    key={idx}
                    onClick={() => onSelect(idx)}
                    className="relative w-10 h-1.5 rounded-full overflow-hidden cursor-pointer"
                    style={{
                        backgroundColor: "rgba(0,0,0,0.08)",
                    }}
                    whileHover={{ scale: 1.1 }}
                >
                    {idx === active && (
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                backgroundColor: MVP_FEATURES[idx].color,
                            }}
                            initial={{ scaleX: 0, transformOrigin: "left" }}
                            animate={{ scaleX: 1 }}
                            transition={{
                                duration: isPaused ? 99999 : 4,
                                ease: "linear",
                            }}
                            key={`progress-${active}`}
                        />
                    )}
                    {idx < active && (
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                backgroundColor: MVP_FEATURES[idx].color,
                                opacity: 0.6,
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
export default function CustomerIntelligenceLab() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [hasRevealed, setHasRevealed] = useState(false);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
    const [cardSpacing, setCardSpacing] = useState(60);

    // Responsive card stack spacing
    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            setCardSpacing(w < 640 ? 25 : w < 1024 ? 40 : 60);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const isInView = useInView(sectionRef, { once: false, amount: 0.4 });

    // Start reveal sequence when in view
    useEffect(() => {
        if (isInView && !hasRevealed) {
            const timer = setTimeout(() => {
                setHasRevealed(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isInView, hasRevealed]);

    // Auto-cycle through features
    useEffect(() => {
        if (!isInView || !hasRevealed || isPaused) {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
            return;
        }

        autoPlayRef.current = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % MVP_FEATURES.length);
        }, 4000);

        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [isInView, hasRevealed, isPaused]);

    const handleSelect = useCallback((idx: number) => {
        setActiveIndex(idx);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 10000);
    }, []);

    const handleHover = useCallback(() => {
        setIsPaused(true);
    }, []);

    const handleLeave = useCallback(() => {
        setIsPaused(false);
    }, []);

    // Parallax transforms
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });

    // Register particle targets
    useRegisterParticleTargets("intelligenceLab", sectionRef as unknown as RefObject<HTMLElement>, [".particle-target-lab"], isInView);

    const headlineY = useTransform(scrollYProgress, [0, 0.5], [80, 0]);
    const headlineOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
    const smoothY = useSpring(headlineY, { stiffness: 100, damping: 30 });

    return (
        <section
            ref={sectionRef}
            id="platform"
            className="relative overflow-hidden bg-transparent min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] h-screen max-h-[900px]"
        >
            {/* Subtle grain */}
            <div
                className="absolute inset-0 pointer-events-none z-50 opacity-[0.015]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Ambient orb - following active color */}
            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${MVP_FEATURES[activeIndex].color}12, transparent 70%)`,
                    right: "-5%",
                    top: "20%",
                }}
                animate={{
                    opacity: [0.4, 0.7, 0.4],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col justify-center max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
                {/* Header - Left aligned, strong */}
                <motion.div
                    className="mb-12 sm:mb-16 lg:mb-20"
                    style={{ y: smoothY, opacity: headlineOpacity }}
                >
                    <motion.h2
                        className="font-display text-[clamp(40px,7vw,72px)] tracking-[-0.04em] text-[#1d1d1f] leading-[1.0] font-bold"
                        initial={{ opacity: 0, y: 40 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
                    >
                        The Platform
                    </motion.h2>
                    <motion.p
                        className="mt-4 text-[17px] sm:text-[19px] text-[#6e6e73] font-medium max-w-[500px]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT_EXPO }}
                    >
                        Everything you need to understand your customers - built for speed, depth, and action.
                    </motion.p>
                </motion.div>

                {/* Horizontal Card Stack */}
                <div
                    className="relative flex-1 flex items-center justify-center"
                    style={{ perspective: "1500px" }}
                >
                    <div className="relative w-full h-[260px] flex items-center justify-center">
                        {MVP_FEATURES.map((feature, idx) => (
                            <StackedCard
                                key={feature.id}
                                feature={feature}
                                index={idx}
                                activeIndex={activeIndex}
                                totalCards={MVP_FEATURES.length}
                                isRevealed={hasRevealed}
                                cardSpacing={cardSpacing}
                                onHover={handleHover}
                                onLeave={handleLeave}
                            />
                        ))}
                    </div>
                </div>

                {/* Bottom Controls */}
                <motion.div
                    className="flex items-center justify-between mt-8 sm:mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView && hasRevealed ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    {/* Progress dots */}
                    <ProgressDots
                        total={MVP_FEATURES.length}
                        active={activeIndex}
                        onSelect={handleSelect}
                        isPaused={isPaused}
                    />

                    {/* Feature counter */}
                    <div className="flex items-center gap-3 text-[14px] text-[#86868b]">
                        <span className="font-mono">
                            {String(activeIndex + 1).padStart(2, "0")}
                        </span>
                        <div className="w-8 h-[1px] bg-[#d2d2d7]" />
                        <span className="font-mono">
                            {String(MVP_FEATURES.length).padStart(2, "0")}
                        </span>
                    </div>
                </motion.div>

                {/* Keyboard hint */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2 text-[12px] text-[#86868b]/50"
                    initial={{ opacity: 0 }}
                    animate={isInView && hasRevealed ? { opacity: 1 } : {}}
                    transition={{ delay: 1.5 }}
                >
                    <Zap className="w-3 h-3" />
                    <span>Hover to explore</span>
                </motion.div>
            </div>
        </section>
    );
}
