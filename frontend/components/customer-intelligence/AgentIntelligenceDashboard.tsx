"use client";

import React, { useState, useRef, memo } from 'react';
// ... rest of imports are fine until line 61

import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Bot,
    Clock,
    User,
    ChevronRight,
    Activity,
    CheckCircle2,
    XCircle,
    Terminal,
    Radio,
    Zap,
    Cpu,
    Loader2,
    Trash2,
    Phone,
    PhoneCall,
    AlertCircle,
    ArrowUp,
    RotateCcw,
    RefreshCw,
    Shield,
    Layers,
    Sparkles,
    AlertTriangle,
    Trophy,
    Coffee,
    PhoneIncoming
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, parseAsUTC } from "@/lib/utils";
import { AgentStatus, UpcomingLead, HistoryItem, AGENT_PERSONAS } from "./AgentQueue";
import { AgentLiveStream } from "./AgentLiveStream";
import { CampaignActivityLog } from "@/components/campaign-activity/CampaignActivityLog";
import { CampaignActivityModal } from "@/components/campaign-activity/CampaignActivityModal";
import { CohortBadge } from "./CohortBadge";
import { ExecutionFeed } from "./ExecutionFeed";


interface AgentIntelligenceDashboardProps {
    activeAgents: AgentStatus[];
    upcomingLeads: UpcomingLead[];
    historyItems: HistoryItem[];
    allLeadsByCohort: Record<string, any[]>;
    allEvents: any[];
    maxConcurrency?: number;
    isCompleted?: boolean;
    isPaused?: boolean;
    isResetting?: boolean;
    completionData?: {
        total_targets: number;
        total_completed: number;
        completion_rate: number;
        cohort_progress: Record<string, {
            target: number;
            completed: number;
            is_complete: boolean;
        }>;
        total_calls?: number;
        call_distribution?: Record<string, number>;
    };
    onClose?: () => void;
    onReset?: () => void | Promise<void>;
    isExhausted?: boolean;
    onReplenish?: () => Promise<void>;
    onLeadAction?: (action: 'approve' | 'reschedule' | 'retry', leadId: string) => void;
    onRefreshQueue?: () => void | Promise<void>;
    onUserQueueRefresh?: () => void;
    feedEvents?: any[];
    onClearFeed?: () => void;
    feedViewMode?: 'live' | 'all';
    onFeedViewModeChange?: (mode: 'live' | 'all') => void;
    className?: string;
}

