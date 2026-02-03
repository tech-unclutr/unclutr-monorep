import React, { useState, useRef, memo } from 'react';
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
    Shield,
    Layers,
    RotateCcw,
    AlertCircle,
    Trophy
} from 'lucide-react';
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
import { cn } from "@/lib/utils";
import { AgentStatus, UpcomingLead, HistoryItem } from "./AgentQueue";
import { AgentLiveStream } from "./AgentLiveStream";

interface AgentIntelligenceDashboardProps {
    activeAgents: AgentStatus[];
    upcomingLeads: UpcomingLead[];
    historyItems: HistoryItem[];
    allLeadsByCohort: Record<string, any[]>;
    allEvents: any[];
    isCompleted?: boolean;
    isPaused?: boolean;
    completionData?: {
        total_targets: number;
        total_completed: number;
        completion_rate: number;
        cohort_progress: Record<string, {
            target: number;
            completed: number;
            is_complete: boolean;
        }>;
    };
    onClose?: () => void;
    onReset?: () => void | Promise<void>;
    onLeadAction?: (action: 'approve' | 'reschedule', leadId: string) => void;
    className?: string;
}

export function AgentIntelligenceDashboard({
    activeAgents,
    upcomingLeads,
    historyItems,
    allLeadsByCohort,
    allEvents,
    isCompleted = false,
    isPaused = false,
    completionData,
    onClose,
    onReset,
    onLeadAction,
    className
}: AgentIntelligenceDashboardProps) {
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Exhaustion Logic
    const allLeads = Object.values(allLeadsByCohort).flat();
    const failedLeads = allLeads.filter(l => l.status === 'FAILED');
    const hasFailures = failedLeads.length > 0;
    const hasPendingLeads = allLeads.some(l => ['BACKLOG', 'READY', 'NEXT'].includes(l.status)) || upcomingLeads.length > 0;
    const isExhausted = !hasPendingLeads && activeAgents.length === 0;

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

    return (
        <div className={cn("flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/50 rounded-[32px] overflow-hidden border border-zinc-200 dark:border-zinc-800", className)}>
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
                        <AlertDialogAction onClick={handleResetCampaign} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Confirm Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Header Section */}
            <div className="relative z-10 p-8 pb-6 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl shadow-inner">
                        <Bot className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight leading-none mb-1 text-zinc-900 dark:text-zinc-100">AI Agent Intelligence</h2>
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
                        className="h-9 px-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-bold text-[10px] uppercase tracking-widest gap-2"
                        onClick={() => setShowResetConfirm(true)}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Campaign
                    </Button>

                    {onClose && (
                        <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Grid - 3 Folds */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6 bg-zinc-50/50 dark:bg-transparent min-h-[600px]">

                {/* FOLD 1: UPCOMING QUEUE + REALTIME ENGAGEMENT */}
                <div className="flex gap-6 overflow-hidden">
                    {/* Left: UPCOMING QUEUE */}
                    <div className="w-[340px] flex flex-col gap-4 min-h-0">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                <h3 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Upcoming Queue</h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold shrink-0">{upcomingLeads.length}</Badge>
                        </div>

                        <ScrollArea className="flex-1 bg-white dark:bg-zinc-900/30 rounded-[28px] border border-zinc-200 dark:border-zinc-800/50 p-4 shadow-sm">
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {upcomingLeads.map((lead, idx) => (
                                        <motion.div
                                            key={`upcoming-${lead.lead_id}-${idx}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="group relative flex items-center gap-3 p-3 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-zinc-800/50 transition-all cursor-default"
                                        >
                                            <motion.div layoutId={`upcoming-avatar-${lead.lead_id}`}>
                                                <Avatar className="w-10 h-10 border-2 border-white dark:border-zinc-800 shadow-sm shrink-0">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${lead.avatar_seed}`} />
                                                    <AvatarFallback>{lead.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{lead.name}</p>
                                                <div className="flex items-center gap-1.5 pt-0.5">
                                                    <Badge className="text-[8px] px-1.5 py-0 h-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-0 uppercase font-black tracking-widest">
                                                        Waitlist
                                                    </Badge>
                                                    {lead.cohort && <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase truncate">{lead.cohort}</span>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {upcomingLeads.length === 0 && (
                                    <div className="h-32 flex flex-col items-center justify-center text-zinc-400">
                                        <p className="text-[10px] uppercase font-black tracking-widest">Queue Empty</p>
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
                            {!isCompleted && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-1" />}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2">
                            {isCompleted && completionData ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-[40px] border-2 border-emerald-200 dark:border-emerald-800 p-12 text-center shadow-2xl shadow-emerald-500/10 relative overflow-hidden"
                                >
                                    {/* Confetti Background Effect */}
                                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                        {Array.from({ length: 20 }).map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ y: -20, x: Math.random() * 100 + '%', opacity: 0.8 }}
                                                animate={{
                                                    y: '100vh',
                                                    rotate: Math.random() * 360,
                                                    opacity: 0
                                                }}
                                                transition={{
                                                    duration: 3 + Math.random() * 2,
                                                    repeat: Infinity,
                                                    delay: Math.random() * 2
                                                }}
                                                className="absolute w-3 h-3 rounded-full"
                                                style={{
                                                    backgroundColor: ['#10b981', '#14b8a6', '#06b6d4', '#8b5cf6', '#ec4899'][i % 5]
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Trophy Icon */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", delay: 0.2 }}
                                        className="relative z-10 p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full border-4 border-white dark:border-zinc-900 mb-8 shadow-2xl shadow-emerald-500/30"
                                    >
                                        <Trophy className="w-20 h-20 text-white" strokeWidth={2} />
                                    </motion.div>

                                    {/* Success Message */}
                                    <motion.h4
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-4xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight relative z-10"
                                    >
                                        🎉 Campaign Complete!
                                    </motion.h4>

                                    {/* Success Rate */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="mb-8 relative z-10 flex flex-col items-center gap-6"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 mb-2">
                                                {Math.round(completionData.completion_rate)}%
                                            </div>
                                            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                                Success Rate • {completionData.total_completed} / {completionData.total_targets} Targets
                                            </p>
                                        </div>

                                        {hasFailures && (
                                            <Button
                                                onClick={() => setShowResetConfirm(true)}
                                                variant="outline"
                                                className="h-12 px-6 rounded-2xl border-emerald-200 dark:border-emerald-800 bg-white/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all gap-2 shadow-sm"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Retry {failedLeads.length} Failed Leads
                                            </Button>
                                        )}
                                    </motion.div>

                                    {/* Cohort Breakdown */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 }}
                                        className="w-full max-w-2xl space-y-3 relative z-10"
                                    >
                                        <h5 className="text-xs uppercase font-black text-zinc-400 dark:text-zinc-500 tracking-widest mb-4">Cohort Performance</h5>
                                        {Object.entries(completionData.cohort_progress).map(([cohort, progress], idx) => (
                                            <motion.div
                                                key={cohort}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 1 + idx * 0.1 }}
                                                className="flex items-center justify-between p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {progress.is_complete ? (
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                    ) : (
                                                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                                    )}
                                                    <span className="font-bold text-zinc-900 dark:text-white">{cohort}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-mono font-bold text-zinc-600 dark:text-zinc-400">
                                                        {progress.completed} / {progress.target}
                                                    </span>
                                                    <Badge className={cn(
                                                        "text-[9px] px-2 py-0.5 h-5 border-0 font-black uppercase tracking-wider",
                                                        progress.is_complete
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                    )}>
                                                        {progress.is_complete ? "Complete" : "In Progress"}
                                                    </Badge>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </motion.div>
                            ) : activeAgents.length > 0 ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
                                    {activeAgents.map((agent, idx) => (
                                        <AgentLiveStream
                                            key={agent.lead_id}
                                            agent={agent}
                                            events={allEvents.filter(e => e.agent_name === agent.agent_name)}
                                            index={idx}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-zinc-900/30 rounded-[40px] border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center shadow-inner">
                                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-full border border-zinc-100 dark:border-zinc-800 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                        <Bot className="w-16 h-16 text-zinc-300 dark:text-zinc-700" strokeWidth={1.5} />
                                    </div>
                                    <h4 className="text-2xl font-black text-zinc-800 dark:text-zinc-200 mb-3 tracking-tight">
                                        {isExhausted ? "Leads Exhausted" : (isPaused ? "Agents Standing By" : "System Idle")}
                                    </h4>
                                    <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-sm font-medium leading-relaxed mb-6">
                                        {isExhausted
                                            ? (hasFailures
                                                ? `All scheduled leads were attempted, but ${failedLeads.length} did not connect. Click "Retry" below to attempt these contacts again.`
                                                : "All available leads in this cohort have been reached. Your campaign objective has been fulfilled.")
                                            : (isPaused
                                                ? "AI agents have been initialized and are ready to execute. Your lead buffer is being prepared."
                                                : "AI agents are currently in standby mode. They will appear here automatically when a new session is initiated or resumed.")
                                        }
                                    </p>
                                    {isExhausted && hasFailures && (
                                        <Button
                                            onClick={() => setShowResetConfirm(true)}
                                            className="h-12 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 gap-2"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Retry {failedLeads.length} Failed Leads
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FOLD 2: RECENT ACTIVITY + FULL ROSTER (Side by Side) */}
                <div className="flex-1 flex gap-6 border-t border-zinc-200 dark:border-zinc-800/50 pt-6 min-h-0">

                    {/* Left: RECENT ACTIVITY */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                <h3 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Recent Activity</h3>
                            </div>
                            <h4 className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-tighter">Outcome Ledger</h4>
                        </div>

                        <ScrollArea className="flex-1 bg-white dark:bg-zinc-900/30 rounded-[28px] border border-zinc-200 dark:border-zinc-800/50 p-4 shadow-sm">
                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {historyItems.map((item, idx) => (
                                        <motion.div
                                            key={`history-${item.lead_id}-${idx}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50/50 dark:bg-black/40 border border-zinc-100 dark:border-zinc-800/50 hover:border-indigo-500/30 hover:bg-white dark:hover:bg-zinc-900/50 transition-all shadow-sm"
                                        >
                                            <div className="relative shrink-0">
                                                <motion.div layoutId={`history-avatar-${item.lead_id}`}>
                                                    <Avatar className="w-10 h-10 border-2 border-white dark:border-zinc-800 shadow-sm">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.avatar_seed}`} />
                                                        <AvatarFallback>{item.name.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                </motion.div>
                                                <div className={cn(
                                                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-lg",
                                                    item.status === 'COMPLETED' ? "bg-emerald-500" :
                                                        item.status === 'PENDING_AVAILABILITY' ? "bg-orange-500" : "bg-red-500"
                                                )}>
                                                    {item.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3 text-white" /> :
                                                        item.status === 'PENDING_AVAILABILITY' ? <Clock className="w-3 h-3 text-white" /> :
                                                            <XCircle className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-[13px] font-black text-zinc-800 dark:text-zinc-200 truncate pr-2">{item.name}</p>
                                                    <span className="text-[10px] text-zinc-400 font-mono tracking-tighter">14:02s</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={cn(
                                                        "text-[9px] px-1.5 py-0 h-4 border-0 font-black uppercase tracking-[0.1em]",
                                                        item.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" :
                                                            item.status === 'PENDING_AVAILABILITY' ? "bg-orange-500/10 text-orange-600 dark:text-orange-500" :
                                                                "bg-red-500/10 text-red-600 dark:text-red-500"
                                                    )}>
                                                        {item.status === 'PENDING_AVAILABILITY' ? 'REVIEW REQUIRED' : item.status}
                                                    </Badge>
                                                    {item.status === 'FAILED' && item.outcome && (
                                                        <span className="text-[9px] text-red-500/80 font-bold italic truncate flex-1">
                                                            {item.outcome}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-tighter">3m session</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {historyItems.length === 0 && (
                                    <div className="h-40 flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
                                        <p className="text-[10px] uppercase font-black tracking-widest">No Activity Recorded</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right: FULL ROSTER */}
                    <div className="w-[360px] flex flex-col gap-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                    <h3 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Full Roster</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-tighter hidden sm:block">Segmented View</h4>
                                    <Badge variant="outline" className="text-[10px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold shrink-0">
                                        {Object.values(allLeadsByCohort).flat().length}
                                    </Badge>
                                </div>
                            </div>

                            {/* Quick Navigation */}
                            <div className="flex items-center gap-2 overflow-x-auto px-2 pb-2 scrollbar-none snap-x mask-linear-fade">
                                {Object.keys(allLeadsByCohort).map((cohort) => (
                                    <button
                                        key={cohort}
                                        onClick={() => document.getElementById(`cohort-${cohort.replace(/\s+/g, '-')}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                        className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 dark:hover:bg-indigo-500 dark:hover:text-white dark:hover:border-indigo-500 transition-all snap-start"
                                    >
                                        {cohort}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <ScrollArea className="flex-1 bg-white dark:bg-zinc-900/30 rounded-[28px] border border-zinc-200 dark:border-zinc-800/50 p-4 shadow-sm">
                            <div className="space-y-6 pb-12">
                                {Object.entries(allLeadsByCohort).map(([cohort, leads]) => (
                                    <div key={cohort} id={`cohort-${cohort.replace(/\s+/g, '-')}`} className="space-y-2.5 scroll-mt-4">
                                        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-950/80 backdrop-blur-sm py-1 z-10 px-1 border-b border-dashed border-zinc-200 dark:border-zinc-800/50">
                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{cohort}</span>
                                            <Badge variant="secondary" className="text-[9px] h-4 px-1">{leads.length}</Badge>
                                        </div>
                                        <div className="space-y-1.5 pt-1">
                                            {leads.map((lead, leadIdx) => (
                                                <div key={`roster-${cohort}-${lead.lead_id}-${leadIdx}`} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-50/30 dark:bg-black/20 border border-zinc-100 dark:border-zinc-800/30">
                                                    <motion.div layoutId={`roster-avatar-${lead.lead_id}`}>
                                                        <Avatar className="w-6 h-6 border border-zinc-200 dark:border-zinc-800">
                                                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${lead.avatar_seed}`} />
                                                            <AvatarFallback className="text-[6px]">{lead.name.slice(0, 2)}</AvatarFallback>
                                                        </Avatar>
                                                    </motion.div>
                                                    <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate flex-1">{lead.name}</p>
                                                    <Badge className={cn(
                                                        "text-[7px] px-1 py-0 h-3.5 border-0 font-black uppercase tracking-tighter",
                                                        lead.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" :
                                                            lead.status === 'FAILED' ? "bg-red-500/10 text-red-600 dark:text-red-500" :
                                                                lead.status === 'READY' ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-500" :
                                                                    lead.status === 'PENDING_AVAILABILITY' ? "bg-orange-500/10 text-orange-600 dark:text-orange-500" :
                                                                        "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                                                    )}>
                                                        {lead.status === 'READY' ? 'NEXT' : (lead.status === 'PENDING_AVAILABILITY' ? 'REVIEW' : lead.status)}
                                                    </Badge>
                                                    {lead.status === 'FAILED' && lead.outcome && (
                                                        <span className="text-[8px] text-red-500/80 font-bold italic truncate max-w-[100px]" title={lead.outcome}>
                                                            {lead.outcome}
                                                        </span>
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
            </div >

            {/* Footer Status Bar */}
            < div className="shrink-0 h-12 bg-zinc-50/50 dark:bg-zinc-900 px-8 flex items-center justify-between text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] border-t border-zinc-200 dark:border-zinc-800/50 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.05)]" >
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
                    NODE CLUSTER: UNCLN-@{activeAgents.length} ACTIVE
                </div>
            </div >
        </div >
    );
}

const LiveAgentCard = memo(({ agent, events, index }: { agent: AgentStatus, events: any[], index: number }) => {
    const status = (agent.status || 'idle').toLowerCase();
    const isActive = ['speaking', 'connected', 'ringing', 'listening', 'processing', 'initiated', 'in-progress', 'queued'].includes(status);
    const scrollRef = useRef<HTMLDivElement>(null);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "group relative bg-gradient-to-br from-white via-white to-zinc-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 rounded-[28px] overflow-hidden flex flex-col transition-all duration-700",
                isActive
                    ? "shadow-[0_8px_32px_-8px_rgba(99,102,241,0.3),0_0_0_1px_rgba(99,102,241,0.1)] dark:shadow-[0_8px_32px_-8px_rgba(99,102,241,0.4),0_0_0_1px_rgba(99,102,241,0.2)] hover:shadow-[0_16px_48px_-12px_rgba(99,102,241,0.4),0_0_0_1px_rgba(99,102,241,0.2)]"
                    : "shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)]"
            )}
        >
            {/* Active status indicator bar */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-1 transition-all duration-500",
                isActive
                    ? "bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 opacity-100"
                    : "bg-zinc-200 dark:bg-zinc-800 opacity-0 group-hover:opacity-50"
            )}>
                {isActive && (
                    <motion.div
                        className="h-full bg-white/40"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                )}
            </div>

            {/* Ambient glow effect for active agents */}
            {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            )}

            <div className="relative z-10 p-6 flex flex-col gap-5">
                {/* Agent Header - Enhanced */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {/* Multi-layer glow effect */}
                            {isActive && (
                                <>
                                    <div className="absolute inset-0 blur-3xl opacity-40 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 animate-pulse scale-125" />
                                    <div className="absolute inset-0 blur-xl opacity-30 rounded-full bg-indigo-500 scale-110" />
                                </>
                            )}

                            <motion.div layoutId={`active-avatar-${agent.lead_id}`}>
                                <Avatar className={cn(
                                    "w-[72px] h-[72px] border-[3px] relative z-10 shadow-2xl ring-4 transition-all duration-500",
                                    isActive
                                        ? "border-white dark:border-zinc-900 ring-indigo-500/20 dark:ring-indigo-500/30 scale-105"
                                        : "border-white dark:border-zinc-900 ring-zinc-100/50 dark:ring-zinc-800/50"
                                )}>
                                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${agent.lead_name || agent.agent_name}&backgroundColor=e0e7ff`} />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-100 via-indigo-50 to-purple-100 dark:from-indigo-950 dark:via-indigo-900 dark:to-purple-950 text-indigo-700 dark:text-indigo-300 font-black text-xl">
                                        {agent.agent_name?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </motion.div>

                            {/* AI Badge with enhanced styling */}
                            <motion.div
                                className={cn(
                                    "absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full border-[3px] border-white dark:border-zinc-900 flex items-center justify-center relative z-20 shadow-2xl transition-all duration-500",
                                    isActive
                                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600 scale-110"
                                        : "bg-gradient-to-br from-zinc-400 to-zinc-500 dark:from-zinc-600 dark:to-zinc-700"
                                )}
                                animate={isActive ? { scale: [1.1, 1.15, 1.1] } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Bot className="w-4 h-4 text-white drop-shadow-sm" />
                            </motion.div>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1.5">
                                <h4 className="font-black text-xl text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                                    {agent.agent_name}
                                </h4>
                                <Badge className={cn(
                                    "px-2.5 py-1 text-[9px] uppercase font-black tracking-[0.1em] border-0 shadow-lg transition-all duration-300",
                                    isActive
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-zinc-900/5"
                                )}>
                                    {isActive ? (
                                        <span className="flex items-center gap-1.5">
                                            <motion.div
                                                className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"
                                                animate={{ opacity: [1, 0.3, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                            {agent.status}
                                        </span>
                                    ) : agent.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2.5 text-[11px]">
                                <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                    UNCLN-@{index + 1}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                <span className="font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                                    Autonomous Agent
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Target Information - Premium redesign */}
                <div className={cn(
                    "relative p-5 rounded-2xl border-2 transition-all duration-500 overflow-hidden",
                    isActive
                        ? "bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 dark:from-indigo-950/30 dark:via-zinc-900/50 dark:to-purple-950/20 border-indigo-200/50 dark:border-indigo-800/30"
                        : "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900/50 dark:via-zinc-900/30 dark:to-black/20 border-zinc-200 dark:border-zinc-800"
                )}>
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                    }} />

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={cn(
                                "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 shrink-0",
                                isActive
                                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30"
                                    : "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 shadow-zinc-900/10"
                            )}>
                                <User className={cn(
                                    "w-7 h-7 transition-colors duration-500",
                                    isActive ? "text-white" : "text-zinc-500 dark:text-zinc-400"
                                )} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.12em] mb-1.5">
                                    Active Target
                                </p>
                                <p className="text-[17px] font-black text-zinc-900 dark:text-zinc-50 truncate leading-none">
                                    {agent.lead_name || "Establishing Connection..."}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 pl-6 ml-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                            <span className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1">
                                Duration
                            </span>
                            <span className={cn(
                                "text-2xl font-mono font-black tabular-nums leading-none transition-colors duration-500",
                                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-800 dark:text-zinc-200"
                            )}>
                                {Math.floor(agent.duration / 60)}:{(agent.duration % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Neural Log Preview - Maximum realism */}
                <div className="relative h-48 w-full bg-[#0a0a0a] dark:bg-black rounded-2xl overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.4),0_8px_24px_-8px_rgba(0,0,0,0.3)] border border-zinc-900/50 dark:border-zinc-950">
                    {/* Realistic terminal texture */}
                    <div className="absolute inset-0 opacity-[0.015]" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                    }} />

                    {/* Scanline effect for realism */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            background: 'linear-gradient(transparent 50%, rgba(255,255,255,0.1) 50%)',
                            backgroundSize: '100% 4px'
                        }}
                        animate={{ y: ['0%', '100%'] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />

                    <div className="relative z-10 h-full flex flex-col p-5 font-mono">
                        {/* Terminal header */}
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800/60">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                            <span className="text-zinc-400 uppercase tracking-[0.12em] font-black text-[11px] flex-1">
                                Neural Streams / Live Logs
                            </span>
                            {isActive && (
                                <div className="flex items-center gap-1.5">
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                                        animate={{ opacity: [1, 0.4, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">LIVE</span>
                                </div>
                            )}
                        </div>

                        {/* Terminal content */}
                        <ScrollArea className="flex-1 pr-2">
                            <div className="space-y-2">
                                <AnimatePresence initial={false}>
                                    {events.map((event, i) => (
                                        <motion.div
                                            key={event.id + i}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            className="flex items-start gap-3 text-[11px] leading-relaxed"
                                        >
                                            <span className="text-zinc-500 shrink-0 font-semibold tabular-nums">
                                                [{new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                            </span>
                                            <span className="text-zinc-200 leading-relaxed">
                                                <span className="text-emerald-400 font-black mr-2">SYS:</span>
                                                {event.message}
                                            </span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {events.length === 0 && (
                                    <div className="h-24 flex flex-col items-center justify-center opacity-25 gap-3">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Activity className="w-7 h-7 text-zinc-500" strokeWidth={2.5} />
                                        </motion.div>
                                        <span className="uppercase tracking-[0.25em] font-black text-[10px] text-zinc-500">
                                            Initializing Neural Link...
                                        </span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

LiveAgentCard.displayName = 'LiveAgentCard';
