"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeadCard } from "./LeadCard";
import type { Agent, Lead } from "./types";

interface AgentCardProps {
    agent: Agent;
    currentLead: Lead | null;
}

const ICON_MAP = {
    sparkles: Sparkles,
    settings: Settings,
    zap: Zap,
} as const;

const ACCENT_STYLES: Record<string, {
    ring: string;
    dot: string;
    bg: string;
    activeBg: string;
    activeBorder: string;
}> = {
    emerald: {
        ring: "ring-emerald-400 dark:ring-emerald-500",
        dot: "bg-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        activeBg: "bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-500/5 dark:to-zinc-950",
        activeBorder: "border-emerald-200/60 dark:border-emerald-500/15",
    },
    violet: {
        ring: "ring-violet-400 dark:ring-violet-500",
        dot: "bg-violet-500",
        bg: "bg-violet-50 dark:bg-violet-500/10",
        activeBg: "bg-gradient-to-b from-violet-50/50 to-white dark:from-violet-500/5 dark:to-zinc-950",
        activeBorder: "border-violet-200/60 dark:border-violet-500/15",
    },
    rose: {
        ring: "ring-rose-400 dark:ring-rose-500",
        dot: "bg-rose-400 dark:bg-rose-500",
        bg: "bg-rose-50 dark:bg-rose-500/10",
        activeBg: "bg-gradient-to-b from-rose-50/50 to-white dark:from-rose-500/5 dark:to-zinc-950",
        activeBorder: "border-rose-200/60 dark:border-rose-500/15",
    },
};

export function AgentCard({ agent, currentLead }: AgentCardProps) {
    const Icon = ICON_MAP[agent.icon];
    const accent = ACCENT_STYLES[agent.accentColor] ?? ACCENT_STYLES.emerald;
    const isProcessing = agent.status === "processing" && currentLead;

    return (
        <motion.div
            layout
            className={cn(
                "rounded-xl border p-3.5 transition-all",
                isProcessing
                    ? cn(accent.activeBg, accent.activeBorder, "shadow-sm")
                    : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 border-dashed",
            )}
        >
            {/* Agent row — horizontal: avatar + name + status */}
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center ring-2 relative shrink-0",
                    accent.ring,
                    accent.bg,
                )}>
                    <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
                    {/* Status dot */}
                    <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950",
                        isProcessing ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600",
                    )} />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {agent.name}
                    </h3>
                    <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wider truncate",
                        isProcessing
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-400 dark:text-zinc-500",
                    )}>
                        {isProcessing ? "On Call" : "Available"}
                    </p>
                </div>

                {isProcessing && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                )}
            </div>

            {/* Current lead (compact) */}
            {isProcessing && currentLead && (
                <div className="mt-3">
                    <LeadCard lead={currentLead} compact />
                </div>
            )}
        </motion.div>
    );
}
