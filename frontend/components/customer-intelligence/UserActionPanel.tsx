"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PhoneCall,
    Sparkles,
    Clock,
    ArrowRight,
    User,
    Bot,
    ChevronRight,
    Info,
    Calendar,
    RefreshCw,
    MoreHorizontal,
    PhoneOff,
    CheckCircle2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

// --- Types ---

interface UserQueueItem {
    id: string;
    lead_id: string;
    lead_name: string;
    contact_number: string;
    ai_summary: string;
    intent_strength: number;
    confirmation_slot: string | null;
    detected_at: string;
    priority_score: number;
    status: 'READY' | 'LOCKED' | 'RESCHEDULED' | 'CLOSED';
    user_call_count: number;
    last_user_call_at: string | null;
    locked_by_user_id: string | null;
    lock_expires_at: string | null;
}

interface UserActionPanelProps {
    campaignId: string;
    onCallClick?: (item: UserQueueItem) => void;
    onContextClick?: (item: UserQueueItem) => void;
}

// --- Sub-components ---

const IntentBadge = ({ strength }: { strength: number }) => {
    const isHigh = strength >= 80;
    const isMedium = strength >= 60;

    return (
        <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
            isHigh ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                isMedium ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
        )}>
            <Sparkles className="w-3 h-3" />
            {strength}% Intent
        </div>
    );
};

const CountdownTimer = ({ targetTime }: { targetTime: string }) => {
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const target = new Date(targetTime);
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft("NOW");
                setIsUrgent(true);
                return;
            }

            const mins = Math.floor(diff / 1000 / 60);
            if (mins < 30) setIsUrgent(true);

            if (mins < 60) setTimeLeft(`${mins}m`);
            else {
                const hours = Math.floor(mins / 60);
                const remainingMins = mins % 60;
                setTimeLeft(`${hours}h ${remainingMins}m`);
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [targetTime]);

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs tabular-nums",
            isUrgent ? "bg-red-500/10 text-red-600 border-red-500/20 animate-pulse" : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        )}>
            <Clock className="w-3.5 h-3.5" />
            {isUrgent && targetTime < new Date().toISOString() ? "PAST DUE" : `CALL IN ${timeLeft}`}
        </div>
    );
};

const NextLeadCard = ({ item, onCall, onViewContext }: { item: UserQueueItem, onCall: () => void, onViewContext: () => void }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-shrink-0 w-full md:w-[480px] bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-emerald-500/30 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col group relative"
        >
            {/* Urgency Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="p-8 space-y-6 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute -inset-1.5 bg-emerald-500/20 blur-md rounded-full" />
                            <Avatar className="w-16 h-16 border-4 border-white dark:border-zinc-900 shadow-xl">
                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.lead_id}`} />
                                <AvatarFallback>{item.lead_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white">
                                <span className="text-[10px] font-black">#1</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none mb-1 group-hover:text-emerald-500 transition-colors">
                                {item.lead_name}
                            </h3>
                            <p className="text-sm font-bold text-zinc-400">{item.contact_number}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <IntentBadge strength={item.intent_strength} />
                        {item.confirmation_slot && <CountdownTimer targetTime={item.confirmation_slot} />}
                    </div>
                </div>

                {/* AI Summary Box */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-3xl p-5 border border-emerald-100/50 dark:border-emerald-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Bot className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-white dark:bg-emerald-900/50 flex items-center justify-center shadow-sm">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/70 dark:text-emerald-400">AI Call Summary</span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 font-semibold leading-relaxed line-clamp-3">
                        {item.ai_summary || "Highly interested customer. Expecting a follow-up call."}
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-zinc-400" />
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Detected</p>
                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{formatDistanceToNow(new Date(item.detected_at))} ago</p>
                        </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-3">
                        <PhoneCall className="w-5 h-5 text-zinc-400" />
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Retry Count</p>
                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{item.user_call_count} Attempts</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800/50 flex gap-3">
                <Button
                    onClick={onCall}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-[1.5rem] shadow-xl shadow-emerald-500/20 text-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <PhoneCall className="w-5 h-5 mr-3" />
                    CALL NOW
                </Button>
                <Button
                    variant="outline"
                    className="w-14 h-14 rounded-[1.5rem] border-zinc-200 dark:border-zinc-800"
                    onClick={onViewContext}
                >
                    <MoreHorizontal className="w-6 h-6 text-zinc-500" />
                </Button>
            </div>
        </motion.div>
    );
};

