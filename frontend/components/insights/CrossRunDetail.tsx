"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Layers, Loader2, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { formatRelative, type InsightItem } from "./mockData";
import { SynthesisInsightCard } from "./SynthesisInsightCard";

interface CrossRunDetailProps {
    runId: string;
}

type CrossRunResponse = {
    run_id: string;
    generated_at?: string | null;
    elapsed_seconds?: number | null;
    transcript_ids: string[];
    insights: InsightItem[];
    filtered_insight_ids: string[];
    usage?: { input_tokens?: number; output_tokens?: number } | null;
};

export function CrossRunDetail({ runId }: CrossRunDetailProps) {
    const router = useRouter();
    const [data, setData] = useState<CrossRunResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = (await api.get(
                    `/insights/cross-runs/${runId}`,
                )) as CrossRunResponse;
                if (!cancelled) {
                    setData(res);
                    setError(null);
                }
            } catch (e) {
                if (cancelled) return;
                if (e instanceof ApiError && e.status === 404) {
                    setNotFound(true);
                    return;
                }
                setError(e instanceof Error ? e.message : String(e));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [runId]);

    if (notFound || error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-6">
                <div className="text-center max-w-md">
                    <h1 className="font-display text-xl font-semibold text-foreground">
                        Cross-run not found
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {error ??
                            "This synthesis run either doesn't exist or hasn't been generated for your company."}
                    </p>
                    <button
                        onClick={() => router.push("/dashboard/insights")}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to insights
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-6">
                <div className="text-center text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                    Loading cross-run…
                </div>
            </div>
        );
    }

    const insights = data.insights ?? [];
    const surfaced = (data.filtered_insight_ids ?? []).length;
    const tokens =
        (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-6 py-8">
                <button
                    type="button"
                    onClick={() => router.push("/dashboard/insights")}
                    className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to insights
                </button>

                <header className="flex items-start gap-3 mb-8">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FF8A4C]/10 text-[#FF8A4C] shrink-0">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                            Cross-run synthesis
                        </h1>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
                            <span className="font-mono text-[11px]">{data.run_id}</span>
                            {data.generated_at && (
                                <>
                                    <Dot />
                                    <span>Generated {formatRelative(data.generated_at)}</span>
                                </>
                            )}
                            <Dot />
                            <span className="tabular-nums">
                                {data.transcript_ids.length} transcripts
                            </span>
                            <Dot />
                            <span className="tabular-nums">
                                {insights.length} mined · {surfaced} surfaced
                            </span>
                            {tokens > 0 && (
                                <>
                                    <Dot />
                                    <span className="tabular-nums">{tokens.toLocaleString()} tokens</span>
                                </>
                            )}
                            {typeof data.elapsed_seconds === "number" && (
                                <>
                                    <Dot />
                                    <span className="tabular-nums">
                                        {data.elapsed_seconds.toFixed(1)}s
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {insights.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#27272A] bg-card/50 p-8 text-center">
                        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                            <Sparkles className="w-3.5 h-3.5 text-[#FF8A4C]" />
                            The cross-run produced no aggregated insights for this batch.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {insights.map((insight, idx) => (
                            <SynthesisInsightCard
                                key={insight.insight_id}
                                insight={insight}
                                rank={idx + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Dot() {
    return <span className="text-zinc-300 dark:text-zinc-700">·</span>;
}
