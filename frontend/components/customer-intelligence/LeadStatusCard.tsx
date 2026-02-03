import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, User, FileText, CheckCircle2 } from 'lucide-react';

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
    onAction?: (action: 'approve' | 'reschedule', leadId: string) => void;
}

export function LeadStatusCard({ lead, type, onAction }: LeadStatusCardProps) {
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
            case 'failed': return 'text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
            case 'speaking': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800';
            case 'connected': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
            case 'pending_availability': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
            case 'scheduled': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
            case 'initiated': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
            default: return 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700';
        }
    };

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
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 h-5 rounded-full border ${getStatusColor(lead.status || 'Waiting')}`}>
                            {lead.status === 'PENDING_AVAILABILITY' ? 'Review Required' : (lead.status || 'In Queue')}
                        </Badge>
                        {lead.cohort && (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                                {lead.cohort}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {lead.status?.toLowerCase() === 'failed' && lead.outcome && (
                <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 leading-tight">
                        <span className="uppercase tracking-widest mr-1">Error:</span>
                        {lead.outcome}
                    </p>
                </div>
            )}

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
                        <Button variant="outline" size="sm" className="w-full text-xs h-8">
                            <User className="w-3.5 h-3.5 mr-1.5" />
                            Profile
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-zinc-500 hover:text-zinc-900">
                            View Logs
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

import { CheckCircle2 as CheckCircleIcon } from 'lucide-react'; 
