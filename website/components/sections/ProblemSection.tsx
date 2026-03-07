"use client";

import { useRef, useState, useEffect, useCallback, RefObject } from "react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useTransform,
    useSpring,
    useInView,
    MotionValue,
} from "framer-motion";
import Image from "next/image";
import { useRegisterParticleTargets } from "@/components/ui/particles/useRegisterParticleTargets";

// Typed easing curve for Framer Motion
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─────────────────────────────────────────────────────────────
   ARC DATA
───────────────────────────────────────────────────────────── */
const ARCS_DATA = [
    {
        arcName: "Booking Hell",
        subName: '"We\'ll do it next week"',
        color: "#FF5A36",
        items: [
            {
                label: "Endless Delays",
                shortLabel: "Delayed",
                monologue:
                    'You keep saying you\'ll start user calls "after this launch." But the dust never settles. Every Monday, discovery gets quietly bumped again.',
                avatar: "/avatars/avatar_booking_1.png",
            },
            {
                label: "90% No-Shows",
                shortLabel: "Ghosted",
                monologue:
                    'You emailed 50 humans. 10 booked. 2 showed up. Between time zones and "can we reschedule" emails, it\'s exhausting just to get on Zoom.',
                avatar: "/avatars/avatar_booking_2.png",
            },
            {
                label: "Zero User Contact",
                shortLabel: "Zero Calls",
                monologue:
                    "You constantly talk about \"the customer\" in standup, but if you're being honest? You haven't actually spoken to a real user in 8 weeks.",
                avatar: "/avatars/avatar_booking_3.png",
            },
        ],
    },
    {
        arcName: "Trash Interviews",
        subName: '"Just vibing on Zoom"',
        color: "#E88B30",
        items: [
            {
                label: "Pitching, Not Listening",
                shortLabel: "Pitching",
                monologue:
                    "Instead of listening, you just pitched the roadmap for 20 minutes. They nodded politely, you felt validated, and then they completely ghosted.",
                avatar: "/avatars/avatar_interview_1.png",
            },
            {
                label: "No Prep, No Insight",
                shortLabel: "Unprepared",
                monologue:
                    "You jumped on with zero prep, had a lovely chat about the weather, and realized after hanging up that you learned absolutely nothing useful.",
                avatar: "/avatars/avatar_interview_2.png",
            },
            {
                label: "Ignoring Silent Churn",
                shortLabel: "Blind Churn",
                monologue:
                    "You celebrate a great NPS score, blissfully ignoring the 30% of your user base who quietly churned this morning without saying a single word.",
                avatar: "/avatars/avatar_interview_3.png",
            },
        ],
    },
    {
        arcName: "The Notion Blackhole",
        subName: '"Where insights go to die"',
        color: "#6B7280",
        items: [
            {
                label: "Unwatched Recordings",
                shortLabel: "Unwatched",
                monologue:
                    "It's a 45-minute mp4 in a Google Drive folder. You promised you'd write a summary later. You won't. Nobody is ever watching that.",
                avatar: "/avatars/avatar_notion_1.png",
            },
            {
                label: "Unread Notes",
                shortLabel: "Unread",
                monologue:
                    "You dumped all your notes into a massive, perfectly organized Notion doc. Literally no one on the team has opened it since you hit save.",
                avatar: "/avatars/avatar_notion_2.png",
            },
            {
                label: "Lost Insights",
                shortLabel: "Lost",
                monologue:
                    'The user dropped a massive truth bomb at minute 14. You didn\'t write it down. By Friday standup, it just morphed into "users want it faster".',
                avatar: "/avatars/avatar_notion_3.png",
            },
        ],
    },
    {
        arcName: "Broken Telephone",
        subName: '"Silos & Slack messages"',
        color: "#6366F1",
        items: [
            {
                label: "Wasted Sprints",
                shortLabel: "Wasted",
                monologue:
                    "Engineering just spent a month grinding on a feature that Sales could have told you wouldn't close a single deal. But nobody asked them.",
                avatar: "/avatars/avatar_silos_1.png",
            },
            {
                label: "Siloed Teams",
                shortLabel: "Siloed",
                monologue:
                    "Support knows exactly why users are confused. Product is busy building a new dashboard. You're two Slack channels apart, but building blind.",
                avatar: "/avatars/avatar_silos_2.png",
            },
            {
                label: "Opinion Wars",
                shortLabel: "Opinions",
                monologue:
                    "Sales says users want X. Support says Y. The CEO says Z. Everyone just uses their own single conversation to force their pet feature.",
                avatar: "/avatars/avatar_silos_3.png",
            },
        ],
    },
    {
        arcName: "Fake Rigor",
        subName: '"Customer-centric LARPing"',
        color: "#F43F5E",
        items: [
            {
                label: "No User Proof",
                shortLabel: "No Proof",
                monologue:
                    'You claim to be "customer-obsessed." But ask the team to name the very last time a real user quote changed a roadmap decision? Crickets.',
                avatar: "/avatars/avatar_rigor_1.png",
            },
            {
                label: "Blind Building",
                shortLabel: "Blind",
                monologue:
                    "You've been building non-stop since your last round. If you're being completely honest, you still don't have a confident answer on why people actually buy.",
                avatar: "/avatars/avatar_rigor_2.png",
            },
            {
                label: "Data Without Why",
                shortLabel: "No Why",
                monologue:
                    "You have Mixpanel and a dozen dashboards. You know exactly what users are doing, but you have absolutely no idea *why* they're actually doing it.",
                avatar: "/avatars/avatar_rigor_3.png",
            },
        ],
    },
    {
        arcName: "Roadmap Roulette",
        subName: '"Whoever yells loudest wins"',
        color: "#FF6B00",
        items: [
            {
                label: "Loud Minority Wins",
                shortLabel: "Loud Few",
                monologue:
                    "Three power users complained loudly in Discord. You derailed the entire sprint to fix it. The 99% who silently pay you wanted something else entirely.",
                avatar: "/avatars/avatar_roadmap_1.png",
            },
            {
                label: "Gut Over Data",
                shortLabel: "Gut Feel",
                monologue:
                    "In planning meetings, the founder's gut feeling is treated as undeniable fact. Nobody pushes back, because no one has the data to prove them wrong.",
                avatar: "/avatars/avatar_roadmap_2.png",
            },
            {
                label: "Trend Chasing",
                shortLabel: "FOMO",
                monologue:
                    "A VC tweeted a hot take. Suddenly, your whole Q3 strategy shifted to chase an AI trend, abandoning the core problems your real users are begging for.",
                avatar: "/avatars/avatar_roadmap_3.png",
            },
        ],
    },
];

