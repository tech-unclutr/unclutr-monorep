"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flame, Phone } from "lucide-react";
import type { Lead } from "./types";

export type LeadCardVariant = "default" | "hot" | "next-up";

interface LeadCardProps {
    lead: Lead;
    /** Compact variant used inside agent cards */
    compact?: boolean;
    /** Visual treatment: next-up (spotlight), hot (high score), default */
    variant?: LeadCardVariant;
    /** Mount-only stagger delay in seconds — ignored after initial render */
    staggerIndex?: number;
}

// ── Animation variants ──────────────────────────────────────────────
//
// Key insight: entry/exit use ONLY opacity (+ subtle scale). No x/y
// transforms — those fight with layout="position" and cause jank.
// Layout reflow (cards sliding up to fill a gap) is handled entirely
// by the spring on the `layout` prop.

const EASE_OUT: [number, number, number, number] = [0, 0, 0.2, 1];
const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];

/** Queue cards: fade in on mount (with optional stagger), fade+shrink on exit */
const queueVariants = {
    initial: { opacity: 0 },
    animate: (mountDelay: number) => ({
        opacity: 1,
        transition: {
            opacity: { duration: 0.2, delay: mountDelay, ease: EASE_OUT },
        },
    }),
    exit: {
        opacity: 0,
        scale: 0.96,
        transition: { duration: 0.15, ease: EASE_IN },
    },
};

/** Next-up card: scale in from 0.98, "pop out" (scale 1.02) on exit */
const nextUpVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.25, ease: EASE_OUT },
    },
    exit: {
        opacity: 0,
        scale: 1.02,
        transition: { duration: 0.2, ease: EASE_IN },
    },
};

/** Shared spring for layout reflow — snappy, no bounce */
const layoutSpring = {
    type: "spring" as const,
    stiffness: 500,
    damping: 35,
};

// ── Helpers ─────────────────────────────────────────────────────────

function scoreColor(score: number): string {
    if (score >= 70)
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20";
    if (score >= 50)
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20";
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 ring-zinc-200 dark:ring-zinc-700";
}

function avatarColor(name: string): string {
    const colors = [
        "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
        "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
        "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

// ── Component ───────────────────────────────────────────────────────

export function LeadCard({
    lead,
    compact = false,
    variant = "default",
    staggerIndex = 0,
}: LeadCardProps) {
    // ── Compact variant (used inside AgentCard) ─────────────────────
    if (compact) {
        return (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide truncate">
                        {lead.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        {lead.company}
                    </p>
                </div>
                <AudioWaveform />
            </div>
        );
    }

    // ── Full variant ────────────────────────────────────────────────
    const isNextUp = variant === "next-up";
    const isHot = variant === "hot";
    const variants = isNextUp ? nextUpVariants : queueVariants;

    return (
        <motion.div
            layout="position"
            custom={staggerIndex * 0.04}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ layout: layoutSpring }}
            role="listitem"
            className={cn(
                "flex items-center gap-3 rounded-xl border transition-colors duration-200",
                isNextUp
                    ? "px-4 py-3.5 bg-gradient-to-r from-rose-50/80 via-white to-white dark:from-rose-500/[0.06] dark:via-zinc-950 dark:to-zinc-950 border-rose-200/60 dark:border-rose-500/15 shadow-[0_0_12px_rgba(244,63,94,0.06)]"
                    : isHot
                        ? "px-4 py-3 bg-white dark:bg-zinc-950 border-amber-200/50 dark:border-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/20"
                        : "px-4 py-3 bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700",
            )}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <div
                    className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                        avatarColor(lead.name),
                    )}
                >
                    {lead.name.charAt(0).toUpperCase()}
                </div>

                {/* Pulsing phone badge on next-up card */}
                {isNextUp && (
                    <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 dark:bg-rose-400 flex items-center justify-center border-2 border-white dark:border-zinc-950"
                    >
                        <Phone className="w-2 h-2 text-white dark:text-zinc-950" />
                    </motion.div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p
                        className={cn(
                            "text-sm font-semibold truncate",
                            isNextUp
                                ? "text-zinc-900 dark:text-white"
                                : "text-zinc-800 dark:text-zinc-200",
                        )}
                    >
                        {lead.name}
                    </p>
                    {isHot && (
                        <Flame className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
                    )}
                </div>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide truncate">
                    {lead.company}
                </p>
            </div>

            {/* Score */}
            <span
                className={cn(
                    "text-xs font-bold tabular-nums px-2.5 py-1 rounded-full ring-1 shrink-0",
                    scoreColor(lead.score),
                )}
            >
                {lead.score}
            </span>
        </motion.div>
    );
}

// ── Audio waveform icon (animated bars) ─────────────────────────────

function AudioWaveform() {
    return (
        <div className="flex items-end gap-[2px] h-5">
            {[3, 5, 2, 5, 3, 4, 2].map((h, i) => (
                <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-emerald-500 dark:bg-emerald-400"
                    animate={{
                        height: [
                            `${h * 3}px`,
                            `${(h + 2) * 3}px`,
                            `${h * 3}px`,
                        ],
                    }}
                    transition={{
                        duration: 0.8 + i * 0.1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.08,
                    }}
                />
            ))}
        </div>
    );
}
