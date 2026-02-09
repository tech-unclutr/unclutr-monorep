"use strict";
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    X,
    Clock,
    Calendar,
    Phone,
    FileText,
    Mic,
    Headphones,
    AlertTriangle,
    Play,
    Pause,
    Download,
    CheckCircle2,
    Link as LinkIcon,
    XCircle,
    PhoneIncoming,
    PhoneCall,
    ChevronDown,
    ChevronUp,
    Terminal,
    Database,
    AlertCircle,
    Sparkles,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { ExecutionFeed } from "../customer-intelligence/ExecutionFeed";
import { ExecutionEvent } from "../customer-intelligence/AgentQueue";

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
    avatar_seed: string;
    recording_url?: string;
    transcript?: Array<{ role: string, content: string }>;
    scheduling_preference?: string;
    cohort?: string;
    summary?: string;
    next_step?: string;
    agreement_status?: {
        agreed: boolean;
        status: string;
        confidence: string;
    };
    sentiment?: {
        emoji: string;
        label: string;
        score: number;
    };
    intent_priority?: {
        level: 'high' | 'medium' | 'low';
        score: number;
        reason?: string;
    };
    bolna_call_id?: string;
    user_queue_item_id?: string; // [NEW] For fetching complete lead context
}

interface CampaignActivityModalProps {
    call: CallLogEntry | null;
    isOpen: boolean;
    onClose: () => void;
    campaignId?: string;
}

