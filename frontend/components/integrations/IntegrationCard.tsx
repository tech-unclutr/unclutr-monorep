"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, RefreshCw, Shield, Eye, Settings2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Integration } from '@/lib/api/integrations';

interface IntegrationCardProps {
    integration: Integration;
    onConnect: (slug: string) => void;
    onViewDetails: (integration: Integration) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
    integration,
    onConnect,
    onViewDetails
}) => {
    const isConnected = integration.status === 'active';
    const isSyncing = integration.status === 'syncing';
    const isError = integration.status === 'error';
    const isInactive = integration.status === 'inactive';
    const isDisconnectRequested = integration.status === 'disconnect_requested';

    return (
        <Card className="w-full min-w-[320px] lg:min-w-[380px] p-5 border-gray-100/50 dark:border-white/[0.03] bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center p-2 shadow-sm overflow-hidden shrink-0">
                        {integration.datasource.logo_url ? (
                            <img
                                src={integration.datasource.logo_url}
                                alt={integration.datasource.name}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">
                                {integration.datasource.name[0]}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        {!integration.datasource.is_implemented && (
                            <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">
                                Coming Soon
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-zinc-100 truncate">{integration.datasource.name}</h3>
                            {isConnected && (
                                <Badge variant="outline" className="bg-emerald-500/5 border-emerald-500/20 text-emerald-500 text-[10px] py-0 px-2 flex items-center gap-1 shrink-0">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Active
                                </Badge>
                            )}
                            {isDisconnectRequested && (
                                <Badge variant="destructive" className="text-[10px] py-0 px-2 shrink-0">
                                    Disconnect Pending
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
                            {integration.datasource.description || `Sync your ${integration.datasource.name} data.`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 shrink-0">
                    {isConnected ? (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewDetails(integration)}
                                className="h-8 rounded-lg border-gray-200 dark:border-zinc-800 text-xs font-medium transition-all hover:bg-gray-50 dark:hover:bg-zinc-800"
                            >
                                <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                                Configure
                            </Button>
                        </div>
                    ) : (<>
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2">
                                {integration.datasource.is_implemented && (
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onConnect(integration.datasource.slug);
                                        }}
                                        size="sm"
                                        className="h-8.5 rounded-xl text-xs font-bold px-5 transition-all bg-gradient-to-r from-[#FF8A4C] to-[#FF7026] hover:from-[#ff965e] hover:to-[#ff8240] text-white shadow-[0_4px_12px_rgba(255,138,76,0.3)] hover:shadow-[0_6px_16px_rgba(255,138,76,0.4)] hover:-translate-y-0.5 active:translate-y-0 flex-1 border-none"
                                    >
                                        Connect
                                    </Button>
                                )}
                                {isInactive && integration.datasource.is_implemented && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewDetails(integration);
                                        }}
                                        className="h-8.5 w-8.5 rounded-xl border-gray-200/50 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-white/[0.15] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all shrink-0 shadow-sm"
                                    >
                                        <Settings2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            {isInactive && (
                                <Badge
                                    variant="outline"
                                    className="bg-orange-500/[0.03] dark:bg-orange-500/[0.05] border-orange-500/20 text-[#FF8A4C] text-[10px] py-1 px-3 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg backdrop-blur-[2px] font-bold tracking-tight shadow-[0_2px_8px_rgba(255,138,76,0.05)]"
                                >
                                    <Sparkles className="w-3 h-3 animate-pulse text-orange-400" />
                                    In Your Stack
                                </Badge>
                            )}
                        </div>
                    </>)}
                </div>
            </div>

            {/* Privacy & Safety Stickers */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100/50 dark:border-white/[0.03]">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-zinc-500">
                    <Shield className="w-3 h-3 text-orange-400" />
                    <span>AES-256 Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-zinc-500">
                    <Eye className="w-3 h-3 text-emerald-400" />
                    <span>Read-only access</span>
                </div>

                {isConnected && (
                    <div className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-gray-400 dark:text-zinc-500">
                        <RefreshCw className={cn("w-3 h-3 text-emerald-400", isSyncing && "animate-spin")} />
                        <span>Synced {integration.last_sync_at ? '2m ago' : 'never'}</span>
                    </div>
                )}
            </div>
        </Card >
    );
};
