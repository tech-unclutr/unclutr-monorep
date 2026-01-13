"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, RefreshCw, Shield, Eye, Settings2, Sparkles, Plus, Activity } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Integration } from '@/lib/api/integrations';
import { motion, AnimatePresence } from 'framer-motion';

interface IntegrationCardProps {
    integration: Integration;
    onConnect: (slug: string) => void;
    onViewDetails: (integration: Integration) => void;
    onAdd?: (slug: string, category: string) => void;
    onRemove?: (id: string) => void;
    onRefresh?: () => void;
    onSync?: (id: string) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
    integration,
    onConnect,
    onViewDetails,
    onAdd,
    onRefresh,
    onSync
}) => {
    const isConnected = integration.status === 'active';
    const isSyncing = integration.status === 'syncing' || integration.status === 'SYNCING';
    const isError = integration.status === 'error';
    const isInStack = integration.in_stack;
    const isImplemented = integration.datasource.is_implemented;

    // An item is "fully active/connected" if it is active, syncing, or has an error but is connected
    const isFullyConnected = isConnected || isSyncing || isError;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full"
        >
            {/* Increased padding to p-6 for premium spaciousness */}
            <Card className="group relative h-full flex flex-col w-full p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl dark:hover:shadow-zinc-900/50 hover:-translate-y-1 transition-all duration-300 ease-spring overflow-hidden">

                {/* Dynamic Spotlight Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-50/50 via-transparent to-transparent dark:from-zinc-800/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 flex items-start gap-5 mb-6">
                    {/* Logo Container */}
                    <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center p-2.5 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 ease-spring">
                            {integration.datasource.logo_url ? (
                                <img
                                    src={integration.datasource.logo_url}
                                    alt={integration.datasource.name}
                                    className="w-full h-full object-contain drop-shadow-sm"
                                />
                            ) : (
                                <div className="w-full h-full bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl">
                                    {integration.datasource.name[0]}
                                </div>
                            )}
                        </div>
                        {isFullyConnected && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 flex items-center justify-center shadow-sm z-20">
                                <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1 py-1">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate tracking-tight group-hover:text-primary transition-colors duration-300">
                                {integration.datasource.name}
                            </h3>
                            {!isImplemented && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-center min-w-[3rem]">
                                    Soon
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 mt-1.5">
                            {integration.metadata_info?.shop ? (
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate font-mono">
                                    {integration.metadata_info.shop.replace('.myshopify.com', '')}
                                </span>
                            ) : (
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                                    {integration.datasource.description || `Integrate ${integration.datasource.name} with your stack.`}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ARCHITECTURAL SPLIT: Status vs Trust */}
                {/* ARCHITECTURAL SPLIT: Status vs Trust */}
                {/* Changed items-start to items-center for better vertical alignment on the row */}
                <div className="relative z-10 flex items-center justify-between gap-4 mb-6">
                    {/* LEFT PILLAR: Status Pulse */}
                    <div className="flex-shrink-0">
                        {isConnected ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:bg-emerald-500/15 transition-colors">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Active
                            </div>
                        ) : isSyncing ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 shadow-sm">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Syncing
                            </div>
                        ) : isInStack ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-600 dark:text-orange-400 shadow-sm">
                                <Sparkles className="w-3.5 h-3.5" />
                                In Stack
                            </div>
                        ) : (
                            <div className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-500 border border-zinc-200 dark:border-zinc-700/50">
                                Not Connected
                            </div>
                        )}
                    </div>

                    {/* RIGHT PILLAR: Trust Signal Stack */}
                    <div className="flex flex-col items-end gap-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                            <span>Enterprise Security</span>
                            <Shield className="w-3 h-3" />
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                            <span>Read-only Access</span>
                            <Eye className="w-3 h-3" />
                        </div>
                    </div>
                </div>

                {/* Main Action Area */}
                <div className="mt-auto pt-5 border-t border-zinc-100 dark:border-zinc-800/50">
                    <AnimatePresence mode="wait">
                        {isFullyConnected ? (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-2 gap-3"
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onViewDetails(integration)}
                                    className="w-full h-9 rounded-lg border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 group/btn shadow-sm cursor-pointer"
                                >
                                    <Settings2 className="w-3.5 h-3.5 mr-2 group-hover/btn:rotate-45 transition-transform text-zinc-400 group-hover/btn:text-zinc-600 dark:group-hover/btn:text-zinc-300" />
                                    Configure
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSync) onSync(integration.id);
                                    }}
                                    disabled={isSyncing}
                                    className="w-full h-9 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Activity className={cn("w-3.5 h-3.5 mr-2", isSyncing && "animate-spin")} />
                                    {isSyncing ? "Syncing..." : "Sync Now"}
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3"
                            >
                                {isImplemented ? (
                                    <>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onConnect(integration.datasource.slug);
                                            }}
                                            size="sm"
                                            className="flex-1 h-9 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-sm cursor-pointer"
                                        >
                                            Connect
                                        </Button>
                                        {!isInStack ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onAdd) onAdd(integration.datasource.slug, integration.datasource.category);
                                                }}
                                                className="aspect-square h-9 p-0 rounded-lg border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors shadow-sm bg-white dark:bg-zinc-800/50 cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="aspect-square h-9 p-0 rounded-lg text-orange-500 bg-orange-50 dark:bg-orange-500/10 cursor-default"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <Button disabled variant="outline" className="w-full h-9 rounded-lg bg-zinc-50 dark:bg-zinc-900 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-medium cursor-not-allowed opacity-70">
                                        Coming Soon
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {isSyncing && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-100 dark:bg-zinc-800 overflow-hidden rounded-b-xl">
                        <div className="h-full bg-emerald-500 animate-progress origin-left" style={{ width: '100%' }} />
                    </div>
                )}
            </Card>
        </motion.div>
    );
};