/* ─────────────────────────────────────────────────────────────
   TYPEWRITER HOOK
───────────────────────────────────────────────────────────── */
function useTypewriter(text: string, speed: number = 18, enabled: boolean = true) {
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setDisplayedText(text);
            setIsTyping(false);
            return;
        }

        setDisplayedText("");
        setIsTyping(true);
        let i = 0;

        const interval = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.slice(0, i + 1));
                i++;
            } else {
                setIsTyping(false);
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed, enabled]);

    return { displayedText, isTyping };
}

/* ─────────────────────────────────────────────────────────────
   PARALLAX LAYER COMPONENT
───────────────────────────────────────────────────────────── */
function ParallaxOrb({
    scrollYProgress,
    color,
    size,
    position,
    speed,
}: {
    scrollYProgress: MotionValue<number>;
    color: string;
    size: string;
    position: { top?: string; bottom?: string; left?: string; right?: string };
    speed: number;
}) {
    const y = useTransform(scrollYProgress, [0, 1], [0, speed]);
    const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

    return (
        <motion.div
            className="absolute rounded-full blur-[100px] pointer-events-none"
            style={{
                ...position,
                width: size,
                height: size,
                backgroundColor: color,
                y: smoothY,
                opacity: 0.4,
            }}
        />
    );
}

