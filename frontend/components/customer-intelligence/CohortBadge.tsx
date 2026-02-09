"use client";

import React from 'react';
import { Users } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CohortBadgeProps {
    cohort: string;
    variant?: 'default' | 'mini' | 'glass';
    className?: string;
    animate?: boolean;
}

export function CohortBadge({
    cohort,
    variant = 'default',
    className,
    animate = true
}: CohortBadgeProps) {
    if (!cohort) return null;

    const baseStyles = "inline-flex items-center gap-1.5 font-black uppercase tracking-wider transition-all duration-300";

    const variants = {
        default: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px]",
        mini: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700/50 px-2 py-0.5 rounded-lg text-[9px]",
        glass: "bg-white/40 dark:bg-indigo-500/10 backdrop-blur-md text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] shadow-sm shadow-indigo-500/5"
    };

    const content = (
        <>
            <Users className={cn(
                variant === 'mini' ? "w-2.5 h-2.5" : "w-3 h-3",
                "opacity-70 group-hover:opacity-100 transition-opacity"
            )} />
            <span className="truncate max-w-[120px]">{cohort}</span>
        </>
    );

    if (!animate) {
        return (
            <div className={cn(baseStyles, variants[variant], "group", className)}>
                {content}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -1 }}
            className={cn(baseStyles, variants[variant], "group cursor-default", className)}
        >
            {content}
        </motion.div>
    );
}
