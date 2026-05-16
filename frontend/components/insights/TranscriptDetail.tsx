"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Bot,
    ChevronDown,
    FileText,
    Loader2,
    PlayCircle,
    Sparkles,
    User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import {
    formatRelative,
    type InsightItem,
    type MockTranscript,
} from "./mockData";
import { SynthesisInsightCard } from "./SynthesisInsightCard";

interface TranscriptDetailProps {
    transcriptId: string;
}

type TranscriptMessage = {
    role: "user" | "assistant" | "system" | string;
    text: string;
};

type TranscriptDetailResponse = MockTranscript & {
    transcript: TranscriptMessage[];
    transcript_raw?: string | null;
    recording_url?: string | null;
    insights: InsightItem[] | null;
};

// Poll while insights are still brewing so the panel flips automatically
// once the pipeline finishes (typically 30-60s).
const POLL_INTERVAL_MS = 5000;

export function TranscriptDetail({ transcriptId }: TranscriptDetailProps) {
    const router = useRouter();
    const [data, setData] = useState<TranscriptDetailResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notReady, setNotReady] = useState(false);
    const [transcriptOpen, setTranscriptOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const res = (await api.get(
                    `/insights/transcripts/${transcriptId}`,
                )) as TranscriptDetailResponse;
                if (!cancelled) {
                    setData(res);
                    setError(null);
                    setNotReady(false);
                }
            } catch (e) {
                if (cancelled) return;
                if (e instanceof ApiError && e.status === 404) {
                    setNotReady(true);
                    return;
                }
                setError(e instanceof Error ? e.message : String(e));
            }
        }

        load();
        const id = setInterval(() => {
            // Stop polling once insights have landed.
            if (data && data.insights !== null) return;
            load();
        }, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [transcriptId, data?.insights === null]);

    if (notReady) {
        return <NotReady id={transcriptId} />;
    }

    if (error) {
        return <NotReady id={transcriptId} message={`Failed to load: ${error}`} />;
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-6">
                <div className="text-center text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                    Loading transcript…
                </div>
            </div>
        );
    }

    const transcript = data;
    const transcriptInsights = data.insights;
    const messages = data.transcript ?? [];

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-6 py-8">
                <button
                    onClick={() => router.push("/dashboard/insights")}
                    className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to insights
                </button>

                <header className="flex items-start justify-between gap-4 mb-8">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                                {transcript.name}
                            </h1>
                            <div className="mt-1.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                                <span className="font-medium uppercase tracking-wide">
                                    {transcript.persona}
                                </span>
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span>Ingested {formatRelative(transcript.ingested_at)}</span>
                                {transcript.duration_minutes > 0 && (
                                    <>
                                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                        <span className="tabular-nums">
                                            {transcript.duration_minutes}m
                                        </span>
                                    </>
                                )}
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span className="tabular-nums">{messages.length} turns</span>
                            </div>
                        </div>
                    </div>
                    {transcript.recording_url && (
                        <a
                            href={transcript.recording_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-card px-3 text-[12px] font-medium text-foreground hover:border-[#FF8A4C]/40 transition-colors dark:border-[#27272A]"
                        >
                            <PlayCircle className="h-3.5 w-3.5" />
                            Recording
                        </a>
                    )}
                </header>

                {/* Insights — primary content */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Insights from this transcript
                        </h2>
                    </div>
                    {transcriptInsights === null ? (
                        <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#27272A] bg-card/50 p-8 text-center">
                            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                <Sparkles className="w-3.5 h-3.5 text-[#FF8A4C]" />
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Insights are being generated… this page will update automatically.
                            </div>
                        </div>
                    ) : transcriptInsights.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#27272A] bg-card/50 p-8 text-center">
                            <p className="text-sm text-muted-foreground">
                                The pipeline finished but didn't surface any themes from this call.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transcriptInsights.map((insight, idx) => (
                                <SynthesisInsightCard
                                    key={insight.insight_id}
                                    insight={insight}
                                    rank={idx + 1}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Source transcript — chat-style, collapsed by default, lives below the insights */}
                <section className="mt-10">
                    <button
                        type="button"
                        onClick={() => setTranscriptOpen((v) => !v)}
                        aria-expanded={transcriptOpen}
                        aria-controls="transcript-body"
                        className="group flex w-full items-center justify-between gap-3 mb-4 text-left"
                    >
                        <div className="flex items-center gap-2">
                            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                                Conversation
                            </h2>
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                {messages.length}
                            </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            {transcriptOpen ? "Hide" : "Show"}
                            <ChevronDown
                                className={cn(
                                    "w-3.5 h-3.5 transition-transform duration-200",
                                    transcriptOpen ? "rotate-180" : "rotate-0",
                                )}
                            />
                        </span>
                    </button>
                    {transcriptOpen &&
                        (messages.length === 0 ? (
                            <div
                                id="transcript-body"
                                className="rounded-xl border border-dashed border-gray-200 dark:border-[#27272A] bg-card/50 p-6 text-center text-sm text-muted-foreground"
                            >
                                No transcript text was captured for this call.
                            </div>
                        ) : (
                            <div
                                id="transcript-body"
                                className="rounded-2xl border border-gray-100 dark:border-[#27272A] bg-card/50 p-4 sm:p-6 space-y-3"
                            >
                                {messages.map((m, idx) => (
                                    <Bubble key={idx} message={m} />
                                ))}
                            </div>
                        ))}
                </section>
            </div>
        </div>
    );
}

function Bubble({ message }: { message: TranscriptMessage }) {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";
    const isSystem = !isUser && !isAssistant;
    return (
        <div
            className={cn(
                "flex items-start gap-3",
                isUser && "flex-row-reverse",
            )}
        >
            <div
                className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1",
                    isUser
                        ? "bg-[#FF8A4C]/10 text-[#FF8A4C] ring-[#FF8A4C]/20"
                        : isAssistant
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
                          : "bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
                )}
            >
                {isUser ? (
                    <User className="h-3.5 w-3.5" />
                ) : isAssistant ? (
                    <Bot className="h-3.5 w-3.5" />
                ) : (
                    <FileText className="h-3 w-3" />
                )}
            </div>
            <div
                className={cn(
                    "flex max-w-[78%] flex-col gap-1",
                    isUser ? "items-end text-right" : "items-start",
                )}
            >
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    {isSystem ? "system" : message.role}
                </span>
                <div
                    className={cn(
                        "rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap",
                        isUser
                            ? "bg-[#FF8A4C]/10 text-foreground rounded-tr-sm"
                            : isAssistant
                              ? "bg-zinc-100 text-foreground dark:bg-zinc-800/80 rounded-tl-sm"
                              : "bg-card border border-dashed border-zinc-200 dark:border-zinc-700 text-foreground/80",
                    )}
                >
                    {message.text || <span className="italic text-muted-foreground">(empty)</span>}
                </div>
            </div>
        </div>
    );
}

function NotReady({ id, message }: { id: string; message?: string }) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                <h1 className="font-display text-xl font-semibold text-foreground">
                    Transcript not ready
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {message ??
                        "This transcript either doesn't exist or is still being processed."}
                </p>
                <Link
                    href="/dashboard/insights"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to insights
                </Link>
            </div>
        </div>
    );
}
