"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityEntry, SentimentType } from "./types";

interface ActivityRowProps {
    entry: ActivityEntry;
    onClick?: (entry: ActivityEntry) => void;
}

const SENTIMENT_STYLES: Record<SentimentType, string> = {
    Positive: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20",
    Neutral: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/20",
    Negative: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:ring-rose-500/20",
};

export function ActivityRow({ entry, onClick }: ActivityRowProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={onClick ? () => onClick(entry) : undefined}
            className={cn(
                "rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-4 transition-colors hover:border-zinc-200 dark:hover:border-zinc-700",
                onClick && "cursor-pointer",
            )}
        >
            <div className="flex items-center gap-4">
                {/* Check icon */}
                <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                </div>

                {/* Lead info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {entry.leadName}
                    </p>
                    <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate">
                        {entry.leadCompany}
                    </p>
                </div>

                {/* Sentiment */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Sentiment
                    </span>
                    <span className={cn(
                        "text-[11px] font-bold px-2.5 py-0.5 rounded-full ring-1",
                        SENTIMENT_STYLES[entry.sentiment],
                    )}>
                        {entry.sentiment}
                    </span>
                </div>

                {/* Click affordance */}
                {onClick && (
                    <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                )}
            </div>
        </motion.div>
    );
}
