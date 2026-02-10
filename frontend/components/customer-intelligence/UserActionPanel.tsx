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
    CheckCircle2,
    Phone,
    Copy,
    Check,
    ArrowLeft,
    History,
    Clock4,
    ArrowUpToLine,
    CheckCircle,
    Loader2,
    ShieldCheck,
    Play,
    Lock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CohortBadge } from "./CohortBadge";
import { cn, formatPhoneNumber } from "@/lib/utils";
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
    cohort?: string | null;
    ai_summary: string;
    intent_strength: number;
    confirmation_slot: string | null;
    detected_at: string;
    last_ai_call_at: string | null;
    priority_score: number;
    status: 'READY' | 'LOCKED' | 'RESCHEDULED' | 'CLOSED';
    user_call_count: number;
    last_user_call_at: string | null;
    locked_by_user_id: string | null;
    retry_scheduled_for: string | null;
}

interface UserActionPanelProps {
    campaignId: string;
    campaignStatus?: string; // New
    isStarted?: boolean; // New: Track if session has activated
    onCallClick?: (item: UserQueueItem) => void;
    onContextClick?: (item: UserQueueItem) => void;
    onStart?: () => void; // New
    refreshTrigger?: number;
    historyItems?: any[]; // Using any[] for flexibility matching ExecutionPanel, strictly should be HistoryItem[]
    maxConcurrency?: number;
}

// --- Sub-components ---

const IntentBadge = ({ strength }: { strength: number }) => {
    // Backend returns 0.0-1.0, but we want to treat it as percentage for logic if it's already converted? 
    // Wait, the fix is to PASS it converted or convert it here. 
    // Let's assume we pass the raw value to this badge sometimes? No, the plan said "Update NextLeadCard to pass item.intent_strength * 100".
    // AND "Update QueueLeadCard to display Math.round(item.intent_strength * 100)".
    // So this component expects 0-100.
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
            {Math.round(strength)}% Intent
        </div>
    );
};

const CountdownTimer = ({ targetTime, label = "CALL IN" }: { targetTime: string, label?: string }) => {
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
            isUrgent ? "bg-red-500/10 text-red-600 border-red-500/20 animate-pulse" : "bg-orange-500/10 text-orange-600 border-orange-500/20"
        )}>
            <Clock className="w-3.5 h-3.5" />
            {isUrgent && targetTime < new Date().toISOString() ? "PAST DUE" : `${label} ${timeLeft}`}
        </div>
    );
};

