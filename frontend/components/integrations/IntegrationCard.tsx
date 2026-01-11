"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, RefreshCw, Shield, Eye, Settings2, Sparkles, Info, Plus, X } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Integration } from '@/lib/api/integrations';
import { SyncProgress } from '@/components/integrations/SyncProgress';

interface IntegrationCardProps {
    integration: Integration;
    onConnect: (slug: string) => void;
    onViewDetails: (integration: Integration) => void;
    onAdd?: (slug: string, category: string) => void;
    onRemove?: (id: string) => void;
    onRefresh?: () => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
    integration,
    onConnect,
    onViewDetails,
    onAdd,
    onRemove,
    onRefresh
}) => {
    const isConnected = integration.status === 'active';
    const isSyncing = integration.status === 'syncing';
    const isError = integration.status === 'error';
    const isInactive = integration.status === 'inactive';
    const isInStack = integration.in_stack;

    // An item is "fully active/connected" if it is active, syncing, or has an error but is connected
    const isFullyConnected = isConnected || isSyncing || isError;

    return (
        <Card className="w-full min-w-[320px] lg:min-w-[380px] p-6 border-gray-200/80 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-zinc-900/50 transition-all duration-300 ease-out group hover:scale-[1.01] hover:border-gray-300/80 dark:hover:border-zinc-700/80 relative overflow-hidden">
            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-zinc-800/20 dark:via-transparent dark:to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 flex items-start justify-between mb-5">
                <div className="flex items-center gap-4 flex-1">
                    {/* Premium Logo Container */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 border border-gray-200 dark:border-zinc-700 flex items-center justify-center p-2 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 ease-out overflow-hidden shrink-0 relative">
                        {/* Subtle glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/10 group-hover:to-transparent transition-all duration-300" />
                        {integration.datasource.logo_url ? (
                            <img
                                src={integration.datasource.logo_url}
                                alt={integration.datasource.name}
                                className="w-full h-full object-contain relative z-10"
                            />
                        ) : (
                            <div className="w-full h-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold relative z-10">
                                {integration.datasource.name[0]}
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        {!integration.datasource.is_implemented && (
                            <div className="text-[9px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                                Coming Soon
                            </div>
                        )}
                        <div className="flex items-center gap-2.5">
                            <h3 className="font-semibold text-base text-gray-900 dark:text-zinc-100 truncate group-hover:text-gray-950 dark:group-hover:text-white transition-colors">
                                {integration.datasource.name}
                            </h3>
                            {isConnected && (
                                <Badge variant="outline" className="bg-gradient-to-r from-emerald-500/10 to-emerald-400/10 dark:from-emerald-500/20 dark:to-emerald-400/20 border-emerald-500/30 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 px-2 flex items-center gap-1 shrink-0 relative overflow-hidden shadow-sm shadow-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                                    <div className="absolute top-1/2 left-2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                                    Active
                                </Badge>
                            )}
                            {isSyncing && (
                                <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-blue-400/10 dark:from-blue-500/20 dark:to-blue-400/20 border-blue-500/30 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 text-[10px] py-0 px-2 flex items-center gap-1 shrink-0 relative overflow-hidden shadow-sm shadow-blue-500/20">
                                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                    Syncing
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1.5 leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
                            {integration.datasource.description || `Sync your ${integration.datasource.name} data.`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-stretch gap-2.5 shrink-0">
                    {isFullyConnected ? (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewDetails(integration)}
                                className="h-8 rounded-lg border-gray-200 dark:border-zinc-700 text-xs font-medium transition-all duration-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-zinc-800 dark:hover:to-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 group/config"
                            >
                                <Settings2 className="w-4 h-4 mr-1.5 group-hover/config:rotate-45 transition-transform duration-300" />
                                Configure
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2">
                                {integration.datasource.is_implemented && (
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onConnect(integration.datasource.slug);
                                        }}
                                        size="sm"
                                        className="h-9 rounded-xl text-xs font-bold px-5 transition-all duration-300 ease-out bg-gradient-to-r from-[#FF8A4C] to-[#FF7026] hover:from-[#ff965e] hover:to-[#ff8240] text-white shadow-[0_4px_12px_rgba(255,138,76,0.3)] hover:shadow-[0_6px_16px_rgba(255,138,76,0.4)] dark:shadow-[0_4px_16px_rgba(255,138,76,0.4)] dark:hover:shadow-[0_6px_20px_rgba(255,138,76,0.5)] hover:-translate-y-0.5 active:translate-y-0 flex-1 border-none"
                                    >
                                        Connect
                                    </Button>
                                )}
                                {isInStack && integration.datasource.is_implemented && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewDetails(integration);
                                        }}
                                        className="h-9 w-9 rounded-xl border-gray-200/70 dark:border-zinc-800/70 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-sm text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-zinc-800 dark:hover:to-zinc-900 transition-all duration-300 shrink-0 shadow-sm group/settings"
                                    >
                                        <Settings2 className="w-4 h-4 group-hover/settings:rotate-45 transition-transform duration-300" />
                                    </Button>
                                )}
                            </div>

                            {/* Functional Stack Badges - Compact & Premium */}
                            {isInStack ? (
                                <Badge
                                    variant="outline"
                                    className="group/badge relative bg-orange-500/[0.04] dark:bg-orange-500/[0.08] border border-orange-500/20 dark:border-orange-500/30 text-[#FF8A4C] dark:text-orange-400 text-[10px] h-6 px-2.5 flex items-center justify-center gap-1 whitespace-nowrap rounded-xl backdrop-blur-sm font-semibold tracking-tight cursor-pointer hover:bg-orange-500/[0.08] dark:hover:bg-orange-500/[0.15] hover:border-orange-500/30 dark:hover:border-orange-500/40 transition-all duration-300 shadow-inner hover:shadow-[0_0_12px_rgba(255,138,76,0.2)] dark:hover:shadow-[0_0_16px_rgba(255,138,76,0.3)]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onRemove && integration.id) onRemove(integration.id);
                                    }}
                                >
                                    <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                                    In Stack
                                    <X className="w-0 h-2.5 opacity-0 group-hover/badge:w-2.5 group-hover/badge:opacity-60 group-hover/badge:ml-0.5 hover:!opacity-100 hover:text-red-500 hover:scale-110 transition-all duration-300 overflow-hidden" />
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="bg-gray-50 dark:bg-zinc-900/40 border border-gray-200/70 dark:border-zinc-800/70 text-gray-400 dark:text-zinc-500 text-[10px] h-6 px-2.5 flex items-center justify-center gap-1 whitespace-nowrap rounded-xl font-medium tracking-tight hover:border-orange-500/25 dark:hover:border-orange-500/30 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-500/[0.03] dark:hover:bg-orange-500/[0.05] transition-all duration-300 cursor-pointer group/add-badge"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onAdd) onAdd(integration.datasource.slug, integration.datasource.category);
                                    }}
                                >
                                    <Plus className="w-2.5 h-2.5 group-hover/add-badge:rotate-90 transition-transform duration-300" />
                                    Add to Stack
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isSyncing && (
                <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <SyncProgress
                        integrationId={integration.id || ''}
                        status={integration.status}
                        metadata={integration.metadata_info}
                        onRefresh={() => onRefresh?.()}
                    />
                </div>
            )}

            {/* Privacy & Safety Stickers - Enhanced Footer */}
            <TooltipProvider>
                <div className="relative z-10 flex items-center gap-4 pt-5 border-t border-gray-200/70 dark:border-zinc-800/40 bg-gray-50/30 dark:bg-zinc-900/30 -mx-6 px-6 -mb-6 pb-6 rounded-b-xl">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-zinc-400 cursor-help group/security">
                                <Shield className="w-3 h-3 text-orange-400 dark:text-orange-500 group-hover/security:scale-110 transition-transform duration-200" />
                                <span>AES-256</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] p-2 bg-zinc-900 border-zinc-800 text-zinc-400 max-w-[200px]">
                            Credentials encrypted at rest with authenticated symmetric encryption.
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-zinc-400 cursor-help group/read">
                                <Eye className="w-3 h-3 text-emerald-400 dark:text-emerald-500 group-hover/read:scale-110 transition-transform duration-200" />
                                <span>Read-only</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[10px] p-2 bg-zinc-900 border-zinc-800 text-zinc-400 max-w-[200px]">
                            We never modify your Shopify data. We only sync what's needed for analytics.
                        </TooltipContent>
                    </Tooltip>

                    {isConnected && (
                        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                            <RefreshCw className={cn("w-3 h-3 text-emerald-400 dark:text-emerald-500", isSyncing && "animate-spin")} />
                            <span>
                                {isSyncing ? 'Syncing now...' : (
                                    integration.last_sync_at ? (
                                        (() => {
                                            try {
                                                const ds = integration.last_sync_at;
                                                // Ensure the string is treated as UTC if it doesn't have a timezone suffix
                                                const isoString = (ds.endsWith('Z') || ds.includes('+')) ? ds : ds + 'Z';
                                                const date = new Date(isoString);
                                                const now = new Date();
                                                const diff = (now.getTime() - date.getTime()) / 1000;

                                                if (diff < 60) return 'Just now';
                                                if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                                                if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                                                return `${Math.floor(diff / 86400)}d ago`;
                                            } catch (e) {
                                                return 'Unknown';
                                            }
                                        })()
                                    ) : 'Never'
                                )}
                            </span>
                        </div>
                    )}
                </div>
            </TooltipProvider>
        </Card >
    );
};