export default function AgentIntelligenceDashboard({
    activeAgents,
    upcomingLeads,
    historyItems,
    allLeadsByCohort,
    allEvents,
    maxConcurrency = 2,
    isCompleted = false,
    isPaused = false,
    isResetting = false,
    completionData,
    onClose,
    onReset,
    isExhausted = false,
    onReplenish,
    onLeadAction,
    onRefreshQueue,
    onUserQueueRefresh,
    feedEvents = [],
    onClearFeed,
    feedViewMode = 'live',
    onFeedViewModeChange,
    className
}: AgentIntelligenceDashboardProps) {
    const [selectedActivityCall, setSelectedActivityCall] = useState<any>(null);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false); // New State
    const [selectedCohort, setSelectedCohort] = useState<string>('all');
    const [hiddenLeadIds, setHiddenLeadIds] = useState<Set<string>>(new Set());
    const [promotedLeadIds, setPromotedLeadIds] = useState<Set<string>>(new Set());
    const [showHardResetConfirm, setShowHardResetConfirm] = useState(false); // [NEW] Hard reset dialog state
    const [isHardResetting, setIsHardResetting] = useState(false); // [NEW] Hard reset loading state
    const [promoteWarningLeadId, setPromoteWarningLeadId] = useState<string | null>(null); // [NEW] Promotion warning state

    // Exhaustion Logic
    const allLeads = Object.values(allLeadsByCohort).flat();
    const failedLeads = allLeads.filter(l => l.status === 'FAILED');
    const hasFailures = failedLeads.length > 0;
    const hasPendingLeads = allLeads.some(l => ['BACKLOG', 'READY', 'NEXT'].includes(l.status)) || upcomingLeads.length > 0;
    const isQueueEmpty = !hasPendingLeads && activeAgents.length === 0;
    const isTargetAchieved = completionData ? (completionData.total_targets > 0 && completionData.total_completed >= completionData.total_targets) : false;
    // Check for actual progress to prevent premature "Mission Accomplished" on empty campaigns
    const hasProgress = completionData ? ((completionData.total_completed || 0) > 0 || (completionData.total_calls || 0) > 0) : false;
    const showCompletionUI = isTargetAchieved || ((isCompleted || isExhausted) && hasProgress);

    // Extract Campaign ID from URL (since it's not passed as prop currently)
    // URL pattern: .../campaign/[id]
    const campaignId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null;

    const playSound = (type: 'success' | 'error' | 'click') => {
        try {
            // Very subtle UI sounds would go here
        } catch (e) { }
    };

    const handleResetCampaign = async () => {
        // If onReset is provided by parent (ExecutionPanel), delegate to it
        // This prevents double API calls and allows parent to handle state updates
        if (onReset) {
            try {
                playSound('click');
                // Check if onReset returns a promise (async) and await it
                const result = onReset();
                if (result instanceof Promise) {
                    await result;
                }
                setShowResetConfirm(false);
                return;
            } catch (error) {
                // Parent should handle toast, but just in case
                console.error("Reset delegation failed", error);
            }
        }

        // Fallback: Local API call (only if used in isolation)
        if (!campaignId) return;

        try {
            playSound('click');
            await api.post(`/execution/campaign/${campaignId}/reset`);

            toast.success("Campaign Reset", {
                description: "Retrying failed/unanswered calls. Completed conversations are preserved.",
            });
            setShowResetConfirm(false);

        } catch (error) {
            toast.error("Reset Failed", {
                description: "Could not reset the campaign. Please try again.",
            });
        }
    };

    // [NEW] Hard Reset Function
    const handleHardResetCampaign = async () => {
        if (!campaignId) return;

        try {
            setIsHardResetting(true);
            playSound('click');
            await api.post(`/execution/campaign/${campaignId}/hard-reset`);

            toast.success("Campaign Wiped", {
                description: "All call data has been permanently deleted.",
            });
            setShowHardResetConfirm(false);

            // Refresh dashboard (Reset local state)
            if (onReset) {
                // Trigger parent refresh if possible, or just reload window
                window.location.reload();
            }

        } catch (error) {
            toast.error("Hard Reset Failed", {
                description: "Could not wipe campaign data. Please try again.",
            });
        } finally {
            setIsHardResetting(false);
        }
    };

    const handleRetryLead = async (leadId: string) => {
        // Use prop action if provided
        if (onLeadAction) {
            onLeadAction('retry', leadId);
            return;
        }

        // Fallback: Local API call
        if (!campaignId) return;

        try {
            playSound('click');
            await api.post(`/execution/campaign/${campaignId}/retry/${leadId}`);

            toast.success("Retry Initiated", {
                description: "Lead has been re-queued for dialing.",
            });

        } catch (error) {
            toast.error("Retry Failed", {
                description: "Could not re-queue the lead. Please try again.",
            });
        }
    };

    const handleRemoveLead = async (leadId: string) => {
        try {
            // Optimistic update
            setHiddenLeadIds(prev => new Set(prev).add(leadId));

            await api.delete(`/intelligence/leads/${leadId}`);

            toast.success("Lead Removed", {
                description: "Contact removed from queue and moved back to roster.",
            });

        } catch (error) {
            setHiddenLeadIds(prev => {
                const next = new Set(prev);
                next.delete(leadId);
                return next;
            });
            toast.error("Removal Failed", {
                description: "Could not remove the lead. Please try again.",
            });
        }
    };

    const handlePromoteLead = async (leadId: string) => {
        // [FIX] Check for max retries (>= 2 check)
        // Find the lead to check execution_count
        const lead = Object.values(allLeadsByCohort).flat().find(l => l.lead_id === leadId);

        if (lead && (lead.execution_count || 0) >= 2) {
            // Show warning instead of promoting immediately
            setPromoteWarningLeadId(leadId);
            return;
        }

        await executePromotion(leadId);
    };

    const executePromotion = async (leadId: string) => {
        try {
            // Optimistic update
            setPromotedLeadIds(prev => new Set(prev).add(leadId));
            setPromoteWarningLeadId(null); // Clear warning if active

            await api.post(`/intelligence/leads/${leadId}/promote`);

            toast.success("Lead Promoted", {
                description: "Contact added back to the upcoming queue.",
            });

        } catch (error) {
            setPromotedLeadIds(prev => {
                const next = new Set(prev);
                next.delete(leadId);
                return next;
            });
            toast.error("Promotion Failed", {
                description: "Could not promote the lead. Please try again.",
            });
        }
    };

    const handleRefreshQueue = async () => {
        if (!onRefreshQueue) return;
        try {
            setIsRefreshing(true);
            playSound('click');
            const result = onRefreshQueue();
            if (result instanceof Promise) {
                await result;
            }
            toast.success("Queue Refreshed", {
                description: "Upcoming queue data updated.",
            });
        } catch (error) {
            toast.error("Refresh Failed", {
                description: "Could not refresh the queue.",
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className={cn("flex flex-col min-h-full bg-zinc-50/50 dark:bg-zinc-900/50 rounded-[32px] overflow-hidden border border-zinc-200 dark:border-zinc-800", className)}>
            <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                <AlertDialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset Campaign Progress?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500">
                            This will re-queue all contacts who didn't pick up, failed, or had technical issues.
                            <br /><br />
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">Safe Reset:</span> Users who already spoke with the agent (Interested/Not Interested) or asked for a callback will <span className="underline">NOT</span> be contacted again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetCampaign}
                            disabled={isResetting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
                        >
                            {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reset"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* [NEW] Hard Reset Confirmation Dialog */}
            <AlertDialog open={showHardResetConfirm} onOpenChange={setShowHardResetConfirm}>
                <AlertDialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Delete All Campaign Data?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500" asChild>
                            <div>
                                <span className="font-bold text-red-600 dark:text-red-400">WARNING: DESTRUCTIVE ACTION.</span>
                                <br /><br />
                                This will permanently delete:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>All Call Logs & Recordings</li>
                                    <li>All Analytics & Metrics</li>
                                    <li>All Queue Progress</li>
                                </ul>
                                <br />
                                The campaign will cease all activity and return to DRAFT state. This cannot be undone.
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleHardResetCampaign}
                            disabled={isHardResetting}
                            className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
                        >
                            {isHardResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Everything"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* [NEW] Promotion Warning Dialog */}
            <AlertDialog open={!!promoteWarningLeadId} onOpenChange={(open) => !open && setPromoteWarningLeadId(null)}>
                <AlertDialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-amber-600 dark:text-amber-500 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Override Retry Limit?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500">
                            This lead has already been called <span className="font-bold text-zinc-900 dark:text-zinc-100">2 or more times</span>.
                            <br /><br />
                            Promoting them will <span className="font-bold">reset their retry counter</span> and call them again immediately. This overrides the safety limit designed to prevent harassment.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-0" onClick={() => setPromoteWarningLeadId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => promoteWarningLeadId && executePromotion(promoteWarningLeadId)}
                            className="bg-amber-500 hover:bg-amber-600 text-white min-w-[100px]"
                        >
                            Promote Anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Header Section */}
            <div className={cn("relative z-10 p-8 pb-6 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md transition-all duration-500", showCompletionUI && "p-4 px-8 pb-4")}>
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 bg-indigo-500/10 rounded-2xl shadow-inner transition-all", showCompletionUI && "p-2")}>
                        <Bot className={cn("w-8 h-8 text-indigo-500 dark:text-indigo-400", showCompletionUI && "w-6 h-6")} />
                    </div>
                    <div>
                        <h2 className={cn("text-3xl font-black tracking-tight leading-none mb-1 text-zinc-900 dark:text-zinc-100", showCompletionUI && "text-xl")}>AI Agent Intelligence</h2>
                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Real-time Autonomous Dialing Queue</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-xs font-medium border-r border-zinc-200 dark:border-zinc-800 pr-6 mr-6 h-8">
                        <div className="flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-indigo-500" />
                            <span className="uppercase tracking-widest font-black text-[9px] text-zinc-500 dark:text-zinc-400">Neural Model v4.2</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <span className="uppercase tracking-widest font-black text-[9px] text-zinc-500 dark:text-zinc-400">Latency: 1.2ms</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isResetting}
                        className="h-9 px-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-bold text-[10px] uppercase tracking-widest gap-2"
                        onClick={() => setShowResetConfirm(true)}
                    >
                        {isResetting ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        {isResetting ? "Resetting..." : "Reset Campaign"}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isHardResetting}
                        className="h-9 px-3 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest gap-2 transition-colors"
                        onClick={() => setShowHardResetConfirm(true)}
                        title="Delete All Data (Hard Reset)"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>

                    {onClose && (
                        <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Grid - 3 Folds */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6 bg-zinc-50/50 dark:bg-transparent">

                {/* FOLD 1: UPCOMING QUEUE + REALTIME ENGAGEMENT */}
                <div className="flex-[1.4] flex gap-6 overflow-hidden min-h-0">
                    {/* Left: UPCOMING QUEUE */}
                    <div className="w-[340px] flex flex-col gap-4 min-h-0">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                <h3 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Upcoming Queue</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {onRefreshQueue && (
                                    <button
                                        onClick={handleRefreshQueue}
                                        disabled={isRefreshing}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50"
                                        title="Refresh Queue"
                                    >
                                        <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                                    </button>
                                )}
                                <Badge variant="outline" className="text-[10px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold shrink-0">{upcomingLeads.length}</Badge>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 bg-white dark:bg-zinc-900/30 rounded-[28px] border border-zinc-200 dark:border-zinc-800/50 shadow-sm">
                            <div className={cn("p-4 min-h-full flex flex-col", upcomingLeads.filter(l => !hiddenLeadIds.has(l.lead_id)).length === 0 && "items-center justify-center")}>
                                {upcomingLeads.filter(l => !hiddenLeadIds.has(l.lead_id)).length > 0 ? (
                                    <div className="space-y-2 w-full">
                                        <AnimatePresence mode="popLayout">
                                            {upcomingLeads
                                                .filter(l => !hiddenLeadIds.has(l.lead_id))
                                                .slice(0, 7)
                                                .map((lead, idx) => {
                                                    const isWaitlist = idx < maxConcurrency;
                                                    const isScheduled = lead.scheduled_for;
                                                    const scheduledTime = isScheduled ? new Date(lead.scheduled_for!).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' }) : '';

                                                    return (
                                                        <motion.div
                                                            key={`upcoming-${lead.lead_id}-${idx}`}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -10, height: 0 }}
                                                            className={cn(
                                                                "group relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-default",
                                                                isWaitlist
                                                                    ? "bg-white dark:bg-zinc-800/80 border-indigo-500/20 shadow-sm"
                                                                    : "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/80"
                                                            )}
                                                        >
                                                            <motion.div layoutId={`upcoming-avatar-${lead.lead_id}`}>
                                                                <Avatar className="w-10 h-10 border-2 border-white dark:border-zinc-800 shadow-sm shrink-0">
                                                                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${lead.avatar_seed}`} />
                                                                    <AvatarFallback>{lead.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                            </motion.div>
                                                            <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-4 items-center">
                                                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                                                    <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                                                                        {lead.name}
                                                                    </p>
                                                                    {lead.cohort && (
                                                                        <CohortBadge cohort={lead.cohort} variant="mini" />
                                                                    )}
                                                                </div>

                                                                <div className="shrink-0 flex items-center justify-end">
                                                                    <Badge className={cn(
                                                                        "text-[8px] px-2 py-0 h-5 border-0 uppercase font-black tracking-widest text-center min-w-[70px]",
                                                                        isScheduled
                                                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                                                                            : isWaitlist
                                                                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                                                : "bg-zinc-500/10 text-zinc-500 dark:text-zinc-500"
                                                                    )}>
                                                                        {isScheduled ? (
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <span className="flex items-center gap-1 cursor-help">
                                                                                            <Clock className="w-2.5 h-2.5" />
                                                                                            {scheduledTime}
                                                                                        </span>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent className="z-[9999]" side="top">
                                                                                        <p>{new Date(lead.scheduled_for!).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        ) : (isWaitlist ? 'Up Next' : 'Queue')}
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 z-20">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemoveLead(lead.lead_id);
                                                                    }}
                                                                    className="p-2 bg-white dark:bg-zinc-900 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-800 transition-all"
                                                                    title="Remove from queue"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center flex-1">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="relative p-8 flex flex-col items-center gap-4 max-w-[280px]"
                                        >
                                            <div className="relative mb-2">
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                                                <div className="relative w-16 h-16 bg-gradient-to-tr from-white to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-full border border-white/50 dark:border-zinc-700 shadow-sm flex items-center justify-center">
                                                    <Sparkles className="w-7 h-7 text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
                                                </div>
                                                <div className="absolute -top-1 -right-1">
                                                    <div className="w-4 h-4 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="text-xs font-black tracking-[0.2em] text-zinc-900 dark:text-zinc-100 uppercase">Queue Clear</h3>
                                                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[200px]">
                                                    All leads processed. System standing by for new entries.
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right: ENGAGEMENT MATRIX */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex items-center gap-2 px-2">
                            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <h3 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Real-time Engagement Matrix</h3>
                            {!isCompleted && !isPaused && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-1" />}
                            {isPaused && <div className="w-2 h-2 bg-amber-500 rounded-full ml-1" />}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 relative">
                            {isPaused ? (
                                <div className="h-full rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/30">
                                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                                        <Coffee className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Agents Waiting</h3>
                                    <p className="text-xs text-zinc-500 max-w-[200px] mt-1">
                                        Campaign is currently paused. Resuming will re-activate neural mesh uplinks.
                                    </p>
                                </div>
                            ) : (activeAgents && activeAgents.filter(Boolean).length > 0) ? (
                                <div className="h-full overflow-y-auto pr-2 scrollbar-hide">
                                    <div className="flex flex-col h-full">
                                        <div className={cn(
                                            "grid gap-6 mb-6",
                                            "grid-cols-1 lg:grid-cols-2"
                                        )}>
                                            {Array.from({ length: maxConcurrency }).map((_, idx) => {
                                                const agent = activeAgents[idx];
                                                if (agent) {
                                                    const allLeads = Object.values(allLeadsByCohort).flat();
                                                    const leadData = allLeads.find(l => l.lead_id === agent.lead_id);
                                                    const agentWithCohort = {
                                                        ...agent,
                                                        cohort: leadData?.cohort || agent.cohort
                                                    };
                                                    return (
                                                        <div
                                                            key={agent.agent_id || `active-${idx}`}
                                                            className="min-h-[400px] h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                                                        >
                                                            <AgentLiveStream
                                                                agent={agentWithCohort}
                                                                events={allEvents.filter(e => e.agent_id ? e.agent_id === agent.agent_id : e.agent_name === agent.agent_name)}
                                                                index={idx}
                                                            />
                                                        </div>
                                                    );
                                                }
                                                const persona = AGENT_PERSONAS[idx % AGENT_PERSONAS.length];
                                                return (
                                                    <div
                                                        key={`placeholder-${idx}`}
                                                        className="min-h-[400px] h-full rounded-[32px] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/10 flex flex-col items-center justify-center p-8 text-center"
                                                    >
                                                        <Avatar className="w-20 h-20 mb-6 border-2 border-white dark:border-zinc-800 shadow-xl">
                                                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${persona.seed}&backgroundColor=e0e7ff`} />
                                                        </Avatar>
                                                        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Agent {persona.name}</h3>
                                                        <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Standing By</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (isTargetAchieved) ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full rounded-[40px] border border-indigo-500/30 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-indigo-500/10 via-transparent to-amber-500/5 dark:from-indigo-500/20 dark:via-zinc-950 dark:to-amber-500/10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)] backdrop-blur-sm relative overflow-hidden"
                                >
                                    {/* Animated Aura */}
                                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                                        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] animate-[pulse_8s_ease-in-out_infinite]" />
                                    </div>

                                    <div className="relative z-10 mb-8">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-indigo-600 flex items-center justify-center shadow-[0_20px_50px_-12px_rgba(245,158,11,0.4)]"
                                        >
                                            <Trophy className="w-12 h-12 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                                        </motion.div>
                                        <motion.div
                                            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute -top-2 -right-2 text-amber-400"
                                        >
                                            <Sparkles className="w-6 h-6" />
                                        </motion.div>
                                    </div>
                                    <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight relative z-10">Target Achieved!</h3>
                                    <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-[320px] mt-3 mb-10 font-medium leading-relaxed relative z-10">
                                        Mission accomplished. All cohort targets have been met with exceptional precision.
                                    </p>
                                    <Button
                                        onClick={() => setShowResetConfirm(true)}
                                        disabled={isResetting}
                                        className="h-14 px-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] active:scale-95 gap-3 relative z-10 border-t border-white/20"
                                    >
                                        {isResetting ? <RotateCcw className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5 shadow-sm" />}
                                        <span className="tracking-wide">RE-INITIATE SEQUENCE</span>
                                    </Button>
                                </motion.div>
                            ) : (isExhausted || isCompleted) ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full rounded-[40px] border border-zinc-200 dark:border-zinc-800/50 flex flex-col items-center justify-center p-10 text-center bg-white/40 dark:bg-zinc-900/20 shadow-xl backdrop-blur-sm group overflow-hidden"
                                >
                                    <div className="relative mb-8">
                                        <motion.div
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                            className={cn(
                                                "w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner mt-2 rotate-[10deg] group-hover:rotate-0 transition-transform duration-700",
                                                hasFailures ? "bg-amber-500/10" : "bg-emerald-500/10"
                                            )}
                                        >
                                            {hasFailures ? (
                                                <AlertCircle className="w-10 h-10 text-amber-500 drop-shadow-sm" />
                                            ) : (
                                                <CheckCircle2 className="w-10 h-10 text-emerald-500 drop-shadow-sm" />
                                            )}
                                        </motion.div>
                                        <div className="absolute -inset-4 bg-zinc-500/5 blur-3xl -z-10 rounded-full animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                                        {hasFailures ? "Capacity Exhausted" : "Operational Standby"}
                                    </h3>
                                    <p className="text-[15px] text-zinc-500 dark:text-zinc-400 max-w-[300px] mt-3 mb-10 font-medium leading-relaxed">
                                        {hasFailures
                                            ? `Precisely ${failedLeads.length} leads were unreachable at this time. Recommendation: Re-attempt sequence after thermal cooldown.`
                                            : "The queue is clear. All leads processed successfully. Systems currently in low-power operational standby."}
                                    </p>
                                    <Button
                                        onClick={() => setShowResetConfirm(true)}
                                        disabled={isResetting}
                                        variant={hasFailures ? "default" : "outline"}
                                        className={cn(
                                            "h-14 px-10 rounded-full font-black transition-all gap-3 tracking-widest uppercase text-xs",
                                            hasFailures
                                                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20 border-t border-white/20"
                                                : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-white/50 dark:bg-transparent backdrop-blur-sm shadow-sm"
                                        )}
                                    >
                                        {isResetting ? <RotateCcw className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5 opacity-70" />}
                                        {hasFailures ? `Cycle ${failedLeads.length} Remaining Contacts` : "Reset Matrix State"}
                                    </Button>

                                    {/* Subtle status label */}
                                    <div className="absolute bottom-6 flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity duration-1000">
                                        <div className="w-1 h-1 rounded-full bg-zinc-400 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">Neural Buffer Clear</span>
                                    </div>
                                </motion.div>
                            ) : (activeAgents && activeAgents.length > 0) ? (
                                <div className="h-full overflow-y-auto pr-2 scrollbar-hide">
                                    <div className="flex flex-col h-full">
                                        <div className={cn(
                                            "grid gap-6 mb-6",
                                            "grid-cols-1 lg:grid-cols-2"
                                        )}>
                                            {Array.from({ length: maxConcurrency }).map((_, idx) => {
                                                const persona = AGENT_PERSONAS[idx % AGENT_PERSONAS.length];
                                                return (
                                                    <div
                                                        key={`idle-placeholder-${idx}`}
                                                        className="min-h-[400px] h-full rounded-[32px] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/10 flex flex-col items-center justify-center p-8 text-center transition-all group hover:bg-white/60 dark:hover:bg-zinc-900/20"
                                                    >
                                                        <div className="relative mb-6">
                                                            <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full scale-150 animate-pulse" />
                                                            <Avatar className="w-20 h-20 border-2 border-white dark:border-zinc-800 shadow-xl relative z-10 transition-transform group-hover:scale-105 duration-500">
                                                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${persona.seed}&backgroundColor=e0e7ff`} />
                                                                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">{persona.name.slice(0, 2)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-zinc-950 rounded-full border border-zinc-100 dark:border-zinc-800 flex items-center justify-center z-20 shadow-sm">
                                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Agent {persona.name}</h3>
                                                            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{persona.tagline}</p>
                                                        </div>

                                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium max-w-[180px] mt-4 leading-relaxed">
                                                            System online and awaiting next lead sequence...
                                                        </p>

                                                        <div className="mt-8 px-4 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                                                            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Autonomous Standby</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/30">
                                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Initializing Neural Mesh</h3>
                                    <p className="text-xs text-zinc-500 max-w-[200px] mt-1">
                                        Establishing secure uplinks with active AI agents...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FOLD 2: RECENT ACTIVITY + FULL ROSTER (Side by Side) */}
                <div className={cn(
                    "flex-[1.2] flex gap-6 border-t border-zinc-200 dark:border-zinc-800/50 pt-6 min-h-0 shrink-0",
                    activeAgents.filter(Boolean).length === 1 ? "min-h-[400px]" : "min-h-[450px]"
                )}>

                    {/* Left: RECENT ACTIVITY */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                <h3 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Campaign Activity</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <h4 className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-tighter">Outcome Ledger</h4>
                                {campaignId && historyItems.length > 0 && (
                                    <a
                                        href={`/campaigns/${campaignId}/history`}
                                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-orange-50 dark:from-indigo-950/30 dark:to-orange-950/30 border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:shadow-md hover:scale-105"
                                    >
                                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                            See all {historyItems.length.toLocaleString()}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-indigo-500 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <ScrollArea className="flex-1 bg-white dark:bg-zinc-900/30 rounded-[28px] border border-zinc-200 dark:border-zinc-800/50 p-4 shadow-sm transition-all duration-500 ease-in-out">
                            <CampaignActivityLog
                                history={historyItems.map(item => ({
                                    ...item,
                                    phone_number: (item as any).phone_number || "Unknown",
                                    timestamp: (item as any).timestamp || new Date().toISOString(),
                                    duration: item.duration || 0,
                                    outcome: item.outcome || "Pending"
                                }))}
                                onSelectCall={(call) => {
                                    setSelectedActivityCall(call);
                                    setIsActivityModalOpen(true);
                                }}
                                onCopyToQueue={onUserQueueRefresh}
                            />
                        </ScrollArea>
                    </div>

                    {/* Right: FULL ROSTER */}
                    <div className="w-[360px] flex flex-col gap-4 h-[450px]">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                    <h3 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Full Roster</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-tighter hidden sm:block">Segmented View</h4>
                                    <Badge variant="outline" className="text-[10px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold shrink-0">
                                        {selectedCohort === 'all'
                                            ? Object.values(allLeadsByCohort).flat().length
                                            : (allLeadsByCohort[selectedCohort]?.length || 0)}
                                    </Badge>
                                </div>
                            </div>

                            {/* Quick Navigation / Filter */}
                            <div className="flex items-center gap-2 overflow-x-auto px-2 pb-2 scrollbar-none snap-x mask-linear-fade">
                                <button
                                    onClick={() => setSelectedCohort('all')}
                                    className={cn(
                                        "shrink-0 text-[10px] font-bold px-3 py-1 rounded-full transition-all snap-start border",
                                        selectedCohort === 'all'
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                                            : "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                                    )}
                                >
                                    All
                                </button>
                                {Object.keys(allLeadsByCohort).map((cohort) => (
                                    <button
                                        key={cohort}
                                        onClick={() => setSelectedCohort(cohort)}
                                        className={cn(
                                            "shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all snap-start border",
                                            selectedCohort === cohort
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                                                : "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                                        )}
                                    >
                                        {cohort}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <ScrollArea className="flex-1 bg-white dark:bg-zinc-900/30 rounded-[28px] border border-zinc-200 dark:border-zinc-800/50 p-4 shadow-sm">
                            <div className="space-y-6 pb-12">
                                {Object.entries(allLeadsByCohort)
                                    .filter(([cohort]) => selectedCohort === 'all' || selectedCohort === cohort)
                                    .map(([cohort, leads]) => (
                                        <div key={cohort} id={`cohort-${cohort.replace(/\s+/g, '-')}`} className="space-y-2.5 scroll-mt-4">
                                            <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-950/80 backdrop-blur-sm py-1 z-10 px-1 border-b border-dashed border-zinc-200 dark:border-zinc-800/50">
                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{cohort}</span>
                                                <Badge variant="secondary" className="text-[9px] h-4 px-1">{leads.length}</Badge>
                                            </div>
                                            <div className="space-y-1.5 pt-1">
                                                {leads.map((lead, leadIdx) => (
                                                    <div key={`roster-${cohort}-${lead.lead_id}-${leadIdx}`} className="group flex items-center gap-3 p-2 rounded-xl bg-zinc-50/30 dark:bg-black/20 border border-zinc-100 dark:border-zinc-800/30">
                                                        <motion.div layoutId={`roster-avatar-${lead.lead_id}`}>
                                                            <Avatar className="w-6 h-6 border border-zinc-200 dark:border-zinc-800">
                                                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${lead.avatar_seed}`} />
                                                                <AvatarFallback className="text-[6px]">{lead.name.slice(0, 2)}</AvatarFallback>
                                                            </Avatar>
                                                        </motion.div>
                                                        <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate flex-1">{lead.name}</p>
                                                        {(() => {
                                                            const s = (lead.status || '').toLowerCase();
                                                            let statusColor = "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500";
                                                            let StatusIcon = Clock;
                                                            let label = lead.status;

                                                            if (s === 'completed' || s === 'intent_yes' || s === 'scheduled') {
                                                                statusColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500";
                                                                StatusIcon = CheckCircle2;
                                                            } else if (s === 'failed' || s === 'intent_no' || s === 'dnc' || s === 'failed_connect') {
                                                                statusColor = "bg-red-500/10 text-red-600 dark:text-red-500";
                                                                StatusIcon = XCircle;
                                                            } else if (s === 'ready') {
                                                                statusColor = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-500";
                                                                StatusIcon = Phone;
                                                                label = 'NEXT';
                                                            } else if (s === 'pending_availability' || s === 'ambiguous') {
                                                                statusColor = "bg-orange-500/10 text-orange-600 dark:text-orange-500";
                                                                StatusIcon = AlertCircle;
                                                                label = s === 'pending_availability' ? 'REVIEW' : 'UNCLEAR';
                                                            } else if (s === 'speaking' || s === 'connected' || s === 'ringing') {
                                                                statusColor = "bg-blue-500/10 text-blue-600 dark:text-blue-500";
                                                                StatusIcon = PhoneCall;
                                                            }

                                                            return (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Badge className={cn(
                                                                                "text-[8px] px-1.5 py-0 h-4 border-0 font-black uppercase tracking-tighter flex items-center gap-1 transition-transform hover:scale-105 active:scale-95 cursor-default",
                                                                                statusColor
                                                                            )}>
                                                                                <StatusIcon className="w-2.5 h-2.5" />
                                                                                {label}
                                                                            </Badge>
                                                                        </TooltipTrigger>
                                                                        {(lead.outcome || s === 'ambiguous') && (
                                                                            <TooltipContent
                                                                                side="top"
                                                                                className={cn(
                                                                                    "z-[100] bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 rounded-2xl max-w-[240px]",
                                                                                    (() => {
                                                                                        const statusLower = lead.status?.toLowerCase();
                                                                                        return (statusLower === 'failed' || statusLower === 'intent_no' || statusLower === 'dnc' || statusLower === 'failed_connect') ? "border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "";
                                                                                    })()
                                                                                )}
                                                                            >
                                                                                <div className="flex flex-col gap-2.5">
                                                                                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                                                                        {(() => {
                                                                                            const statusLower = lead.status?.toLowerCase();
                                                                                            const isError = ['failed', 'intent_no', 'dnc', 'failed_connect'].includes(statusLower);
                                                                                            const isAmbiguous = statusLower === 'ambiguous';
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
                                                                                        <span className="font-black uppercase tracking-[0.2em] text-[10px] text-white/50">
                                                                                            {lead.status?.toLowerCase() === 'ambiguous' ? 'Neural Insight' : 'Status Detail'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-[11px] leading-relaxed font-semibold text-white/90">
                                                                                        {lead.outcome || 'AI connected but intent was unclear. Manual review suggested.'}
                                                                                    </p>
                                                                                </div>
                                                                            </TooltipContent>
                                                                        )}
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            );
                                                        })()}
                                                        {!['READY', 'PENDING', 'INITIATED', 'RINGING', 'CONNECTED', 'SPEAKING'].includes(lead.status) && !promotedLeadIds.has(lead.lead_id) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePromoteLead(lead.lead_id);
                                                                }}
                                                                className="p-1 rounded-md text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
                                                                title="Promote to Queue"
                                                            >
                                                                <ArrowUp className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {promotedLeadIds.has(lead.lead_id) && (
                                                            <Badge className="bg-amber-500/10 text-amber-500 text-[8px] h-3.5 px-1 border-0">QUEUED</Badge>
                                                        )}
                                                        {lead.status === 'FAILED' && !promotedLeadIds.has(lead.lead_id) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRetryLead(lead.lead_id);
                                                                }}
                                                                className="p-1 rounded-md text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 opacity-0 group-hover:opacity-100 transition-all ml-1"
                                                                title="Retry Call"
                                                            >
                                                                <RotateCcw className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* FOLD 3: MISSION CONTROL FEED (Renamed to Processing Last Calls) */}
                <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800/50 pt-6 pb-4">
                    <ExecutionFeed
                        campaignId={campaignId || ""}
                        isActive={!isPaused && !isCompleted}
                        events={feedEvents}
                        onClear={onClearFeed}
                        viewMode={feedViewMode}
                        onViewModeChange={onFeedViewModeChange}
                    />
                </div>
            </div>

            {/* Footer Status Bar */}
            <div className="shrink-0 h-12 bg-zinc-50/50 dark:bg-zinc-900 px-8 flex items-center justify-between text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] border-t border-zinc-200 dark:border-zinc-800/50 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 group cursor-help">
                        <Shield className="w-3.5 h-3.5 text-indigo-500 transition-transform group-hover:scale-110" />
                        <span className="group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">Security: Verified Uplink</span>
                    </div>
                    <div className="flex items-center gap-2 group cursor-help">
                        <Activity className="w-3.5 h-3.5 text-emerald-500 transition-transform group-hover:scale-110" />
                        <span className="group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">Quality: 98.4%</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-zinc-300 dark:text-zinc-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    NODE CLUSTER: UNCLN-@{activeAgents.filter(a => a !== null).length} ACTIVE
                </div>
            </div>

            <CampaignActivityModal
                call={selectedActivityCall}
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                campaignId={campaignId || undefined}
            />
        </div>
    );
}