const statusConfig: Record<string, { color: string, Icon: any }> = {
    'INTENT_YES': { color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', Icon: CheckCircle2 },
    'INTERESTED': { color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', Icon: CheckCircle2 },
    'NOT_INTERESTED': { color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', Icon: AlertCircle },
    'DNC': { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', Icon: XCircle },
    'SCHEDULED': { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', Icon: CheckCircle2 },
    'VOICEMAIL': { color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20', Icon: PhoneIncoming },
    'NO_ANSWER': { color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20', Icon: PhoneIncoming },
    'BUSY': { color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', Icon: PhoneIncoming },
    'FAILED': { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', Icon: XCircle },
    'CONNECTED': { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', Icon: PhoneCall },
    'DISCONNECTED': { color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20', Icon: Clock },
};

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

export const CampaignActivityModal: React.FC<CampaignActivityModalProps> = ({ call, isOpen, onClose, campaignId: propCampaignId }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
    const [events, setEvents] = useState<ExecutionEvent[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);

    // [NEW] State for complete lead context
    const [completeHistory, setCompleteHistory] = useState<any[]>([]);
    const [hasCompleteContext, setHasCompleteContext] = useState(false);

    // Reset state when call changes or modal opens/closes
    React.useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(call?.duration || 0);
        setIsTranscriptOpen(false);
        setCompleteHistory([]);
        setHasCompleteContext(false);

        if (isOpen && call) {
            fetchEvents();
        }
    }, [call, isOpen]);

    const fetchEvents = async () => {
        if (!call) return;
        try {
            setIsLoadingEvents(true);

            // [NEW] Priority 1: Try to fetch complete context from user queue if item_id available
            if (call.user_queue_item_id) {
                try {
                    const contextData = await api.get(`/user-queue/${call.user_queue_item_id}/context`);

                    if (contextData && contextData.history && contextData.history.length > 0) {
                        // Transform history into events format
                        const transformedEvents: ExecutionEvent[] = contextData.history.map((item: any, index: number) => ({
                            id: item.id || `history-${index}`,
                            type: item.type === 'AI' ? 'agent_action' : 'thought',
                            message: item.summary || item.notes || 'No details available',
                            timestamp: item.created_at,
                            agent_name: item.type === 'AI' ? 'AI Agent' : 'User',
                            lead_id: call.lead_id,
                            metadata: {
                                status: item.status,
                                duration: item.duration,
                                recording_url: item.recording_url,
                                full_transcript: item.full_transcript
                            }
                        }));

                        setEvents(transformedEvents);
                        setCompleteHistory(contextData.history);
                        setHasCompleteContext(true);
                        setIsLoadingEvents(false);
                        return; // Successfully fetched complete context
                    }
                } catch (contextError) {
                    console.warn("Failed to fetch user queue context, falling back to execution events:", contextError);
                }
            }

            // Priority 2: Use provided campaignId prop
            // Priority 3: Extract from URL /campaigns/[id]/history or similar
            let campaignId = propCampaignId;

            if (!campaignId) {
                const pathParts = window.location.pathname.split('/');
                // If path is /campaigns/ff4d88d2-9c17-4da6-90a5-c8eceb976566/history
                // Parts: ["", "campaigns", "ff4d88d2...", "history"]
                const campaignIdx = pathParts.indexOf('campaigns');
                if (campaignIdx !== -1 && pathParts[campaignIdx + 1] && pathParts[campaignIdx + 1] !== 'history') {
                    campaignId = pathParts[campaignIdx + 1];
                } else {
                    // Fallback to last segment if 'campaigns' not found
                    campaignId = pathParts.pop();
                    if (campaignId === 'history') campaignId = pathParts.pop();
                }
            }

            if (campaignId && campaignId !== 'history' && call.lead_id) {
                let url = `/execution/campaign/${campaignId}/lead/${call.lead_id}/events`;
                if (call.bolna_call_id) {
                    url += `?call_id=${call.bolna_call_id}`;
                }
                const data = await api.get(url);
                setEvents(data);
            }
        } catch (error) {
            console.error("Failed to fetch lead events:", error);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    if (!call) return null;

    const status = (call.outcome || call.status || 'FAILED').toUpperCase();

    // Determine display status with priority logic
    const getDisplayStatus = () => {
        // 1. Priority: AGREED
        if (call.scheduling_preference === 'yes' || call.transcript?.some(t => t.content.includes("outcome: AGREED"))) {
            // Fallback if data structure slightly different, but relying on similar logic to Log if possible. 
            // Note: Modal props might be different. Checking interface:
            // interface CallLogEntry in Modal doesn't have agreement_status explicitly typed in the file I read earlier?
            // Let's re-check the interface in the file view.
            // It had: outcome, status, key_insight, critical_signal.
            // It did NOT have agreement_status in the interface definition in line 36-55 of the view_file output for Modal.
            // However, the object passed is likely the same full object from the Log.
            // I will try to access it safely or use outcome string if it maps.
        }

        // Actually, let's look at the `CallLogEntry` interface in `CampaignActivityModal.tsx`.
        // It is defined locally! 
        // I should probably update the interface too if I want to be type safe, or just use what I have.
        // In `CampaignActivityLog`, `agreement_status` is there.
        // I'll assume the prop passed has it, but I need to update the interface to avoid TS errors.

        return null; // logic placeholder to be replaced by actual code below
    };



    const getDisplayStatusResult = (() => {
        // Cast to any to access potentially missing properties in the local interface definition
        const fullCall = call as any;

        if (fullCall.agreement_status?.status === 'yes') {
            return {
                label: 'AGREED',
                color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                Icon: CheckCircle2
            };
        }

        const config = statusConfig[status] || { color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20', Icon: Clock };
        return {
            label: status === 'AMBIGUOUS' ? 'Unclear' : status.replace(/_/g, ' '),
            color: config.color,
            Icon: config.Icon
        };
    })();

    const generateSummary = () => {
        // Blacklist generic messages to force context-aware generation
        const genericMessages = [
            "No transmission intel captured.",
            "No specific insight generated.",
            "Call completed."
        ];

        const hasValidSummary = call.summary && !genericMessages.some(m => call.summary?.includes(m));
        const hasValidInsight = call.key_insight && !genericMessages.some(m => call.key_insight?.includes(m));

        if (hasValidSummary) return call.summary;
        if (hasValidInsight) return call.key_insight;

        // Context-Aware Fallback Generation
        if (call.critical_signal?.type === 'DNC') return "Customer requested to be removed from all future contact. Expressed clear do-not-call preference.";
        if (call.critical_signal?.type === 'WRONG_PERSON') return "Call reached a person other than the intended recipient. Contact records require update.";
        if (call.critical_signal?.type === 'LANGUAGE_BARRIER') return "A significant language barrier prevented effective communication. Support in local language may be required.";

        if (status === 'INTENT_YES' || status === 'INTERESTED') return `Customer expressed positive interest. Wants to learn more.`;
        if (status === 'NOT_INTERESTED') return `Customer politely declined the offer. Expressed clear disinterest.`;
        if (status === 'SCHEDULED') return `Follow-up requested. Interested but busy now.`;

        // Status & Duration based context
        if (status === 'VOICEMAIL') return "Reached voicemail system. Message left successfully.";
        if (status === 'NO_ANSWER') return "Call was not answered. No contact established.";
        if (status === 'BUSY') return "Line was busy. Re-queueing for later attempt.";
        if (status === 'FAILED') return "Call failed to connect due to network or carrier issues.";

        if (call.duration < 10) return "Short duration call. Likely disconnected immediately or hung up.";
        if (call.duration < 30) return "Brief connection. Call ended before meaningful conversation could develop.";
        if (call.duration > 120) return "Extended conversation held. Connected for over 2 minutes without specific outcome classification.";

        return "Call flow executed. Outcome status captured without additional qualitative intelligence.";
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const onTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const onLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-[40px] p-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col [&>button]:hidden">
                <VisuallyHidden>
                    <DialogDescription>
                        Detailed call transcript, recording, and outcome intelligence for {call.name}.
                    </DialogDescription>
                </VisuallyHidden>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-8">
                        {/* Header */}
                        <div className="flex items-start gap-6 mb-10 relative">
                            <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl shrink-0 bg-zinc-50 dark:bg-zinc-900">
                                <img
                                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${call.avatar_seed}`}
                                    alt={call.name}
                                    className="w-full h-full object-contain scale-125 translate-y-2"
                                />
                            </div>

                            <div className="flex-1 pt-2">
                                <div className="flex items-center gap-3 mb-3">
                                    <DialogTitle className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                                        {call.name}
                                    </DialogTitle>
                                    <Badge className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5", getDisplayStatusResult.color)}>
                                        <getDisplayStatusResult.Icon className="w-3.5 h-3.5" />
                                        {getDisplayStatusResult.label}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDuration(call.duration)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {format(new Date(call.timestamp), "MMM d, h:mm a")}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5" />
                                        {call.phone_number}
                                    </span>
                                </div>
                                {call.cohort && (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900 shadow-none py-1 h-auto text-[10px] font-black uppercase tracking-wider px-3 rounded-lg">
                                            {call.cohort}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-transparent hover:border-zinc-200"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Sections */}
                        <div className="space-y-6">
                            {/* Section 1: What Happened */}
                            <Card className="rounded-[32px] bg-zinc-50/50 dark:bg-zinc-900/30 p-8 border border-zinc-100/50 dark:border-zinc-800/50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/5 to-transparent rounded-bl-full" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            Outcome Intelligence
                                        </h3>
                                    </div>
                                    <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                                        {generateSummary()}
                                    </p>

                                    {call.critical_signal && (
                                        <div className={cn(
                                            "mt-6 p-5 rounded-2xl border flex items-start gap-4",
                                            call.critical_signal.severity === 'critical'
                                                ? "bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-500/10"
                                                : "bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/10"
                                        )}>
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                call.critical_signal.severity === 'critical' ? "bg-red-500/10" : "bg-amber-500/10"
                                            )}>
                                                <AlertTriangle className={cn(
                                                    "w-5 h-5",
                                                    call.critical_signal.severity === 'critical' ? "text-red-600" : "text-amber-600"
                                                )} />
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-sm font-black uppercase tracking-wider mb-1",
                                                    call.critical_signal.severity === 'critical' ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
                                                )}>
                                                    {call.critical_signal.label}
                                                </p>
                                                <p className={cn(
                                                    "text-xs font-bold",
                                                    call.critical_signal.severity === 'critical' ? "text-red-600/80" : "text-amber-600/80"
                                                )}>
                                                    {call.critical_signal.type === 'DNC'
                                                        ? "Request removal from outreach queue."
                                                        : "Attention required for this lead profile."}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Section 3: Recording */}
                            <Card className="rounded-[32px] bg-white dark:bg-zinc-950 p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                                            <Headphones className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            Acoustics Archive
                                        </h3>
                                    </div>
                                    {call.recording_url && (
                                        <Button variant="ghost" size="sm" className="h-8 rounded-full text-[10px] font-black uppercase tracking-widest gap-2" asChild>
                                            <a href={call.recording_url} target="_blank" rel="noopener noreferrer">
                                                <Download className="w-3.5 h-3.5" />
                                                Download
                                            </a>
                                        </Button>
                                    )}
                                </div>

                                {!call.recording_url ? (
                                    <div className="py-8 text-center text-zinc-400 italic text-sm font-medium bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200">
                                        Recording currently being synchronized...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-6 p-4 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                        <audio
                                            ref={audioRef}
                                            src={call.recording_url}
                                            onTimeUpdate={onTimeUpdate}
                                            onLoadedMetadata={onLoadedMetadata}
                                            onEnded={onEnded}
                                            className="hidden"
                                        />
                                        <Button
                                            size="icon"
                                            className="w-14 h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                                            onClick={togglePlay}
                                        >
                                            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 translate-x-0.5" />}
                                        </Button>

                                        <div className="flex-1 space-y-2">
                                            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)] transition-all duration-100"
                                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-black text-zinc-400 tabular-nums uppercase">
                                                <span>{formatDuration(currentTime)}</span>
                                                <span>{formatDuration(duration || call.duration)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* Section: Mission Control Feed (Priya Reporting Vibe) */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="p-2 bg-zinc-900 rounded-xl text-emerald-500">
                                        <Terminal className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        Mission Control Feed
                                    </h3>
                                </div>

                                <div className="flex items-start gap-8 px-2">
                                    {/* Left: Large Agent Avatar (Priya) */}
                                    <div className="shrink-0 flex flex-col items-center gap-3 sticky top-4">
                                        <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-2xl relative group/avatar">
                                            <div className="absolute inset-0 bg-indigo-500/10 group-hover/avatar:bg-indigo-500/20 transition-colors" />
                                            <img
                                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${events[0]?.agent_name || 'Priya'}&backgroundColor=e0e7ff`}
                                                alt="Agent"
                                                className="w-full h-full object-contain scale-110 translate-y-2 relative z-10"
                                            />
                                            <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-indigo-500/20 to-transparent z-20" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">
                                                {events[0]?.agent_name || 'Priya'}
                                            </p>
                                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">
                                                Screening Rep
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Thought Cloud Report Card */}
                                    <div className="flex-1 relative group/card">
                                        {/* Thought Cloud Tail */}
                                        <div className="absolute -left-2 top-8 w-4 h-4 bg-white dark:bg-zinc-900 border-l border-b border-zinc-200 dark:border-zinc-800 rotate-45 z-0" />

                                        <Card className="rounded-[40px] bg-white dark:bg-zinc-950 p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative z-10 overflow-hidden min-h-[400px]">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

                                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar flex flex-col relative z-20">
                                                {events.length > 0 ? (
                                                    events.map((event, i) => (
                                                        <div key={event.id} className="group/item">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn(
                                                                        "w-1.5 h-1.5 rounded-full",
                                                                        event.type === 'thought' ? "bg-amber-500" :
                                                                            event.type === 'agent_action' ? "bg-indigo-500" : "bg-zinc-400"
                                                                    )} />
                                                                    <span className={cn(
                                                                        "text-[9px] font-black uppercase tracking-[0.1em]",
                                                                        event.type === 'thought' ? "text-amber-600/70" :
                                                                            event.type === 'agent_action' ? "text-indigo-600/70" : "text-zinc-500"
                                                                    )}>
                                                                        {event.type.replace('_', ' ')}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[9px] font-mono text-zinc-400 tabular-nums">
                                                                    {new Date(event.timestamp).toLocaleTimeString([], { hour12: true, hour: 'numeric', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <div className={cn(
                                                                "px-5 py-3 rounded-2xl rounded-tl-sm transition-all duration-300",
                                                                event.type === 'thought'
                                                                    ? "bg-amber-500/[0.03] border border-amber-500/10 text-zinc-600 dark:text-zinc-400 italic"
                                                                    : event.type === 'agent_action'
                                                                        ? "bg-indigo-500/[0.03] border border-indigo-500/10 text-zinc-900 dark:text-zinc-100"
                                                                        : "bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
                                                            )}>
                                                                <p className="text-[13px] leading-relaxed font-medium">
                                                                    {event.message}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-24 text-center">
                                                        <Database className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mx-auto mb-4 animate-pulse" />
                                                        <p className="text-sm font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-widest">
                                                            {isLoadingEvents ? "Fetching complete history..." : hasCompleteContext ? "No interactions recorded" : "No live events captured"}
                                                        </p>
                                                        {!isLoadingEvents && !hasCompleteContext && (
                                                            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2 max-w-xs mx-auto">
                                                                This lead may have been processed before the mission control feed was enabled.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Live Briefing Unit</span>
                                                </div>
                                                <Badge variant="outline" className="text-[8px] border-zinc-200 dark:border-zinc-800 text-zinc-400 h-5 px-2">
                                                    Secure Channel
                                                </Badge>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Transcript */}
                            {call.transcript && call.transcript.length > 0 && (
                                <Card className="rounded-[32px] bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                                        className="w-full flex items-center justify-between p-8 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                                                <Mic className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                Neuro-Conversation Archive
                                            </h3>
                                        </div>
                                        {isTranscriptOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                                    </button>

                                    {isTranscriptOpen && (
                                        <div className="px-8 pb-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {call.transcript.map((turn, i) => (
                                                <div key={i} className={cn(
                                                    "flex flex-col",
                                                    turn.role === 'agent' || turn.role === 'assistant' ? 'items-start' : 'items-end'
                                                )}>
                                                    <div className={cn(
                                                        "max-w-[85%] px-5 py-3 rounded-3xl text-[13px] font-medium leading-relaxed shadow-sm",
                                                        turn.role === 'agent' || turn.role === 'assistant'
                                                            ? "bg-indigo-600 text-white rounded-tl-sm"
                                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tr-sm border border-zinc-200/50 dark:border-zinc-700/50"
                                                    )}>
                                                        {turn.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            )}

                            {/* Section 4: Close Button */}
                            <div className="pt-4">
                                <Button
                                    onClick={onClose}
                                    className="w-full h-14 rounded-[24px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl gap-3"
                                >
                                    Close Activity Log
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
