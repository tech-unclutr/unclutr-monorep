"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Zap, ChevronUp, Sparkles } from "lucide-react";
import { trackEvent, EventName } from "@/lib/analytics";

const SOLUTIONS = [
    {
        label: "Why SquareUp",
        description: "THE PROBLEM WE SOLVE",
        badge: null,
        href: "#problem",
    },
    {
        label: "Interview Studio",
        description: "AI-POWERED RESEARCH AGENTS",
        badge: null,
        href: "#interview-studio",
    },
    {
        label: "Studies",
        description: "REAL CUSTOMER INSIGHTS",
        badge: null,
        href: "#studies",
    },
];

export default function FloatingNav() {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [hidden, setHidden] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setActiveTab(null);
        };

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setActiveTab(null);
            }
        };

        const checkVisibility = () => {
            const hasModal = document.documentElement.hasAttribute("data-study-modal");
            const footer = document.querySelector('[data-section-name="footer"]');

            if (footer) {
                const rect = footer.getBoundingClientRect();
                // Hide the nav when the footer top is within 120px of the viewport bottom
                // (nav is ~69px tall from bottom, so this gives a comfortable buffer)
                if (rect.top <= window.innerHeight - 120) {
                    setHidden(true);
                    return;
                }
            }

            setHidden(hasModal);
        };

        // Watch for study modal attribute changes
        const mutationObserver = new MutationObserver(checkVisibility);
        mutationObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-study-modal"] });

        // Check on scroll for footer visibility
        window.addEventListener("scroll", checkVisibility, { passive: true });

        // Initial checks
        checkVisibility();
        // Fallback check after full render
        const initTimeout = setTimeout(checkVisibility, 500);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("touchstart", handleClickOutside);
        window.addEventListener("mousedown", handleClickOutside);

        return () => {
            mutationObserver.disconnect();
            window.removeEventListener("scroll", checkVisibility);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("touchstart", handleClickOutside);
            window.removeEventListener("mousedown", handleClickOutside);
            clearTimeout(initTimeout);
        };
    }, []);

    if (!mounted) return null;

    const handleMouseEnter = () => {
        if (!window.matchMedia("(hover: hover)").matches) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveTab("solutions");
    };

    const handleMouseLeave = () => {
        if (!window.matchMedia("(hover: hover)").matches) return;
        timeoutRef.current = setTimeout(() => {
            setActiveTab(null);
        }, 150);
    };

    const handleToggle = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const newState = activeTab === "solutions" ? null : "solutions";
        trackEvent(EventName.NAV_DROPDOWN_TOGGLE, { state: newState ? "open" : "close", method: "click" });
        setActiveTab(newState);
    };

    const scrollToTop = () => {
        trackEvent(EventName.NAV_SCROLL_TO_TOP);
        window.scrollTo({ top: 0, behavior: "smooth" });
        setActiveTab(null);
    };

    return (
        <AnimatePresence>
            {!hidden && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    ref={containerRef}
                    className="fixed z-50 left-0 right-0 flex justify-center"
                    style={{
                        bottom: "calc(19px + env(safe-area-inset-bottom, 0px))",
                    }}
                    onMouseLeave={handleMouseLeave}
                >
                    <nav
                        aria-label="Main navigation"
                        className="relative text-white border border-white/20 backdrop-blur-md flex flex-col items-center w-[calc(100%-32px)] max-w-[400px]"
                        style={{
                            background: "linear-gradient(to right, #FF5A36, #FF914D)",
                            borderRadius: "24px",
                            boxShadow: "0 18px 60px rgba(255,107,0,0.15), 0 0 0 1px rgba(255,255,255,0.1)",
                        }}
                    >
                        <AnimatePresence>
                            {activeTab === "solutions" && (
                                <motion.div
                                    key="submenu"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15, ease: "linear" }}
                                    className="w-full px-5 pt-6 pb-4"
                                    onMouseEnter={handleMouseEnter}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 space-y-1">
                                            {SOLUTIONS.map((item) => (
                                                <button
                                                    key={item.label}
                                                    onClick={() => {
                                                        trackEvent(EventName.NAV_CLICK, { nav_item: item.label, nav_type: "solution", target_section: item.href });
                                                        const el = document.querySelector(item.href);
                                                        if (el) el.scrollIntoView({ behavior: "smooth" });
                                                        setActiveTab(null);
                                                    }}
                                                    className="group block w-full text-left outline-none h-[44px] sm:h-[54px] flex flex-col justify-center px-3 rounded-xl transition-colors hover:bg-white/10 active:scale-[0.98]"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[13px] font-bold tracking-tight text-white leading-none">{item.label}</span>
                                                        {item.badge && (
                                                            <span className="text-[9px] bg-white/30 px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest text-white">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-white/50 leading-tight mt-1 group-hover:text-white/80 transition-colors uppercase tracking-tight">
                                                        {item.description}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <Sparkles size={24} className="text-white/60 group-hover:text-white transition-colors relative z-10" />
                                        </div>
                                    </div>

                                    <div className="w-full h-[1px] bg-white/10 mt-4" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center px-2 py-1.5 h-[50px] w-full gap-1.5 rounded-b-[24px]">
                            <div className="flex items-center justify-center w-[44px] shrink-0">
                                <button
                                    onClick={scrollToTop}
                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 transition-all active:scale-90"
                                    title="Home"
                                >
                                    <Home size={20} />
                                </button>
                            </div>

                            <div className="w-[1px] h-5 bg-white/20 shrink-0" />

                            <div className="flex-1 flex items-center h-full">
                                <button
                                    onClick={handleToggle}
                                    onMouseEnter={handleMouseEnter}
                                    aria-expanded={activeTab === "solutions"}
                                    aria-label="Our Solutions menu"
                                    className={`w-full h-full flex items-center justify-center gap-2 rounded-[18px] cursor-pointer transition-colors border-none bg-transparent text-white ${activeTab === "solutions" ? "bg-white/30" : "hover:bg-white/10"}`}
                                >
                                    <span className="font-bold text-[13px] tracking-tight whitespace-nowrap uppercase">Our Solutions</span>
                                    <ChevronUp size={14} className={`transition-transform duration-200 ${activeTab === "solutions" ? "rotate-180" : ""}`} />
                                </button>
                            </div>

                            <div className="w-[1px] h-5 bg-white/20 shrink-0" />

                            <div className="flex-1 flex items-center h-[44px] relative group transition-all hover:scale-[1.02] active:scale-95">
                                <div className="absolute -inset-[2px] rounded-[20px] overflow-hidden pointer-events-none">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div
                                            className="animate-spin"
                                            style={{
                                                width: '200%',
                                                aspectRatio: '1',
                                                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 260deg, #ffffff 290deg, #ff6b00 330deg, #ff9f43 350deg, transparent 360deg)',
                                                animationDuration: '2.5s',
                                            }}
                                        />
                                    </div>
                                </div>
                                <a
                                    href="/pilot"
                                    onClick={() => trackEvent(EventName.CTA_CLICK, { cta_text: "Book Pilot", cta_href: "/pilot", source_section: "floating_nav", cta_position: "nav_bar" })}
                                    className="relative bg-white w-full h-full rounded-[18px] font-bold text-[13px] flex items-center justify-center gap-2 z-10"
                                >
                                    <Zap size={14} className="fill-current text-brand-orange" />
                                    <span className="uppercase tracking-tight whitespace-nowrap text-brand-orange">Book Pilot</span>
                                </a>
                            </div>
                        </div>
                    </nav>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
