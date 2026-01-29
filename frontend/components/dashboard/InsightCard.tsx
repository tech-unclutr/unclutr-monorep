"use client"

import { motion } from "framer-motion"
import {
    Sparkles, TrendingUp, TrendingDown, Info,
    Zap, AlertTriangle, DollarSign, Users,
    Activity, ShoppingBag, Truck, RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface InsightObject {
    id: string
    title: string
    description: string
    impact_score: number
    trend?: "up" | "down" | "neutral"
    meta: {
        category?: "financial" | "growth" | "operational"
        confidence?: string
        context?: string
        recommendation?: string
        [key: string]: any
    }
}

interface InsightCardProps {
    insight: InsightObject
    isActive: boolean
    onAction?: (insight: InsightObject) => void
}

export function InsightCard({ insight, isActive, onAction }: InsightCardProps) {
    const isTrendUp = insight.trend === "up"
    const isTrendDown = insight.trend === "down"
    const category = insight.meta?.category || "operational"
    const isHighImpact = insight.impact_score >= 8.0

    // Theme Config based on Category
    const theme = {
        financial: {
            bg: "from-emerald-500/10 to-transparent",
            border: "border-emerald-500/20",
            iconBg: "bg-emerald-500/20",
            iconColor: "text-emerald-400",
            accent: "emerald",
            icon: DollarSign
        },
        growth: {
            bg: "from-blue-500/10 to-transparent",
            border: "border-blue-500/20",
            iconBg: "bg-blue-500/20",
            iconColor: "text-blue-400",
            accent: "blue",
            icon: TrendingUp
        },
        operational: {
            bg: "from-amber-500/10 to-transparent",
            border: "border-amber-500/20",
            iconBg: "bg-amber-500/20",
            iconColor: "text-amber-400",
            accent: "amber",
            icon: Activity
        }
    }[category] || {
        bg: "from-slate-500/10 to-transparent",
        border: "border-slate-500/20",
        iconBg: "bg-slate-500/20",
        iconColor: "text-slate-400",
        accent: "slate",
        icon: Info
    }

    const Icon = theme.icon

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
                opacity: isActive ? 1 : 0.6,
                scale: isActive ? 1 : 0.98,
                filter: isActive ? "blur(0px)" : "blur(2px)"
            }}
            transition={{ duration: 0.4 }}
            className={cn(
                "relative overflow-hidden p-5 rounded-2xl border transition-all duration-500 h-full flex flex-col",
                "bg-gradient-to-br",
                theme.bg,
                isActive ? theme.border : "border-white/5",
                isActive ? "shadow-2xl shadow-black/20" : "opacity-50",
                isHighImpact && isActive && "animate-pulse-subtle" // Custom class or we define style
            )}
            style={isHighImpact && isActive ? { boxShadow: `0 0 30px -5px ${theme.iconColor.replace('text-', 'var(--')}` } : {}}
        >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className={cn(
                    "h-12 w-12 shrink-0 rounded-xl flex items-center justify-center border shadow-lg backdrop-blur-sm",
                    theme.iconBg,
                    theme.border,
                    theme.iconColor
                )}>
                    <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-black/20",
                            theme.border,
                            theme.iconColor
                        )}>
                            {category}
                        </span>

                        {/* Impact Score */}
                        <div className="flex items-center gap-1.5" title="Business Impact Score">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1.5 w-1 rounded-full bg-white/10",
                                            i < Math.floor(insight.impact_score / 2) && `bg-${theme.accent}-500`
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-xs font-mono text-white/50">{insight.impact_score}</span>
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1">
                        {insight.title}
                    </h3>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
                <p className="text-[13px] text-white/80 leading-relaxed font-medium">
                    {insight.description}
                </p>

                {/* Metadata Grid */}
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 gap-2 text-[11px]"
                    >
                        {/* Context */}
                        {insight.meta.context && (
                            <div className="col-span-2 bg-white/5 rounded-lg p-2.5 border border-white/5">
                                <div className="text-white/40 mb-1 flex items-center gap-1.5">
                                    <Info className="h-3 w-3" /> Context
                                </div>
                                <div className="text-white/70 italic leading-snug">
                                    "{insight.meta.context}"
                                </div>
                            </div>
                        )}

                        {/* Recommendation */}
                        {insight.meta.recommendation && (
                            <div className="col-span-2 bg-gradient-to-r from-white/10 to-transparent rounded-lg p-2.5 border border-white/10">
                                <div className="text-amber-400 mb-1 flex items-center gap-1.5 font-semibold">
                                    <Zap className="h-3 w-3 fill-amber-400" /> Action
                                </div>
                                <div className="text-white/90 font-medium leading-snug">
                                    {insight.meta.recommendation}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
                {/* Action Bar */}
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2 mt-2"
                    >
                        <button
                            onClick={() => onAction && onAction(insight)}
                            className={cn(
                                "flex-1 text-[11px] font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5",
                                isHighImpact
                                    ? `bg-${theme.accent}-500/20 text-${theme.accent}-300 border border-${theme.accent}-500/30 hover:bg-${theme.accent}-500/30`
                                    : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {isHighImpact ? <Zap className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                            {insight.meta.action_label || "Fix This Now"}
                        </button>
                        <button className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Dismiss">
                            <span className="sr-only">Dismiss</span>
                            <span className="text-[10px]">✕</span>
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30">
                <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" />
                    Updated Just Now
                </span>
                <span
                    className={cn(
                        "px-2 py-0.5 rounded-full border bg-black/20 cursor-help",
                        insight.meta.confidence === 'high' ? "border-emerald-500/20 text-emerald-500" : "border-yellow-500/20 text-yellow-500"
                    )}
                    title={insight.meta.confidence === 'high' ? "Verified against live Shopify data. 100% Match." : "Calculated with available data. < 95% certainty."}
                >
                    {insight.meta.confidence?.toUpperCase() || "HIGH"} CONFIDENCE
                </span>
            </div>
        </motion.div>
    )
}
