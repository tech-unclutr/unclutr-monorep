"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatToIST, formatRelativeTime, parseAsUTC } from "@/lib/utils";
import { CheckCircle2, Link as LinkIcon, XCircle, AlertCircle, PhoneIncoming, PhoneCall, Clock, Calendar, Copy, Activity } from 'lucide-react';
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
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
    call_log_id?: string;
    // [NEW] Context-aware fields
    next_step?: string;
    sentiment?: {
        emoji: string;
        label: string;
        score: number;
    };
    agreement_status?: {
        status: string;
        confidence: string;
    };
    preferred_slot?: {
        requested: boolean;
        start_time?: string;
        end_time?: string;
        day?: string;
        is_outside_window?: boolean;
    };
    should_copy_to_queue?: boolean;
    copied_to_queue_at?: string;
    user_queue_item_id?: string; // [NEW] For fetching complete lead context
}


interface CampaignActivityLogProps {
    history: CallLogEntry[];
    onSelectCall: (call: CallLogEntry) => void;
    onCopyToQueue?: () => void;
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
    'AMBIGUOUS': { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', Icon: AlertCircle },
    'DISCONNECTED': { color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20', Icon: Clock },
};

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

export const CampaignActivityLog: React.FC<CampaignActivityLogProps> = ({ history, onSelectCall, onCopyToQueue }) => {
    // [NEW] Track collapsed state for each group
    const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

    const handleCopyToQueue = async (call: CallLogEntry) => {
        try {
            const campaignId = window.location.pathname.split('/').pop();

            await api.post(`/execution/campaign/${campaignId}/lead/${call.lead_id}/copy-to-queue`, {
                call_log_id: (call as any).call_log_id,
                preferred_slot: call.preferred_slot
            });
            toast.success("Copied to Queue", {
                description: `Lead ${call.name} has been added to your personal follow-up queue.`
            });
            if (onCopyToQueue) {
                onCopyToQueue();
            }
        } catch (error) {
            toast.error("Copy Failed", {
                description: "Could not add lead to queue. Please try again."
            });
        }
    };

    const handleBookCall = (call: CallLogEntry) => {
        const campaignId = window.location.pathname.split('/').pop();
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/execution/campaign/${campaignId}/lead/${call.lead_id}/book-call`;
        window.open(url, '_blank');
        toast.info("Booking Link Opened", {
            description: "Calendar booking page opened in a new tab."
        });
    };

    // Group consecutive calls to the same lead, with time threshold
    const groupedHistory = React.useMemo(() => {
        const groups: { lead_id: string; calls: CallLogEntry[]; id: string }[] = [];
        const groupMap = new Map<string, { lead_id: string; calls: CallLogEntry[]; id: string }>();
        const TIME_THRESHOLD_MINUTES = 30;

        history.forEach((item, idx) => {
            const existingGroup = groupMap.get(item.lead_id);
            let shouldGroup = false;

            if (existingGroup) {
                const lastCall = existingGroup.calls[existingGroup.calls.length - 1];
                // Assuming history is typically sorted new -> old.
                // item is older than lastCall.
                const itemTime = parseAsUTC(item.timestamp).getTime();
                const lastCallTime = parseAsUTC(lastCall.timestamp).getTime();
                const diffMinutes = Math.abs(lastCallTime - itemTime) / (1000 * 60);

                if (diffMinutes <= TIME_THRESHOLD_MINUTES) {
                    shouldGroup = true;
                }
            }

            if (shouldGroup && existingGroup) {
                existingGroup.calls.push(item);
            } else {
                const newGroup = {
                    lead_id: item.lead_id,
                    calls: [item],
                    id: `${item.lead_id}-${idx}` // Unique ID for the group state
                };
                groups.push(newGroup);
                groupMap.set(item.lead_id, newGroup);
            }
        });

        return groups;
    }, [history]);

    // Initialize collapsed state for new groups
    React.useEffect(() => {
        setCollapsedGroups(prev => {
            const next = { ...prev };
            groupedHistory.forEach(group => {
                if (next[group.id] === undefined) {
                    // Default to collapsed if multiple items, expanded if single
                    next[group.id] = group.calls.length > 1;
                }
            });
            return next;
        });
    }, [groupedHistory]);

    const toggleGroup = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCollapsedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    // Helper to determine the "Primary" call to show in collapsed state
    const getPrimaryCall = (calls: CallLogEntry[]): CallLogEntry => {
        if (calls.length === 1) return calls[0];

        // 1. Agreement / Conversion
        const agreementCall = calls.find(c => c.agreement_status?.status === 'yes');
        if (agreementCall) return agreementCall;

        // 2. High Intent
        const highIntentCall = calls.find(c => c.intent_priority?.level === 'high');
        if (highIntentCall) return highIntentCall;

        // 3. Positive Outcome
        const positiveCall = calls.find(c => ['INTENT_YES', 'INTERESTED', 'SCHEDULED'].includes(c.outcome || c.status || ''));
        if (positiveCall) return positiveCall;

        // 4. Connected
        const connectedCall = calls.find(c => (c.outcome || c.status) === 'CONNECTED');
        if (connectedCall) return connectedCall;

        // 5. Default to the latest (first in the list)
        return calls[0];
    };

    if (history.length === 0) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center p-8 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="relative flex items-center justify-center">
                        <motion.div
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute -inset-4 bg-zinc-500/30 blur-2xl rounded-full"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.15, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Activity className="relative w-8 h-8 text-zinc-400 dark:text-zinc-500 opacity-90" strokeWidth={1.5} />
                        </motion.div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 tracking-tight">No activity yet</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 font-normal">
                            Waiting for the first connection.
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-3 pb-4">
            {groupedHistory.slice(0, 20).map((group) => {
                const isCollapsed = collapsedGroups[group.id];
                const primaryCall = getPrimaryCall(group.calls);
                const isStack = group.calls.length > 1;

                return (
                    <motion.div
                        key={group.id}
                        initial={false}
                        animate={isCollapsed ? "collapsed" : "expanded"}
                        className="relative"
                    >
                        {/* Stack Effect Layers (only visible when collapsed) */}
                        <AnimatePresence>
                            {isStack && isCollapsed && (
                                <>
                                    {/* Second card in stack */}
                                    <motion.div
                                        initial={{ scale: 0.95, y: 0, opacity: 0, rotateX: 0 }}
                                        animate={{ scale: 0.95, y: 6, opacity: 0.9, rotateX: -2 }}
                                        exit={{ scale: 1, y: 0, opacity: 0, rotateX: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="absolute inset-x-2 bottom-0 h-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-lg z-0"
                                        style={{ transformOrigin: "center bottom" }}
                                    />
                                    {/* Third card in stack */}
                                    <motion.div
                                        initial={{ scale: 0.90, y: 0, opacity: 0, rotateX: 0 }}
                                        animate={{ scale: 0.90, y: 12, opacity: 0.7, rotateX: -3 }}
                                        exit={{ scale: 1, y: 0, opacity: 0, rotateX: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.02 }}
                                        className="absolute inset-x-4 bottom-0 h-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-md -z-10"
                                        style={{ transformOrigin: "center bottom" }}
                                    />
                                </>
                            )}
                        </AnimatePresence>

                        {/* Main Card Container */}
                        <Card
                            className={cn(
                                "relative z-10 overflow-hidden transition-all duration-300 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800/60",
                                isStack && "cursor-pointer hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-lg",
                                !isStack && "hover:shadow-md hover:-translate-y-0.5 shadow-sm"
                            )}
                            onClick={(e) => isStack ? toggleGroup(group.id, e) : onSelectCall(primaryCall)}
                        >
                            {/* Collapsed State View */}
                            {isCollapsed ? (
                                <div className="p-3 group">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm shrink-0 bg-zinc-50 dark:bg-zinc-900">
                                            <img
                                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${primaryCall.avatar_seed}`}
                                                alt={primaryCall.name}
                                                className="w-full h-full object-contain scale-125 translate-y-1"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                                                    {primaryCall.name}
                                                    {isStack && (
                                                        <Badge variant="secondary" className="text-[8px] px-1.5 h-3.5 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-0">
                                                            {group.calls.length}
                                                        </Badge>
                                                    )}
                                                </h3>
                                                <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                                                    {formatRelativeTime(primaryCall.timestamp)}
                                                </span>
                                            </div>

                                            {/* Primary Call Summary */}
                                            <CallItemDetails call={primaryCall} showDetails={false} />
                                        </div>
                                    </div>

                                    {/* Expand Indicator */}
                                    {isStack && (
                                        <div className="mt-2 flex items-center justify-center">
                                            <motion.div
                                                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Expand</span>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Expanded State View */
                                <div className="flex flex-col">
                                    {/* Header (Sticky-ish) - Click to collapse */}
                                    <div
                                        className={cn("p-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/50 backdrop-blur-sm", isStack && "cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors")}
                                        onClick={(e) => isStack && toggleGroup(group.id, e)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-full overflow-hidden border border-white dark:border-zinc-800 shadow-sm shrink-0 bg-zinc-50 dark:bg-zinc-900">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${group.calls[0].avatar_seed}`} // Always use first seed
                                                    alt={group.calls[0].name}
                                                    className="w-full h-full object-contain scale-125 translate-y-1"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                                                    {group.calls[0].name}
                                                </h3>
                                                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                    {group.calls.length} Call{group.calls.length > 1 ? 's' : ''} Sequence
                                                </p>
                                            </div>
                                        </div>
                                        {isStack && (
                                            <motion.div
                                                className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                                                    <polyline points="18 15 12 9 6 15"></polyline>
                                                </svg>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Thread of Calls */}
                                    <div className="flex flex-col">
                                        {group.calls.map((call, idx) => (
                                            <div
                                                key={`${call.lead_id}-${idx}`}
                                                className={cn(
                                                    "p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer border-b border-zinc-50 dark:border-zinc-800/50 last:border-0",
                                                    // Highlight primary call contextually
                                                    call === primaryCall && "bg-orange-50/30 dark:bg-orange-500/5"
                                                )}
                                                onClick={(e) => { e.stopPropagation(); onSelectCall(call); }}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Timeline Line */}
                                                    <div className="flex flex-col items-center self-stretch w-4 pt-1.5">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full ring-2 ring-white dark:ring-zinc-950",
                                                            (call.outcome || '').includes('YES') || (call.outcome || '').includes('INTERESTED')
                                                                ? "bg-emerald-500"
                                                                : "bg-zinc-300 dark:bg-zinc-700"
                                                        )} />
                                                        {idx < group.calls.length - 1 && (
                                                            <div className="w-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800 my-1" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] uppercase font-bold text-zinc-400">
                                                                {formatRelativeTime(call.timestamp)}
                                                            </span>
                                                            {call === primaryCall && (
                                                                <Badge variant="outline" className="text-[8px] h-4 border-orange-200 text-orange-500">Key Context</Badge>
                                                            )}
                                                        </div>
                                                        <CallItemDetails
                                                            call={call}
                                                            showDetails={true}
                                                            onCopyToQueue={handleCopyToQueue}
                                                            onBookCall={handleBookCall}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
};

// Extracted Component for cleaner rendering of call content
const CallItemDetails: React.FC<{
    call: CallLogEntry;
    showDetails: boolean;
    onCopyToQueue?: (call: CallLogEntry) => void;
    onBookCall?: (call: CallLogEntry) => void;
}> = ({ call, showDetails, onCopyToQueue, onBookCall }) => {
    const hindiPattern = /[\u0900-\u097F]+/;
    const hasHindi = call.key_insight && hindiPattern.test(call.key_insight);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs}s`;
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    };

    const getDisplayStatus = (call: CallLogEntry) => {
        // 1. Priority: AGREED (if applicable)
        if (call.agreement_status?.status === 'yes') {
            return {
                label: 'AGREED',
                color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                Icon: CheckCircle2
            };
        }

        // 2. Default Outcome/Status
        const statusKey = (call.outcome || call.status || 'FAILED').toUpperCase();
        const config = statusConfig[statusKey] || { color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20', Icon: Clock };

        return {
            label: statusKey === 'AMBIGUOUS' ? 'Unclear' : statusKey.replace(/_/g, ' '),
            color: config.color,
            Icon: config.Icon
        };
    };

    const displayStatus = getDisplayStatus(call);

    return (
        <div className="flex flex-col gap-1.5">
            {/* Top Row for this call: Status + Duration */}
            <div className="flex items-center gap-2 mb-0.5">
                <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1 cursor-default", displayStatus.color)}>
                    <displayStatus.Icon className="w-2.5 h-2.5" />
                    {displayStatus.label}
                </Badge>

                <span className="text-[10px] text-zinc-400">
                    {formatDuration(call.duration)}
                </span>
            </div>

            {/* Insight */}
            <p className={cn(
                "text-sm leading-relaxed line-clamp-2",
                call.intent_priority?.level === 'high'
                    ? "text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-600 dark:text-zinc-400"
            )}>
                {call.intent_priority && (
                    <span className="mr-1.5 text-[10px] opacity-60">●</span>
                )}
                {call.key_insight || "—"}
            </p>

            {/* Next Step Action */}
            {call.next_step && (
                <div className="flex items-start gap-2 mt-1.5">
                    <div className="mt-[3px] text-orange-500 dark:text-orange-400 shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 7l10 10" />
                            <path d="M17 7v10h-10" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-300 leading-snug">
                        {call.next_step}
                    </p>
                </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {hasHindi && (
                    <Badge className="bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400 text-[9px] font-bold px-1.5 py-0 border-0">
                        Hindi
                    </Badge>
                )}
                {call.critical_signal && (
                    <Badge className={cn(
                        "text-[9px] font-bold px-1.5 py-0 border-0 shadow-none",
                        call.critical_signal.severity === 'critical'
                            ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    )}>
                        {call.critical_signal.label}
                    </Badge>
                )}
                {call.agreement_status?.status === 'yes' && (
                    <>
                        {/* Only show confidence since AGREED is now primary status */}
                        <Badge className={cn(
                            "text-[9px] font-bold px-1.5 py-0 border-0 shadow-none",
                            call.agreement_status.confidence === 'high'
                                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                : "bg-green-500/10 text-green-600 dark:text-green-400"
                        )}>
                            CONFIDENCE: {call.agreement_status.confidence}
                        </Badge>
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-1.5 py-0 border-0 shadow-none">
                            OPEN
                        </Badge>
                    </>
                )}
            </div>

            {/* Actions for Expanded View */}
            {showDetails && (call.should_copy_to_queue || call.copied_to_queue_at || call.preferred_slot?.is_outside_window) && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 w-full">
                    {call.should_copy_to_queue && !call.copied_to_queue_at && onCopyToQueue && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); onCopyToQueue(call); }}
                            className="h-6 text-[9px] font-black uppercase tracking-widest gap-1.5 border-orange-500/20 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                        >
                            <Copy className="w-3 h-3" />
                            Copy
                        </Button>
                    )}
                    {call.copied_to_queue_at && (
                        <div className="flex items-center gap-1.5 px-2 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">In User Queue</span>
                        </div>
                    )}
                    {call.preferred_slot?.is_outside_window && onBookCall && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); onBookCall(call); }}
                            className="h-6 text-[9px] font-black uppercase tracking-widest gap-1.5 border-blue-500/20 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        >
                            <Calendar className="w-3 h-3" />
                            Book
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
