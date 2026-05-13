"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { TranscriptListItem } from "@/lib/gcs";

const STATUS_STYLE: Record<TranscriptListItem["status"], { dot: string; pill: string; label: string }> = {
  pending: { dot: "bg-signal-amber animate-pulse", pill: "bg-signal-amber/10 text-signal-amber",
              label: "Processing" },
  done:    { dot: "bg-signal-green",                pill: "bg-signal-green/10 text-signal-green",
              label: "Done" },
  failed:  { dot: "bg-signal-red",                  pill: "bg-signal-red/10 text-signal-red",
              label: "Failed" },
};

export default function TranscriptsPage() {
  const router = useRouter();
  const [items, setItems] = useState<TranscriptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [crossing, setCrossing] = useState(false);
  const [crossErr, setCrossErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/transcripts", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 5s while pending items exist
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = items.reduce(
    (acc, i) => { acc[i.status] += 1; return acc; },
    { pending: 0, done: 0, failed: 0 } as Record<TranscriptListItem["status"], number>
  );

  const doneIds = useMemo(() => items.filter(i => i.status === "done").map(i => i.transcript_id), [items]);
  const allDoneSelected = doneIds.length > 0 && doneIds.every(id => selected.has(id));

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAllDone = () => {
    if (allDoneSelected) setSelected(new Set());
    else setSelected(new Set(doneIds));
  };

  const runCrossTranscript = async () => {
    if (selected.size === 0) return;
    setCrossing(true);
    setCrossErr(null);
    try {
      const res = await fetch("/api/transcripts/aggregate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      router.push(`/transcripts/cross/${encodeURIComponent(data.run_id)}`);
    } catch (e) {
      setCrossErr(e instanceof Error ? e.message : String(e));
      setCrossing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <section className="mb-8 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 pill bg-accent-50 text-accent-700 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
              Production view · GCS-backed
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-ink-950 leading-tight">
              Transcripts
            </h1>
            <p className="text-ink-600 mt-2">
              Files uploaded to{" "}
              <code className="text-xs bg-ink-100 px-1.5 py-0.5 rounded">gs://{process.env.NEXT_PUBLIC_BUCKET_LABEL || "your-bucket"}/inbox/</code>{" "}
              auto-trigger the pipeline. Insights land here once processed.
            </p>
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            className="btn-secondary text-sm"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Total" value={items.length} />
          <Stat label="Done" value={counts.done} accent={false} />
          <Stat label="Processing" value={counts.pending} accent={counts.pending > 0} />
          <Stat label="Failed" value={counts.failed} accent={counts.failed > 0} red={counts.failed > 0} />
        </section>

        {err && (
          <div className="card p-5 mb-6 border-signal-red/30 bg-signal-red/5">
            <div className="text-sm text-signal-red font-semibold mb-1">Couldn&apos;t load transcripts</div>
            <div className="text-xs text-ink-600">{err}</div>
            <div className="text-xs text-ink-500 mt-2">
              Check that <code>GCP_SERVICE_ACCOUNT_KEY</code>, <code>GCS_TRANSCRIPTS_BUCKET</code> and{" "}
              <code>GCP_PROJECT_ID</code> are set in Vercel env vars.
            </div>
          </div>
        )}

        {loading && items.length === 0 && (
          <div className="card p-8 text-center text-ink-500 text-sm">Loading transcripts from GCS…</div>
        )}

        {!loading && items.length === 0 && !err && (
          <div className="card p-10 text-center">
            <div className="text-ink-700 font-medium mb-2">No transcripts yet</div>
            <p className="text-sm text-ink-500 mb-4">
              Upload a <code>.txt</code> file to <code>inbox/</code> in your GCS bucket.
            </p>
            <pre className="text-xs text-ink-700 bg-ink-100 px-3 py-2 rounded inline-block text-left">
{`gcloud storage cp ./T1.txt gs://${process.env.NEXT_PUBLIC_BUCKET_LABEL || "<bucket>"}/inbox/T1.txt`}
            </pre>
          </div>
        )}

        {/* Cross-run controls (visible when ≥2 transcripts done) */}
        {doneIds.length >= 2 && (
          <section className="card p-4 mb-4 flex items-center justify-between flex-wrap gap-3 bg-purple-50/40 border-purple-100">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={toggleSelectAllDone}
                className="text-xs text-ink-700 underline hover:text-ink-900"
              >
                {allDoneSelected ? "Deselect all done" : `Select all done (${doneIds.length})`}
              </button>
              <span className="text-sm text-ink-700">
                {selected.size} selected · reuses cached per-transcript outputs + LLM clustering (~$0.30–0.40 per run)
              </span>
            </div>
            <button
              onClick={runCrossTranscript}
              disabled={selected.size < 1 || crossing}
              className="btn-primary text-sm"
              title={selected.size < 1 ? "Select 1+ done transcripts to run" : ""}
            >
              {crossing ? "Running cross-transcript synthesis…" : `Run cross-transcript (${selected.size})`}
            </button>
          </section>
        )}
        {crossErr && (
          <div className="card p-3 mb-4 border-signal-red/30 bg-signal-red/5 text-sm text-signal-red">
            {crossErr}
          </div>
        )}

        {/* List */}
        {items.length > 0 && (
          <section className="space-y-2">
            {items.map(item => {
              const isSelectable = item.status === "done";
              const isSelected = selected.has(item.transcript_id);
              return (
                <div
                  key={item.transcript_id}
                  className={
                    "card card-hover p-4 flex items-center gap-4 " +
                    (isSelected ? "border-accent-500 bg-accent-50/30" : "")
                  }
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!isSelectable}
                    onChange={() => toggleSelect(item.transcript_id)}
                    className="w-4 h-4 rounded border-ink-300 text-accent-500 focus:ring-accent-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                    title={isSelectable ? "Include in cross-transcript run" : "Only completed transcripts can be selected"}
                  />
                  <Link
                    href={`/transcripts/${encodeURIComponent(item.transcript_id)}`}
                    className="flex items-center justify-between gap-4 flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_STYLE[item.status].dot}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink-900 truncate">{item.transcript_id}</div>
                        <div className="text-xs text-ink-500 mt-0.5 truncate">
                          {item.object_name} · {(item.size_bytes / 1024).toFixed(1)} KB · uploaded {timeAgo(item.uploaded_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`pill ${STATUS_STYLE[item.status].pill}`}>{STATUS_STYLE[item.status].label}</span>
                      <span className="text-ink-300">→</span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </section>
        )}
      </main>
      <Footer />
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
          <span className="text-ink-600 text-sm font-medium">Transcripts</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-ink-600 hover:text-ink-900">Synthesis (live)</Link>
          <Link href="/transcripts" className="text-ink-900 font-medium">Transcripts</Link>
          <Link href="/transcripts/cross" className="text-ink-600 hover:text-ink-900">Cross-runs</Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-100 mt-16 py-8">
      <div className="max-w-6xl mx-auto px-6 text-xs text-ink-500 flex items-center justify-between flex-wrap gap-3">
        <div>SquareUp Synthesis · v2 · GCS-backed ingest</div>
        <div className="flex items-center gap-4">
          <span>Anti-hallucination active</span>
          <span className="w-1 h-1 rounded-full bg-ink-300" />
          <span>Span-grounded</span>
          <span className="w-1 h-1 rounded-full bg-ink-300" />
          <span>Federated-ready</span>
        </div>
      </div>
    </footer>
  );
}

function Stat({ label, value, accent = false, red = false }: { label: string; value: number; accent?: boolean; red?: boolean }) {
  const color = red ? "text-signal-red" : accent ? "text-accent-500" : "text-ink-900";
  return (
    <div className="card p-4">
      <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function timeAgo(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
