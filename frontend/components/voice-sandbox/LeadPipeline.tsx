"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, Inbox, ArrowRight } from "lucide-react";
import { LeadCard } from "./LeadCard";
import { cn } from "@/lib/utils";
import type { Lead, CohortAccent } from "./types";

interface LeadPipelineProps {
    leads: Lead[];
    totalCount: number;
    cohortLabel?: string;
    cohortAccent?: CohortAccent;
}

// ── Conversational status copy that changes with pipeline state ─────

function getStatusCopy(
    waitingCount: number,
    totalCount: number,
): { headline: string; sub: string } {
    if (waitingCount === 0) {
        return {
            headline: "Pipeline Clear",
            sub: "Every lead has been reached",
        };
    }
    if (waitingCount <= 3) {
        return {
            headline: "Almost Done",
            sub: `${waitingCount} lead${waitingCount !== 1 ? "s" : ""} remaining`,
        };
    }
    return {
        headline: "Lead Pipeline",
        sub: `${totalCount.toLocaleString()} waiting to connect`,
    };
}

// ── Component ───────────────────────────────────────────────────────

const ACCENT_CLASSES: Record<CohortAccent, { icon: string; bg: string; nextLabel: string }> = {
    emerald: {
        icon: "text-emerald-500 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        nextLabel: "text-emerald-500 dark:text-emerald-400",
    },
    violet: {
        icon: "text-violet-500 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-500/10",
        nextLabel: "text-violet-500 dark:text-violet-400",
    },
    rose: {
        icon: "text-rose-500 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-500/10",
        nextLabel: "text-rose-500 dark:text-rose-400",
    },
};

export function LeadPipeline({ leads, totalCount, cohortLabel, cohortAccent = "rose" }: LeadPipelineProps) {
    const accent = ACCENT_CLASSES[cohortAccent];
    const waitingLeads = useMemo(
        () => leads.filter((l) => l.status === "waiting"),
        [leads],
    );

    const [nextUp, ...queue] = waitingLeads;

    // ── First-render flag: stagger only fires on initial mount ──────
    const isFirstRender = useRef(true);
    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    // ── Scroll-fade state ───────────────────────────────────────────
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showTopFade, setShowTopFade] = useState(false);
    const [showBottomFade, setShowBottomFade] = useState(true);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const check = () => {
            setShowTopFade(el.scrollTop > 4);
            setShowBottomFade(
                el.scrollTop + el.clientHeight < el.scrollHeight - 4,
            );
        };

        check();
        el.addEventListener("scroll", check, { passive: true });
        return () => el.removeEventListener("scroll", check);
    }, [waitingLeads.length]);

    const defaultCopy = getStatusCopy(waitingLeads.length, totalCount);
    const headline = cohortLabel && waitingLeads.length > 0 ? cohortLabel : defaultCopy.headline;
    const sub = defaultCopy.sub;

    return (
        <div
            className="flex flex-col max-h-[480px] rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden"
            role="region"
            aria-label="Lead pipeline"
        >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="shrink-0 px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", accent.bg)}>
                        <Phone className={cn("w-4 h-4", accent.icon)} />
                    </div>

                    {waitingLeads.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">
                                {waitingLeads.length} in queue
                            </span>
                        </div>
                    )}
                </div>

                <motion.h2
                    key={headline}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight"
                >
                    {headline}
                </motion.h2>
                <motion.p
                    key={sub}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5"
                >
                    {sub}
                </motion.p>
            </div>

            {/* ── Next Up spotlight ───────────────────────────────────── */}
            {nextUp && (
                <div className="shrink-0 px-3 pb-2">
                    <div className="flex items-center gap-1.5 px-2 pb-1.5">
                        <ArrowRight className={cn("w-3 h-3", accent.nextLabel)} />
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", accent.nextLabel)}>
                            Next up
                        </span>
                    </div>
                    <AnimatePresence mode="popLayout">
                        <LeadCard key={nextUp.id} lead={nextUp} variant="next-up" />
                    </AnimatePresence>
                </div>
            )}

            {/* ── Divider ────────────────────────────────────────────── */}
            {queue.length > 0 && (
                <div className="shrink-0 mx-5 border-t border-zinc-100 dark:border-zinc-800" />
            )}

            {/* ── Scrollable queue ───────────────────────────────────── */}
            {queue.length > 0 && (
                <div className="flex-1 min-h-0 relative">
                    {/* Top scroll fade */}
                    <div
                        className={cn(
                            "absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none transition-opacity duration-200",
                            showTopFade ? "opacity-100" : "opacity-0",
                        )}
                    />

                    <div
                        ref={scrollRef}
                        className="h-full overflow-y-auto scrollbar-subtle px-3 py-2"
                        role="list"
                        aria-label={`${queue.length} leads queued`}
                    >
                        {/* flex + gap instead of space-y — avoids margin
                            conflicts with layout="position" reflow */}
                        <div className="flex flex-col gap-1.5">
                            <AnimatePresence mode="popLayout">
                                {queue.map((lead, i) => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        variant={lead.score >= 80 ? "hot" : "default"}
                                        staggerIndex={isFirstRender.current ? i : 0}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Bottom scroll fade */}
                    <div
                        className={cn(
                            "absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none transition-opacity duration-200",
                            showBottomFade ? "opacity-100" : "opacity-0",
                        )}
                    />
                </div>
            )}

            {/* ── Empty state ────────────────────────────────────────── */}
            {waitingLeads.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center"
                >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                        <Inbox className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        All caught up
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
                        Every lead in the pipeline has been reached by an agent
                    </p>
                </motion.div>
            )}
        </div>
    );
}
