"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface MetricCardProps {
    label: string;
    value: string | number;
    trend?: number;
    trendLabel?: string;
    icon?: LucideIcon;
    color?: string; // e.g. "indigo", "emerald", "rose"
    loading?: boolean;
    subValue?: string;
}

export function MetricCard({
    label,
    value,
    trend,
    trendLabel,
    icon: Icon,
    color = "indigo",
    loading = false,
    subValue
}: MetricCardProps) {
    const getColorClass = (c: string) => {
        switch (c) {
            case "emerald": return "from-emerald-500/20 to-emerald-500/5 text-emerald-400";
            case "rose": return "from-rose-500/20 to-rose-500/5 text-rose-400";
            case "amber": return "from-amber-500/20 to-amber-500/5 text-amber-400";
            case "blue": return "from-blue-500/20 to-blue-500/5 text-blue-400";
            default: return "from-indigo-500/20 to-indigo-500/5 text-indigo-400";
        }
    };

    const getTrendColor = (t: number) => {
        if (t > 0) return "text-emerald-400";
        if (t < 0) return "text-rose-400";
        return "text-white/40";
    };

    const getTrendIcon = (t: number) => {
        if (t > 0) return <ArrowUp className="w-3 h-3" />;
        if (t < 0) return <ArrowDown className="w-3 h-3" />;
        return <Minus className="w-3 h-3" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden relative group"
        >
            {/* Background gradient glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-${color}-500/5 blur-3xl group-hover:bg-${color}-500/10 transition-all duration-500`} />

            <div className="p-5 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-medium text-white/60">{label}</h3>
                    {Icon && (
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${getColorClass(color)}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-8 w-24 bg-white/10 rounded" />
                        <div className="h-4 w-16 bg-white/5 rounded" />
                    </div>
                ) : (
                    <div>
                        <div className="text-2xl font-bold text-white tracking-tight mb-1">
                            {value}
                        </div>

                        {(trend !== undefined || subValue) && (
                            <div className="flex items-center gap-2 text-xs">
                                {trend !== undefined && (
                                    <div className={`flex items-center gap-1 font-medium ${getTrendColor(trend)}`}>
                                        {getTrendIcon(trend)}
                                        <span>{Math.abs(trend)}%</span>
                                    </div>
                                )}
                                {trendLabel && (
                                    <span className="text-white/30">{trendLabel}</span>
                                )}
                                {subValue && (
                                    <span className="text-white/40">{subValue}</span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
