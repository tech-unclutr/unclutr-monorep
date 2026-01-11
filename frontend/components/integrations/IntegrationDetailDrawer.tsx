"use client";

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Shield,
    Eye,
    Database,
    ArrowRight,
    Trash2,
    Sparkles,
    Activity,
    Info
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Integration } from '@/lib/api/integrations';
import { SyncProgress } from '@/components/integrations/SyncProgress';
import { ActivityFeed } from '@/components/integrations/ActivityFeed';
import { SyncStatusCard } from '@/components/integrations/SyncStatusCard';
import useSWR from 'swr';
import { useAuth } from '@/hooks/use-auth';
import { getIntegration } from '@/lib/api/integrations';

interface IntegrationDetailDrawerProps {
    integration: Integration | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSync: (id: string) => void;
    onDisconnect: (id: string) => void;
    onConnect: (slug: string) => void;
    onRefresh?: () => void;
}

export const IntegrationDetailDrawer: React.FC<IntegrationDetailDrawerProps> = ({
    integration,
    open,
    onOpenChange,
    onSync,
    onDisconnect,
    onConnect,
    onRefresh
}) => {
    const { companyId } = useAuth();
    if (!integration) return null;

    // Real-time Pulse: Poll for latest integration status/stats when drawer is open
    const { data: latestIntegration } = useSWR(
        open && integration?.id ? [`/api/v1/integrations/${integration.id}`, companyId] : null,
        () => getIntegration(companyId!, integration!.id),
        {
            refreshInterval: 3000, // Poll every 3s for live pulse
            dedupingInterval: 2000
        }
    );

    // Use latest data if available, fallback to initial prop
    const activeIntegration = latestIntegration || integration;

    const isConnected = activeIntegration.status === 'active';
    const isSyncing = activeIntegration.status === 'syncing' || activeIntegration.status === 'SYNCING';
    const isError = integration.status === 'error';
    const isActiveState = isConnected || isSyncing || isError;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md border-l border-gray-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-gray-100 dark:border-zinc-900 text-left">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center p-2 shadow-sm overflow-hidden">
                            {integration.datasource.logo_url ? (
                                <img src={integration.datasource.logo_url} alt={integration.datasource.name} className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">
                                    {integration.datasource.name[0]}
                                </div>
                            )}
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold dark:text-zinc-100">{integration.datasource.name}</SheetTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={cn(
                                    "text-[10px] py-0 px-2 flex items-center gap-1 relative overflow-hidden",
                                    isConnected
                                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500"
                                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
                                )}>
                                    {isActiveState && (
                                        <>
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full mr-0.5",
                                                isConnected ? "bg-emerald-500 animate-pulse" :
                                                    isSyncing ? "bg-blue-500 animate-spin" : "bg-red-500"
                                            )} />
                                            {isConnected && <div className="absolute top-1/2 left-2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />}
                                        </>
                                    )}
                                    {!isActiveState && <Activity className="w-2.5 h-2.5" />}
                                    {isConnected ? "Healthy" : isSyncing ? "Syncing..." : isError ? "Connection Error" : "Not Connected"}
                                </Badge>
                                <span className="text-[10px] text-gray-400 dark:text-zinc-500">•</span>
                                <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">Read-only</span>
                            </div>
                        </div>
                    </div>
                    <SheetDescription className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                        {integration.datasource.description || `Securely connected to ${integration.datasource.name}. We only fetch what's necessary to compute your metrics.`}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Pre-Connection Benefits */}
                    {!isConnected && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 tracking-wider uppercase flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                                What you get
                            </h4>
                            <div className="grid gap-3">
                                <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">Automated Profit Analytics</div>
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">
                                            We'll automatically fetch orders, fees, and payouts to calculate your true net profit.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold text-gray-900 dark:text-zinc-100">Historical Sync</div>
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">
                                            We backfill up to 12 months of data to give you instant historical context.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Health Stats (Only if Connected/Active) */}
                    {/* Health & Sync (Consolidated) */}
                    {isActiveState && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Control & Statistics */}
                            <SyncStatusCard
                                status={activeIntegration.status}
                                lastSynced={activeIntegration.last_sync_at}
                                syncStats={activeIntegration.metadata_info?.sync_stats}
                                onSync={() => onSync(activeIntegration.id)}
                            />

                            {/* Technical Sync Statistics Grid */}
                            {activeIntegration.metadata_info?.sync_stats && (
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: 'Orders', key: 'orders_count', tooltip: 'Includes all orders (open, archived, cancelled) from all sales channels.' },
                                        { label: 'Products', key: 'products_count', tooltip: 'Total count of products (Active + Draft/Archived).' },
                                        { label: 'Discounts', key: 'discounts_count', tooltip: 'Total number of price rules and automatic discounts configured.' }
                                    ].map((stat) => (
                                        <div key={stat.key} className="p-3 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 transition-all hover:bg-gray-50 dark:hover:bg-zinc-900 group">
                                            <div className="flex items-center gap-1 mb-1">
                                                <div className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest truncate">
                                                    {stat.label}
                                                </div>
                                                {stat.tooltip && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="w-2.5 h-2.5 text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-400 cursor-help transition-colors" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-[200px] p-3 leading-relaxed bg-zinc-900 border-zinc-800 shadow-xl" sideOffset={5}>
                                                                <div className="font-semibold text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Calculation</div>
                                                                <div className="text-xs text-zinc-100">{stat.tooltip}</div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-zinc-100 tabular-nums">
                                                {new Intl.NumberFormat('en-US', {
                                                    notation: activeIntegration.metadata_info?.sync_stats?.[stat.key] > 9999 ? 'compact' : 'standard',
                                                    maximumFractionDigits: 1
                                                }).format(activeIntegration.metadata_info?.sync_stats?.[stat.key] || 0)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Live Activity Monitor */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 tracking-wider uppercase flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5" />
                                    Live Pulse
                                </h4>
                                <ActivityFeed
                                    integrationId={integration.id}
                                    open={open}
                                    companyId={companyId}
                                    onSyncTriggered={() => {
                                        // Clear activity feed when sync is triggered
                                        if (typeof window !== 'undefined' && (window as any).__clearActivityFeed) {
                                            (window as any).__clearActivityFeed()
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {!isActiveState && (
                        <div className="space-y-8">
                            {/* Security Info */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 tracking-wider uppercase flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5" />
                                    Data Safety & Privacy
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                        <Eye className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-tight">Read-Only Access</div>
                                            <div className="text-[11px] text-emerald-600/70 dark:text-emerald-500/60 mt-0.5 leading-normal">
                                                We never modify your data. We only read what's necessary to compute unit economics.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                                        <Database className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-tight">Encrypted at Rest</div>
                                            <div className="text-[11px] text-orange-600/70 dark:text-orange-500/60 mt-0.5 leading-normal">
                                                All connection credentials are encrypted using industry-standard AES-256.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Data Points */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 tracking-wider uppercase flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5" />
                                    Data we access
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {['Orders', 'Payments', 'Taxes', 'Discounts', 'Inventory', 'Customers'].map(tag => (
                                        <Badge key={tag} variant="outline" className="bg-gray-50/50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 text-[10px] py-1 px-3">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <SheetFooter className="p-6 border-t border-gray-100 dark:border-zinc-900 space-y-3 sm:flex-col">
                    <div className="text-[11px] text-gray-400 dark:text-zinc-500 italic text-center w-full mb-2">
                        Connected through secure API connector. Unclutr is SOC 2 compliant.
                    </div>
                    {isActiveState ? (
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full h-11 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 font-bold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center gap-2"
                                onClick={() => {
                                    // Clear activity feed before syncing
                                    if (typeof window !== 'undefined' && (window as any).__clearActivityFeed) {
                                        (window as any).__clearActivityFeed()
                                    }
                                    onSync(integration.id)
                                }}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Sync Data Now
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-11 transition-all text-xs font-bold flex items-center justify-center gap-2 border-red-500/10 text-red-500 hover:bg-red-500/5 hover:border-red-500/20"
                                onClick={() => onDisconnect(integration.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                                Request Disconnection
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Button
                                className="w-full h-11 bg-[#FF8A4C] hover:bg-[#FF8A4C]/90 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20"
                                onClick={() => {
                                    onConnect(integration.datasource.slug);
                                }}
                            >
                                Connect {integration.datasource.name}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-11 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900 text-xs font-bold"
                                onClick={() => onDisconnect(integration.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove from Stack
                            </Button>
                        </div>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet >
    );
};
