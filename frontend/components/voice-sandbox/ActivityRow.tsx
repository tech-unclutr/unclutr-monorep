"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityEntry, SentimentType } from "./types";

interface ActivityRowProps {
    entry: ActivityEntry;
}

const SENTIMENT_STYLES: Record<SentimentType, string> = {
    Positive: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/20",
    Neutral: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/20",
    Negative: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:ring-rose-500/20",
};

export function ActivityRow({ entry }: ActivityRowProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-4 transition-colors hover:border-zinc-200 dark:hover:border-zinc-700"
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

                {/* Insights toggle */}
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shrink-0"
                >
                    Insights
                    <ChevronDown className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        expanded && "rotate-180",
                    )} />
                </button>
            </div>

            {/* Expanded insights (placeholder) */}
            {expanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800"
                >
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Interview insights and key takeaways will appear here once processing is complete.
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}
