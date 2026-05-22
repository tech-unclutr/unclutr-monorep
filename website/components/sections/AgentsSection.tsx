"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, useScroll, useMotionValueEvent } from "framer-motion";
import Image from "next/image";
import AgentVideoCard from "../ui/AgentVideoCard";
import { useIsMobile } from "../ui/useIsMobile";
import { useRegisterParticleTargets } from "../ui/particles/useRegisterParticleTargets";
import { RefObject } from "react";
import { useSectionVisibility, useCarouselTracking } from "@/lib/analytics";


const agentsData = [
    {
        name: "Pulse",
        video: "/agent-videos/pulse.mp4",
        poster: "/posters/pulse.webp",
        description: "Books meetings and qualifies leads at scale with voice AI.",
    },
    {
        name: "Yoda",
        video: "/agent-videos/yoda.mp4",
        poster: "/posters/yoda.webp",
        description: "Turns every conversation into a structured data set.",
    },
    {
        name: "Sage",
        video: "/agent-videos/sage.mp4",
        poster: "/posters/sage.webp",
        description: "Synthesizes millions of data points into clear Intelligence Briefs.",
    },
    {
        name: "Atlas",
        video: "/agent-videos/atlas.mp4",
        poster: "/posters/atlas.webp",
        description: "Turns scattered calls into an instant knowledge base.",
    },
    {
        name: "Kairo",
        video: "/agent-videos/kairo.mp4",
        poster: "/posters/kairo.webp",
        description: "Routes intelligence directly to the people who can fix it.",
    },
];

const AUTO_ADVANCE_INTERVAL = 6000;
const getGap = (width: number) => width < 640 ? 16 : width < 1024 ? 32 : 56;


