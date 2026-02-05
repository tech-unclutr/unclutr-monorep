"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Activity, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"

interface LiveTickerProps {
    status: "analyzing" | "synced" | "error"
    logs?: string[]
}

export function LiveTicker({ status, logs = [] }: LiveTickerProps) {
    const [mounted, setMounted] = useState(false)
    const [currentTime, setCurrentTime] = useState("")
    const [currentLogIndex, setCurrentLogIndex] = useState(0)

    // Simulation of log streaming if no logs provided
    const defaultLogs = [
        "Cross-referencing Shopify Order #1024...",
        "Validating inventory at 'Main Warehouse'...",
        "Checking for un-synced refunds...",
        "Verifying calculated GMV against source...",
        "Analyzing customer lifetime value drift...",
        "Syncing latest payout data...",
    ]

    const displayLogs = logs.length > 0 ? logs : defaultLogs

    useEffect(() => {
        setMounted(true)
        setCurrentTime(new Date().toLocaleTimeString())
    }, [])

    useEffect(() => {
        if (status !== "analyzing") return

        const interval = setInterval(() => {
            setCurrentLogIndex((prev) => (prev + 1) % displayLogs.length)
            setCurrentTime(new Date().toLocaleTimeString([], { hour12: true }))
        }, 2000)

        return () => clearInterval(interval)
    }, [status, displayLogs.length])

    return (
        <div className="w-full h-8 flex items-center overflow-hidden relative bg-transparent">
            {/* Side Fades for scrolling effect - Theme aware */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-50 dark:from-zinc-900 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-50 dark:from-zinc-900 to-transparent z-10" />

            <div className="flex items-center px-4 gap-3 text-xs font-mono w-full">
                {/* Status Indicator */}
                <div className="flex items-center gap-2 shrink-0">
                    {status === "analyzing" && (
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                    )}
                    {status === "synced" && (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    )}
                    {status === "error" && (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className={cn(
                        "uppercase font-bold",
                        status === "analyzing" && "text-blue-500 dark:text-blue-400",
                        status === "synced" && "text-emerald-600 dark:text-emerald-400",
                        status === "error" && "text-red-600 dark:text-red-400",
                    )}>
                        {status === "analyzing" ? "SYSTEM ACTIVE" : status.toUpperCase()}
                    </span>
                </div>

                {/* Separator */}
                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 shrink-0" />

                {/* Scroller */}
                <div className="relative flex-1 h-full overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentLogIndex}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex items-center text-zinc-600 dark:text-zinc-400 truncate"
                        >
                            {mounted && (
                                <span className="text-zinc-400 dark:text-zinc-600 mr-2">[{currentTime}]</span>
                            )}
                            {status === "synced" ? "All systems verified. Waiting for new events." : displayLogs[currentLogIndex]}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
