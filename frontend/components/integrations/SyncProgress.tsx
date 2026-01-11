import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SyncStats {
    current_step: 'fetching' | 'refining' | 'complete';
    message: string;
    processed_count?: number;
    total_count?: number;
    eta_seconds?: number;
    progress?: number;
}

interface SyncProgressProps {
    integrationId: string
    status: string
    metadata: any
    onRefresh: () => void
}

export function SyncProgress({ integrationId, status, metadata, onRefresh }: SyncProgressProps) {
    const [progress, setProgress] = useState(0)

    // Parse stats from metadata
    const stats: SyncStats | undefined = metadata?.sync_stats

    useEffect(() => {
        let interval: NodeJS.Timeout

        // Poll more frequently during sync for a "alive" feel
        if (status === "syncing" || status === "SYNCING") {
            interval = setInterval(() => {
                onRefresh()
            }, 3000)
        }

        return () => clearInterval(interval)
    }, [status, onRefresh])

    if (!stats && status !== "SYNCING") return null

    const percentage = stats?.total_count ? Math.round((stats.processed_count || 0) / stats.total_count * 100) : stats?.progress || 0;
    const message = stats?.message || (status === "SYNCING" ? "Syncing..." : "Sync Active");
    const eta = stats?.eta_seconds;

    return (
        <div className="w-full p-3 border rounded-xl bg-white/40 dark:bg-zinc-900/40 border-gray-100/80 dark:border-zinc-800/80 space-y-2.5 transition-all">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-zinc-100">
                    <RefreshCw className={cn("h-3.5 w-3.5 text-blue-500", (status === "syncing" || status === "SYNCING") && "animate-spin")} />
                    <span className="text-[11px] tracking-tight">{message}</span>
                </div>
                {percentage > 0 && (
                    <div className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full tabular-nums">
                        {percentage}%
                    </div>
                )}
            </div>

            <div className="h-1 w-full bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8 }}
                />
            </div>

            <div className="text-[9px] text-gray-400 dark:text-zinc-500 flex justify-between items-center font-bold uppercase tracking-wider">
                <div className="flex items-center gap-3">
                    {eta !== undefined && eta > 0 && (
                        <span className="text-blue-600/60 dark:text-blue-400/60">
                            ~{eta}s
                        </span>
                    )}
                    {stats?.processed_count !== undefined && stats?.total_count && (
                        <span>{stats.processed_count} / {stats.total_count}</span>
                    )}
                </div>
                {(status === "syncing" || status === "SYNCING") && (
                    <div className="flex items-center gap-1 opacity-60">
                        <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Tracking</span>
                    </div>
                )}
            </div>
        </div>
    )
}
