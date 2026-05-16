"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    FileText,
    Loader2,
    Sparkles,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import {
    formatRelative,
    type MockTranscript,
    type TranscriptStatus,
} from "./mockData";

// Poll while anything is still pending so users see the row flip to "done"
// without a manual refresh once the pipeline finishes.
const POLL_INTERVAL_MS = 5000;

export function TranscriptsList() {
    const router = useRouter();
    const [transcripts, setTranscripts] = useState<MockTranscript[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const goBack = () => {
        // Prefer the explicit return path stashed by ExecutionPage's "View Insights"
        // button — survives reloads, jumps straight back to the right execution screen.
        if (typeof window !== "undefined") {
            const stashed = sessionStorage.getItem("insights_return_path");
            if (stashed) {
                sessionStorage.removeItem("insights_return_path");
                router.push(stashed);
                return;
            }
            if (window.history.length > 1) {
                router.back();
                return;
            }
        }
        router.push("/dashboard/study");
    };

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = (await api.get("/insights/transcripts")) as MockTranscript[];
                if (!cancelled) {
                    setTranscripts(data);
                    setError(null);
                }
            } catch (e) {
                if (cancelled) return;
                setError(
                    e instanceof ApiError
                        ? e.message
                        : e instanceof Error
                          ? e.message
                          : String(e),
                );
            }
        }

        load();
        const id = setInterval(() => {
            // Only keep polling while there's something pending; otherwise stop.
            const anyPending = (transcripts ?? []).some((t) => t.status === "pending");
            if (anyPending || transcripts === null) load();
        }, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(id);
        };
        // intentionally re-run when `transcripts` flips between null/empty/some,
        // so the poller can shut itself off once everything is terminal.
    }, [transcripts === null, JSON.stringify((transcripts ?? []).map((t) => t.status))]);

    const counts = useMemo(() => {
        const base = { done: 0, pending: 0, failed: 0 } as Record<TranscriptStatus, number>;
        for (const t of transcripts ?? []) base[t.status]++;
        return base;
    }, [transcripts]);

    const canRunSynthesis = counts.done >= 2;
    const [synthesizing, setSynthesizing] = useState(false);

    const runSynthesis = async () => {
        if (!canRunSynthesis || synthesizing) return;
        setSynthesizing(true);
        try {
            const doneIds = (transcripts ?? [])
                .filter((t) => t.status === "done")
                .map((t) => t.id);
            const res = (await api.post("/insights/cross-runs", {
                call_log_ids: doneIds,
            })) as { run_id: string };
            router.push(`/dashboard/insights/cross-runs/${res.run_id}`);
        } catch (e) {
            const msg =
                e instanceof ApiError
                    ? e.message
                    : e instanceof Error
                      ? e.message
                      : String(e);
            setError(`Cross-run failed: ${msg}`);
            setSynthesizing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-6 py-8">
                <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                </button>

                <header className="flex items-start justify-between gap-6 mb-8">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                                Insights
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                                One row per completed research call. Each row links to that call's
                                full transcript and the LLM-extracted themes, contradictions, and
                                recommended actions.
                            </p>
                            <div className="mt-3 flex items-center gap-3 text-[11.5px] text-muted-foreground">
                                <span className="tabular-nums">
                                    <span className="font-semibold text-foreground">
                                        {counts.done}
                                    </span>{" "}
                                    done
                                </span>
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span className="tabular-nums">
                                    <span className="font-semibold text-foreground">
                                        {counts.pending}
                                    </span>{" "}
                                    pending
                                </span>
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span className="tabular-nums">
                                    <span className="font-semibold text-foreground">
                                        {counts.failed}
                                    </span>{" "}
                                    failed
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={runSynthesis}
                        disabled={!canRunSynthesis || synthesizing}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all shrink-0",
                            canRunSynthesis && !synthesizing
                                ? "bg-[#FF8A4C] text-white shadow-[0_0_15px_rgba(255,138,76,0.25)] hover:opacity-90 active:scale-[0.98]"
                                : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground cursor-not-allowed",
                        )}
                    >
                        {synthesizing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {synthesizing ? "Running synthesis…" : "Run synthesis"}
                    </button>
                </header>

                <div className="space-y-2">
                    {transcripts === null && !error ? (
                        <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#27272A] bg-card/50 p-8 text-center text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                            Loading transcripts…
                        </div>
                    ) : error ? (
                        <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 p-6 text-sm text-rose-700 dark:text-rose-400">
                            Couldn't load transcripts: {error}
                        </div>
                    ) : (transcripts ?? []).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#27272A] bg-card/50 p-8 text-center text-sm text-muted-foreground">
                            No transcripts yet. Trigger a research call to see it here.
                        </div>
                    ) : (
                        (transcripts ?? []).map((t) => (
                            <TranscriptRow key={t.id} transcript={t} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function TranscriptRow({ transcript }: { transcript: MockTranscript }) {
    const isDone = transcript.status === "done";

    const row = (
        <div
            className={cn(
                "group flex items-center gap-4 rounded-xl border bg-card px-5 py-4 transition-all",
                isDone
                    ? "border-gray-100 dark:border-[#27272A] hover:border-[#FF8A4C]/30 hover:shadow-[0_8px_24px_-12px_rgba(255,138,76,0.12)]"
                    : "border-gray-100 dark:border-[#27272A] opacity-70",
            )}
        >
            <StatusBadge status={transcript.status} />
            <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-medium text-foreground">
                    {transcript.name}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium uppercase tracking-wide">
                        {transcript.persona}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span>{formatRelative(transcript.ingested_at)}</span>
                    {transcript.duration_minutes > 0 && (
                        <>
                            <span className="text-zinc-300 dark:text-zinc-700">·</span>
                            <span className="tabular-nums">
                                {transcript.duration_minutes}m
                            </span>
                        </>
                    )}
                </div>
            </div>
            {isDone && (
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#FF8A4C] group-hover:translate-x-0.5 transition-all shrink-0" />
            )}
        </div>
    );

    if (!isDone) return row;

    return (
        <Link href={`/dashboard/insights/${transcript.id}`}>{row}</Link>
    );
}

function StatusBadge({ status }: { status: TranscriptStatus }) {
    if (status === "done") {
        return (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
            </div>
        );
    }
    if (status === "pending") {
        return (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <Loader2 className="w-4 h-4 animate-spin" />
            </div>
        );
    }
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400">
            <XCircle className="w-4 h-4" />
        </div>
    );
}
