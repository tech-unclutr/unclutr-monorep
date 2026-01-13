import React from 'react';
import { ActivityFeed } from '@/components/integrations/ActivityFeed';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle2, Info, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Integration } from '@/lib/api/integrations';

interface IntegrationActivitySectionProps {
    activeIntegration: Integration;
    companyId: string | null;
    open: boolean;
    isProcessingOrCoolingDown: boolean;
    isReconciling: boolean;
    isErrorState: boolean;
    isStuck: boolean;
    syncError: any;
    syncStats: any;
    onConnect: (slug: string) => void;
    onTriggerReconciliation: () => void;
    isManualVerification?: boolean;
}

export const IntegrationActivitySection: React.FC<IntegrationActivitySectionProps> = ({
    activeIntegration,
    companyId,
    open,
    isProcessingOrCoolingDown,
    isReconciling,
    isErrorState,
    isStuck,
    syncError,
    syncStats,
    onConnect,
    onTriggerReconciliation,
    isManualVerification = false
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Live Pulse
                    </h4>
                    <Badge variant="outline" className="text-[10px] h-5 gap-1 border-emerald-200/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Real-time
                    </Badge>
                </div>

                {/* Verify Data Integrity Button */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isProcessingOrCoolingDown}
                        className={cn(
                            "h-7 px-2 text-[10px] gap-1.5 transition-all",
                            // Stuck or Error -> Red clickable
                            (isStuck || isErrorState || syncError)
                                ? "bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 border-red-200 dark:border-red-500/20"
                                : isProcessingOrCoolingDown
                                    ? "text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10 dark:text-emerald-400 cursor-default"
                                    : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 cursor-alias" // Arrow alias
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            onTriggerReconciliation();
                        }}
                    >
                        {isProcessingOrCoolingDown ? (
                            <>
                                {isReconciling ? (
                                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                ) : isErrorState ? (
                                    <Info className="w-3 h-3 shrink-0 text-red-500" />
                                ) : (
                                    <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500" />
                                )}

                                {syncStats.message ? (
                                    <div className="flex items-center gap-2">
                                        {/* Auto-Trigger Success Message Change */}
                                        {syncStats.message === 'Integrity Verified' && !isManualVerification ? (
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Excellent</span>
                                        ) : (
                                            <span className="max-w-[140px] truncate text-[9px] font-medium opacity-90">{syncStats.message}</span>
                                        )}

                                        {syncStats.message.toLowerCase().includes("reconnect") && (
                                            <div
                                                className="cursor-pointer hover:underline text-[9px] font-bold text-emerald-600 dark:text-emerald-400"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onConnect('shopify');
                                                }}
                                            >
                                                Fix Now
                                            </div>
                                        )}
                                    </div>
                                ) : "Verifying..."}
                            </>
                        ) : (
                            <>
                                {activeIntegration.metadata_info?.sync_stats?.message?.toLowerCase().includes("reconnect") ? (
                                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-bold"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onConnect('shopify');
                                        }}
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Fix Connection
                                    </div>
                                ) : (
                                    <>
                                        {/* Error / Stuck State -> Show Retry */}
                                        {(isStuck || isErrorState || syncError) ? (
                                            <>
                                                <RefreshCw className="w-3 h-3 text-red-500" />
                                                <span className="text-red-600 dark:text-red-400 font-bold">Retry Verification</span>
                                            </>
                                        ) : (
                                            <>
                                                {/* Default State */}
                                                <ShieldCheck className="w-3 h-3" />
                                                Verify Integrity
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </Button>

                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="cursor-help p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-50 hover:opacity-100">
                                    <Info className="w-3 h-3 text-gray-400 dark:text-zinc-500" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                sideOffset={12}
                                className="max-w-[260px] p-0 overflow-hidden bg-zinc-900/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 ring-1 ring-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200"
                            >
                                <div className="px-4 py-3 border-b border-zinc-800/50 bg-gradient-to-b from-white/5 to-transparent">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest">
                                            {syncError ? "Network Error" : "Data Integrity Guard"}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-4 py-3">
                                    <p className="text-xs font-medium text-zinc-300 leading-relaxed">
                                        {syncError
                                            ? "Could not fetch integration status. Click to refresh the connection."
                                            : "Triggers a deep \"Zero-Drift\" audit to guarantee 100% data match with Shopify."
                                        }
                                    </p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Progress Bar (Module 7 Improvement) */}
            {isReconciling && !isStuck && syncStats.progress !== undefined && (
                <div className="w-full h-1 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${syncStats.progress}%` }}
                    />
                </div>
            )}

            <div className="min-h-[200px] border border-gray-100 dark:border-zinc-800 rounded-lg bg-gray-50/50 dark:bg-zinc-900/50 overflow-hidden">
                <ActivityFeed
                    integrationId={activeIntegration.id}
                    open={open}
                    companyId={companyId || undefined}
                    onSyncTriggered={() => {
                        // Handle any specific sync trigger logic for the drawer if needed
                    }}
                />
            </div>
        </div>
    );
};
