"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    FlaskConical,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
    type Study,
    type Industry,
    industryMeta,
    familyGradient,
    familyIcon,
} from "./study-explorer-shared";
// Re-export types for external consumers
export type { Study, Industry } from "./study-explorer-shared";

// ── Industry card (shared between rail + grid) ─

function IndustryCard({
    industry,
    count,
    onClick,
    index = 0,
    animateOnMount = false,
}: {
    industry: string;
    count: number;
    onClick: () => void;
    index?: number;
    animateOnMount?: boolean;
}) {
    const m = industryMeta[industry];
    if (!m) return null;
    const I = m.icon;

    const motionProps = animateOnMount
        ? {
            initial: { opacity: 0, scale: 0.92 } as const,
            animate: { opacity: 1, scale: 1 } as const,
            transition: { duration: 0.45, delay: index * 0.06, ease: "easeOut" as const },
        }
        : {
            initial: { opacity: 0, y: 16 } as const,
            whileInView: { opacity: 1, y: 0 } as const,
            viewport: { once: true, margin: "-20px" } as const,
            transition: { duration: 0.4, delay: (index % 7) * 0.05, ease: "easeOut" as const },
        };

    return (
        <motion.button
            {...motionProps}
            onClick={onClick}
            className={cn(
                "flex-shrink-0 w-[180px] h-[220px] rounded-2xl overflow-hidden",
                "flex flex-col relative",
                "hover:scale-[1.04] hover:z-10",
                "transition-all duration-300 cursor-pointer group",
                "border border-gray-200/50 dark:border-[#27272A]/50",
                "bg-white/70 dark:bg-[#18181B]/60 backdrop-blur-sm",
                "hover:shadow-[0_12px_36px_-6px_rgba(255,138,76,0.12)] dark:hover:shadow-[0_12px_36px_-6px_rgba(255,138,76,0.08)]",
                "hover:border-[#FF8A4C]/25 dark:hover:border-[#FF8A4C]/15"
            )}
        >
            {/* Hover ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF8A4C]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

            {/* Image / Icon area */}
            <div className="flex-1 flex items-center justify-center pt-3 pb-1 relative z-10">
                {m.image ? (
                    <div className={cn(
                        "relative w-[120px] h-[120px] group-hover:-translate-y-1 transition-all duration-500",
                        "rounded-2xl overflow-hidden",
                        "border border-gray-200/60 dark:border-[#27272A]",
                        "group-hover:border-[#FF8A4C]/30 group-hover:shadow-[0_8px_24px_-4px_rgba(255,138,76,0.15)]"
                    )}>
                        <img
                            src={`/images/study-explorer/${m.image}`}
                            alt={industry}
                            className="w-full h-full object-cover"
                        />
                        {/* Warm overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#FF8A4C]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                ) : (
                    <div className="relative w-20 h-20 group-hover:-translate-y-1 transition-all duration-500">
                        {/* Frosted glass shell */}
                        <div className="absolute inset-0 rounded-2xl bg-white/10 dark:bg-white/[0.06] backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] group-hover:shadow-[0_8px_24px_rgba(255,138,76,0.1)] transition-shadow duration-500" />
                        {/* Inner gradient */}
                        <div className="absolute inset-[3px] rounded-xl bg-gradient-to-br from-[#FF8A4C]/5 via-transparent to-[#FF8A4C]/3 dark:from-[#FF8A4C]/10 dark:to-[#FF8A4C]/5" />
                        {/* Icon */}
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <I className={cn("w-8 h-8 transition-colors duration-300", m.color, "group-hover:text-[#FF8A4C]")} />
                        </div>
                        {/* Reflection line */}
                        <div className="absolute top-2 left-3 right-3 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                )}
            </div>

            {/* Text area */}
            <div className="shrink-0 px-3 pb-4 pt-2 relative z-10">
                <h3 className="text-[13.5px] font-semibold text-foreground leading-snug text-center group-hover:text-[#FF8A4C] transition-colors duration-200">
                    {industry}
                </h3>
                <p className="text-[11.5px] text-muted-foreground mt-1 text-center font-medium">
                    {count} {count === 1 ? "study" : "studies"}
                </p>
            </div>
        </motion.button>
    );
}

// ── Industry rail (horizontal scroll) ──────────

function IndustryRail({
    title,
    items,
    onSelect,
    industryCounts,
}: {
    title: string;
    items: Industry[];
    onSelect: (industry: Industry) => void;
    industryCounts: Record<string, number>;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    const scroll = useCallback((dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
    }, []);

    return (
        <section className="min-w-0 px-8 overflow-hidden relative">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="flex items-center gap-3 mb-4 px-1"
            >
                <h2 className="text-[15px] font-bold text-foreground tracking-tight font-display">
                    {title}
                </h2>
                <div className="h-px bg-gradient-to-r from-gray-200 dark:from-zinc-700 to-transparent flex-1" />
            </motion.div>

            <div className="relative group/rail -mx-1">
                {canScrollLeft && (
                    <button
                        onClick={() => scroll("left")}
                        className={cn(
                            "absolute left-0 top-0 bottom-0 z-10 w-12",
                            "bg-gradient-to-r from-[#FAFAFA] dark:from-[#0C0C0E] to-transparent",
                            "flex items-center justify-start pl-1",
                            "opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
                        )}
                    >
                        <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-lg flex items-center justify-center border border-gray-200 dark:border-[#3F3F46]">
                            <ChevronLeft className="w-4 h-4 text-foreground" />
                        </div>
                    </button>
                )}

                <div
                    ref={scrollRef}
                    onScroll={updateArrows}
                    className="flex gap-3 overflow-x-auto scrollbar-show-on-hover pb-3 px-1 scroll-smooth"
                >
                    {items.map((industry, i) => (
                        <IndustryCard
                            key={industry}
                            industry={industry}
                            count={industryCounts[industry] || 0}
                            onClick={() => onSelect(industry)}
                            index={i}
                            animateOnMount
                        />
                    ))}
                </div>

                {canScrollRight && (
                    <button
                        onClick={() => scroll("right")}
                        className={cn(
                            "absolute right-0 top-0 bottom-0 z-10 w-12",
                            "bg-gradient-to-l from-[#FAFAFA] dark:from-[#0C0C0E] to-transparent",
                            "flex items-center justify-end pr-1",
                            "opacity-0 group-hover/rail:opacity-100 transition-opacity duration-200"
                        )}
                    >
                        <div className="w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-lg flex items-center justify-center border border-gray-200 dark:border-[#3F3F46]">
                            <ChevronRight className="w-4 h-4 text-foreground" />
                        </div>
                    </button>
                )}
            </div>
        </section>
    );
}

// ── Industry grid (wrapping rows) ──────────────

function IndustryGrid({
    title,
    items,
    onSelect,
    industryCounts,
}: {
    title: string;
    items: Industry[];
    onSelect: (industry: Industry) => void;
    industryCounts: Record<string, number>;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [itemsPerRow, setItemsPerRow] = useState(7);
    const [visibleRows, setVisibleRows] = useState(1);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const measure = () => {
            const cardWidth = 180;
            const gap = 12;
            const available = el.clientWidth;
            const count = Math.max(1, Math.floor((available + gap) / (cardWidth + gap)));
            setItemsPerRow(count);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const visibleCount = visibleRows * itemsPerRow;
    const visibleItems = items.slice(0, visibleCount);
    const hasMore = visibleCount < items.length;

    return (
        <section className="px-8">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 mb-4 px-1"
            >
                <h2 className="text-[15px] font-bold text-foreground tracking-tight font-display">
                    {title}
                </h2>
                <div className="h-px bg-gradient-to-r from-gray-200 dark:from-zinc-700 to-transparent flex-1" />
            </motion.div>

            <div ref={containerRef} className="flex flex-wrap gap-3 px-1">
                {visibleItems.map((industry, i) => (
                    <IndustryCard
                        key={industry}
                        industry={industry}
                        count={industryCounts[industry] || 0}
                        onClick={() => onSelect(industry)}
                        index={i}
                    />
                ))}
            </div>

            {(hasMore || visibleRows > 1) && (
                <div className="flex justify-center mt-5 gap-2">
                    {hasMore && (
                        <button
                            onClick={() => setVisibleRows((prev) => prev + 1)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-lg",
                                "text-[13px] font-medium text-muted-foreground",
                                "hover:text-[#FF8A4C] hover:bg-[#FF8A4C]/[0.04] dark:hover:bg-[#FF8A4C]/[0.06]",
                                "transition-all duration-200 active:scale-[0.98]",
                                "border border-transparent hover:border-[#FF8A4C]/15"
                            )}
                        >
                            <span>Show More</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {visibleRows > 1 && (
                        <button
                            onClick={() => setVisibleRows(1)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-lg",
                                "text-[13px] font-medium text-muted-foreground",
                                "hover:text-foreground hover:bg-muted/50",
                                "transition-all duration-200 active:scale-[0.98]",
                                "border border-transparent hover:border-gray-200 dark:hover:border-[#27272A]"
                            )}
                        >
                            <span>Collapse</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}

// ── Main component ─────────────────────────────

export function StudyExplorer() {
    const router = useRouter();

    // ── API Data State ──
    const [studies, setStudies] = useState<Study[]>([]);
    const [INDUSTRIES, setIndustries] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ── Fetch data from API ──
    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                setIsLoading(true);
                const [metaData, studiesData] = await Promise.all([
                    api.get("/studies/meta"),
                    api.get("/studies"),
                ]);

                if (cancelled) return;

                setIndustries(
                    metaData.industries.map((i: any) => i.name)
                );
                setStudies(studiesData);
            } catch (err) {
                console.error("Failed to load study data:", err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        fetchData();
        return () => { cancelled = true; };
    }, []);

    const selectIndustry = useCallback((industry: Industry) => {
        router.push(`/dashboard/studies/${encodeURIComponent(industry)}`);
    }, [router]);

    // Industry study counts
    const industryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const ind of INDUSTRIES) {
            counts[ind] = studies.filter((s) => s.industries.includes(ind)).length;
        }
        return counts;
    }, [INDUSTRIES, studies]);

    // Split industries for Popular vs Explore More
    const popularIndustries = useMemo(() => INDUSTRIES.slice(0, 7), [INDUSTRIES]);
    const exploreIndustries = useMemo(() => {
        const base = INDUSTRIES.slice(7);
        return [...base].slice(0, 18);
    }, [INDUSTRIES]);

    // ── Loading state ──
    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center w-full bg-[#FAFAFA] dark:bg-[#0C0C0E]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="h-8 w-8 animate-spin text-[#FF8A4C]" />
                    <p className="text-muted-foreground text-sm">Loading studies…</p>
                </motion.div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // RENDER — Industry Selection Landing
    // ═══════════════════════════════════════════════

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-screen flex flex-col overflow-hidden w-full bg-[#FAFAFA] dark:bg-[#0C0C0E] relative selection:bg-[#FF8A4C]/20"
        >
            {/* Ambient spotlight */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#FF8A4C]/[0.03] dark:bg-[#FF8A4C]/[0.02] blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute top-1/3 -right-32 w-64 h-64 bg-violet-500/[0.02] dark:bg-violet-500/[0.015] blur-[80px] rounded-full pointer-events-none" />

            {/* ──── Hero area ──── */}
            <div className="px-8 pt-10 pb-5 shrink-0 relative z-10">
                {/* Brand tag */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="flex items-center gap-2 mb-4"
                >
                    <div className="w-5 h-5 rounded bg-[#FF8A4C] flex items-center justify-center">
                        <img src="/brand/icon.svg" alt="" className="w-3.5 h-3.5 brightness-0 invert" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                        Research Catalog
                    </span>
                </motion.div>

                {/* Conversational headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-[32px] font-bold text-foreground tracking-tight leading-[1.15] font-display mb-2.5"
                >
                    What should you study{" "}
                    <span className="text-[#FF8A4C]">next?</span>
                </motion.h1>

                {/* Value proposition subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 }}
                    className="text-[14px] text-muted-foreground leading-relaxed max-w-md mb-4"
                >
                    <span className="text-foreground font-semibold">{studies.length} studies</span> across{" "}
                    <span className="text-foreground font-semibold">{INDUSTRIES.length} industries</span>,
                    organized by department, ranked by what moves the needle.
                    Pick an industry to get started.
                </motion.p>

                {/* Breathing gradient accent */}
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
                    className="origin-left"
                >
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="h-[2px] w-12 rounded-full bg-gradient-to-r from-[#FF8A4C] via-[#FF8A4C]/40 to-transparent"
                    />
                </motion.div>
            </div>

            {/* ──── Industry Rails ──── */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-subtle pb-8 space-y-6">
                <IndustryRail
                    title="Popular Industries"
                    items={popularIndustries}
                    onSelect={selectIndustry}
                    industryCounts={industryCounts}
                />
                {exploreIndustries.length > 0 && (
                    <IndustryGrid
                        title="Explore More"
                        items={exploreIndustries}
                        onSelect={selectIndustry}
                        industryCounts={industryCounts}
                    />
                )}
            </div>
        </motion.div>
    );
}
