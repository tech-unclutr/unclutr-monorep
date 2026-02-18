import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    Box,
    Percent,
    Receipt,
    Truck,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SyncStatusCardProps {
    status: string;
    lastSynced?: string;
    syncStats?: {
        orders_count?: number;
        products_count?: number;
        discounts_count?: number;
        taxes_count?: number;
        shipping_zones_count?: number;
        message?: string;
        current_step?: string;
        progress?: number;
    };
    onSync: () => void;
}

const SYNC_STAGES = [
    { id: 'handshake', label: 'Security Handshake', description: 'Establishing encrypted tunnel' },
    { id: 'cataloging', label: 'Cataloging Metadata', description: 'Mapping store architecture' },
    { id: 'backfilling', label: 'Streaming Records', description: 'Fetching historical data' },
    { id: 'refining', label: 'AI Analysis', description: 'Refining metrics & trends' },
    { id: 'finalizing', label: 'Established Feed', description: 'Activating real-time stream' },
];

export const SyncStatusCard: React.FC<SyncStatusCardProps> = ({ status, lastSynced, syncStats = {}, onSync }) => {
    const isSyncing = status === 'syncing' || status === 'SYNCING';
    const currentStep = syncStats.current_step || 'handshake';
    const currentProgress = syncStats.progress || 0;

    const getTimeAgo = (dateStr?: string) => {
        if (!dateStr) return "Sync pending";
        try {
            // Ensure the string is treated as UTC if it doesn't have a timezone suffix
            const isoString = (dateStr.endsWith('Z') || dateStr.includes('+')) ? dateStr : dateStr + 'Z';
            const date = new Date(isoString);
            const now = new Date();
            const diff = (now.getTime() - date.getTime()) / 1000;
            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            return `${Math.floor(diff / 86400)}d ago`;
        } catch { return "Unknown"; }
    };

    const currentStageIndex = SYNC_STAGES.findIndex(s => s.id === currentStep);
    const activeStage = SYNC_STAGES[currentStageIndex] || SYNC_STAGES[0];

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all duration-300 overflow-hidden relative group">
            <div className="p-5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-2.5 h-2.5 rounded-full transition-all duration-500",
                                isSyncing ? "bg-blue-500 animate-pulse ring-4 ring-blue-500/20" : "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                            )} />
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {isSyncing ? "Updating Pulse" : "Fully Caught Up"}
                            </h3>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                            {isSyncing
                                ? `Step ${currentStageIndex + 1} of 5`
                                : `Last updated ${getTimeAgo(lastSynced)}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                        <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                            {syncStats.orders_count || 0}
                        </span>
                        <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Orders</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isSyncing && (
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, height: 0, y: 10 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            className="space-y-4 pt-2"
                        >
                            {/* Single Sequential Task View */}
                            <div className="flex items-center gap-4 bg-gray-50/50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 transition-all">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                    <Loader size={16} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                        {activeStage.label}
                                    </span>
                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 truncate">
                                        {activeStage.description}
                                    </span>
                                </div>
                                <div className="ml-auto text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full tabular-nums">
                                    {currentProgress}%
                                </div>
                            </div>

                            {/* Minimal Slim Progress Bar */}
                            <div className="space-y-1.5 px-0.5">
                                <div className="h-1 w-full bg-gray-100 dark:bg-zinc-900/50 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${currentProgress}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
