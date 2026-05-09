"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { InsightCard } from "@/components/InsightCard";
import type { Action, AggregatedInsight, DebateResult } from "@/lib/types";

type CrossRunPayload = {
  pipeline_version: string;
  run_id: string;
  generated_at: string;
  elapsed_seconds: number;
  transcript_ids: string[];
  brand_context?: string;
  onboarding_plan?: string;
  aggregated: { aggregated_insights: AggregatedInsight[] };
  filtered_insight_ids: string[];
  debate: { results: DebateResult[] };
  actions: { actions: Action[] };
  usage: { input_tokens: number; output_tokens: number };
};

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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <Link href="/transcripts" className="text-sm text-ink-500 hover:text-ink-900 mb-6 inline-block">
          ← Back to transcripts
        </Link>

        <div className="inline-flex items-center gap-2 pill bg-purple-50 text-purple-700 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Cross-transcript synthesis
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink-950 mb-2 break-all">{runId}</h1>

        {err && <p className="text-sm text-signal-red">{err}</p>}

        {data && (
          <>
            <p className="text-sm text-ink-500 mb-6">
              {data.transcript_ids.length} transcript{data.transcript_ids.length === 1 ? "" : "s"} · {insights.length} mined · {surfaced.length} surfaced · {data.elapsed_seconds.toFixed(1)}s
            </p>

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

            {surfaced.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-ink-900 mb-4">Cross-transcript insights</h2>
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

            {surfaced.length === 0 && (
              <div className="card p-6 text-center text-sm text-ink-500">
                No insights surfaced — all candidates filtered out by priority gates. Try a wider P0–P3 filter or lower severity threshold.
              </div>
            )}
          </>
        )}
      </main>
    </div>
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
          <span className="text-ink-600 text-sm font-medium">Cross-run</span>
        </div>
      </div>
    </header>
  );
}
