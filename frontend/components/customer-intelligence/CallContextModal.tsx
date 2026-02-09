"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import {
    PhoneCall,
    Bot,
    User,
    Calendar,
    Clock,
    Sparkles,
    MessageSquare,
    History,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    XCircle,
    Loader2,
    Info
} from 'lucide-react';
import { cn, formatPhoneNumber } from "@/lib/utils";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CallContextModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string;
    itemId: string;
    leadName: string;
}

interface TimelineEvent {
    id: string;
    type: 'AI_CALL' | 'USER_CALL';
    timestamp: string;
    duration: number;
    agent_name: string;
    summary: string;
    outcome: string;
    transcript?: string;
}

export const CallContextModal = ({ isOpen, onClose, leadId, itemId, leadName }: CallContextModalProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [context, setContext] = useState<any>(null);
    const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

    const fetchContext = async () => {
        setIsLoading(true);
        try {
            const data = await api.get(`/user-queue/${itemId}/context`);
            setContext(data);
        } catch (error) {
            const err = error as any;
            console.error("Failed to fetch lead context:", err);
            if (err.response) {
                console.error("Error Response:", err.response.status, err.response.data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log("CallContextModal Effect Triggered:", { isOpen, itemId, leadId });
        if (isOpen) {
            if (itemId) {
                console.log("Fetching context for item:", itemId);
                fetchContext();
            } else {
                console.error("Missing itemId for CallContextModal", { leadId, leadName });
                setIsLoading(false); // Stop loading so we don't spin forever
                setContext(null); // Ensure context is null to trigger empty/error state if any
            }
        }
    }, [isOpen, itemId]);

    const timeline: TimelineEvent[] = [];
    if (context) {
        // AI History
        if (context.ai_call_history) {
            const rawHistory = Array.isArray(context.ai_call_history)
                ? context.ai_call_history
                : [context.ai_call_history];

            rawHistory.forEach((call: any, idx: number) => {
                if (!call || Object.keys(call).length === 0) return;

                timeline.push({
                    id: `ai-${idx}`,
                    type: 'AI_CALL',
                    timestamp: call.created_at || call.timestamp,
                    duration: call.call_duration || call.duration,
                    agent_name: call.agent_id || 'Maya',
                    summary: call.transcript_summary || call.summary,
                    outcome: call.call_status || call.outcome,
                    transcript: call.transcript
                });
            });
        }
        // User History
        if (context.user_call_logs) {
            context.user_call_logs.forEach((log: any) => {
                timeline.push({
                    id: log.id,
                    type: 'USER_CALL',
                    timestamp: log.created_at,
                    duration: log.duration,
                    agent_name: 'You',
                    summary: log.notes,
                    outcome: log.status
                });
            });
        }
        // Sort by timestamp
        timeline.sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl rounded-[3rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden h-[85vh] flex flex-col">
                <DialogTitle className="sr-only">Call Context for {leadName}</DialogTitle>
                <DialogDescription className="sr-only">
                    View execution history and details for this lead.
                </DialogDescription>
                {/* Header Section */}
                <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-8 text-white">
                    <div className="flex items-center gap-6">
                        <Avatar className="w-20 h-20 border-4 border-white/20 shadow-2xl">
                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${leadId}`} />
                            <AvatarFallback>{leadName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black tracking-tight">{leadName}</h2>
                            <div className="flex items-center gap-4">
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/10 font-black">
                                    {formatPhoneNumber(context?.lead?.contact_number)}
                                </Badge>
                                <div className="flex items-center gap-1.5 text-orange-100 text-sm font-bold">
                                    <Sparkles className="w-4 h-4" />
                                    {Math.round((context?.user_queue_item?.intent_strength || 0) * 100)}% Intent Strength
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col md:flex-row divide-x divide-zinc-100 dark:divide-zinc-800">
                            {/* Left: Metadata & Preferences */}
                            <div className="w-full md:w-64 p-6 space-y-8 bg-zinc-50/50 dark:bg-zinc-900/10">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Engagement Stats</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-500">AI Attempts</span>
                                            <span className="text-xs font-black text-zinc-900 dark:text-white">{context?.ai_call_history?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-500">User Attempts</span>
                                            <span className="text-xs font-black text-zinc-900 dark:text-white">{context?.user_call_logs?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-500">Total Duration</span>
                                            <span className="text-xs font-black text-zinc-900 dark:text-white">~12 mins</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Confirmed Time</h4>
                                    {context?.user_queue_item?.confirmation_slot ? (
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-emerald-600" />
                                            <div className="leading-tight">
                                                <p className="text-xs font-black text-emerald-700">{format(new Date(context.user_queue_item.confirmation_slot), "MMM do")}</p>
                                                <p className="text-[10px] font-bold text-emerald-600">{format(new Date(context.user_queue_item.confirmation_slot), "h:mm a")}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-zinc-400 font-medium italic">No preferred slot detected.</p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Extracted Context</h4>
                                    <ScrollArea className="h-40">
                                        <div className="space-y-3">
                                            {context?.user_queue_item?.ai_summary ? (
                                                <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 text-[11px] font-medium leading-relaxed">
                                                    {context.user_queue_item.ai_summary}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-zinc-400 italic">No summary available.</p>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>

                            {/* Right: Timeline */}
                            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                                <div className="flex items-center gap-3 mb-6">
                                    <History className="w-5 h-5 text-orange-500" />
                                    <h4 className="text-base font-black text-zinc-900 dark:text-white tracking-tight">Timeline & Interactions</h4>
                                </div>

                                <ScrollArea className="flex-1 pr-4">
                                    <div className="space-y-6 relative ml-4 border-l-2 border-zinc-100 dark:border-zinc-800 pl-8">
                                        {timeline.map((event) => (
                                            <div key={event.id} className="relative group">
                                                {/* Point */}
                                                <div className={cn(
                                                    "absolute -left-[45px] top-4 w-8 h-8 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                                    event.type === 'AI_CALL' ? "bg-orange-500" : "bg-emerald-500"
                                                )}>
                                                    {event.type === 'AI_CALL' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-black text-zinc-900 dark:text-white">{event.agent_name}</span>
                                                            <Badge variant="secondary" className={cn(
                                                                "text-[9px] font-black uppercase tracking-widest px-2 py-0",
                                                                event.type === 'AI_CALL' ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                                                            )}>
                                                                {event.type === 'AI_CALL' ? "AI Agent" : "Human Agent"}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-zinc-400">
                                                            {(() => {
                                                                try {
                                                                    if (!event.timestamp) return "N/A";
                                                                    const date = new Date(event.timestamp);
                                                                    if (isNaN(date.getTime())) return "Invalid Date";
                                                                    return format(date, "MMM d, h:mm a");
                                                                } catch {
                                                                    return "N/A";
                                                                }
                                                            })()}
                                                        </span>
                                                    </div>

                                                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-5 border border-zinc-100 dark:border-zinc-800 group-hover:border-orange-500/20 transition-colors">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn(
                                                                        "w-2 h-2 rounded-full",
                                                                        ["CONNECTED", "CONNECTED_SUCCESS", "SUCCESS", "WON"].includes(event.outcome) ? "bg-emerald-500" : "bg-amber-500"
                                                                    )} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{event.outcome}</span>
                                                                </div>
                                                                <p className="text-xs font-bold text-zinc-400">{event.duration} seconds</p>
                                                            </div>
                                                            {event.transcript && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 rounded-xl text-orange-500 font-bold text-[10px]"
                                                                    onClick={() => setExpandedCallId(expandedCallId === event.id ? null : event.id)}
                                                                >
                                                                    {expandedCallId === event.id ? "Hide Transcript" : "View Details"}
                                                                    {expandedCallId === event.id ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <p className="text-sm text-zinc-600 dark:text-zinc-300 font-semibold leading-relaxed">
                                                            {event.summary || "No specific details logged for this interaction."}
                                                        </p>

                                                        {expandedCallId === event.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800"
                                                            >
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Transcript Preview</span>
                                                                </div>
                                                                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 space-y-2 whitespace-pre-wrap italic">
                                                                    {event.transcript}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        This log is immutable and generated in real-time.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" className="rounded-2xl font-bold h-12 px-6" onClick={onClose}>Close</Button>
                        <Button className="rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black h-12 px-8 shadow-xl shadow-orange-500/20">
                            <PhoneCall className="w-4 h-4 mr-2" />
                            RESUME CALL FLOW
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
