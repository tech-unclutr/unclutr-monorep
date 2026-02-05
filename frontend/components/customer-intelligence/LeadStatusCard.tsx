import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Clock, User, FileText, CheckCircle2, RotateCcw, AlertCircle, Phone, PhoneIncoming, PhoneCall, XCircle, AlertTriangle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeadStatusCardProps {
    lead: {
        id: string;
        name: string;
        avatar_seed?: string;
        status?: string;
        outcome?: string;
        cohort?: string;
        duration?: number; // In seconds, for history items
        meta_data?: Record<string, unknown>;
        scheduled_for?: string;
    };
    type: 'UPCOMING' | 'AGENT_ACTIVE' | 'HISTORY' | 'HUMAN_QUEUE';
    onAction?: (action: 'approve' | 'reschedule' | 'retry', leadId: string) => void;
}

export function LeadStatusCard({ lead, type, onAction }: LeadStatusCardProps) {
    const getStatusInfo = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'intent_yes':
            case 'scheduled':
                return {
                    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
                    Icon: CheckCircle2
                };

            case 'pending_availability':
            case 'ambiguous':
            case 'scheduled_check':
                return {
                    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
                    Icon: AlertCircle
                };

            case 'voicemail':
            case 'no_answer':
            case 'busy':
                return {
                    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
                    Icon: PhoneIncoming
                };

            case 'speaking':
                return {
                    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800',
                    Icon: PhoneCall
                };

            case 'initiated':
            case 'ringing':
            case 'connected':
            case 'in-progress':
                return {
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
                    Icon: Phone
                };

            case 'failed':
            case 'intent_no':
            case 'dnc':
            case 'failed_connect':
            case 'hangup':
            case 'silence':
            case 'language_barrier':
            case 'wrong_person':
            case 'fax_robot':
                return {
                    color: 'text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
                    Icon: XCircle
                };

            default:
                return {
                    color: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
                    Icon: Clock
                };
        }
    };

    const retriableStates = ['failed', 'voicemail', 'no_answer', 'busy', 'cancelled', 'hangup', 'silence', 'ambiguous', 'language_barrier', 'failed_connect'];
    const isRetriable = retriableStates.includes(lead.status?.toLowerCase() || '');

    return (
        <div className="w-[320px] p-1 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Avatar className="w-14 h-14 border-2 border-white dark:border-zinc-800 shadow-md">
                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${lead.avatar_seed || lead.name}`} />
                    <AvatarFallback>{lead.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white truncate">{lead.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        {(() => {
                            const { color: statusColor, Icon: StatusIcon } = getStatusInfo(lead.status || 'Waiting');
                            return (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 h-6 rounded-full border flex items-center gap-1.5 cursor-default transition-all hover:scale-105 active:scale-95 ${statusColor}`}>
                                                <StatusIcon className="w-3 h-3 shrink-0" />
                                                <span className="truncate">
                                                    {lead.status === 'PENDING_AVAILABILITY' ? 'Review Required' :
                                                        lead.status === 'AMBIGUOUS' ? 'Unclear Outcome' :
                                                            (lead.status || 'In Queue')}
                                                </span>
                                            </Badge>
                                        </TooltipTrigger>
                                        {(lead.outcome || lead.status === 'AMBIGUOUS') && (
                                            <TooltipContent
                                                side="top"
                                                className="z-[100] bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 rounded-2xl max-w-[240px]"
                                            >
                                                <div className="flex flex-col gap-2.5">
                                                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                                        {(() => {
                                                            const statusKey = lead.status?.toLowerCase();
                                                            const isError = statusKey === 'failed' || statusKey === 'intent_no' || statusKey === 'dnc' || statusKey === 'failed_connect';
                                                            const isAmbiguous = statusKey === 'ambiguous' || statusKey === 'pending_availability';

                                                            return (
                                                                <div className={cn(
                                                                    "p-1 rounded-md",
                                                                    isError ? "bg-red-500/20 text-red-400" :
                                                                        isAmbiguous ? "bg-amber-500/20 text-amber-400" : "bg-indigo-500/20 text-indigo-400"
                                                                )}>
                                                                    <AlertCircle className="w-3 h-3" />
                                                                </div>
                                                            );
                                                        })()}
                                                        <span className="font-black uppercase tracking-[0.2em] text-[9px] text-white/50">
                                                            {lead.status?.toLowerCase() === 'ambiguous' ? 'Neural Insight' : 'Status Detail'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] leading-relaxed font-semibold text-white/90">
                                                        {lead.outcome || (lead.status === 'AMBIGUOUS' ? 'AI connected but intent was unclear. Manual review suggested.' : '')}
                                                    </p>
                                                </div>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })()}
                        {lead.cohort && (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                                {lead.cohort}
                            </span>
                        )}
                    </div>
                </div>
            </div>


            {/* Context / Metadata */}
            <div className="space-y-3">
                {type === 'HISTORY' && typeof lead.duration === 'number' && (
                    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Duration: <span className="font-medium text-zinc-900 dark:text-zinc-200">{Math.floor(lead.duration / 60)}m {lead.duration % 60}s</span></span>
                    </div>
                )}

                {(lead.meta_data?.transcript_summary as string) && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-2.5 text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex items-center gap-1.5 mb-1 text-zinc-900 dark:text-zinc-300 font-semibold">
                            <FileText className="w-3 h-3" />
                            Summary
                        </div>
                        <p className="line-clamp-3 leading-relaxed">
                            {lead.meta_data?.transcript_summary as string}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                        <span className="text-zinc-400">Last Contact</span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Today, 2:30 PM</span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                        <span className="text-zinc-400">Timezone</span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">PST (UTC-8)</span>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
                {lead.status === 'PENDING_AVAILABILITY' ? (
                    <>
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full text-[10px] h-8 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                            onClick={() => onAction?.('approve', lead.id)}
                        >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approve
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[10px] h-8 border-orange-200 text-orange-600 font-bold"
                            onClick={() => onAction?.('reschedule', lead.id)}
                        >
                            Reschedule
                        </Button>
                    </>
                ) : (
                    <>
                        {isRetriable ? (
                            <Button
                                variant="default"
                                size="sm"
                                className="w-full text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                onClick={() => onAction?.('retry', lead.id)}
                            >
                                <RotateCcw className="w-3 h-3 mr-1.5" />
                                Retry Call
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" className="w-full text-xs h-8">
                                <User className="w-3.5 h-3.5 mr-1.5" />
                                Profile
                            </Button>
                        )}
                        <Button
                            variant={isRetriable ? "outline" : "ghost"}
                            size="sm"
                            className={isRetriable ? "w-full text-xs h-8" : "w-full text-xs h-8 text-zinc-500 hover:text-zinc-900"}
                        >
                            {isRetriable ? <User className="w-3.5 h-3.5 mr-1.5" /> : null}
                            {isRetriable ? "Profile" : "View Logs"}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}


