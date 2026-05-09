"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { InsightCard } from "@/components/InsightCard";
import type { Action, AggregatedInsight, DebateResult } from "@/lib/types";
import type { ServerPipelineResult } from "@/lib/pipeline-server";

type DetailResponse = {
  transcript_id: string;
  transcript_text: string;
  status: "pending" | "done" | "failed";
  result: ServerPipelineResult | null;
  error: { error: string; stage?: string; timestamp?: string } | null;
};

export default function TranscriptDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/transcripts/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d: DetailResponse = await res.json();
        setData(d);
        setErr(null);
        if (d.status === "pending") setTimeout(load, 5000); // poll while pending
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const insights = data?.result?.aggregated.aggregated_insights ?? [];
  const filteredIds = data?.result?.filtered_insight_ids ?? [];
  const surfaced = useMemo(
    () => filteredIds.map(fid => insights.find(i => i.insight_id === fid)).filter((i): i is AggregatedInsight => !!i),
    [filteredIds, insights],
  );
  const actions: Action[] = data?.result?.actions.actions ?? [];
  const actionsByInsight = useMemo(() => {
    const m = new Map<string, Action>();
    for (const a of actions) for (const sid of a.supporting_insights) if (!m.has(sid)) m.set(sid, a);
    return m;
  }, [actions]);
  const debateByInsight = useMemo(() => {
    const m = new Map<string, DebateResult>();
    for (const d of data?.result?.debate.results ?? []) m.set(d.insight_id, d);
    return m;
  }, [data]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <Link href="/transcripts" className="text-sm text-ink-500 hover:text-ink-900 mb-6 inline-block">
          ← Back to transcripts
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-ink-950 mb-2 break-all">{id}</h1>
        <StatusLine data={data} loading={loading} err={err} />

        {data?.error && (
          <div className="card p-5 mt-6 border-signal-red/30 bg-signal-red/5">
            <div className="text-sm text-signal-red font-semibold mb-1">Pipeline failed</div>
            <div className="text-xs text-ink-700">{data.error.error}</div>
            {data.error.stage && <div className="text-xs text-ink-500 mt-1">Stage: {data.error.stage}</div>}
          </div>
        )}

        {/* Transcript text */}
        {data?.transcript_text && (
          <section className="mt-8">
            <details>
              <summary className="text-sm font-semibold text-ink-700 cursor-pointer hover:text-ink-900">
                Source transcript ({data.transcript_text.length.toLocaleString()} chars)
              </summary>
              <pre className="mt-3 card p-4 text-xs text-ink-800 whitespace-pre-wrap overflow-x-auto max-h-[60vh] overflow-y-auto font-mono leading-relaxed">
                {data.transcript_text}
              </pre>
            </details>
          </section>
        )}

        {/* Run summary */}
        {data?.result && (
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
            <Stat label="Insights surfaced" value={surfaced.length} />
            <Stat label="Total mined" value={insights.length} />
            <Stat label="Hallucinations rejected" value={data.result.verification.rejected} accent={data.result.verification.rejected > 0} />
            <Stat label="Elapsed" value={`${data.result.elapsed_seconds.toFixed(1)}s`} />
            <Stat label="Tokens" value={`${(data.result.usage.input_tokens / 1000).toFixed(1)}k in / ${(data.result.usage.output_tokens / 1000).toFixed(1)}k out`} small />
          </section>
        )}

        {/* Insights */}
        {surfaced.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-ink-900 mb-4">Insights</h2>
            <div className="space-y-4">
              {surfaced.map((ins, i) => (
                <InsightCard
                  key={ins.insight_id}
                  rank={i + 1}
                  insight={ins}
                  action={actionsByInsight.get(ins.insight_id)}
                  debate={debateByInsight.get(ins.insight_id)}
                />
              ))}
            </div>
          </section>
        )}

        {data?.status === "pending" && (
          <div className="card p-6 mt-8 text-center">
            <div className="text-sm text-ink-700 font-medium mb-1">Pipeline running</div>
            <div className="text-xs text-ink-500">
              The ingest endpoint is processing this transcript. Insights typically arrive within 30–60s.
              This page auto-refreshes every 5 seconds.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusLine({ data, loading, err }: { data: DetailResponse | null; loading: boolean; err: string | null }) {
  if (loading) return <p className="text-sm text-ink-500">Loading…</p>;
  if (err) return <p className="text-sm text-signal-red">{err}</p>;
  if (!data) return null;
  const styles = {
    pending: "text-signal-amber",
    done: "text-signal-green",
    failed: "text-signal-red",
  };
  return (
    <p className={`text-sm font-medium ${styles[data.status]}`}>
      Status: {data.status}
      {data.result && ` · ${data.result.aggregated.aggregated_insights.length} insights mined · ${data.result.filtered_insight_ids.length} surfaced`}
    </p>
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
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-ink-600 hover:text-ink-900">Synthesis (live)</Link>
          <Link href="/transcripts" className="text-ink-900 font-medium">Transcripts</Link>
        </nav>
      </div>
    </header>
  );
}

function Stat({ label, value, accent = false, small = false }: { label: string; value: string | number; accent?: boolean; small?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`${small ? "text-sm" : "text-2xl"} font-bold ${accent ? "text-signal-red" : "text-ink-900"}`}>{value}</div>
    </div>
  );
}
