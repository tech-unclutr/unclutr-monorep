
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2,
    CheckCircle2,
    ShoppingBag,
    Box,
    Percent,
    Receipt,
    Truck,
    Activity,
    Clock,
    Zap,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAuthToken } from '@/lib/auth';

interface ActivityLog {
    id: string
    event: string
    status: string
    topic: string
    timestamp: string
    emoji: string
    source: string
}

interface UnifiedSyncStatusProps {
    integrationId: string;
    status: string;
    metadata: any;
    open: boolean; // if drawer is open
}

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}

export function UnifiedSyncStatus({ integrationId, status, metadata, open }: UnifiedSyncStatusProps) {
    const isSyncing = status === 'syncing' || status === 'SYNCING';
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    // Stats for Ticker
    const syncStats = metadata?.sync_stats || {};
    const statsItems = [
        { icon: ShoppingBag, label: 'Orders', count: syncStats.orders_count || 0, color: "text-blue-500" },
        { icon: Box, label: 'Products', count: syncStats.products_count || 0, color: "text-orange-500" },
        { icon: Percent, label: 'Discounts', count: syncStats.discounts_count || 0, color: "text-purple-500" },
    ];

    // Ticker Effect (Cycle every 3s)
    useEffect(() => {
        if (!statsItems.length) return;
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % statsItems.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Feed Polling (Only when open and syncing, or just open to show recent history)
    useEffect(() => {
        if (!open) return;
        let interval: NodeJS.Timeout;

        const fetchLogs = async () => {
            // If not syncing and we already have logs, maybe stop polling? 
            // But user might want to see history. Let's poll slower if not syncing.
            if (!isSyncing && logs.length > 0) return;

            try {
                const token = await getAuthToken();
                if (!token) return;
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/integrations/shopify/activity?integration_id=${integrationId}&limit=10`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data);
                }
            } catch (e) {
                console.error("Feed error", e);
            }
        };

        fetchLogs();
        // Poll frequent if syncing, else once on open (handled by return check above)
        if (isSyncing) {
            interval = setInterval(fetchLogs, 3000);
        }

        return () => clearInterval(interval);
    }, [integrationId, open, isSyncing]); // removed logs dependency to avoid loops

    const activeItem = statsItems[activeIndex];
    const ActiveIcon = activeItem.icon;

    return (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm transition-all duration-500 hover:shadow-md">

            {/* --- HEADER: Status + Ticker --- */}
            <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-zinc-900/50 border-b border-gray-50 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                    <div className={cn("relative flex items-center justify-center w-8 h-8 rounded-full border",
                        isSyncing ? "border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10" : "border-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-800"
                    )}>
                        {isSyncing ? (
                            <>
                                <Loader2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 animate-spin" />
                                <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-20 duration-1000" />
                            </>
                        ) : (
                            <CheckCircle2 className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none">
                            {isSyncing ? "Sync in Progress" : "Sync Active"}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-500 mt-1 font-medium">
                            {isSyncing ? "Listening for events..." : "All systems operational"}
                        </p>
                    </div>
                </div>

                {/* Ticker (Right Side) */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-zinc-800">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeItem.label}
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -5, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-end min-w-[60px]"
                        >
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", activeItem.color)}>
                                {activeItem.label}
                            </span>
                            <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                                {activeItem.count.toLocaleString()}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* --- BODY: Conditional Feed --- */}
            {/* Show feed if syncing, OR if we have recent logs and user wants to see them (maybe always show but max-height small?) */}
            {/* User wanted "reduce poppy-ness". Let's show feed ONLY if syncing or if there's an error. 
                If active/idle, collapse it to save space. */}

            <AnimatePresence>
                {isSyncing && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                        <div className="p-0 bg-gray-50/30 dark:bg-zinc-950/30 border-t border-gray-100 dark:border-zinc-800">
                            <div className="px-4 py-2 flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-600 tracking-wider">
                                <span>Live Terminal</span>
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Online
                                </span>
                            </div>
                            <div className="h-[140px] overflow-hidden relative">
                                {/* Mask Gradient for fading out top items */}
                                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white dark:from-zinc-900 to-transparent z-10 opacity-50" />

                                <ScrollArea className="h-full px-4 pb-4">
                                    <div className="space-y-3 pt-2">
                                        {logs.map((log) => (
                                            <motion.div
                                                key={log.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-3 text-xs"
                                            >
                                                <span className="text-base shrink-0">{log.emoji}</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-gray-700 dark:text-zinc-300 truncate">
                                                        {log.event}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                        <span>{timeAgo(log.timestamp)}</span>
                                                        <span>•</span>
                                                        <span className="uppercase">{log.source}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {logs.length === 0 && (
                                            <div className="text-center py-8 text-gray-400 text-xs italic">
                                                Waiting for data stream...
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
