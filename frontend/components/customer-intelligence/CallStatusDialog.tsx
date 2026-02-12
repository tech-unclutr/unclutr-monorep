"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    CheckCircle2,
    XCircle,
    Clock,
    UserMinus,
    PhoneOff,
    Calendar,
    MessageSquare,
    Target,
    PhoneCall,
    Voicemail,
    Sparkles,
    Play
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface CallStatusDialogProps {
    isOpen: boolean;
    onClose: () => void;
    lead: {
        id: string;
        name: string;
        item_id: string;
        campaign_id: string;
    };
    onSuccess: () => void;
}

const STATUS_OPTIONS = [
    { value: 'CONNECTED', label: 'Connected', icon: CheckCircle2, color: 'text-emerald-500' },
    { value: 'VOICEMAIL', label: 'Voicemail', icon: Voicemail, color: 'text-amber-500' },
    { value: 'NO_ANSWER', label: 'No Answer', icon: PhoneOff, color: 'text-zinc-500' },
    { value: 'BUSY', label: 'Busy', icon: Clock, color: 'text-blue-500' },
    { value: 'WRONG_PERSON', label: 'Wrong Person', icon: UserMinus, color: 'text-red-500' },
    { value: 'NOT_INTERESTED', label: 'Not Interested', icon: XCircle, color: 'text-red-600' },
];

const NEXT_ACTION_OPTIONS = [
    { value: 'CLOSE_WON', label: 'Booked / Won', icon: Target, color: 'text-emerald-600' },
    { value: 'CLOSE_LOST', label: 'Closed / Lost', icon: XCircle, color: 'text-red-600' },
    { value: 'RETRY_NOW', label: 'Retry Immediately (AI)', icon: RefreshCw, color: 'text-orange-600' },
    { value: 'RETRY_SCHEDULED', label: 'Schedule Follow-up', icon: Calendar, color: 'text-amber-600' },
];

import { RefreshCw } from 'lucide-react';