const QueueLeadCard = ({ item, index, onClick }: { item: UserQueueItem, index: number, onClick: () => void }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={onClick}
            className="flex-shrink-0 w-64 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-5 flex flex-col gap-4 group hover:bg-white dark:hover:bg-zinc-900 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
        >
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-emerald-500/10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.lead_id}`} />
                    <AvatarFallback>{item.lead_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                    <h4 className="font-bold text-zinc-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">
                        {item.lead_name}
                    </h4>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        #{index + 2} IN QUEUE
                    </p>
                </div>
            </div>

            <div className="bg-zinc-50/50 dark:bg-black/20 rounded-2xl p-3 border border-zinc-100/50 dark:border-zinc-800/30">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold line-clamp-2 leading-snug italic">
                    "{item.ai_summary || "Ready for follow-up"}"
                </p>
            </div>

            <div className="flex items-center justify-between mt-auto">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter rounded-lg border-zinc-200">
                    {item.intent_strength}% Intent
                </Badge>
                {item.confirmation_slot && (
                    <span className="text-[10px] font-black text-red-500 animate-pulse">
                        DUE SOON
                    </span>
                )}
            </div>
        </motion.div>
    );
};

// --- Main Panel ---

export const UserActionPanel = ({ campaignId, onCallClick, onContextClick }: UserActionPanelProps) => {
    const [queue, setQueue] = useState<UserQueueItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchQueue = async () => {
        try {
            const data = await api.get(`/user-queue/${campaignId}`);
            setQueue(data);
        } catch (error) {
            console.error("Failed to fetch user queue:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 30000); // Poll every 30s as fallback
        return () => clearInterval(interval);
    }, [campaignId]);

    const handleCall = async (item: UserQueueItem) => {
        try {
            // Lock and get fresh item context
            const data = await api.get(`/user-queue/${campaignId}/next?user_id=me`);
            if (onCallClick) {
                onCallClick(data.item);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to start call. It might be locked by someone else.");
            fetchQueue();
        }
    };

    if (isLoading && queue.length === 0) {
        return (
            <div className="w-full h-40 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (queue.length === 0) {
        return (
            <div className="w-full bg-emerald-500/5 dark:bg-emerald-500/10 rounded-[3rem] p-12 flex flex-col items-center justify-center border border-emerald-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <CheckCircle2 className="w-48 h-48 text-emerald-500" />
                </div>
                <div className="w-20 h-20 rounded-full bg-white dark:bg-emerald-900 flex items-center justify-center shadow-xl mb-6">
                    <Sparkles className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">All Caught Up!</h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-semibold max-w-sm text-center">
                    The AI agents are hard at work looking for new opportunities. We'll alert you as soon as a hot lead is ready.
                </p>
                <Button
                    variant="ghost"
                    onClick={fetchQueue}
                    className="mt-6 text-emerald-600 font-bold hover:bg-emerald-500/10"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Manually Refresh
                </Button>
            </div>
        );
    }

    const nextLead = queue[0];
    const upcomingQueue = queue.slice(1);

    return (
        <div className="w-full bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent dark:from-emerald-500/20 dark:via-transparent dark:to-transparent rounded-[4rem] p-10 border border-emerald-500/20 shadow-2xl relative overflow-hidden group/panel">
            {/* Background Blob Effects */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full translate-y-1/2 pointer-events-none" />

            {/* Header Area */}
            <div className="flex items-center justify-between mb-10 px-4">
                <div className="flex items-center gap-5">
                    <div className="flex -space-x-3 transition-transform hover:scale-105 duration-300">
                        {[1, 2, 3].map(i => (
                            <Avatar key={i} className="w-12 h-12 border-4 border-white dark:border-zinc-900 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
                                <AvatarImage src={`/images/avatars/notionists/full_body/avatar_${i}.png`} />
                                <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                        ))}
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 flex items-center justify-center text-zinc-400 shadow-lg">
                            <Bot className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Human Action Pipeline</h2>
                            <Badge className="bg-emerald-500 text-white font-black px-3 py-1 rounded-full text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 animate-bounce">
                                {queue.length} READY
                            </Badge>
                        </div>
                        <p className="text-sm font-bold text-emerald-600/70 dark:text-emerald-400/70">Leads transitioned from AI Team for your closing touch</p>
                    </div>
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" className="rounded-2xl h-12 w-12 p-0 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors">
                                <RefreshCw className="w-5 h-5" onClick={fetchQueue} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Refresh Queue</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* The Belt */}
            <div className="flex items-center gap-10">
                {/* AI TO YOU Animated Arrow */}
                <div className="hidden lg:flex flex-col items-center gap-3 ml-4">
                    <motion.div
                        animate={{ x: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <ArrowRight className="w-8 h-8 text-emerald-500/30" />
                    </motion.div>
                </div>

                {/* Left Card: NEXT UP (BIG) */}
                <NextLeadCard
                    item={nextLead}
                    onCall={() => handleCall(nextLead)}
                    onViewContext={() => onContextClick?.(nextLead)}
                />

                {/* Conveyor Belt: The rest of the queue */}
                <div className="flex-1 min-w-0 h-full py-2">
                    <div className="flex items-center gap-4 mb-4 ml-2">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Upcoming Conveyor</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 via-zinc-200/50 to-transparent dark:from-zinc-800 dark:via-zinc-800/50" />
                    </div>

                    <div
                        ref={scrollRef}
                        className="flex items-center gap-6 overflow-x-auto scrollbar-hide pb-4 px-2"
                        style={{ perspective: "1000px" }}
                    >
                        <AnimatePresence mode="popLayout">
                            {upcomingQueue.length > 0 ? (
                                upcomingQueue.map((item, idx) => (
                                    <QueueLeadCard
                                        key={item.id}
                                        item={item}
                                        index={idx}
                                        onClick={() => onContextClick?.(item)}
                                    />
                                ))
                            ) : (
                                <div className="w-full flex items-center justify-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] text-zinc-400 italic font-medium">
                                    No more leads in pipeline...
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* You Destination Cluster */}
                <div className="flex flex-col items-center gap-4 px-10 border-l border-emerald-500/20">
                    <div className="relative group/user">
                        <div className="absolute -inset-4 bg-emerald-500/20 blur-2xl rounded-full opacity-0 group-hover/user:opacity-100 transition-opacity animate-pulse" />
                        <Avatar className="w-24 h-24 border-8 border-white dark:border-zinc-950 shadow-2xl relative z-10 transition-transform group-hover/user:scale-105">
                            <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=User&backgroundColor=d1fae5" />
                            <AvatarFallback>YOU</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-950 flex items-center justify-center text-white z-20 shadow-xl">
                            <PhoneCall className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-center z-10">
                        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">DESTINATION</h4>
                        <div className="flex items-center justify-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">YOU</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Belt Ticker Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 flex overflow-hidden opacity-30">
                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="flex whitespace-nowrap"
                >
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-12 h-1 bg-emerald-500 mx-8 rounded-full" />
                    ))}
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-12 h-1 bg-emerald-500 mx-8 rounded-full" />
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
