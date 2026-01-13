import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Radio, CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { getAuthToken } from "@/lib/auth"

interface ActivityLog {
    id: string
    event: string
    status: string
    topic: string
    timestamp: string
    emoji: string
    source: string
    category?: string
    is_stacked?: boolean
    stacked_count?: number
}

interface ActivityFeedProps {
    integrationId: string
    open: boolean
    companyId?: string | null
    workspaceId?: string | null
    onSyncTriggered?: () => void  // Callback when sync is triggered
}

function timeAgo(dateString: string) {
    // Ensure the string is treated as UTC if it doesn't have a timezone suffix
    const isoString = (dateString.endsWith('Z') || dateString.includes('+')) ? dateString : dateString + 'Z';
    const date = new Date(isoString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function ActivityFeed({ integrationId, open, companyId, workspaceId, onSyncTriggered }: ActivityFeedProps) {
    // Session-persisted logs (only cleared on refresh or sync)
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now())

    useEffect(() => {
        if (!open) {
            setIsConnected(false)
            return
        }

        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        const fetchLogs = async () => {
            if (!isMounted) return;
            try {
                const token = await getAuthToken()
                if (!token) return

                // Fetch only important events (webhooks + errors + recent backfills)
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const url = `${apiBase}/api/v1/integrations/shopify/activity?integration_id=${integrationId}&limit=15&important_only=true`

                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Company-ID': companyId || '',
                        'X-Workspace-ID': workspaceId || ''
                    }
                })

                if (res.ok) {
                    const newLogs = await res.json()
                    if (isMounted) {
                        setIsConnected(true)
                        setLogs(prevLogs => {
                            const combined = [...newLogs, ...prevLogs]
                            const uniqueMap = new Map()

                            combined.forEach(log => {
                                if (!uniqueMap.has(log.id)) {
                                    uniqueMap.set(log.id, log)
                                }
                            })

                            return Array.from(uniqueMap.values()).sort((a, b) =>
                                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                            )
                        })
                    }
                }
            } catch (e) {
                console.error("Activity stream error", e)
                if (isMounted) setIsConnected(false)
            } finally {
                if (isMounted) {
                    timeoutId = setTimeout(fetchLogs, 3500)
                }
            }
        }

        // Initial fetch
        fetchLogs()

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        }
    }, [integrationId, open, lastSyncTime])

    // Expose method to clear logs (called when sync is triggered)
    useEffect(() => {
        if (onSyncTriggered) {
            // Create a global handler
            (window as any).__clearActivityFeed = () => {
                setLogs([])
                setLastSyncTime(Date.now())
            }
        }
    }, [onSyncTriggered])

    // Helper for precise time format
    const formatTime = (dateString: string) => {
        // Ensure the string is treated as UTC if it doesn't have a timezone suffix
        const isoString = (dateString.endsWith('Z') || dateString.includes('+')) ? dateString : dateString + 'Z';
        const date = new Date(isoString)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm overflow-hidden flex flex-col h-[380px]">
            {/* Humanized Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                            Live Activity
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            Real-time synchronization events
                        </p>
                    </div>
                </div>

                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all duration-500 ${isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
                    : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'
                    }`}>
                    <span className="relative flex h-2 w-2">
                        {isConnected && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}></span>
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                        {isConnected ? 'Live' : 'Syncing'}
                    </span>
                </div>
            </div>

            {/* Feed Content */}
            <ScrollArea className="flex-1 bg-gray-50/30 dark:bg-zinc-950/20">
                <div className="p-4 space-y-3">
                    <AnimatePresence initial={false}>
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Activity className="w-8 h-8 text-gray-300 dark:text-zinc-600 mb-3" />
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No activity yet</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[180px]">
                                    Listening for new events...
                                </p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    layout
                                    className={`bg-white dark:bg-zinc-900 border border-gray-200/50 dark:border-zinc-800 p-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group relative ${log.is_stacked ? 'mb-2' : ''
                                        }`}
                                >
                                    {/* Stacked Effect Layers */}
                                    {log.is_stacked && (
                                        <>
                                            <div className="absolute top-1 left-2 right-2 h-full bg-white dark:bg-zinc-900 border border-gray-200/50 dark:border-zinc-800 rounded-xl z-[-1] scale-x-[0.96] translate-y-1 opacity-60" />
                                            <div className="absolute top-2 left-4 right-4 h-full bg-white dark:bg-zinc-900 border border-gray-200/50 dark:border-zinc-800 rounded-xl z-[-2] scale-x-[0.92] translate-y-2 opacity-30" />
                                        </>
                                    )}

                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="relative">
                                                <div className="text-xl shrink-0 mt-0.5 select-none grayscale group-hover:grayscale-0 transition-all duration-300">
                                                    {log.emoji}
                                                </div>
                                                {log.is_stacked && (
                                                    <Badge className="absolute -bottom-2 -right-2 h-4 min-w-[1.25rem] px-1 flex items-center justify-center text-[9px] bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-2 border-white dark:border-zinc-900 shadow-sm pointer-events-none">
                                                        x{log.stacked_count}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                                                    {log.event}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 rounded-md font-medium text-gray-500 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400 border-none">
                                                        {log.source}
                                                    </Badge>
                                                    {log.status === 'pending' && (
                                                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 rounded-md text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20">
                                                            Processing
                                                        </Badge>
                                                    )}
                                                    {log.status === 'error' && (
                                                        <Badge variant="destructive" className="text-[9px] h-4 px-1.5 rounded-md">
                                                            Failed
                                                        </Badge>
                                                    )}
                                                    {log.category && (
                                                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 rounded-md text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20">
                                                            <span className="truncate max-w-[80px]">{log.category}</span>
                                                        </Badge>
                                                    )}
                                                    {log.is_stacked && (
                                                        <span className="text-[9px] text-gray-400 italic">
                                                            Consolidated
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="block text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                                                {formatTime(log.timestamp)}
                                            </span>
                                            <span className="text-[9px] text-gray-400 dark:text-zinc-600">
                                                {timeAgo(log.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </ScrollArea>
        </div>
    )
}
