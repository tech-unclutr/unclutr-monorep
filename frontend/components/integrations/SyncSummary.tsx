import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    Box,
    Percent,
    Receipt,
    Truck,
    CheckCircle2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SyncSummaryProps {
    status: string;
    syncStats?: {
        orders_count?: number;
        products_count?: number;
        discounts_count?: number;
        customers_count?: number;
        locations_count?: number;
        inventory_count?: number;
    };
}

export const SyncSummary: React.FC<SyncSummaryProps> = ({ status, syncStats = {} }) => {
    const isSyncing = status === 'syncing' || status === 'SYNCING';
    const [activeIndex, setActiveIndex] = useState(0);

    const items = [
        { icon: ShoppingBag, label: 'Orders', count: syncStats.orders_count || 0, color: "text-blue-500" },
        { icon: Box, label: 'Products', count: syncStats.products_count || 0, color: "text-orange-500" },
        { icon: CheckCircle2, label: 'Inventory', count: syncStats.inventory_count || 0, color: "text-emerald-500" },
    ];

    // Progressive Ticker Effect
    useEffect(() => {
        if (!isSyncing) return;
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % items.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isSyncing, items.length]);

    const activeItem = items[activeIndex];
    const ActiveIcon = activeItem.icon;

    return (
        <div className="relative overflow-hidden rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 transition-all duration-300">
            <div className="flex items-center justify-between p-3.5 relative z-10">
                {/* Left: Status */}
                <div className="flex items-center gap-3">
                    <div className={cn("p-1.5 rounded-full flex items-center justify-center", isSyncing ? "bg-white dark:bg-zinc-800 shadow-sm" : "bg-gray-100 dark:bg-zinc-800")}>
                        {isSyncing ? (
                            <Loader size={14} className="text-emerald-600 dark:text-emerald-500" />
                        ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">
                            {isSyncing ? "Syncing..." : "Sync Complete"}
                        </h3>
                    </div>
                </div>

                {/* Right: Progressive Ticker */}
                <div className="flex items-center gap-3 min-w-[140px] justify-end">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeItem.label}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2 text-right"
                        >
                            <div className="flex flex-col items-end">
                                <span className={cn("text-[10px] font-bold uppercase tracking-wider", activeItem.color)}>
                                    {activeItem.label}
                                </span>
                                <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                                    {activeItem.count.toLocaleString()}
                                </span>
                            </div>
                            <div className={cn("p-1.5 rounded-md bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700", activeItem.color)}>
                                <ActiveIcon className="w-3.5 h-3.5" />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
