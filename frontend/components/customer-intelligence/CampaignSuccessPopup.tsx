"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, RotateCcw, Loader2, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CampaignSuccessStats {
    total_leads?: number;
    completed: number;
    targets_met?: number;
    success_rate: number;
    cohort_progress?: Record<string, {
        target: number;
        completed: number;
        is_complete: boolean;
    }>;
    total_calls?: number;
    call_distribution?: Record<string, number>;
}

interface CampaignSuccessPopupProps {
    isOpen: boolean;
    onClose: () => void;
    stats?: CampaignSuccessStats;
    onReset?: () => void;
    onComplete?: () => void;
    isExhausted?: boolean;
    onReplenish?: () => void;
}

export function CampaignSuccessPopup({ isOpen, onClose, stats, onReset, onComplete, isExhausted, onReplenish }: CampaignSuccessPopupProps) {
    const [isResetting, setIsResetting] = React.useState(false);

    const handleReset = async () => {
        if (onReset) {
            setIsResetting(true);
            try {
                await onReset();
            } finally {
                setIsResetting(false);
            }
        }
    };

    const handleReplenish = async () => {
        if (onReplenish) {
            setIsResetting(true);
            try {
                await onReplenish();
            } finally {
                setIsResetting(false);
            }
        }
    }

    if (!stats) return null;

    // Theme Configuration
    const theme = isExhausted
        ? {
            bgGradient: "bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1),rgba(217,119,6,0.05),transparent_60%)]",
            colors: ['#f59e0b', '#d97706', '#fcd34d'],
            personaBadge: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
            iconBg: "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20",
            icon: Sparkles,
            title: "Leads Exhausted",
            subtitle: "Mission targets not yet met, but all available leads have been called.",
            successRateColor: "text-amber-600 dark:text-amber-400",
            checkIconColor: "text-amber-500"
        }
        : {
            bgGradient: "bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),rgba(20,184,166,0.05),transparent_60%)]",
            colors: ['#10b981', '#14b8a6', '#6366f1'],
            personaBadge: "bg-emerald-500/10 text-emerald-600 border-0",
            iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20",
            icon: Trophy,
            title: "Mission Accomplished.",
            subtitle: "Target hit! Objective fulfilled. I've paused the agents for your next mission.",
            successRateColor: "text-emerald-600 dark:text-emerald-400",
            checkIconColor: "text-emerald-500"
        };

    const IconComponent = theme.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "h-full min-h-[400px] flex flex-col items-center justify-center rounded-[40px] border border-dashed p-6 text-center shadow-inner relative overflow-hidden backdrop-blur-3xl",
                isExhausted
                    ? "border-amber-200/50 dark:border-amber-800/30 bg-amber-50/40 dark:bg-amber-900/10"
                    : "border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40"
            )}
        >
            {/* Living Ambient Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 45, 0],
                        x: [-10, 10, -10],
                        y: [-10, 10, -10]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className={cn("absolute -top-[25%] -left-[25%] w-[150%] h-[150%] blur-[80px]", theme.bgGradient)}
                />
            </div>

            {/* Floating Bokeh Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                        key={`bokeh-${i}`}
                        initial={{
                            x: Math.random() * 100 + '%',
                            y: Math.random() * 100 + '%',
                            opacity: 0,
                            scale: Math.random() * 0.4 + 0.3
                        }}
                        animate={{
                            y: [null, '-20%', '120%'],
                            opacity: [0, 0.3, 0],
                            x: (Math.random() * 6 - 3) + '%'
                        }}
                        transition={{
                            duration: 12 + Math.random() * 8,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "linear"
                        }}
                        className="absolute w-3 h-3 rounded-full blur-[1px]"
                        style={{
                            backgroundColor: theme.colors[i % 3],
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl gap-4">
                {/* Celebration Badge & Persona */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-white/20 dark:bg-zinc-800/20 px-4 py-1.5 rounded-full border border-white/40 dark:border-white/5 backdrop-blur-md"
                >
                    <div className="relative">
                        <Avatar className="w-8 h-8 border border-white/50 dark:border-zinc-800 shadow-sm">
                            <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Maya&backgroundColor=ecfdf5" />
                            <AvatarFallback>M</AvatarFallback>
                        </Avatar>
                        <div className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900", isExhausted ? "bg-amber-500" : "bg-emerald-500")} />
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-wider leading-none">Maya</span>
                            <Badge className={cn("text-[8px] h-3.5 px-1 font-black uppercase tracking-tighter", theme.personaBadge)}>Ops</Badge>
                        </div>
                    </div>
                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest whitespace-nowrap">Auto-Paused</span>
                    </div>
                </motion.div>

                {/* Main Celebration Message */}
                <div className="space-y-1">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                        className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg rotate-3", theme.iconBg)}
                    >
                        <IconComponent className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </motion.div>

                    <motion.h4
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight leading-tight"
                    >
                        {theme.title}
                    </motion.h4>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-normal max-w-sm mx-auto"
                    >
                        {theme.subtitle}
                    </motion.p>
                </div>

                {/* High Impact Metrics */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-3 w-full max-w-md"
                >
                    <div className="flex-1 p-3 rounded-2xl bg-white/50 dark:bg-zinc-800/30 border border-white/50 dark:border-white/5 shadow-sm">
                        <div className={cn("text-2xl font-black leading-none mb-1 tabular-nums", theme.successRateColor)}>
                            {Math.round(stats.success_rate)}%
                        </div>
                        <p className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Efficiency</p>
                    </div>

                    <div className="flex-1 p-3 rounded-2xl bg-white/50 dark:bg-zinc-800/30 border border-white/50 dark:border-white/5 shadow-sm">
                        <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1 tabular-nums">
                            {stats.completed}
                        </div>
                        <p className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Conversions</p>
                    </div>
                </motion.div>

                {/* Second Row: Calls Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex gap-3 w-full max-w-md mt-2"
                >
                    <div className="flex-1 p-3 rounded-2xl bg-white/50 dark:bg-zinc-800/30 border border-white/50 dark:border-white/5 shadow-sm flex items-center justify-between px-6">
                        <div>
                            <div className="text-2xl font-black text-zinc-800 dark:text-zinc-200 leading-none mb-1 tabular-nums">
                                {stats.total_calls || 0}
                            </div>
                            <p className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em]">Total Calls</p>
                        </div>
                        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700/50" />
                        <div className="flex flex-col gap-1 text-right">
                            {Object.entries(stats.call_distribution || {})
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 2)
                                .map(([status, count]) => (
                                    <div key={status} className="flex items-center gap-1.5 justify-end">
                                        <span className="text-[9px] font-bold text-zinc-500 lowercase first-letter:uppercase">{status.replace(/_/g, ' ')}</span>
                                        <Badge variant="secondary" className="h-3.5 px-1 text-[8px] font-black tabular-nums bg-white/50 dark:bg-black/20">{count}</Badge>
                                    </div>
                                ))}
                        </div>
                    </div>
                </motion.div>

                {/* Mini Cohort Distribution */}
                {stats.cohort_progress && (
                    <div className="w-full max-w-md space-y-1.5 mt-2">
                        <div className="flex items-center justify-between px-1">
                            <h5 className="text-[9px] uppercase font-black text-zinc-400 tracking-widest">Targets</h5>
                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800 mx-3 opacity-30" />
                        </div>
                        <div className="max-h-[100px] overflow-y-auto pr-1 custom-scrollbar space-y-1">
                            {Object.entries(stats.cohort_progress).sort(([_, a], [__, b]) => (b.completed / b.target) - (a.completed / a.target)).map(([cohort, progress], idx) => (
                                <div
                                    key={cohort}
                                    className="flex items-center justify-between px-3 py-1.5 bg-white/40 dark:bg-zinc-800/20 rounded-xl border border-white/30 dark:border-white/5"
                                >
                                    <span className="font-bold text-[10px] text-zinc-700 dark:text-zinc-300 truncate">{cohort}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-[11px] text-zinc-900 dark:text-white tabular-nums">{progress.completed}/{progress.target}</span>
                                        <CheckCircle2 className={cn("w-3 h-3", progress.is_complete ? theme.checkIconColor : "text-zinc-300")} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mt-2 w-full max-w-sm space-y-2"
                >
                    {/* Replenish Action for Exhausted State */}
                    {isExhausted && onReplenish && (
                        <Button
                            onClick={handleReplenish}
                            disabled={isResetting}
                            variant="default"
                            className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 font-black text-[11px] uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] gap-2 shadow-lg shadow-amber-500/20"
                        >
                            {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                            {isResetting ? "Replenishing..." : "Replenish Short Calls (<10s)"}
                        </Button>
                    )}

                    {/* Standard Reset Action */}
                    {onReset && (
                        <Button
                            onClick={handleReset}
                            disabled={isResetting}
                            variant={isExhausted ? "outline" : "default"} // Demote reset if exhausted has a primary action
                            className={cn(
                                "w-full h-10 rounded-xl border-0 font-black text-[11px] uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] gap-2",
                                isExhausted
                                    ? "bg-white/50 hover:bg-white text-zinc-600 border border-zinc-200"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                            )}
                        >
                            {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                            {isResetting ? "Resetting..." : (isExhausted ? "Full Campaign Reset" : "Reset Campaign")}
                        </Button>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
