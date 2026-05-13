"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { InsightCard } from "@/components/InsightCard";
import type { Action, AggregatedInsight, AggregatedOutput, DebateResult, RunVerification } from "@/lib/types";

type CrossRunPayload = {
  pipeline_version: string;
  run_id: string;
  generated_at: string;
  elapsed_seconds: number;
  transcript_ids: string[];
  brand_context?: string;
  onboarding_plan?: string;
  aggregated: AggregatedOutput;
  filtered_insight_ids: string[];
  debate: { results: DebateResult[] };
  actions: { actions: Action[] };
  usage: { input_tokens: number; output_tokens: number };
  verification?: RunVerification;
};

// Sonnet 4.5 floor pricing. Real cost is a bit higher because of Opus judge calls.
function estimateCostUsd(inTokens: number, outTokens: number): number {
  return (inTokens * 3 + outTokens * 15) / 1_000_000;
}

export default function CrossRunPage() {
  const params = useParams<{ runId: string }>();
  const runId = decodeURIComponent(params.runId ?? "");
  const [data, setData] = useState<CrossRunPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/transcripts/cross/${encodeURIComponent(runId)}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setData)
      .catch(e => setErr(e instanceof Error ? e.message : String(e)));
  }, [runId]);

  const insights = data?.aggregated.aggregated_insights ?? [];
  const surfaced = useMemo(
    () => (data?.filtered_insight_ids ?? [])
      .map(id => insights.find(i => i.insight_id === id))
      .filter((i): i is AggregatedInsight => !!i),
    [data, insights],
  );
  const actionsByInsight = useMemo(() => {
    const m = new Map<string, Action>();
    for (const a of data?.actions.actions ?? []) for (const sid of a.supporting_insights) if (!m.has(sid)) m.set(sid, a);
    return m;
  }, [data]);
  const debateByInsight = useMemo(() => {
    const m = new Map<string, DebateResult>();
    for (const d of data?.debate.results ?? []) m.set(d.insight_id, d);
    return m;
  }, [data]);

  const multiTranscriptCount = useMemo(
    () => insights.filter(i => i.transcripts_mentioning.length >= 2).length,
    [insights],
  );

  const clusteringMethod = data?.aggregated.metadata.clustering_method ?? "jaccard";
  const costUsd = data ? estimateCostUsd(data.usage.input_tokens, data.usage.output_tokens) : 0;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <Link href="/transcripts" className="text-sm text-ink-500 hover:text-ink-900 mb-6 inline-block">
          ← Back to transcripts
        </Link>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="inline-flex items-center gap-2 pill bg-purple-50 text-purple-700">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Cross-transcript synthesis
          </span>
          <ClusteringBadge method={clusteringMethod} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink-950 mb-2 break-all">{runId}</h1>

        {err && (
          <div className="card p-4 mt-4 border-signal-red/30 bg-signal-red/5">
            <p className="text-sm text-signal-red font-semibold">Couldn&apos;t load this cross-run</p>
            <p className="text-xs text-ink-600 mt-1">{err}</p>
          </div>
        )}

        {data && (
          <>
            <p className="text-sm text-ink-500 mb-6">
              Generated {new Date(data.generated_at).toLocaleString()} · {data.elapsed_seconds.toFixed(1)}s
            </p>

            {/* Stats bar */}
            <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              <Stat label="Transcripts" value={data.transcript_ids.length} sub={data.transcript_ids.join(", ")} />
              <Stat label="Insights mined" value={insights.length} />
              <Stat
                label="Multi-transcript"
                value={multiTranscriptCount}
                sub={insights.length ? `${Math.round((multiTranscriptCount / insights.length) * 100)}% of mined` : "—"}
                accent={multiTranscriptCount > 0}
              />
              <Stat label="Surfaced" value={surfaced.length} sub="top P0/P1/P2" />
              <Stat
                label="Est. cost"
                value={`$${costUsd.toFixed(3)}`}
                sub={`${data.usage.input_tokens.toLocaleString()}in / ${data.usage.output_tokens.toLocaleString()}out`}
              />
            </section>

            {/* Verification, if present */}
            {data.verification && data.verification.totalSpans > 0 && (
              <section className="card p-4 mb-6 bg-ink-50/40">
                <div className="text-xs text-ink-500 uppercase tracking-wider mb-2">Span verification</div>
                <div className="text-sm text-ink-800">
                  <span className="font-semibold">{data.verification.totalSpans}</span> spans checked ·{" "}
                  <span className="text-signal-green font-medium">{data.verification.exact} exact</span>{" · "}
                  <span className="text-yellow-600 font-medium">{data.verification.autoCorrected} auto-corrected</span>{" · "}
                  <span className={data.verification.rejected > 0 ? "text-signal-red font-medium" : "text-ink-500"}>
                    {data.verification.rejected} rejected
                  </span>
                </div>
              </section>
            )}

            {/* Source transcripts */}
            <div className="card p-4 mb-8">
              <div className="text-xs text-ink-500 uppercase tracking-wider mb-2">Source transcripts</div>
              <div className="flex flex-wrap gap-2">
                {data.transcript_ids.map(tid => (
                  <Link
                    key={tid}
                    href={`/transcripts/${encodeURIComponent(tid)}`}
                    className="pill bg-ink-100 text-ink-700 hover:bg-ink-200 hover:text-ink-900"
                  >
                    {tid}
                  </Link>
                ))}
              </div>
            </div>

            {/* Clustering note */}
            {clusteringMethod === "jaccard" && multiTranscriptCount === 0 && insights.length > 4 && (
              <div className="card p-4 mb-6 border-yellow-200 bg-yellow-50">
                <p className="text-sm text-yellow-900 font-semibold">No themes merged across transcripts</p>
                <p className="text-xs text-yellow-800 mt-1">
                  This run used Jaccard token-similarity clustering, which can&apos;t bridge semantically equivalent phrasings (e.g. &quot;longevity&quot; vs &quot;long-lasting&quot;).
                  Re-run via the &quot;Run cross-transcript&quot; button on the transcripts page to use the LLM clusterer.
                </p>
              </div>
            )}

            {surfaced.length > 0 ? (
              <section>
                <h2 className="text-xl font-bold text-ink-900 mb-1">Cross-transcript insights</h2>
                <p className="text-xs text-ink-500 mb-4">
                  Top {surfaced.length} by impact (severity × frequency). Multi-transcript insights are highlighted in the &quot;Frequency&quot; stat.
                </p>
                <div className="space-y-4">
                  {surfaced.map((ins, i) => {
                    const isMulti = ins.transcripts_mentioning.length >= 2;
                    return (
                      <div
                        key={ins.insight_id}
                        className={isMulti ? "rounded-xl ring-2 ring-purple-200/60 ring-offset-1" : ""}
                      >
                        <InsightCard
                          rank={i + 1}
                          insight={ins}
                          action={actionsByInsight.get(ins.insight_id)}
                          debate={debateByInsight.get(ins.insight_id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : (
              <div className="card p-6 text-center text-sm text-ink-500">
                No insights surfaced — all candidates filtered out by priority gates. With single-transcript-only insights (frequency ≤ 25%), P0/P1 are impossible to reach. Try the LLM clusterer to surface cross-transcript themes that meet the bar.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, sub, accent }: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={"card p-3 " + (accent ? "border-purple-200 bg-purple-50/40" : "")}>
      <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={"text-xl font-bold " + (accent ? "text-purple-700" : "text-ink-900")}>{value}</div>
      {sub && <div className="text-[11px] text-ink-500 mt-0.5 truncate" title={sub}>{sub}</div>}
    </div>
  );
}

function ClusteringBadge({ method }: { method: "llm" | "jaccard" }) {
  if (method === "llm") {
    return (
      <span className="inline-flex items-center gap-2 pill bg-green-50 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        LLM clusterer
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 pill bg-ink-100 text-ink-600" title="Token-overlap clustering. Cannot bridge paraphrases like 'longevity' ↔ 'long-lasting'.">
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400" />
      Jaccard (legacy)
    </span>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-accent-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zM3 9h4v4H3V9zm6 0h4v4H9V9z" />
              </svg>
            </div>
            <span className="font-bold text-ink-900">SquareUp</span>
          </Link>
          <span className="text-ink-300">/</span>
          <Link href="/transcripts" className="text-ink-600 text-sm font-medium hover:text-ink-900">Transcripts</Link>
          <span className="text-ink-300">/</span>
          <Link href="/transcripts/cross" className="text-ink-600 text-sm font-medium hover:text-ink-900">Cross-runs</Link>
          <span className="text-ink-300">/</span>
          <span className="text-ink-600 text-sm font-medium">Run</span>
        </div>
      </div>
    </header>
  );
}
