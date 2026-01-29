"use client"

import { motion } from "framer-motion"
import { Sun, Coffee, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface MorningBriefingCardProps {
    briefing: string
    isActive: boolean
}

export function MorningBriefingCard({ briefing, isActive }: MorningBriefingCardProps) {
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
                "relative overflow-hidden p-6 rounded-2xl border transition-all duration-500 h-full flex flex-col",
                "bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent",
                isActive ? "border-indigo-500/30 shadow-2xl shadow-indigo-500/10" : "border-white/5 opacity-50"
            )}
        >
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Sun className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Morning Briefing <Sparkles className="h-3 w-3 text-indigo-400" />
                    </h3>
                    <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative">
                <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-indigo-500/50 to-transparent rounded-full" />
                <p className="pl-4 text-[13px] text-white/90 leading-relaxed font-medium">
                    {briefing || "Your data is looking good. No critical alerts to report safely."}
                </p>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                <span className="flex items-center gap-1.5">
                    <Coffee className="h-3 w-3" />
                    Daily Digest
                </span>
                <span>
                    AI Generated
                </span>
            </div>
        </motion.div>
    )
}
