"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, TrendingUp, TrendingDown, Info, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface InsightObject {
    id: string
    title: string
    description: string
    impact_score: number
    trend?: "up" | "down" | "neutral"
    meta: {
        // v2.0 Velocity Metadata
        confidence?: string  // "high" | "medium" | "low"
        recent_avg?: number
        baseline_avg?: number
        diff_pct?: number
        recent_period?: string
        baseline_period?: string
        context?: string
        recommendation?: string
        volatility?: string  // "high" | "low"
        days_analyzed?: number

        // Legacy fields
        data_points?: number
        [key: string]: any
    }
}

interface InsightStageProps {
    insight: InsightObject | null
    loading: boolean
}

export function InsightStage({ insight, loading }: InsightStageProps) {
    if (loading) {
        return (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 animate-pulse border border-white/5 h-20">
                <div className="h-8 w-8 rounded-full bg-white/10" />
                <div className="space-y-2 flex-1">
                    <div className="h-3 w-1/3 bg-white/10 rounded" />
                    <div className="h-3 w-2/3 bg-white/10 rounded" />
                </div>
            </div>
        )
    }

    if (!insight) {
        return (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-dashed border-white/10 h-20 group">
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
                </div>
                <div className="text-xs text-white/40 italic">
                    Monitoring for high-fidelity trends...
                </div>
            </div>
        )
    }

    const isTrendUp = insight.trend === "up"
    const isTrendDown = insight.trend === "down"

    // v2.0 Metadata
    const confidence = insight.meta?.confidence || "high"  // "high" | "medium" | "low"
    const recentAvg = insight.meta?.recent_avg
    const baselineAvg = insight.meta?.baseline_avg
    const diffPct = insight.meta?.diff_pct
    const recentPeriod = insight.meta?.recent_period
    const baselinePeriod = insight.meta?.baseline_period
    const context = insight.meta?.context
    const recommendation = insight.meta?.recommendation
    const volatility = insight.meta?.volatility
    const daysAnalyzed = insight.meta?.days_analyzed

    // Confidence color coding (v2.0 string-based)
    const getConfidenceColor = (conf: string) => {
        if (conf === "high") return "text-emerald-400"
        if (conf === "medium") return "text-yellow-400"
        return "text-orange-400"
    }

    const getConfidenceBg = (conf: string) => {
        if (conf === "high") return "bg-emerald-500/10 border-emerald-500/30"
        if (conf === "medium") return "bg-yellow-500/10 border-yellow-500/30"
        return "bg-orange-500/10 border-orange-500/30"
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                    "relative overflow-hidden p-4 rounded-xl border flex items-start gap-4 transition-all duration-500",
                    "bg-gradient-to-br from-white/10 to-transparent",
                    insight.impact_score > 7
                        ? "border-amber-500/30 ring-1 ring-amber-500/10"
                        : "border-white/10"
                )}
            >
                {/* Glow Effect for high impact */}
                {insight.impact_score > 7 && (
                    <div className="absolute top-0 right-0 p-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    </div>
                )}

                <div className={cn(
                    "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border",
                    isTrendUp ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                        isTrendDown ? "bg-rose-500/20 border-rose-500/30 text-rose-400" :
                            "bg-blue-500/20 border-blue-500/30 text-blue-400"
                )}>
                    {isTrendUp ? <TrendingUp className="h-5 w-5" /> :
                        isTrendDown ? <TrendingDown className="h-5 w-5" /> :
                            <Sparkles className="h-5 w-5" />}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                    {/* Header with Title and Confidence */}
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider truncate">
                            {insight.title}
                        </h4>
                        <div className="flex items-center gap-2">
                            {/* Confidence Badge (v2.0) */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={cn(
                                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                    getConfidenceBg(confidence),
                                    getConfidenceColor(confidence)
                                )}
                                title={daysAnalyzed ? `Based on ${daysAnalyzed} days of data` : "Confidence level"}
                            >
                                {confidence.toUpperCase()}
                            </motion.div>
                            {/* Impact Score Bar */}
                            <div className="h-1 w-8 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(insight.impact_score / 10) * 100}%` }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className={cn(
                                        "h-full",
                                        insight.impact_score > 7 ? "bg-amber-500" : "bg-blue-500"
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Period Comparison (for velocity insights) */}
                    {recentAvg !== undefined && baselineAvg !== undefined && (
                        <div className="flex items-center gap-3 text-[11px]">
                            <div className="flex items-center gap-1.5">
                                <span className="text-white/50">Recent:</span>
                                <span className="font-bold text-white">
                                    ${recentAvg.toLocaleString()}/day
                                </span>
                                {recentPeriod && (
                                    <span className="text-white/30">({recentPeriod})</span>
                                )}
                            </div>
                            <div className="text-white/20">→</div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-white/50">vs</span>
                                <span className="font-medium text-white/70">
                                    ${baselineAvg.toLocaleString()}/day
                                </span>
                            </div>
                            {diffPct !== undefined && (
                                <div className={cn(
                                    "font-bold ml-auto",
                                    isTrendUp ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {diffPct > 0 ? "+" : ""}{(diffPct * 100).toFixed(1)}%
                                </div>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    <p className="text-xs text-white/70 leading-relaxed font-medium">
                        {insight.description}
                    </p>

                    {/* Context (v2.0) */}
                    {context && (
                        <div className="flex items-start gap-1.5 text-[11px] text-blue-300/80 italic">
                            <Info className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{context}</span>
                        </div>
                    )}

                    {/* Recommendation (v2.0) */}
                    {recommendation && (
                        <div className="flex items-start gap-1.5 text-[11px] bg-white/5 rounded-lg px-2 py-1.5 border border-white/10">
                            <span className="shrink-0">💡</span>
                            <span className="text-white/80 font-medium">{recommendation}</span>
                        </div>
                    )}

                    {/* Volatility Warning */}
                    {volatility === "high" && (
                        <div className="text-[10px] text-orange-400/80 flex items-center gap-1">
                            <span>⚠️</span>
                            <span>High variance detected - monitor closely</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