/* ─────────────────────────────────────────────────────────────
   CENTER AVATAR COMPONENT (with breathing animation)
───────────────────────────────────────────────────────────── */
function CenterAvatar({
    src,
    alt,
    isActive,
    color,
}: {
    src: string;
    alt: string;
    isActive: boolean;
    color: string;
}) {
    return (
        <motion.div
            className="relative particle-target-problem"
            animate={
                isActive
                    ? {
                        scale: [1, 1.02, 1],
                        y: [0, -4, 0],
                    }
                    : {}
            }
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        >
            {/* Subtle spotlight/rim light effect */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse 100% 60% at 50% 100%, ${color}15 0%, transparent 40%)`,
                    transform: "scale(1.2)",
                }}
                animate={{
                    opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Top rim light */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${color}20 0%, transparent 50%)`,
                    transform: "scale(1.8) translateY(-30%)",
                }}
                animate={{
                    opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                }}
            />

            {/* Glow ring behind avatar */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(circle, ${color}12 0%, transparent 50%)`,
                    transform: "scale(1.3)",
                }}
                animate={{
                    scale: [1.3, 1.4, 1.3],
                    opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Main avatar */}
            <div
                className="relative w-[160px] h-[200px] sm:w-[180px] sm:h-[225px] lg:w-[220px] lg:h-[275px]"
            >
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                    style={{
                        filter: `drop-shadow(0 8px 24px rgba(0,0,0,0.15)) drop-shadow(0 0 40px ${color}15)`,
                    }}
                    sizes="(max-width: 640px) 160px, (max-width: 1024px) 180px, 220px"
                    priority
                />
            </div>

            {/* Speaking indicator dots */}
            <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                            boxShadow: `0 2px 8px ${color}40`,
                        }}
                        animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                            duration: 0.8,
                            delay: i * 0.15,
                            repeat: Infinity,
                        }}
                    />
                ))}
            </motion.div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────
   SIDE AVATAR COMPONENT
───────────────────────────────────────────────────────────── */
function SideAvatar({
    src,
    alt,
    label,
    position,
    onClick,
    isHovered,
    onHover,
    color,
}: {
    src: string;
    alt: string;
    label: string;
    position: "left" | "right";
    onClick: () => void;
    isHovered: boolean;
    onHover: (hovered: boolean) => void;
    color: string;
}) {
    return (
        <motion.button
            className={`
                relative flex flex-col items-center gap-2 cursor-pointer group
                particle-target-problem
                ${position === "left" ? "mr-auto" : "ml-auto"}
            `}
            onClick={onClick}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Avatar container - NO greyscale, always visible */}
            <motion.div
                className="relative w-[70px] h-[88px] sm:w-[90px] sm:h-[112px]"
                animate={{
                    scale: isHovered ? 1 : [1, 1.02, 1],
                    opacity: isHovered ? 1 : 0.85,
                }}
                transition={{
                    scale: {
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    },
                    opacity: { duration: 0.3 },
                }}
            >
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain drop-shadow-md"
                    sizes="(max-width: 640px) 70px, 90px"
                />

                {/* Subtle idle glow ring - always visible */}
                <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        background: `radial-gradient(circle, ${color}15 0%, transparent 60%)`,
                        transform: "scale(1.4)",
                    }}
                    animate={{
                        opacity: isHovered ? 0.8 : [0.3, 0.5, 0.3],
                        scale: isHovered ? 1.5 : [1.4, 1.45, 1.4],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </motion.div>

            {/* Label with better contrast */}
            <motion.span
                className="text-[12px] sm:text-[13px] font-semibold tracking-tight transition-colors duration-300"
                style={{
                    color: isHovered ? "#1d1d1f" : "#6e6e73",
                }}
            >
                {label}
            </motion.span>

            {/* Always-visible click indicator arrow */}
            <motion.div
                className="flex items-center gap-1"
                animate={{
                    y: isHovered ? 0 : [0, 2, 0],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="transition-colors duration-300"
                    style={{
                        color: isHovered ? color : "#86868b",
                    }}
                >
                    <path
                        d="M6 2.5V9.5M6 9.5L3 6.5M6 9.5L9 6.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </motion.div>
        </motion.button>
    );
}

/* ─────────────────────────────────────────────────────────────
   SPEECH BUBBLE COMPONENT
───────────────────────────────────────────────────────────── */
function SpeechBubble({
    title,
    monologue,
    color,
    scrollYProgress,
}: {
    title: string;
    monologue: string;
    color: string;
    scrollYProgress: MotionValue<number>;
}) {
    const { displayedText, isTyping } = useTypewriter(monologue, 12, true);

    // Subtle parallax for depth
    const bubbleY = useTransform(scrollYProgress, [0, 1], [0, -20]);
    const smoothBubbleY = useSpring(bubbleY, { stiffness: 100, damping: 30 });

    return (
        <motion.div
            className="relative max-w-[520px] mx-auto"
            style={{ y: scrollYProgress ? smoothBubbleY : 0 }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        >
            {/* Enhanced glass card with warm tone for peach background */}
            <div
                className="relative bg-white/95 backdrop-blur-2xl rounded-[24px] p-5 sm:p-6
                           border border-[#E0D0C2]/60
                           shadow-[0_4px_24px_rgba(140,100,70,0.08),0_12px_48px_rgba(140,100,70,0.05)]"
            >
                {/* Accent line with glow */}
                <motion.div
                    className="absolute top-0 left-6 right-6 h-[3px] rounded-full"
                    style={{
                        backgroundColor: color,
                        boxShadow: `0 2px 12px ${color}40`,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                />

                {/* Title */}
                <motion.h3
                    className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-[#1d1d1f] tracking-tight mb-3 leading-tight pt-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    {title}
                </motion.h3>

                {/* Monologue with better text size */}
                <p className="text-[14px] sm:text-[15px] text-[#424245] leading-[1.6] font-medium">
                    {displayedText}
                    {isTyping && (
                        <motion.span
                            className="inline-block w-[2px] h-[1em] ml-0.5 align-middle rounded-full"
                            style={{ backgroundColor: color }}
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        />
                    )}
                </p>
            </div>

            {/* Speech pointer with matching warm style */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
                    <path
                        d="M14 14L0 0H28L14 14Z"
                        fill="rgba(255,255,255,0.95)"
                    />
                    <path
                        d="M14 12L2 0H26L14 12Z"
                        fill="white"
                    />
                </svg>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function ProblemSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const [activeArcIndex, setActiveArcIndex] = useState(0);
    const [spotlightIndex, setSpotlightIndex] = useState(1); // Center item by default
    const [isHovered, setIsHovered] = useState(false);
    const [isCenterHovered, setIsCenterHovered] = useState(false);
    const [hoveredSide, setHoveredSide] = useState<"left" | "right" | null>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
    const avatarAutoPlayRef = useRef<NodeJS.Timeout | null>(null);

    const isInView = useInView(sectionRef, { once: false, amount: 0.3 });

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });

    const activeArc = ARCS_DATA[activeArcIndex];

    // Get items in display order (spotlight in center)
    const getDisplayOrder = useCallback(() => {
        const items = [...activeArc.items];
        const spotlightItem = items[spotlightIndex];
        const otherItems = items.filter((_, i) => i !== spotlightIndex);
        return {
            left: otherItems[0],
            center: spotlightItem,
            right: otherItems[1] || otherItems[0],
            leftOriginalIndex: items.indexOf(otherItems[0]),
            rightOriginalIndex: items.indexOf(otherItems[1] || otherItems[0]),
        };
    }, [activeArc.items, spotlightIndex]);

    const displayOrder = getDisplayOrder();

    // Register particle targets
    useRegisterParticleTargets("problem", sectionRef as unknown as RefObject<HTMLElement>, [".particle-target-problem"], isInView);

    // Auto-cycle avatars within arc
    const advanceAvatar = useCallback(() => {
        setSpotlightIndex((prev) => (prev + 1) % activeArc.items.length);
    }, [activeArc.items.length]);

    // Auto-cycle arcs (after cycling through all avatars)
    const advanceArc = useCallback(() => {
        setActiveArcIndex((prev) => (prev + 1) % ARCS_DATA.length);
        setSpotlightIndex(0); // Start from first avatar
    }, []);

    // Avatar autoscroll effect
    useEffect(() => {
        if (!isCenterHovered && isInView) {
            avatarAutoPlayRef.current = setInterval(advanceAvatar, 6000);
        }
        return () => {
            if (avatarAutoPlayRef.current) clearInterval(avatarAutoPlayRef.current);
        };
    }, [isCenterHovered, isInView, advanceAvatar, activeArcIndex]);

    // Arc autoscroll effect (every 12 seconds, giving time for 3 avatar cycles)
    useEffect(() => {
        if (!isHovered && isInView) {
            autoPlayRef.current = setInterval(advanceArc, 18000);
        }
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [isHovered, isInView, advanceArc]);

    const handleArcClick = (idx: number) => {
        setActiveArcIndex(idx);
        setSpotlightIndex(1);
    };

    const handleSpotlightChange = (originalIndex: number) => {
        setSpotlightIndex(originalIndex);
    };

    // Scroll-based transforms
    const headerY = useTransform(scrollYProgress, [0, 0.5], [60, 0]);
    const headerOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
    const contentY = useTransform(scrollYProgress, [0.1, 0.5], [100, 0]);
    const contentOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);

    const smoothHeaderY = useSpring(headerY, { stiffness: 100, damping: 30 });
    const smoothContentY = useSpring(contentY, { stiffness: 100, damping: 30 });

    return (
        <section
            ref={sectionRef}
            id="problem"
            className="relative overflow-hidden bg-transparent min-h-screen flex flex-col pt-12 sm:pt-16"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Entry particles handled by ParticleNarrativeController */}

            {/* Grain texture overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-50 opacity-[0.015]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Parallax orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <ParallaxOrb
                    scrollYProgress={scrollYProgress}
                    color={`${activeArc.color}30`}
                    size="600px"
                    position={{ top: "-10%", right: "-15%" }}
                    speed={-100}
                />
                <ParallaxOrb
                    scrollYProgress={scrollYProgress}
                    color={`${activeArc.color}10`}
                    size="250px"
                    position={{ bottom: "25%", left: "5%" }}
                    speed={80}
                />
                <ParallaxOrb
                    scrollYProgress={scrollYProgress}
                    color="#6366F120"
                    size="300px"
                    position={{ top: "40%", left: "30%" }}
                    speed={-50}
                />
            </div>


            {/* Content */}
            <div
                ref={contentRef}
                className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col flex-1 px-6 sm:px-8 lg:px-16 pt-4 sm:pt-5 pb-20 sm:pb-24"
            >
                {/* ─── Header with scroll animation ─── */}
                <motion.div
                    className="mb-6 sm:mb-8 text-center"
                    style={{ y: smoothHeaderY, opacity: headerOpacity }}
                >
                    <motion.h2
                        className="font-display text-[clamp(28px,5vw,52px)] tracking-tighter text-[#1d1d1f] leading-[1.05] font-bold max-w-[800px] mx-auto"
                        initial={{ opacity: 0, y: 40 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
                    >
                        Every team says they
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A36] via-[#E88B30] to-[#FF5A36] bg-[length:200%_auto] animate-gradient">
                            talk to their customers.
                        </span>
                    </motion.h2>

                    <motion.p
                        className="mt-2 text-[15px] sm:text-[17px] text-[#86868b] font-medium tracking-tight"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{
                            duration: 0.8,
                            delay: 0.15,
                            ease: EASE_OUT_EXPO,
                        }}
                    >
                        Scheduling nightmares. Notes in a black hole. Roadmaps by gut feel.
                    </motion.p>
                </motion.div>

                {/* ─── Center Stage Layout ─── */}
                <motion.div style={{ y: smoothContentY, opacity: contentOpacity }}>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-full">
                            {/* Speech Bubble */}
                            <div className="mb-4">
                                <AnimatePresence mode="wait">
                                    <SpeechBubble
                                        key={`bubble-${activeArcIndex}-${spotlightIndex}`}
                                        title={displayOrder.center.label}
                                        monologue={displayOrder.center.monologue}
                                        color={activeArc.color}
                                        scrollYProgress={scrollYProgress}
                                    />
                                </AnimatePresence>
                            </div>

                            {/* Avatar Stage - smooth translate transitions */}
                            <div className="flex items-end justify-center gap-8 sm:gap-16 lg:gap-24">
                                {/* Left Side Avatar */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`left-${activeArcIndex}-${displayOrder.left.avatar}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        <SideAvatar
                                            src={displayOrder.left.avatar}
                                            alt={displayOrder.left.label}
                                            label={displayOrder.left.shortLabel}
                                            position="left"
                                            color={activeArc.color}
                                            onClick={() =>
                                                handleSpotlightChange(
                                                    displayOrder.leftOriginalIndex
                                                )
                                            }
                                            isHovered={hoveredSide === "left"}
                                            onHover={(h) =>
                                                setHoveredSide(h ? "left" : null)
                                            }
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Center Avatar */}
                                <div
                                    onMouseEnter={() => setIsCenterHovered(true)}
                                    onMouseLeave={() => setIsCenterHovered(false)}
                                    className="cursor-default"
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`center-${activeArcIndex}-${displayOrder.center.avatar}`}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -16 }}
                                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                        >
                                            <CenterAvatar
                                                src={displayOrder.center.avatar}
                                                alt={displayOrder.center.label}
                                                isActive={true}
                                                color={activeArc.color}
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Right Side Avatar */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`right-${activeArcIndex}-${displayOrder.right.avatar}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        <SideAvatar
                                            src={displayOrder.right.avatar}
                                            alt={displayOrder.right.label}
                                            label={displayOrder.right.shortLabel}
                                            position="right"
                                            color={activeArc.color}
                                            onClick={() =>
                                                handleSpotlightChange(
                                                    displayOrder.rightOriginalIndex
                                                )
                                            }
                                            isHovered={hoveredSide === "right"}
                                            onHover={(h) =>
                                                setHoveredSide(h ? "right" : null)
                                            }
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ─── Arc Gallery Strip ─── */}
                <motion.div
                    className="mt-auto pt-6"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <div className="flex gap-4 overflow-x-auto overflow-y-visible hide-scrollbar justify-center py-4 -my-2">
                        {ARCS_DATA.map((arc, idx) => {
                            const isActive = activeArcIndex === idx;
                            return (
                                <motion.button
                                    key={idx}
                                    onClick={() => handleArcClick(idx)}
                                    className={`
                                        relative flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-full
                                        transition-all duration-500 cursor-pointer group
                                        ${isActive ? "" : "bg-black/[0.03] hover:bg-white/50"}
                                    `}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{
                                        duration: 0.5,
                                        delay: 0.5 + idx * 0.08,
                                        ease: EASE_OUT_EXPO,
                                    }}
                                    whileHover={{ scale: isActive ? 1.02 : 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {/* Active pill background with colored glow */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="arcPill"
                                            className="absolute inset-0 bg-white rounded-full border border-black/[0.06]"
                                            style={{
                                                boxShadow: `0 4px 24px -4px ${arc.color}30, 0 8px 32px -8px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset`,
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 35,
                                            }}
                                        />
                                    )}

                                    {/* Stacked avatar thumbnails - larger with less overlap */}
                                    <div className="relative z-10 flex -space-x-1.5">
                                        {arc.items.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                className="rounded-full overflow-hidden border-2 border-white/90 bg-[#FEF6EE]"
                                                style={{
                                                    width: isActive ? 32 : 28,
                                                    height: isActive ? 32 : 28,
                                                    boxShadow: isActive ? `0 2px 8px ${arc.color}20` : 'none',
                                                }}
                                                animate={{
                                                    scale: isActive ? 1 : 0.92,
                                                    opacity: isActive ? 1 : 0.5,
                                                }}
                                                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                                                whileHover={{ scale: 1.15, zIndex: 10 }}
                                            >
                                                <Image
                                                    src={item.avatar}
                                                    alt={item.label}
                                                    width={32}
                                                    height={32}
                                                    className="object-cover w-full h-full"
                                                />
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Label with better active state */}
                                    <span
                                        className={`relative z-10 text-[13px] sm:text-[15px] font-semibold tracking-tight whitespace-nowrap transition-colors duration-500
                                            ${isActive ? "text-[#1d1d1f]" : "text-[#86868b] group-hover:text-[#1d1d1f]"}
                                        `}
                                    >
                                        {arc.arcName}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Progress bar - more prominent */}
                    <div className="flex justify-center gap-2 mt-6 pb-2">
                        {ARCS_DATA.map((arc, idx) => (
                            <motion.div
                                key={idx}
                                className="relative w-16 h-2.5 rounded-full overflow-hidden bg-[#DCCAB8]/70 cursor-pointer"
                                onClick={() => handleArcClick(idx)}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {activeArcIndex === idx ? (
                                    <motion.div
                                        className="absolute inset-y-0 left-0 rounded-full"
                                        style={{
                                            backgroundColor: arc.color,
                                            boxShadow: `0 0 12px ${arc.color}60`,
                                        }}
                                        initial={{ scaleX: 0, transformOrigin: "left" }}
                                        animate={{ scaleX: 1 }}
                                        transition={{
                                            duration: isHovered ? 99999 : 18,
                                            ease: "linear",
                                        }}
                                        key={`progress-${activeArcIndex}`}
                                    />
                                ) : idx < activeArcIndex ? (
                                    <div
                                        className="absolute inset-0 rounded-full opacity-50"
                                        style={{ backgroundColor: arc.color }}
                                    />
                                ) : null}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Hover pause indicator */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        className="absolute bottom-6 right-8 flex items-center gap-2 text-[11px] font-medium text-[#86868b]/40 z-20 select-none"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                    >
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-[#86868b]/30"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        Paused
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
