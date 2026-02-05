"use strict";
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatToIST, formatRelativeTime } from "@/lib/utils";
import { CheckCircle2, Link as LinkIcon, XCircle, AlertCircle, PhoneIncoming, PhoneCall, Clock } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CallLogEntry {
    lead_id: string;
    name: string;
    phone_number: string;
    status: string;
    outcome?: string;
    duration: number;
    timestamp: string;
    key_insight?: string;
    is_dnc?: boolean;
    critical_signal?: {
        type: string;
        label: string;
        severity: 'critical' | 'warning' | 'info';
    };
    intent_priority?: {
        level: 'high' | 'medium';
        label: string;
        emoji: string;
    };
    avatar_seed: string;
}

interface CampaignActivityLogProps {
    history: CallLogEntry[];
    onSelectCall: (call: CallLogEntry) => void;
}

const statusConfig: Record<string, { color: string, Icon: any }> = {
    'INTENT_YES': { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', Icon: CheckCircle2 },
    'INTERESTED': { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', Icon: CheckCircle2 },
    'NOT_INTERESTED': { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', Icon: AlertCircle },
    'DNC': { color: 'bg-red-500/10 text-red-600 border-red-500/20', Icon: XCircle },
    'SCHEDULED': { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', Icon: CheckCircle2 },
    'VOICEMAIL': { color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20', Icon: PhoneIncoming },
    'NO_ANSWER': { color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20', Icon: PhoneIncoming },
    'BUSY': { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', Icon: PhoneIncoming },
    'FAILED': { color: 'bg-red-500/10 text-red-600 border-red-500/20', Icon: XCircle },
    'CONNECTED': { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', Icon: PhoneCall },
};

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const CampaignActivityLog: React.FC<CampaignActivityLogProps> = ({ history, onSelectCall }) => {
    return (
        <div className="space-y-4">
            {history.map((item, idx) => {
                const status = (item.outcome || item.status || 'FAILED').toUpperCase();
                const config = statusConfig[status] || { color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20', Icon: Clock };
                const colorClass = config.color;

                // Detect language (simple heuristic)
                const hindiPattern = /[\u0900-\u097F]+/;
                const hasHindi = item.key_insight && hindiPattern.test(item.key_insight);

                return (
                    <Card
                        key={`${item.lead_id}-${idx}`}
                        className="group relative overflow-hidden transition-all duration-300 bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-100 dark:border-zinc-800/60 hover:border-indigo-200 dark:hover:border-indigo-500/30 shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer p-6"
                        onClick={() => onSelectCall(item)}
                    >
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-md shrink-0 bg-zinc-50 dark:bg-zinc-900">
                                <img
                                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.avatar_seed}`}
                                    alt={item.name}
                                    className="w-full h-full object-contain scale-125 translate-y-1"
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Top Row: Name + Duration + Status */}
                                <div className="flex items-center justify-between gap-3 mb-1.5">
                                    <div className="flex items-center gap-2 truncate">
                                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                            {item.name}
                                        </h3>
                                        <span className="text-[10px] text-zinc-400 font-medium" title={formatToIST(item.timestamp)}>
                                            {formatRelativeTime(item.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant="outline" className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 text-[10px] font-bold px-2 py-0 border-zinc-200 dark:border-zinc-800">
                                            {formatDuration(item.duration)}
                                        </Badge>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 cursor-default transition-all hover:scale-105 active:scale-95", statusConfig[status]?.color || 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20')}>
                                                        {(() => {
                                                            const Icon = statusConfig[status]?.Icon || Clock;
                                                            return <Icon className="w-3.5 h-3.5" />;
                                                        })()}
                                                        {status.replace(/_/g, ' ')}
                                                    </Badge>
                                                </TooltipTrigger>
                                                {item.outcome && (
                                                    <TooltipContent
                                                        side="top"
                                                        className={cn(
                                                            "z-[100] bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 rounded-2xl max-w-[240px]",
                                                            (status === 'FAILED' || status === 'DNC') && "border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                                        )}
                                                    >
                                                        <div className="flex flex-col gap-2.5">
                                                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                                                <div className={cn(
                                                                    "p-1 rounded-md",
                                                                    status === 'FAILED' || status === 'DNC' ? "bg-red-500/20 text-red-400" : "bg-indigo-500/20 text-indigo-400"
                                                                )}>
                                                                    <AlertCircle className="w-3 h-3" />
                                                                </div>
                                                                <span className="font-black uppercase tracking-[0.2em] text-[10px] text-white/50">
                                                                    Status Detail
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] leading-relaxed font-semibold text-white/90">
                                                                {item.outcome}
                                                            </p>
                                                        </div>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>

                                {/* Key Quote */}
                                <p className={cn(
                                    "italic mb-2 line-clamp-1 leading-relaxed",
                                    item.intent_priority?.level === 'high'
                                        ? "text-[14px] font-semibold text-zinc-900 dark:text-zinc-100"
                                        : item.intent_priority?.level === 'medium'
                                            ? "text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
                                            : "text-[13px] text-zinc-600 dark:text-zinc-400"
                                )}>
                                    {item.intent_priority && (
                                        <span className="not-italic mr-1 text-[10px] opacity-60">●</span>
                                    )}
                                    {item.key_insight ? `"${item.key_insight}"` : "No response captured"}
                                </p>

                                {/* Tags Row */}
                                <div className="flex items-center gap-2">
                                    {hasHindi && (
                                        <Badge className="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400 text-[9px] font-bold px-2 py-0 border-0">
                                            Hindi
                                        </Badge>
                                    )}
                                    {item.critical_signal && (
                                        <Badge className={cn(
                                            "text-[9px] font-bold px-2 py-0 border-0 shadow-none",
                                            item.critical_signal.severity === 'critical'
                                                ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                                                : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                                        )}>
                                            {item.critical_signal.label}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Subtle glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Card>
                );
            })}
        </div>
    );
};
