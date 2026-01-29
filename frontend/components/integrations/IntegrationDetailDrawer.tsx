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
    Info,
    ShieldCheck
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
import { IntegrationActivitySection } from '@/components/integrations/IntegrationActivitySection';
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

import { IntegritySuccessModal } from '@/components/integrations/IntegritySuccessModal';
import { Loader2 } from 'lucide-react'; // Add Loader2 import

// ... imports remain the same up to checkCircle ...

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
    const [showIntegrityModal, setShowIntegrityModal] = React.useState(false);

    // Persist last valid integration to prevent drawer closing during transient updates
    const lastValidIntegration = React.useRef<Integration | null>(integration);
    if (integration) {
        lastValidIntegration.current = integration;
    }

    // Use latest data from SWR, or prop, or fallback to last valid ref
    // This ensures we always have data to render if the drawer is meant to be open
    const targetIntegration = integration || lastValidIntegration.current;

    // Real-time Pulse: Poll for latest integration status/stats when drawer is open
    // IMPORTANT: This hook must be called unconditionally (before any early returns)
    const { data: latestIntegration, error: syncError, isValidating, mutate } = useSWR(
        open && targetIntegration?.id ? [`/api/v1/integrations/${targetIntegration.id}`, companyId] : null,
        () => targetIntegration ? getIntegration(companyId!, targetIntegration.id) : null,
        {
            refreshInterval: 1000, // Speed up poll to 1s for smoother progress bars
            dedupingInterval: 500,
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            shouldRetryOnError: true
        }
    );

    // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
    const [verificationCompleteTime, setVerificationCompleteTime] = React.useState<number | null>(null);
    const [reconciliationStartTime, setReconciliationStartTime] = React.useState<number | null>(null);
    const lastShownCompletionRef = React.useRef<string | null>(null);
    const hasAutoSyncedRef = React.useRef<string | null>(null);
    const [isManualVerification, setIsManualVerification] = React.useState(false);

    // Calculate values needed for hooks (use optional chaining for safety before early return)
    const activeIntegration = latestIntegration || targetIntegration;
    const syncStats = activeIntegration?.metadata_info?.sync_stats || {};
    const isReconciling = syncStats.current_step === 'reconciling';
    const isComplete = syncStats.current_step === 'complete' && syncStats.message === 'Integrity Verified';
    const isErrorState = syncStats.current_step === 'error';
    const isConnected = activeIntegration?.status === 'active';
    const isSyncing = activeIntegration?.status === 'syncing' || activeIntegration?.status === 'SYNCING';

    // Robust Date Parser
    const parseResilientDate = React.useCallback((dateStr?: string) => {
        if (!dateStr) return 0;
        try {
            const isoString = (dateStr.endsWith('Z') || dateStr.includes('+')) ? dateStr : dateStr + 'Z';
            return new Date(isoString).getTime();
        } catch { return 0; }
    }, []);

    // ALL useEffect HOOKS MUST BE CALLED BEFORE EARLY RETURN
    // Local Timer Logic
    React.useEffect(() => {
        if ((isComplete || isErrorState) && !verificationCompleteTime) {
            setVerificationCompleteTime(Date.now());
            setReconciliationStartTime(null);
        }
        if (isReconciling) {
            setVerificationCompleteTime(null);
            if (!reconciliationStartTime) {
                setReconciliationStartTime(Date.now());
            }
        }
    }, [isComplete, isErrorState, isReconciling, verificationCompleteTime, reconciliationStartTime]);

    // Effect to trigger auto-sync on open
    React.useEffect(() => {
        if (open && activeIntegration?.id && isConnected && !isSyncing && !isReconciling) {
            if (hasAutoSyncedRef.current !== activeIntegration.id) {
                console.log(`[Drawer] Auto-triggering integrity check for ${activeIntegration.id}`);
                hasAutoSyncedRef.current = activeIntegration.id;
                setIsManualVerification(false);

                import('@/lib/api/integrations').then(({ verifyIntegrationIntegrity }) => {
                    verifyIntegrationIntegrity(companyId!, activeIntegration.id)
                        .then(() => mutate())
                        .catch(err => console.error("[Drawer] Auto-sync failed:", err));
                });
            }
        }
        if (!open) {
            hasAutoSyncedRef.current = null;
        }
    }, [open, activeIntegration?.id, isConnected, isSyncing, isReconciling, companyId, mutate]);

    // Effect to trigger modal on completion
    React.useEffect(() => {
        if (isComplete) {
            const completionKey = syncStats.last_updated || '';
            if (completionKey && lastShownCompletionRef.current !== completionKey) {
                const serverTime = parseResilientDate(syncStats.last_updated);
                if (Date.now() - serverTime < 15000 && isManualVerification) {
                    lastShownCompletionRef.current = completionKey;
                    setShowIntegrityModal(true);
                }
            }
        }
    }, [isComplete, syncStats.last_updated, isManualVerification, parseResilientDate, setShowIntegrityModal]);

    // Early return AFTER all hooks have been called
    if (!targetIntegration) return null;
    // Ensure activeIntegration is defined (it should be if targetIntegration is defined)
    if (!activeIntegration) return null;

    // Recalculate values after early return for use in JSX (now we know activeIntegration exists)
    // We already know targetIntegration is not null here. But activeIntegration can be latestIntegration (which could be undefined/null).
    // So we ensure it falls back to targetIntegration.
    const safeIntegration = latestIntegration || targetIntegration!;
    const isError = safeIntegration.status === 'error';
    const isActiveState = isConnected || isSyncing || isError;

    const timeSinceCompletion = verificationCompleteTime ? Date.now() - verificationCompleteTime : 99999;
    const isStuck = reconciliationStartTime && (Date.now() - reconciliationStartTime > 300000);
    const isProcessingOrCoolingDown = (isReconciling && !isStuck) || (verificationCompleteTime !== null && timeSinceCompletion < 3000);


    const getTimeAgo = (dateStr?: string) => {
        if (!dateStr) return "Never";
        try {
            // Ensure the string is treated as UTC if it doesn't have a timezone suffix
            const isoString = (dateStr.endsWith('Z') || dateStr.includes('+')) ? dateStr : dateStr + 'Z';
            const date = new Date(isoString);
            const now = new Date();
            const diff = (now.getTime() - date.getTime()) / 1000;

            if (diff < 30) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            return `${Math.floor(diff / 86400)}d ago`;
        } catch { return "Unknown"; }
    };

    return (
        <>
            <IntegritySuccessModal
                isOpen={showIntegrityModal}
                onClose={() => setShowIntegrityModal(false)}
            />
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="sm:max-w-md border-l border-gray-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl p-0 flex flex-col">
                    <SheetHeader className="p-6 border-b border-gray-100 dark:border-zinc-900 text-left">
                        {/* Header Content Omitted for Brevity - Keeping Existing Layout */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center p-2 shadow-sm overflow-hidden">
                                {targetIntegration.datasource.logo_url ? (
                                    <img src={targetIntegration.datasource.logo_url} alt={targetIntegration.datasource.name} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">
                                        {targetIntegration.datasource.name[0]}
                                    </div>
                                )}
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-bold dark:text-zinc-100">{targetIntegration.datasource.name}</SheetTitle>
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
                                    {isError && (
                                        <button
                                            onClick={() => integration && onConnect(integration.datasource.slug)}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            Reconnect
                                        </button>
                                    )}
                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">•</span>
                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">Read-only</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-1">
                            {targetIntegration.metadata_info?.shop ? (
                                <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#95BF47]/10 dark:bg-[#95BF47]/20">
                                            <ShieldCheck className="w-3 h-3 text-[#95BF47]" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-zinc-300">
                                            Connected to <span className="font-bold text-gray-900 dark:text-white">{targetIntegration.metadata_info.shop.replace('.myshopify.com', '')}</span>
                                        </span>
                                    </div>
                                    <div className="h-3 w-px bg-gray-200 dark:bg-zinc-700" />
                                    <div className="flex items-center gap-1.5">
                                        <div className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Secure</span>
                                    </div>
                                </div>
                            ) : (
                                <SheetDescription className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                                    {targetIntegration.datasource.description || `Securely connected to ${targetIntegration.datasource.name}. We only fetch what's necessary to compute your metrics.`}
                                </SheetDescription>
                            )}
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Pre-Connection Benefits */}
                        {!isConnected && (
                            <div className="space-y-4">
                                {/* ... Same as original ... */}
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
                        {isActiveState && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Control & Statistics */}
                                <SyncStatusCard
                                    status={activeIntegration.status}
                                    lastSynced={activeIntegration.last_sync_at || undefined}
                                    syncStats={activeIntegration.metadata_info?.sync_stats}
                                    onSync={() => onSync(activeIntegration.id)}
                                />

                                {/* Technical Sync Statistics Grid */}
                                {activeIntegration.metadata_info?.sync_stats && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'Orders', key: 'orders_count', tooltip: 'Includes all orders (open, archived, cancelled) from all sales channels.' },
                                            { label: 'Products', key: 'products_count', tooltip: 'Total count of products (Active + Draft/Archived).' },
                                            { label: 'Inventory', key: 'inventory_count', tooltip: 'Total available stock across all tracked inventory items and locations.' }
                                        ].map((stat, index) => {
                                            const isLast = index === 2;
                                            return (
                                                <div key={stat.key} className="p-3 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 transition-all hover:bg-gray-50 dark:hover:bg-zinc-900 group">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <div className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                                                            {stat.label}
                                                        </div>
                                                        {stat.tooltip && (
                                                            <TooltipProvider delayDuration={0}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="group/info cursor-help p-0.5 -m-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative">
                                                                            <Info className="w-2.5 h-2.5 text-gray-300 dark:text-zinc-600 group-hover/info:text-[#FF8A4C] transition-colors" />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent
                                                                        side={isLast ? "left" : "bottom"}

                                                                        className={cn(
                                                                            "max-w-[240px] p-0 overflow-hidden bg-zinc-900/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 ring-1 ring-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-xl animate-in fade-in zoom-in-95 duration-200",
                                                                            isLast ? "slide-in-from-right-2 origin-right" : "slide-in-from-top-1 origin-top"
                                                                        )}
                                                                    >
                                                                        <div className="px-4 py-3 border-b border-zinc-800/50 bg-gradient-to-b from-white/5 to-transparent">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8A4C] shadow-[0_0_8px_rgba(255,138,76,0.5)]" />
                                                                                <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest">Calculation</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="px-4 py-3">
                                                                            <p className="text-xs font-medium text-zinc-300 leading-relaxed">
                                                                                {stat.tooltip}
                                                                            </p>
                                                                        </div>
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
                                            );
                                        })}
                                    </div>
                                )}
                                {activeIntegration.metadata_info?.sync_stats?.last_updated && (
                                    <div className="flex items-center justify-end gap-1.5 mt-2 pr-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                                        <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
                                            Last {syncStats.message === 'Integrity Verified' ? 'Verified' : 'Updated'}: {getTimeAgo(activeIntegration.metadata_info.sync_stats.last_updated)}
                                        </span>
                                    </div>
                                )}

                                {/* Live Activity Monitor & Integrity Controls */}
                                <IntegrationActivitySection
                                    activeIntegration={activeIntegration}
                                    companyId={companyId || null}
                                    open={open}
                                    isProcessingOrCoolingDown={isProcessingOrCoolingDown}
                                    isManualVerification={isManualVerification}
                                    isReconciling={isReconciling}
                                    isErrorState={isErrorState}
                                    isStuck={isStuck || false}
                                    syncError={syncError}
                                    syncStats={syncStats}
                                    onConnect={onConnect}
                                    onTriggerReconciliation={() => {
                                        // Smart Recovery: If backend advises reconnect, hijack the click to fix it.
                                        if (activeIntegration.metadata_info?.sync_stats?.message?.toLowerCase().includes("reconnect")) {
                                            onConnect('shopify');
                                            return;
                                        }

                                        if (companyId && activeIntegration?.id) {
                                            setIsManualVerification(true); // Manual trigger
                                            mutate();
                                            import('@/lib/api/integrations').then(({ verifyIntegrationIntegrity }) => {
                                                verifyIntegrationIntegrity(companyId, activeIntegration.id)
                                                    .then(() => mutate())
                                                    .catch(err => console.error(err));
                                            });
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {!isActiveState && (
                            <div className="space-y-8">
                                {/* Security Info Data Points (Kept same as original) */}
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
                        {/* Footer Buttons (Same as Original) */}
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
                                        onSync(targetIntegration.id)
                                    }}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Sync Data Now
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-11 transition-all text-xs font-bold flex items-center justify-center gap-2 border-red-500/10 text-red-500 hover:bg-red-500/5 hover:border-red-500/20"
                                    onClick={() => onDisconnect(targetIntegration.id)}
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
                                        onConnect(targetIntegration.datasource.slug);
                                    }}
                                >
                                    Connect {targetIntegration.datasource.name}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-11 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900 text-xs font-bold"
                                    onClick={() => onDisconnect(targetIntegration.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove from Stack
                                </Button>
                            </div>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet >
        </>
    );
};

