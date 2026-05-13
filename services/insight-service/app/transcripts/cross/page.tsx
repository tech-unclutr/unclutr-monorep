"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrossRunListItem } from "@/lib/gcs";

export default function CrossRunsIndexPage() {
  const [items, setItems] = useState<CrossRunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/transcripts/cross", { cache: "no-store" });
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

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <section className="mb-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-2 pill bg-purple-50 text-purple-700 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Cross-transcript synthesis
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-ink-950 leading-tight">
              Cross-runs
            </h1>
            <p className="text-ink-600 mt-2">
              Each run synthesises insights across multiple completed transcripts. New runs are
              triggered from the{" "}
              <Link href="/transcripts" className="text-accent-700 hover:underline">
                transcripts page
              </Link>.
            </p>
          </div>
          <button onClick={load} disabled={refreshing} className="btn-secondary text-sm">
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </section>

        {err && (
          <div className="card p-5 mb-6 border-signal-red/30 bg-signal-red/5">
            <div className="text-sm text-signal-red font-semibold mb-1">Couldn&apos;t load cross-runs</div>
            <div className="text-xs text-ink-600">{err}</div>
          </div>
        )}

        {loading && items.length === 0 && (
          <div className="card p-8 text-center text-ink-500 text-sm">Loading cross-runs from GCS…</div>
        )}

        {!loading && items.length === 0 && !err && (
          <div className="card p-10 text-center">
            <div className="text-ink-700 font-medium mb-2">No cross-runs yet</div>
            <p className="text-sm text-ink-500">
              Select 2+ completed transcripts on the{" "}
              <Link href="/transcripts" className="text-accent-700 hover:underline">transcripts page</Link>{" "}
              and click &quot;Run cross-transcript&quot;.
            </p>
          </div>
        )}

        {items.length > 0 && (
          <section className="space-y-2">
            {items.map(item => (
              <Link
                key={item.run_id}
                href={`/transcripts/cross/${encodeURIComponent(item.run_id)}`}
                className="card card-hover p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink-900 truncate">{item.run_id}</div>
                  <div className="text-xs text-ink-500 mt-0.5 truncate">
                    {item.transcript_ids.length > 0 ? item.transcript_ids.join(" + ") : "—"}
                    {" · "}
                    generated {timeAgo(item.generated_at)}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="pill bg-ink-100 text-ink-600">{item.insight_count} mined</span>
                  <span className="pill bg-accent-50 text-accent-700">{item.surfaced_count} surfaced</span>
                  <span className="text-ink-300">→</span>
                </div>
              </Link>
            ))}
          </section>
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
                <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zM3 9h4v4H9V9z" />
              </svg>
            </div>
            <span className="font-bold text-ink-900">SquareUp</span>
          </Link>
          <span className="text-ink-300">/</span>
          <Link href="/transcripts" className="text-ink-600 text-sm font-medium hover:text-ink-900">Transcripts</Link>
          <span className="text-ink-300">/</span>
          <span className="text-ink-900 text-sm font-medium">Cross-runs</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-ink-600 hover:text-ink-900">Synthesis (live)</Link>
          <Link href="/transcripts" className="text-ink-600 hover:text-ink-900">Transcripts</Link>
          <Link href="/transcripts/cross" className="text-ink-900 font-medium">Cross-runs</Link>
        </nav>
      </div>
    </header>
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