export const CallStatusDialog = ({ isOpen, onClose, lead, onSuccess }: CallStatusDialogProps) => {
    const [status, setStatus] = useState<string>("");
    const [duration, setDuration] = useState<number>(0);
    const [notes, setNotes] = useState<string>("");
    const [nextAction, setNextAction] = useState<string>("");
    const [retryDate, setRetryDate] = useState<Date | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // [NEW] State for Context & History
    const [activeTab, setActiveTab] = useState<'context' | 'history'>('context');
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [aiContext, setAiContext] = useState<any>(null);

    // Fetch Context on Open
    useEffect(() => {
        if (isOpen && lead.item_id) {
            setIsLoadingContext(true);
            api.get(`/user-queue/${lead.item_id}/context`)
                .then(data => {
                    setHistory(data.history || []);
                    setAiContext(data.ai_call_history || {});
                })
                .catch(err => console.error("Failed to fetch lead context", err))
                .finally(() => setIsLoadingContext(false));
        }
    }, [isOpen, lead.item_id]);

    const handleSubmit = async () => {
        if (!status) {
            toast.error("Please select a call status");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                status,
                duration,
                notes,
                next_action: nextAction,
                retry_scheduled_for: retryDate?.toISOString(),
                user_id: "me" // Backend handles this
            };

            await api.post(`/user-queue/${lead.item_id}/call-status`, payload);
            toast.success("Call outcome logged successfully");
            onSuccess();
            onClose();
            // Reset form
            setStatus("");
            setDuration(0);
            setNotes("");
            setNextAction("");
            setRetryDate(undefined);
            setActiveTab('context'); // Reset tab
        } catch (error: any) {
            toast.error(error.message || "Failed to log call outcome");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden flex flex-col h-[85vh]">

                {/* Header */}
                <div className="bg-emerald-600 p-8 text-white relative flex-shrink-0">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <PhoneCall className="w-24 h-24" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                                <span className="text-2xl">{lead.name.charAt(0)}</span>
                            </div>
                            <div>
                                <div>{lead.name}</div>
                                <div className="text-lg font-medium opacity-80 mt-1 flex items-center gap-3">
                                    <PhoneCall className="w-4 h-4" /> {lead.id}
                                </div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 mt-8 bg-black/20 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('context')}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'context' ? "bg-white text-emerald-600 shadow-lg" : "text-white/70 hover:text-white"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Context &amp; Scripts
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'history' ? "bg-white text-emerald-600 shadow-lg" : "text-white/70 hover:text-white"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Call History
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Content (Scrollable) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
                        {isLoadingContext ? (
                            <div className="flex h-full items-center justify-center">
                                <RefreshCw className="w-8 h-8 animate-spin text-zinc-300" />
                            </div>
                        ) : activeTab === 'context' ? (
                            <div className="space-y-8">

                                {/* Latest Call Transcript */}
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-emerald-500" />
                                        Latest AI Transcript
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Find latest AI call from history */}
                                        {(() => {
                                            const latestAI = history.find(h => h.type === 'AI');
                                            if (!latestAI || !latestAI.full_transcript) return (
                                                <div className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center text-zinc-400">
                                                    No transcript available for this lead.
                                                </div>
                                            );

                                            // Handle Array or String transcript
                                            let transcriptLines = [];
                                            try {
                                                if (Array.isArray(latestAI.full_transcript)) {
                                                    transcriptLines = latestAI.full_transcript;
                                                } else if (typeof latestAI.full_transcript === 'string') {
                                                    const cleaned = latestAI.full_transcript.trim();
                                                    // Try parsing if it looks like JSON
                                                    if (cleaned.startsWith('[') || cleaned.startsWith('{')) {
                                                        // Replace single quotes with double quotes if it looks like Python str(list)
                                                        const jsonCompatible = cleaned.replace(/'/g, '"');
                                                        try {
                                                            transcriptLines = JSON.parse(jsonCompatible);
                                                        } catch (jsonErr) {
                                                            // Fallback to original parse if replacement fails
                                                            transcriptLines = JSON.parse(cleaned);
                                                        }
                                                    } else {
                                                        // Simple split if just text
                                                        return (
                                                            <div className="whitespace-pre-wrap text-sm font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                                                {latestAI.full_transcript}
                                                            </div>
                                                        )
                                                    }
                                                }
                                            } catch (e) {
                                                console.error("Transcript parse error", e);
                                                return <div className="text-sm text-red-500">Error parsing transcript</div>
                                            }

                                            return (
                                                <div className="space-y-4">
                                                    {transcriptLines.map((turn: any, i: number) => (
                                                        <div key={i} className={cn(
                                                            "flex gap-4 p-4 rounded-2xl text-sm leading-relaxed max-w-2xl",
                                                            turn.role === 'assistant' || turn.role === 'agent'
                                                                ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-200 mr-auto rounded-tl-none border border-emerald-100 dark:border-emerald-900/20"
                                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ml-auto rounded-tr-none"
                                                        )}>
                                                            <div className="flex-1">
                                                                <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">
                                                                    {turn.role}
                                                                </div>
                                                                {turn.content}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Extracted Details */}
                                {(() => {
                                    // Try to find extracted data from latest AI history first, then fallback to aiContext
                                    const latestAI = history.find(h => h.type === 'AI');
                                    const extractedData = latestAI?.extracted_data || aiContext?.extracted_data;

                                    if (!extractedData || Object.keys(extractedData).length === 0) return null;

                                    return (
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 mt-8 flex items-center gap-2">
                                                <Target className="w-4 h-4 text-emerald-500" />
                                                Extracted Data
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {Object.entries(extractedData).map(([k, v]) => (
                                                    <div key={k} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                        <div className="text-[10px] font-bold uppercase text-zinc-400 mb-1">{k.replace(/_/g, ' ')}</div>
                                                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate" title={String(v)}>{String(v)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* History Timeline */}
                                <div className="relative border-l-2 border-zinc-100 dark:border-zinc-800 ml-3 space-y-8 py-2">
                                    {history.map((log, i) => (
                                        <div key={i} className="relative pl-8">
                                            {/* Dot */}
                                            <div className={cn(
                                                "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm",
                                                log.type === 'AI' ? "bg-emerald-500" : "bg-blue-500"
                                            )} />

                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                                                        log.type === 'AI' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    )}>
                                                        {log.type} CALL
                                                    </span>
                                                    <span className="text-xs font-medium text-zinc-400">
                                                        {format(new Date(log.created_at), "MMM d, h:mm a")}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-bold text-zinc-500">
                                                    {log.status}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                                                {log.summary && (
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3 leading-relaxed">
                                                        {log.summary}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-4 text-xs font-medium text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-700/50 pt-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {log.duration}s
                                                    </div>
                                                    {log.recording_url && (
                                                        <a
                                                            href={log.recording_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-1.5 text-emerald-600 hover:underline"
                                                        >
                                                            <Play className="w-3.5 h-3.5 fill-current" />
                                                            Recording
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {history.length === 0 && (
                                        <div className="text-center py-12 text-zinc-400">
                                            No call history found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Action Form */}
                    <div className="w-[400px] bg-zinc-50/50 dark:bg-zinc-950/50 p-8 flex flex-col gap-6 overflow-y-auto border-l border-zinc-100 dark:border-zinc-800">
                        {/* Status Selection */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Call Result</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {STATUS_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatus(opt.value)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                                            status === opt.value
                                                ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10"
                                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                                        )}
                                    >
                                        <opt.icon className={cn("w-5 h-5", status === opt.value ? "text-emerald-500" : opt.color)} />
                                        <span className={cn("text-[9px] font-black uppercase tracking-wider", status === opt.value ? "text-emerald-600" : "text-zinc-500")}>
                                            {opt.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Duration (min)</Label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                    className="w-full pl-12 pr-4 h-12 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 font-bold focus:border-emerald-500 transition-all outline-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-3 flex-1 flex flex-col">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Internal Notes</Label>
                            <div className="relative flex-1">
                                <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-zinc-400" />
                                <Textarea
                                    placeholder="Details..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full h-full pl-12 pr-4 pt-4 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 font-medium focus:border-emerald-500 transition-all outline-none resize-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Next Action */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Next Action</Label>
                            <Select value={nextAction} onValueChange={setNextAction}>
                                <SelectTrigger className="h-12 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-sm">
                                    <SelectValue placeholder="What's next?" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                                    {NEXT_ACTION_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} className="h-10 font-bold focus:bg-emerald-500/10 focus:text-emerald-600">
                                            <div className="flex items-center gap-2">
                                                <opt.icon className={cn("w-4 h-4", opt.color)} />
                                                {opt.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Conditional Scheduler */}
                        <AnimatePresence>
                            {nextAction === 'RETRY_SCHEDULED' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, height: 0 }}
                                    animate={{ opacity: 1, scale: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3"
                                >
                                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">Follow-up</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full h-12 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-left justify-start text-sm",
                                                    !retryDate && "text-muted-foreground"
                                                )}
                                            >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {retryDate ? format(retryDate, "PPP 'at' HH:mm") : <span>Pick a time</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-4 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800" align="start">
                                            <input
                                                type="datetime-local"
                                                className="w-full bg-transparent font-bold outline-none"
                                                onChange={(e) => setRetryDate(new Date(e.target.value))}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-3xl text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
                        >
                            {isSubmitting ? (
                                <RefreshCw className="w-6 h-6 animate-spin" />
                            ) : (
                                <>SAVE &amp; NEXT LEAD</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