export default function AgentsSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const inView = useInView(sectionRef, { once: true, amount: 0.3 });
    const isMobile = useIsMobile();
    useSectionVisibility("agents", sectionRef);

    const [activeAgentIndex, setActiveAgentIndex] = useState(0);
    const { trackTransition: trackAgentCarousel, trackAutoplay: trackAgentAutoplay } = useCarouselTracking(
        "agents", activeAgentIndex, agentsData.map(a => a.name)
    );

    // Register particle targets
    useRegisterParticleTargets("agents", sectionRef as unknown as RefObject<HTMLElement>, [".particle-target-agents"], inView);


    const carouselContainerRef = useRef<HTMLDivElement>(null);
    const [cardWidth, setCardWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    const measureCards = useCallback(() => {
        const container = carouselContainerRef.current;
        if (!container) return;
        const cw = container.offsetWidth;
        setContainerWidth(cw);
        const ratio = cw < 480 ? 0.88 : cw < 768 ? 0.82 : cw < 1024 ? 0.72 : 0.68;
        setCardWidth(Math.round(cw * ratio));
    }, []);

    useEffect(() => {
        measureCards();
        const observer = new ResizeObserver(() => measureCards());
        if (carouselContainerRef.current) {
            observer.observe(carouselContainerRef.current);
        }
        return () => observer.disconnect();
    }, [measureCards]);


    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { scrollXProgress } = useScroll({ container: scrollContainerRef });
    const isUserScrolling = useRef(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useMotionValueEvent(scrollXProgress, "change", (progress) => {
        if (!isUserScrolling.current) return;
        const rawIndex = Math.floor(progress * agentsData.length);
        const clampedIndex = Math.min(Math.max(rawIndex, 0), agentsData.length - 1);
        if (clampedIndex !== activeAgentIndex) {
            setActiveAgentIndex(clampedIndex);
        }
    });


    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            isUserScrolling.current = true;
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => {
                isUserScrolling.current = false;
            }, 150);
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);


    const scrollToAgent = useCallback((index: number) => {
        const container = scrollContainerRef.current;
        if (!container || cardWidth === 0) return;
        const g = getGap(containerWidth);
        const peekWidth = Math.max((containerWidth - cardWidth) / 2 - g, 0);
        const targetX = index * (cardWidth + g) - peekWidth;
        container.scrollTo({ left: targetX, behavior: "smooth" });
    }, [cardWidth, containerWidth]);


    const tabContainerRef = useRef<HTMLDivElement>(null);
    const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

    const measurePill = useCallback((index: number) => {
        const container = tabContainerRef.current;
        const btn = tabButtonRefs.current[index];
        if (container && btn) {
            const cRect = container.getBoundingClientRect();
            const bRect = btn.getBoundingClientRect();
            setPillStyle({ left: bRect.left - cRect.left, width: bRect.width });
        }
    }, []);

    useEffect(() => {
        measurePill(activeAgentIndex);
    }, [activeAgentIndex, measurePill]);

    useEffect(() => {
        const handleResize = () => measurePill(activeAgentIndex);
        window.addEventListener("resize", handleResize);
        const t = setTimeout(() => measurePill(activeAgentIndex), 50);
        return () => {
            window.removeEventListener("resize", handleResize);
            clearTimeout(t);
        };
    }, [activeAgentIndex, measurePill]);


    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startAutoAdvance = useCallback(() => {
        stopAutoAdvance();
        autoTimerRef.current = setInterval(() => {
            setActiveAgentIndex((prev) => {
                const next = (prev + 1) % agentsData.length;
                trackAgentCarousel(next, "autoplay");
                return next;
            });
        }, AUTO_ADVANCE_INTERVAL);

    }, [trackAgentCarousel]);

    const stopAutoAdvance = () => {
        if (autoTimerRef.current) {
            clearInterval(autoTimerRef.current);
            autoTimerRef.current = null;
        }
    };

    useEffect(() => {
        if (isAutoPlaying) {
            startAutoAdvance();
        } else {
            stopAutoAdvance();
        }
        return stopAutoAdvance;
    }, [isAutoPlaying, startAutoAdvance]);


    const switchAgent = useCallback(
        (newIndex: number, method: "click" | "swipe" | "keyboard" | "dot" = "click") => {
            if (newIndex === activeAgentIndex) return;
            trackAgentCarousel(newIndex, method);
            isUserScrolling.current = false;
            setActiveAgentIndex(newIndex);
            scrollToAgent(newIndex);
            // Focus section for keyboard nav
            sectionRef.current?.focus();
            if (isAutoPlaying) {
                startAutoAdvance();
            }
        },
        [activeAgentIndex, isAutoPlaying, startAutoAdvance, scrollToAgent, trackAgentCarousel]
    );

    useEffect(() => {
        if (!isUserScrolling.current) {
            scrollToAgent(activeAgentIndex);
        }
    }, [activeAgentIndex, scrollToAgent]);

    // Keyboard navigation for left/right arrows
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = activeAgentIndex === 0 ? agentsData.length - 1 : activeAgentIndex - 1;
            trackAgentCarousel(prevIndex, "keyboard");
            setActiveAgentIndex(prevIndex);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = (activeAgentIndex + 1) % agentsData.length;
            trackAgentCarousel(nextIndex, "keyboard");
            setActiveAgentIndex(nextIndex);
        }
    }, [activeAgentIndex, trackAgentCarousel]);

    const carouselSpring = { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 };


    const gap = getGap(containerWidth);
    const totalTrackWidth = agentsData.length * cardWidth + (agentsData.length - 1) * gap;
    const peekWidth = Math.max((containerWidth - cardWidth) / 2 - gap, 0);
    const paddingForPeek = Math.max(peekWidth * 0.6, gap);

    return (
        <div
            ref={sectionRef}
            id="agents"
            tabIndex={0}
            role="region"
            aria-label="AI Agents carousel"
            onKeyDown={handleKeyDown}
            onClick={() => sectionRef.current?.focus()}
            className="relative flex flex-col items-center overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
            style={{ paddingTop: "clamp(80px, 10vh, 120px)", paddingBottom: "40px" }}
        >

            {/* Header Text Stagger */}
            <motion.div
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                variants={{
                    hidden: {},
                    visible: {
                        transition: {
                            staggerChildren: 0.15,
                        }
                    }
                }}
                className="text-center mb-8 px-4 relative z-10"
            >
                <motion.h2
                    variants={{
                        hidden: { opacity: 0, y: 40, filter: "blur(8px)", scale: 0.98 },
                        visible: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                    }}
                    className="font-display text-[clamp(28px,6vw,76px)] md:text-[clamp(44px,6vw,76px)] tracking-[-0.04em] text-[#0b132b] leading-[1.05] pointer-events-none max-w-4xl mx-auto text-balance"
                >
                    SquareUp makes customer
                    <br />
                    understanding <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A36] to-[#FF8A66]">a system.</span>
                </motion.h2>
                <motion.p
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                    }}
                    className="mt-6 text-lg sm:text-xxl text-[#606060] font-medium tracking-[-0.01em] max-w-3xl mx-auto"
                >
                    Companies recruit the right participants effortlessly, conduct research autonomously, and deliver user insights that drive actual decisions at lightning speed.
                </motion.p>
            </motion.div>

            {/* Pills Nav */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
                animate={inView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : {}}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="flex items-center justify-center mb-8 px-4 relative z-10"
            >
                <div
                    ref={tabContainerRef}
                    className="relative inline-flex gap-0 p-[3px] rounded-full overflow-hidden"
                    style={{
                        background: "linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.14) 60%, rgba(255,255,255,0.25) 100%)",
                        backdropFilter: "blur(48px) saturate(2.0)",
                        WebkitBackdropFilter: "blur(48px) saturate(2.0)",
                        boxShadow: "0 16px 56px -8px rgba(0,0,0,0.08), 0 6px 20px rgba(0,0,0,0.03), 0 0 0 1px rgba(255,255,255,0.25), inset 0 1px 2px rgba(255,255,255,0.60), inset 0 -1px 2px rgba(0,0,0,0.02)",
                    }}
                >
                    <div
                        className="absolute inset-0 pointer-events-none rounded-full"
                        style={{
                            background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 50%, transparent 70%, rgba(255,255,255,0.08) 100%)",
                        }}
                    />
                    <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none rounded-full"
                        style={{ background: "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.45) 50%, transparent 90%)", filter: "blur(0.5px)" }} />
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none rounded-full"
                        style={{ background: "linear-gradient(90deg, transparent 15%, rgba(0,0,0,0.02) 50%, transparent 85%)", filter: "blur(0.5px)" }} />

                    <motion.div
                        className="absolute top-[3px] bottom-[3px] rounded-full z-0"
                        animate={{ left: pillStyle.left, width: pillStyle.width }}
                        transition={carouselSpring}
                        style={{
                            background: "linear-gradient(135deg, rgba(255,90,54,0.10) 0%, rgba(255,120,80,0.05) 100%)",
                            boxShadow: "0 0 16px rgba(255,90,54,0.06), 0 0 0 1px rgba(255,90,54,0.10), inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -1px 1px rgba(255,90,54,0.04)",
                        }}
                    />

                    {agentsData.map((agent, i) => {
                        const isActive = activeAgentIndex === i;
                        return (
                            <motion.button
                                ref={(el: HTMLButtonElement | null) => { tabButtonRefs.current[i] = el; }}
                                key={agent.name}
                                onClick={() => switchAgent(i)}
                                whileHover={{ scale: isActive ? 1 : 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                className="relative z-10 px-4 sm:px-6 md:px-8 py-2 rounded-full text-[13px] sm:text-[14px] font-semibold transition-colors duration-300 cursor-pointer border-none outline-none bg-transparent text-center whitespace-nowrap"
                                style={{
                                    color: isActive ? "#FF5A36" : "rgba(11,19,43,0.45)",
                                    letterSpacing: "0.02em",
                                    fontWeight: isActive ? 700 : 500,
                                }}
                            >
                                {agent.name}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Dynamic Background Halo Layer */}
            <motion.div
                className="absolute top-[50%] left-1/2 w-[900px] h-[600px] rounded-full blur-[180px] pointer-events-none opacity-15"
                animate={{
                    background: `radial-gradient(ellipse 60% 50% at center, ${['#FF8A66', '#FFB199', '#FF5A36', '#FF8A66', '#FF5A36'][activeAgentIndex]} 0%, transparent 65%)`,
                    x: "-50%",
                    y: "-50%",
                    scale: [1, 1.05, 1]
                }}
                transition={{
                    background: { duration: 1.2 },
                    scale: { duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }
                }}
            />

            {/* Carousel Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="w-full relative z-10"
                ref={carouselContainerRef}
            >
                <div
                    ref={scrollContainerRef}
                    className="relative w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
                    style={{
                        scrollSnapType: "x mandatory",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    <div
                        className="carousel-track flex items-center"
                        style={{
                            gap: gap,
                            paddingLeft: paddingForPeek,
                            paddingRight: paddingForPeek,
                            width: totalTrackWidth + paddingForPeek * 2,
                        }}
                    >
                        {agentsData.map((agent, i) => {
                            const isActive = activeAgentIndex === i;
                            const isAdjacent = Math.abs(activeAgentIndex - i) === 1;
                            return (
                                <div
                                    key={agent.name}
                                    className="flex-shrink-0 particle-target-agents"
                                    style={{
                                        width: cardWidth,
                                        scrollSnapAlign: "center",
                                    }}
                                >
                                    <AgentVideoCard
                                        name={agent.name}
                                        videoSrc={agent.video}
                                        posterSrc={agent.poster}
                                        description={agent.description}
                                        isActive={isActive}
                                        isAdjacent={isAdjacent}
                                        cardWidth={cardWidth}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            { }
            <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-center justify-center gap-2 mt-5 flex-shrink-0"
            >
                <div className="flex items-center gap-[8px]">
                    {agentsData.map((_, i) => {
                        const isActive = activeAgentIndex === i;
                        return (
                            <motion.button
                                key={i}
                                onClick={() => switchAgent(i, "dot")}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label={`Go to agent ${i + 1} of ${agentsData.length}`}
                                className="rounded-full cursor-pointer border-none outline-none p-0"
                                animate={{
                                    width: isActive ? (isMobile ? 24 : 32) : (isMobile ? 6 : 8),
                                    backgroundColor: isActive
                                        ? "#0b132b"
                                        : "rgba(11,19,43,0.15)",
                                }}
                                transition={carouselSpring}
                                style={{ height: isMobile ? 6 : 8 }}
                            />
                        );
                    })}
                </div>

                <button
                    onClick={() => {
                        setIsAutoPlaying((prev) => {
                            trackAgentAutoplay(prev ? "pause" : "start", prev ? "click" : undefined);
                            return !prev;
                        });
                    }}
                    aria-label={isAutoPlaying ? "Pause auto-advance" : "Start auto-advance"}
                    className="ml-2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer outline-none bg-transparent"
                    style={{ boxShadow: "0 0 0 1.5px rgba(11,19,43,0.10), 0 2px 8px rgba(11,19,43,0.04)" }}
                >
                    {isAutoPlaying ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <rect x="1" y="1" width="3" height="8" rx="0.5" fill="#0b132b" />
                            <rect x="6" y="1" width="3" height="8" rx="0.5" fill="#0b132b" />
                        </svg>
                    ) : (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 1.5L8.5 5L2 8.5V1.5Z" fill="#0b132b" />
                        </svg>
                    )}
                </button>
            </motion.div>
        </div>
    );
}
