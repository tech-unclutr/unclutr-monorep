"use strict";
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    AlertCircle,
    PhoneIncoming,
    PhoneCall
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
}

interface CampaignActivityModalProps {
    call: CallLogEntry | null;
    isOpen: boolean;
    onClose: () => void;
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
};

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const CampaignActivityModal: React.FC<CampaignActivityModalProps> = ({ call, isOpen, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Reset state when call changes or modal opens/closes
    React.useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(call?.duration || 0);
    }, [call, isOpen]);

    if (!call) return null;

    const status = (call.outcome || call.status || 'FAILED').toUpperCase();
    const config = statusConfig[status] || { color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20', Icon: Clock };
    const colorClass = config.color;

    const generateSummary = () => {
        if (call.critical_signal?.type === 'DNC') return "Customer requested to be removed from all future contact. Expressed clear do-not-call preference.";
        if (call.critical_signal?.type === 'WRONG_PERSON') return "Call reached a person other than the intended recipient. Contact records require update.";
        if (call.critical_signal?.type === 'LANGUAGE_BARRIER') return "A significant language barrier prevented effective communication. Support in local language may be required.";

        if (status === 'INTENT_YES' || status === 'INTERESTED') return `Customer expressed positive interest. ${call.key_insight || 'Wants to learn more.'}`;
        if (status === 'NOT_INTERESTED') return `Customer politely declined the offer. ${call.key_insight || 'Expressed clear disinterest.'}`;
        if (status === 'SCHEDULED') return `Follow-up requested. ${call.scheduling_preference || call.key_insight || 'Interested but busy now.'}`;
        return "Call completed with capture of outcome status.";
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-[40px] p-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
                <ScrollArea className="flex-1">
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
                                    <Badge className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5", statusConfig[status]?.color || 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20')}>
                                        {(() => {
                                            const Icon = statusConfig[status]?.Icon || Clock;
                                            return <Icon className="w-3.5 h-3.5" />;
                                        })()}
                                        {status.replace(/_/g, ' ')}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
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
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
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

                            {/* Section 2: Transcript */}
                            {call.transcript && call.transcript.length > 0 && (
                                <Card className="rounded-[32px] bg-white dark:bg-zinc-950 p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                                            <Mic className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            Neuro-Conversation
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        {call.transcript.map((turn, i) => (
                                            <div key={i} className={cn(
                                                "flex flex-col",
                                                turn.role === 'agent' || turn.role === 'assistant' ? 'items-start' : 'items-end'
                                            )}>
                                                <div className={cn(
                                                    "max-w-[85%] px-5 py-3 rounded-3xl text-[13px] font-medium leading-relaxed shadow-sm",
                                                    turn.role === 'agent' || turn.role === 'assistant'
                                                        ? "bg-indigo-500 text-white rounded-tl-sm"
                                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tr-sm border border-zinc-200/50 dark:border-zinc-700/50"
                                                )}>
                                                    {turn.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

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
                                            className="w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                                            onClick={togglePlay}
                                        >
                                            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 translate-x-0.5" />}
                                        </Button>

                                        <div className="flex-1 space-y-2">
                                            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)] transition-all duration-100"
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

                            {/* Section 4: Next Steps */}
                            <div className="pt-4">
                                {call.is_dnc ? (
                                    <Button className="w-full h-14 rounded-[24px] bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 gap-3">
                                        <AlertTriangle className="w-4 h-4" />
                                        Finalize Universal DNC Removal
                                    </Button>
                                ) : status === 'INTENT_YES' || status === 'INTERESTED' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button className="h-14 rounded-[24px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 gap-3">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Approve Conversion
                                        </Button>
                                        <Button variant="outline" className="h-14 rounded-[24px] border-emerald-500/20 hover:bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-[0.2em] gap-3">
                                            <Calendar className="w-4 h-4" />
                                            Manual Follow-up
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" className="w-full h-14 rounded-[24px] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-black text-xs uppercase tracking-[0.2em] gap-3">
                                        <LinkIcon className="w-4 h-4" />
                                        Reference Archive Entry
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