const NextLeadCard = ({
    item,
    onContact,
    onViewContext,
    isContactMode = false,
    onCancelContact,
    onLogOutcome
}: {
    item: UserQueueItem,
    onContact: () => void,
    onViewContext: () => void,
    isContactMode?: boolean,
    onCancelContact?: () => void,
    onLogOutcome?: () => void
}) => {
    const isLocked = item.status === 'LOCKED';
    const isRescheduled = item.status === 'RESCHEDULED';
    const [copied, setCopied] = useState(false);

    const copyNumber = () => {
        navigator.clipboard.writeText(item.contact_number);
        setCopied(true);
        toast.success("Number Copied");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-shrink-0 w-full md:w-[480px] bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-emerald-500/30 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col group relative transition-all duration-500"
        >
            {/* Urgency Glow */}
            {!isContactMode && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />}

            {/* Locked Overlay - REMOVED */}

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
                            {!isContactMode && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white">
                                    <span className="text-[10px] font-black">#1</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none mb-1 group-hover:text-emerald-500 transition-colors">
                                {item.lead_name}
                            </h3>
                            {!isContactMode && (
                                <p className="text-sm font-bold text-zinc-400">
                                    {item.contact_number.replace(/.(?=.{4})/g, '•')} {/* Masked in preview */}
                                </p>
                            )}
                        </div>
                    </div>

                    {!isContactMode && (
                        <div className="flex flex-col items-end gap-2">
                            <IntentBadge strength={item.intent_strength * 100} />
                            {item.confirmation_slot && <CountdownTimer targetTime={item.confirmation_slot} />}
                            {isRescheduled && item.retry_scheduled_for && (
                                <CountdownTimer targetTime={item.retry_scheduled_for} label="RETRY IN" />
                            )}
                        </div>
                    )}
                </div>

                {/* CONTACT MODE UI */}
                {isContactMode ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 pointer-events-none" />

                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Primary Contact</p>

                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={copyNumber}
                                    className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight hover:scale-105 transition-transform active:scale-95 cursor-copy"
                                >
                                    {formatPhoneNumber(item.contact_number)}
                                </button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={copyNumber}
                                    className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400"
                                >
                                    {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                </Button>
                            </div>

                            <div className="flex justify-center gap-2">
                                <Badge variant="outline" className="bg-white dark:bg-black border-zinc-200 text-zinc-500 px-3 py-1">
                                    Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-100/50 dark:border-emerald-500/10">
                                <p className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400 uppercase tracking-wider mb-1">AI Summary</p>
                                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 line-clamp-3">
                                    {item.ai_summary || "Highly interested customer."}
                                </p>
                            </div>
                            <div className="bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Attempts</p>
                                <p className="text-xl font-black text-zinc-700 dark:text-zinc-200">{item.user_call_count + 1} <span className="text-xs font-bold text-zinc-400">Current</span></p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* PREVIEW MODE UI */
                    <>
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
                                <Clock className="w-5 h-5 text-zinc-400" />
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                                        {item.last_ai_call_at ? "AI Call" : "Detected"}
                                    </p>
                                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                                        {item.last_ai_call_at
                                            ? formatDistanceToNow(new Date(item.last_ai_call_at)) + " ago"
                                            : formatDistanceToNow(new Date(item.detected_at)) + " ago"}
                                    </p>
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
                    </>
                )}

                {/* Cohort Info */}
                {!isContactMode && item.cohort && (
                    <div className="flex items-center gap-2 px-1">
                        <CohortBadge cohort={item.cohort} variant="glass" />

                        {/* Swap Trigger */}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800/50 flex gap-3">
                {isContactMode ? (
                    <>
                        <Button
                            variant="outline"
                            onClick={onCancelContact}
                            className="flex-1 h-14 rounded-[1.5rem] border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold hover:bg-zinc-100"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            CANCEL
                        </Button>
                        <Button
                            onClick={onLogOutcome}
                            className="flex-[2] bg-zinc-900 dark:bg-white text-white dark:text-black font-black h-14 rounded-[1.5rem] shadow-xl text-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <CheckCircle2 className="w-5 h-5 mr-3" />
                            LOG OUTCOME
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            onClick={onContact}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-[1.5rem] shadow-xl shadow-emerald-500/20 text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                        >
                            <Phone className="w-5 h-5 mr-3" />
                            {isRescheduled ? "RETRY CONTACT" : "CONTACT"}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-14 h-14 rounded-[1.5rem] border-zinc-200 dark:border-zinc-800"
                            onClick={onViewContext}
                        >
                            <MoreHorizontal className="w-6 h-6 text-zinc-500" />
                        </Button>
                    </>
                )}
            </div>
        </motion.div>
    );
};

const QueueLeadCard = ({ item, index, onClick, onSwap }: { item: UserQueueItem, index: number, onClick: () => void, onSwap: (e: React.MouseEvent) => void }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={onClick}
            className="flex-shrink-0 w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-5 flex flex-col gap-4 group hover:bg-white dark:hover:bg-zinc-900 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
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
                    &quot;{item.ai_summary || "Ready for follow-up"}&quot;
                </p>
            </div>

            <div className="flex items-center justify-between mt-auto">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter rounded-lg border-zinc-200">
                    {Math.round(item.intent_strength * 100)}% Intent
                </Badge>
                {item.confirmation_slot && (
                    <span className="text-[10px] font-black text-red-500 animate-pulse">
                        DUE SOON
                    </span>
                )}
                {item.status === 'RESCHEDULED' && (
                    <span className="text-[10px] font-black text-amber-500">
                        RETRY
                    </span>
                )}
            </div>


            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onSwap}
                                className="h-8 w-8 rounded-full text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50"
                            >
                                <ArrowUpToLine className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Prioritize Lead</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </motion.div >
    );
};

// --- Main Panel ---


export const UserActionPanel = ({ campaignId, campaignStatus = 'ACTIVE', isStarted = false, onCallClick, onContextClick, onStart, refreshTrigger, historyItems = [], maxConcurrency = 2 }: UserActionPanelProps) => {
    const [queue, setQueue] = useState<UserQueueItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [contactModeId, setContactModeId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x, y });
    };

    const [error, setError] = useState<string | null>(null);

    const fetchQueue = async (forceRefresh = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const url = forceRefresh
                ? `/user-queue/${campaignId}?refresh=true`
                : `/user-queue/${campaignId}`;

            const data = await api.get(url);
            setQueue(data);

            if (forceRefresh && data.length > 0) {
                toast.success("Queue Refreshed", {
                    description: `Found ${data.length} leads waiting for you.`
                });
            } else if (forceRefresh) {
                toast.info("All Caught Up", {
                    description: "No new leads found at this time."
                });
            }
        } catch (error) {
            setError("Unable to load queue. Please check your connection.");
            if (forceRefresh) {
                toast.error("Refresh Failed");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue(refreshTrigger ? true : false); // Force refresh if trigger changes (and is not undefined/initial)
        const interval = setInterval(() => fetchQueue(), 30000); // Poll every 30s as fallback
        return () => clearInterval(interval);
    }, [campaignId, refreshTrigger]);

    const handleContactStart = async (item: UserQueueItem) => {
        if (item.locked_by_user_id && item.locked_by_user_id !== 'me') {
            // Locked logic
        }

        try {
            // 1. Lock lead
            const data = await api.get(`/user-queue/${campaignId}/next?user_id=me`);
            // 2. Enter Contact Mode
            if (data.item?.id === item.id) {
                setContactModeId(item.id);
            } else {
                toast.warning("Queue moved", { description: "The lead you selected is no longer available." });
                fetchQueue(true);
            }
        } catch (error: unknown) {
            const err = error as { status?: number, message?: string };
            if (err.status === 423) {
                toast.error("Lead Locked", { description: "This lead is currently being handled by another agent." });
                fetchQueue(true);
            } else {
                toast.error(err.message || "Failed to prepare contact.");
            }
        }
    };

    const handleLogOutcome = (item: UserQueueItem) => {
        // Trigger parent dialog
        if (onCallClick) {
            onCallClick(item);
            // We assume the dialog will handle the rest. 
            // We exit contact mode when the dialog is successfully submitted (parent usually triggers refresh which nukes local state?)
            // Or we can manually clear it here? 
            // Better to clear it when the queue refreshes or we can clear it now assuming dialog takes over visibility.
            setContactModeId(null);
        }
    };

    const handleCancelContact = () => {
        setContactModeId(null);
        // Ideally unlock via API, but backend auto-unlocks eventually. 
        // For MMVP, just UI back.
    };

    const handleSwap = async (item: UserQueueItem, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            await api.post(`/user-queue/${item.id}/boost`, {});
            toast.success("Lead Prioritized", {
                description: `${item.lead_name} moved to top of queue`
            });
            fetchQueue(true); // Immediate refresh to reflect new order
        } catch (error) {
            toast.error("Swap Failed", {
                description: "Could not prioritize this lead."
            });
        }
    };

    if (error && queue.length === 0) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/10 rounded-[3rem] border border-red-200 dark:border-red-900/30 p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <PhoneOff className="w-8 h-8 text-red-500" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-red-700 dark:text-red-400">Connection Error</h3>
                    <p className="text-sm text-red-600/80 dark:text-red-400/70">{error}</p>
                </div>
                <Button onClick={() => fetchQueue(true)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </div>
        );
    }

    // Unified Loading & Empty State
    if (queue.length === 0) {
        // CASE 1: Mission Launch state (Session has NOT started yet)
        if (!isStarted) {
            return (
                <div
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
                    className="w-full min-h-[480px] bg-zinc-50 dark:bg-[#030712] rounded-[3rem] p-8 md:p-10 flex flex-col relative overflow-hidden group border border-zinc-200 dark:border-white/5 shadow-2xl dark:shadow-[0_0_120px_rgba(30,58,138,0.25)] transition-all duration-700"
                >
                    {/* Living Background Elements */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.15] mix-blend-overlay pointer-events-none" />

                    {/* Parallax Mesh Gradients */}
                    <motion.div
                        animate={{
                            x: mousePos.x * 40,
                            y: mousePos.y * 40,
                            scale: [1, 1.1, 1],
                            opacity: [0.08, 0.15, 0.08],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "easeInOut",
                            x: { type: "spring", damping: 20 },
                            y: { type: "spring", damping: 20 }
                        }}
                        className="absolute top-[-25%] right-[-15%] w-[900px] h-[900px] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent dark:from-indigo-600/30 dark:via-purple-600/20 rounded-full blur-[140px] pointer-events-none"
                    />
                    <motion.div
                        animate={{
                            x: mousePos.x * -30,
                            y: mousePos.y * -30,
                            scale: [1, 1.2, 1],
                            opacity: [0.05, 0.1, 0.05],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut",
                            x: { type: "spring", damping: 25 },
                            y: { type: "spring", damping: 25 }
                        }}
                        className="absolute bottom-[-25%] left-[-15%] w-[800px] h-[800px] bg-gradient-to-tr from-cyan-500/20 via-emerald-500/10 to-transparent dark:from-blue-600/30 dark:via-teal-600/20 rounded-full blur-[120px] pointer-events-none"
                    />

                    {/* Interactive Scanlines */}
                    <motion.div
                        animate={{ opacity: [0.01, 0.03, 0.01] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/[0.02] dark:via-white/[0.04] to-transparent bg-[length:100%_4px] animate-scanline pointer-events-none"
                    />

                    {/* Digital Grid Overlay */}
                    <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

                    {/* Top Status HUD */}
                    <div className="flex justify-between items-start mb-10 relative z-20 w-full px-2">
                        <div className="flex flex-col gap-2">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/40 dark:bg-white/5 border border-zinc-900/5 dark:border-white/10 backdrop-blur-2xl shadow-sm"
                            >
                                <div className="relative">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping opacity-75" />
                                </div>
                                <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase">System: Standby</span>
                            </motion.div>
                            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 mt-1 px-1 tracking-widest uppercase">ID: UNIT_ZERO_ALPHA</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[9px] font-black text-zinc-400 dark:text-white/40 tracking-widest uppercase mb-0.5 opacity-60">Tactical Link</p>
                                <p className="text-[10px] font-black text-zinc-500">READY</p>
                            </div>
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 10 }}
                                className="w-9 h-9 rounded-xl bg-white/40 dark:bg-white/5 border border-zinc-900/5 dark:border-white/10 flex items-center justify-center backdrop-blur-md shadow-sm"
                            >
                                <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Central Ignition Hub */}
                    <motion.div
                        animate={{
                            x: mousePos.x * -15,
                            y: mousePos.y * -15
                        }}
                        transition={{ type: "spring", damping: 30 }}
                        className="flex-1 flex flex-col items-center justify-center relative z-20 -mt-8"
                    >
                        <div className="relative mb-16">
                            {/* Multilayered Dynamic Rings */}
                            {[1, 2, 3].map((ring) => (
                                <motion.div
                                    key={ring}
                                    animate={{
                                        rotate: ring % 2 === 0 ? 360 : -360,
                                        scale: [1, 1.02, 1]
                                    }}
                                    transition={{
                                        rotate: { duration: 15 + ring * 5, repeat: Infinity, ease: "linear" },
                                        scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: ring }
                                    }}
                                    className={cn(
                                        "absolute inset-0 rounded-full border border-dashed",
                                        ring === 1 ? "-m-14 border-zinc-900/10 dark:border-white/10 opacity-60" :
                                            ring === 2 ? "-m-10 border-zinc-900/5 dark:border-white/[0.05] opacity-40" :
                                                "-m-6 border-emerald-500/10 dark:border-emerald-500/5 opacity-80"
                                    )}
                                />
                            ))}

                            {/* Synchronized Orbiters */}
                            <div className="absolute inset-0 -m-20 animate-spin-slow pointer-events-none">
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="w-2.5 h-2.5 bg-indigo-500 rounded-full absolute top-1/4 left-0 shadow-[0_0_20px_rgba(99,102,241,1)]"
                                />
                            </div>
                            <div className="absolute inset-0 -m-20 animate-spin-reverse-slow pointer-events-none">
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                                    className="w-2 h-2 bg-emerald-500 rounded-full absolute bottom-1/4 right-0 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                                />
                            </div>

                            {/* The Reactor Core Button */}
                            <motion.div
                                whileHover="hover"
                                whileTap="press"
                                className="relative group/core"
                            >
                                <motion.div
                                    variants={{
                                        hover: { scale: 1.4, opacity: 0.25 },
                                        press: { scale: 0.9, opacity: 0.1 }
                                    }}
                                    className="absolute inset-0 bg-indigo-500 dark:bg-white rounded-full blur-[80px] opacity-0 transition-opacity duration-1000"
                                />

                                <Button
                                    onClick={onStart}
                                    className={cn(
                                        "w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1.5 border-[8px] transition-all duration-500 relative z-30",
                                        "bg-zinc-900 dark:bg-white text-white dark:text-black",
                                        "border-zinc-50 dark:border-zinc-900/10 shadow-xl dark:shadow-[0_0_60px_rgba(255,255,255,0.05)]",
                                        "hover:border-zinc-800 dark:hover:border-zinc-200 hover:shadow-indigo-500/30",
                                        "active:scale-95 active:duration-100"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-zinc-50/10 dark:bg-zinc-900/10 flex items-center justify-center group-hover/core:scale-110 group-hover/core:bg-zinc-50/20 transition-all duration-500">
                                        <Play className="w-5 h-5 fill-current ml-0.5" />
                                    </div>
                                    <span className="text-[9px] font-black tracking-[0.3em] uppercase opacity-80 group-hover/core:opacity-100 transition-opacity text-current dark:text-black">Initialize</span>

                                    {/* Inner Core Shine */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                                </Button>

                                {/* Physical Base Ring */}
                                <div className="absolute -inset-2.5 border border-zinc-900/5 dark:border-white/5 rounded-full pointer-events-none" />
                            </motion.div>
                        </div>

                        <motion.h3
                            animate={{
                                y: mousePos.y * -3
                            }}
                            className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-4 tracking-tighter text-center"
                        >
                            Mission Control
                        </motion.h3>

                        <p className="text-zinc-400 dark:text-zinc-500 font-bold text-base md:text-xl max-w-lg text-center leading-relaxed">
                            Your agent swarm is calibrated and ready.<br />
                            <span className="text-zinc-900 dark:text-zinc-200 font-black">Authorize the ignition</span> to begin the harvest.
                        </p>
                    </motion.div>

                    <div className="mt-12 pt-10 border-t border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between w-full relative z-20 gap-8">
                        <div className="flex items-center gap-8">
                            <div className="flex -space-x-3.5">
                                {[...Array(maxConcurrency)].map((_, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ y: -5, scale: 1.1 }}
                                        className="relative"
                                    >
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Avatar className="w-11 h-11 border-[3px] border-white dark:border-zinc-900 grayscale-[0.6] hover:grayscale-0 transition-all shadow-lg">
                                            <AvatarImage src={`/images/avatars/notionists/full_body/avatar_${(idx % 5) + 1}.png`} className="object-cover object-top" />
                                            <AvatarFallback>AI</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1.5">Intelligence Fleet</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-300">{maxConcurrency} AGENTS</span>
                                    <Badge variant="outline" className="text-[9px] font-black border-zinc-200 dark:border-zinc-800 text-zinc-400 h-4 px-1.5">STANDBY</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="h-10 w-px bg-zinc-200 dark:bg-white/5 hidden sm:block" />
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-1">Encrypted Link</span>
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-500 tracking-tight">SECURE ESTABLISHED</span>
                                </div>
                                <div className="w-11 h-11 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // CASE 2: Active Empty state (Session IS running, but queue is exhausted)
        return (
            <div className="w-full bg-emerald-50/80 dark:bg-emerald-950/20 rounded-[3rem] p-8 md:p-12 flex flex-col relative overflow-hidden group border border-emerald-100 dark:border-emerald-500/20 shadow-xl shadow-emerald-500/5">
                {/* Dynamic Background Mesh */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-200/20 via-emerald-100/10 to-transparent dark:from-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-200/20 via-emerald-100/10 to-transparent dark:from-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                {/* Header Area - Context Aware */}
                <div className="flex items-center justify-between mb-16 z-20 relative">
                    <div className="flex items-center gap-6">
                        {/* Avatar Stack */}
                        <div className="flex -space-x-4">
                            {[...Array(maxConcurrency)].map((_, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="relative"
                                >
                                    <Avatar className="w-12 h-12 border-[3px] border-white dark:border-zinc-950 shadow-md grayscale-[0.8] transition-all duration-500 group-hover:grayscale-0 group-hover:scale-110 z-10">
                                        <AvatarImage src={`/images/avatars/notionists/full_body/avatar_${(idx % 5) + 1}.png`} className="object-cover object-top" />
                                        <AvatarFallback>AI</AvatarFallback>
                                    </Avatar>
                                </motion.div>
                            ))}
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Human Action Pipeline</h2>
                                <Badge
                                    className={cn(
                                        "font-black px-2.5 py-0.5 text-[10px] tracking-widest rounded-lg border backdrop-blur-md transition-colors",
                                        isLoading
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse"
                                            : "bg-white/60 dark:bg-zinc-800/60 text-zinc-400 border-zinc-200 dark:border-zinc-800"
                                    )}
                                >
                                    {isLoading ? "SYNCING LIVE" : "WAITING FOR LEADS"}
                                </Badge>
                            </div>
                            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wide">
                                {isLoading ? "Establishing secure connection to AI agents..." : "Monitoring AI conversations for handover opportunities..."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Big Background Icon - Repositioned to match screenshot */}
                <div className="absolute -right-24 top-1/2 -translate-y-1/2 opacity-[0.06] dark:opacity-[0.08] pointer-events-none transition-transform duration-[4000ms] ease-in-out group-hover:rotate-12 group-hover:scale-110">
                    <CheckCircle className="w-[600px] h-[600px] text-emerald-600 dark:text-emerald-400" strokeWidth={0.8} />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center -mt-8 relative z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="relative mb-10"
                    >
                        {/* Pulse Rings */}
                        <div className={cn("absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20", isLoading ? "animate-pulse" : "hidden")} />

                        {/* Icon Container */}
                        <div className="w-28 h-28 rounded-[2.5rem] bg-white dark:bg-zinc-900 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.25)] flex items-center justify-center relative border border-emerald-100 dark:border-emerald-500/20">
                            {isLoading && (
                                <div className="absolute inset-0 rounded-[2.5rem] border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                            )}
                            <Sparkles className={cn("w-12 h-12 text-emerald-500 transition-all duration-500", !isLoading && "group-hover:scale-110 group-hover:rotate-12")} />
                        </div>

                        {/* Status Indicator Badge */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <div className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full bg-white", isLoading ? "animate-ping" : "opacity-50")} />
                                {isLoading ? "LISTENING" : "READY"}
                            </div>
                        </div>
                    </motion.div>

                    <h3 className="text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 tracking-tighter text-center bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                        {isLoading ? "Syncing Pipeline..." : "All Caught Up"}
                    </h3>

                    <p className="text-zinc-500 dark:text-zinc-400 font-medium text-base md:text-lg max-w-lg text-center leading-relaxed">
                        The AI agents are scouting for new opportunities.<br />
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">We will notify you</span> immediately when a lead requires your attention.
                    </p>

                    <Button
                        onClick={() => fetchQueue(true)}
                        disabled={isLoading}
                        className={cn(
                            "mt-14 h-16 px-12 rounded-[2rem] font-black text-xs tracking-[0.2em] transition-all duration-300 shadow-xl",
                            "bg-white hover:bg-zinc-50 text-emerald-600 border border-emerald-100",
                            "dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-emerald-400 dark:border-emerald-900/50",
                            "hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-105 active:scale-95",
                            isLoading && "opacity-80 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                                ESTABLISHING LINK...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-3" />
                                CHECK FOR UPDATES
                            </>
                        )}
                    </Button>
                </div>

                {/* History Section Persistence */}
                {!isLoading && historyItems.length > 0 && (
                    <div className="w-full max-w-4xl mx-auto mt-12 bg-white/50 dark:bg-zinc-950/50 rounded-[3rem] border border-zinc-200/50 dark:border-zinc-800/50 p-8 shadow-sm backdrop-blur-sm z-10">
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
                                <History className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-zinc-900 dark:text-white">Conversation History</h3>
                                <p className="text-xs font-bold text-zinc-400">Your recent interactions</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {historyItems.slice(0, 5).map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-10 h-10 border-2 border-white dark:border-zinc-800">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.lead_id}`} />
                                            <AvatarFallback>{item.name?.slice(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-zinc-900 dark:text-white">{item.name}</p>
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-zinc-200 text-zinc-500">
                                                    {formatPhoneNumber(item.phone_number || "Unknown")}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-wider",
                                                    item.status === 'CONNECTED' ? "text-emerald-600" :
                                                        item.status === 'VOICEMAIL' ? "text-amber-600" : "text-zinc-500"
                                                )}>
                                                    {item.status?.replace('_', ' ')}
                                                </span>
                                                {item.duration && (
                                                    <>
                                                        <span className="text-zinc-300">•</span>
                                                        <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                                                            <Clock4 className="w-3 h-3" />
                                                            {Math.floor(item.duration / 60)}m {item.duration % 60}s
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Outcome</p>
                                        <Badge className={cn(
                                            "font-bold border-0",
                                            item.outcome?.includes("WON") ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                        )}>
                                            {item.outcome?.replace('CLOSE_', '') || "LOGGED"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Split queue into ready and rescheduled items
    const readyQueue = queue.filter(item => item.status !== 'RESCHEDULED');
    const rescheduledQueue = queue.filter(item => item.status === 'RESCHEDULED');

    const nextLead = readyQueue[0];
    const upcomingQueue = readyQueue.slice(1);

    return (
        <div className="flex flex-col gap-6">
            <div className="w-full bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent dark:from-emerald-500/20 dark:via-transparent dark:to-transparent rounded-[4rem] p-10 border border-emerald-500/20 shadow-2xl relative overflow-hidden group/panel">
                {/* Background Blob Effects */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full translate-y-1/2 pointer-events-none" />

                {/* Header Area */}
                <div className="flex items-center justify-between mb-10 px-4">
                    <div className="flex items-center gap-5">
                        <div className="flex -space-x-3 transition-transform hover:scale-105 duration-300">
                            {[...Array(maxConcurrency)].map((_, idx) => (
                                <Avatar key={idx} className="w-12 h-12 border-4 border-white dark:border-zinc-900 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
                                    <AvatarImage src={`/images/avatars/notionists/full_body/avatar_${(idx % 5) + 1}.png`} />
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
                                    <RefreshCw className="w-5 h-5" onClick={() => fetchQueue(true)} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Refresh Queue</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* The Belt */}
                <div className="flex items-start gap-10">
                    {/* AI TO YOU Animated Arrow */}
                    <div className="hidden lg:flex flex-col items-center justify-center gap-3 ml-4">
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
                        onContact={() => handleContactStart(nextLead)}
                        onViewContext={() => onContextClick?.(nextLead)}
                        isContactMode={contactModeId === nextLead.id}
                        onCancelContact={handleCancelContact}
                        onLogOutcome={() => handleLogOutcome(nextLead)}
                    />

                    {/* Conveyor Belt: The rest of the queue */}
                    <div className="flex-1 min-w-0 h-full py-2">
                        <div className="flex items-center gap-4 mb-4 ml-2">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Upcoming Conveyor</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 via-zinc-200/50 to-transparent dark:from-zinc-800 dark:via-zinc-800/50" />
                        </div>

                        <div
                            ref={scrollRef}
                            className="flex flex-col gap-4 h-[450px] overflow-y-auto scrollbar-subtle pb-4 px-2"
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
                                            onSwap={(e) => handleSwap(item, e)}
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

            {/* Rescheduled Follow-ups Section */}
            {rescheduledQueue.length > 0 && (
                <div className="w-full bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-500/20 dark:via-transparent dark:to-transparent rounded-[3rem] border border-amber-500/20 p-8 shadow-lg">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-zinc-900 dark:text-white">Rescheduled Follow-ups</h3>
                                <p className="text-xs font-bold text-amber-600/70 dark:text-amber-400/70">Leads scheduled for future contact</p>
                            </div>
                        </div>
                        <Badge className="bg-amber-500 text-white font-black px-3 py-1 rounded-full text-[10px] tracking-widest">
                            {rescheduledQueue.length} SCHEDULED
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        {rescheduledQueue.map((item, i) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/30 hover:border-amber-400 dark:hover:border-amber-600 transition-colors cursor-pointer" onClick={() => onContextClick?.(item)}>
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-10 h-10 border-2 border-amber-200 dark:border-amber-800">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.lead_id}`} />
                                        <AvatarFallback>{item.lead_name?.slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-zinc-900 dark:text-white">{item.lead_name}</p>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-200 text-amber-600">
                                                {formatPhoneNumber(item.contact_number)}
                                            </Badge>
                                        </div>
                                        {item.retry_scheduled_for && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                                                Scheduled: {new Date(item.retry_scheduled_for).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* History Section */}
            {historyItems.length > 0 && (
                <div className="w-full bg-white dark:bg-zinc-950 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white">Conversation History</h3>
                            <p className="text-xs font-bold text-zinc-400">Your recent interactions</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {historyItems.slice(0, 5).map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-10 h-10 border-2 border-white dark:border-zinc-800">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.lead_id}`} />
                                        <AvatarFallback>{item.name?.slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-zinc-900 dark:text-white">{item.name}</p>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-zinc-200 text-zinc-500">
                                                {formatPhoneNumber(item.phone_number || "Unknown")}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-wider",
                                                item.status === 'CONNECTED' ? "text-emerald-600" :
                                                    item.status === 'VOICEMAIL' ? "text-amber-600" : "text-zinc-500"
                                            )}>
                                                {item.status?.replace('_', ' ')}
                                            </span>
                                            {item.duration && (
                                                <>
                                                    <span className="text-zinc-300">•</span>
                                                    <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                                                        <Clock4 className="w-3 h-3" />
                                                        {Math.floor(item.duration / 60)}m {item.duration % 60}s
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Outcome</p>
                                    <Badge className={cn(
                                        "font-bold border-0",
                                        item.outcome?.includes("WON") ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                            "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                    )}>
                                        {item.outcome?.replace('CLOSE_', '') || "LOGGED"}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
