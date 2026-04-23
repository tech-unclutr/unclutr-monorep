"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    X,
    Play,
    Pause,
    Download,
    FileText,
    MessageSquare,
    Activity,
    Clock,
    Bot,
    User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { parseTranscript, formatCallDuration, type TranscriptTurn } from "./transcript-parser";

interface CallDetailsModalProps {
    callLogId: string | null;
    onClose: () => void;
}

interface CallDetailsResponse {
    id: string;
    lead: { id: string; name: string; company: string; phone: string | null };
    bolna_call_id: string;
    call_status: string;
    call_outcome: string | null;
    call_duration: number;
    total_cost: number;
    currency: string;
    recording_url: string | null;
    transcript_summary: string | null;
    transcript_raw: string;
    transcript_turns: unknown[] | null;
    extracted_data: Record<string, unknown> | null;
    termination_reason: string | null;
    created_at: string | null;
    updated_at: string | null;
}

type Tab = "transcript" | "summary" | "extracted";

export function CallDetailsModal({ callLogId, onClose }: CallDetailsModalProps) {
    const [details, setDetails] = useState<CallDetailsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<Tab>("transcript");
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioCurrent, setAudioCurrent] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Fetch call details when modal opens
    useEffect(() => {
        if (!callLogId) {
            setDetails(null);
            setTab("transcript");
            setIsPlaying(false);
            setAudioCurrent(0);
            setAudioDuration(0);
            return;
        }
        let cancelled = false;
        setLoading(true);
        api.request(`/voice-sandbox/call-log/${callLogId}`)
            .then((data: CallDetailsResponse) => {
                if (!cancelled) {
                    setDetails(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error("[CallDetailsModal] Failed to fetch call details:", err);
                if (!cancelled) {
                    setDetails(null);
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [callLogId]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            audio.play().catch((err) => {
                console.error("[CallDetailsModal] Audio play failed:", err);
                setIsPlaying(false);
            });
        } else {
            audio.pause();
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !audioDuration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audio.currentTime = ratio * audioDuration;
    };

    if (!callLogId) return null;

    const turns: TranscriptTurn[] = details
        ? parseTranscript(details.transcript_raw, details.transcript_turns)
        : [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-3xl max-h-[85vh] mx-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                {details?.lead.name || "Loading..."}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                                {details?.lead.company && (
                                    <>
                                        <span>{details.lead.company}</span>
                                        <span>·</span>
                                    </>
                                )}
                                {details && (
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatCallDuration(details.call_duration)}
                                    </span>
                                )}
                                {details?.call_outcome && (
                                    <>
                                        <span>·</span>
                                        <span className="font-medium text-zinc-500 dark:text-zinc-400">
                                            {details.call_outcome}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Audio player */}
                {details?.recording_url && (
                    <div className="shrink-0 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={togglePlay}
                                className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
                                aria-label={isPlaying ? "Pause recording" : "Play recording"}
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Call Recording
                                    </p>
                                    <p className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                                        {formatCallDuration(Math.floor(audioCurrent))} / {formatCallDuration(Math.floor(audioDuration || details.call_duration))}
                                    </p>
                                </div>
                                {/* Progress bar — click to seek */}
                                <div
                                    onClick={handleSeek}
                                    className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 cursor-pointer relative overflow-hidden group"
                                >
                                    <div
                                        className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-100"
                                        style={{
                                            width: audioDuration > 0 ? `${(audioCurrent / audioDuration) * 100}%` : "0%",
                                        }}
                                    />
                                </div>
                            </div>

                            <a
                                href={details.recording_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                                aria-label="Download recording"
                            >
                                <Download className="w-4 h-4" />
                            </a>

                            <audio
                                ref={audioRef}
                                src={details.recording_url}
                                preload="metadata"
                                onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration || 0)}
                                onTimeUpdate={(e) => setAudioCurrent(e.currentTarget.currentTime || 0)}
                                onEnded={() => { setIsPlaying(false); setAudioCurrent(0); }}
                                onPause={() => setIsPlaying(false)}
                                onPlay={() => setIsPlaying(true)}
                            />
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="shrink-0 flex items-center gap-1 px-6 pt-3 border-b border-zinc-100 dark:border-zinc-800">
                    <TabButton
                        active={tab === "transcript"}
                        onClick={() => setTab("transcript")}
                        icon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                        Transcript
                    </TabButton>
                    <TabButton
                        active={tab === "summary"}
                        onClick={() => setTab("summary")}
                        icon={<FileText className="w-3.5 h-3.5" />}
                    >
                        Summary
                    </TabButton>
                    <TabButton
                        active={tab === "extracted"}
                        onClick={() => setTab("extracted")}
                        icon={<Activity className="w-3.5 h-3.5" />}
                    >
                        Extracted
                    </TabButton>
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle p-6">
                    {loading ? (
                        <LoadingState />
                    ) : !details ? (
                        <EmptyState message="Failed to load call details." />
                    ) : tab === "transcript" ? (
                        <TranscriptView turns={turns} />
                    ) : tab === "summary" ? (
                        <SummaryView summary={details.transcript_summary} terminationReason={details.termination_reason} />
                    ) : (
                        <ExtractedView data={details.extracted_data} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Subcomponents ──────────────────────────────────────────────────

function TabButton({
    active,
    onClick,
    icon,
    children,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors",
                active
                    ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                    : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300",
            )}
        >
            {icon}
            {children}
        </button>
    );
}

function TranscriptView({ turns }: { turns: TranscriptTurn[] }) {
    if (turns.length === 0) {
        return <EmptyState message="No transcript available for this call." />;
    }
    return (
        <div className="space-y-3">
            {turns.map((turn, i) => {
                const isAgent = turn.role === "agent";
                return (
                    <div
                        key={i}
                        className={cn(
                            "flex gap-3",
                            isAgent ? "" : "flex-row-reverse",
                        )}
                    >
                        <div className={cn(
                            "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                            isAgent
                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        )}>
                            {isAgent ? <Bot className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                        </div>
                        <div className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2.5",
                            isAgent
                                ? "bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-sm"
                                : "bg-emerald-500 text-white dark:bg-emerald-500 rounded-tr-sm",
                        )}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-0.5">
                                {turn.role}
                            </p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {turn.content}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function SummaryView({
    summary,
    terminationReason,
}: {
    summary: string | null;
    terminationReason: string | null;
}) {
    if (!summary && !terminationReason) {
        return <EmptyState message="No summary available." />;
    }
    return (
        <div className="space-y-4">
            {summary && (
                <div>
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                        Conversation Summary
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {summary}
                    </p>
                </div>
            )}
            {terminationReason && (
                <div>
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                        Termination Reason
                    </p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{terminationReason}</p>
                </div>
            )}
        </div>
    );
}

function ExtractedView({ data }: { data: Record<string, unknown> | null }) {
    if (!data || Object.keys(data).length === 0) {
        return <EmptyState message="No extracted data available." />;
    }
    return (
        <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => (
                <div
                    key={key}
                    className="rounded-lg border border-zinc-100 dark:border-zinc-800 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/40"
                >
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                        {key.replace(/_/g, " ")}
                    </p>
                    <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">
                        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                    </pre>
                </div>
            ))}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white animate-spin mb-3" />
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Loading call details...</p>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{message}</p>
        </div>
    );
}
