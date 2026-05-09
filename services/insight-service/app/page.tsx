"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ModeSelector } from "@/components/ModeSelector";
import { ApiKeyDialog, getStoredApiKey, setStoredApiKey } from "@/components/ApiKeyDialog";
import { TranscriptInput, type Transcript } from "@/components/TranscriptInput";
import { OnboardingInput } from "@/components/OnboardingInput";
import { InsightControls } from "@/components/InsightControls";
import { TrustPanel } from "@/components/TrustPanel";
import { PipelineView } from "@/components/PipelineView";
import { InsightCard } from "@/components/InsightCard";
import { runPipeline, regenerateInsight } from "@/lib/pipeline";
import { exportFeedbackJsonl } from "@/components/FeedbackWidget";
import type { Mode, PipelineState, Action, InsightFilters, DebateResult } from "@/lib/types";

const initialState = (): PipelineState => ({
  progress: { stage: "idle" },
  extractor: {}, contradiction: {}, severity: {},
  aggregated: null, filteredInsightIds: [], debate: null, actions: null,
  verification: { totalSpans: 0, exact: 0, autoCorrected: 0, rejected: 0, perStage: {} },
  error: null,
});

const DEFAULT_FILTERS: InsightFilters = { topN: 5, priorities: ["P0", "P1", "P2"] };

export default function Home() {
  const [mode, setMode] = useState<Mode>("playback");
  const [apiKey, setApiKey] = useState("");
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [brandContext, setBrandContext] = useState("Wildstone (men's grooming, India, mid-market)");
  const [onboardingPlan, setOnboardingPlan] = useState("");
  const [filters, setFilters] = useState<InsightFilters>(DEFAULT_FILTERS);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [state, setState] = useState<PipelineState>(initialState());
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());

  useEffect(() => {
    setApiKey(getStoredApiKey());
    fetch("/api/health").then(r => r.json()).then(d => setHasServerKey(!!d.hasServerKey)).catch(() => {});
  }, []);

  const onRun = useCallback(async () => {
    if (mode === "live" && !apiKey) {
      setKeyDialogOpen(true);
      return;
    }
    setState(initialState());
    const finalState = await runPipeline(transcripts, {
      mode, apiKey, brandContext, onboardingPlan, filters,
      onProgress: (s) => setState({ ...s }),
    });
    setState(finalState);
  }, [mode, apiKey, transcripts, brandContext, onboardingPlan, filters]);

  const onRegenerate = useCallback(async (insightId: string, note: string) => {
    if (!state.aggregated) return;
    const insight = state.aggregated.aggregated_insights.find(i => i.insight_id === insightId);
    if (!insight) return;

    setRegenerating(prev => new Set(prev).add(insightId));
    try {
      const newDebate: DebateResult = await regenerateInsight(insight, note, {
        mode, apiKey, brandContext, onboardingPlan,
      });
      // Replace the debate result for this insight
      setState(prev => ({
        ...prev,
        debate: prev.debate
          ? {
            results: prev.debate.results.map(d => d.insight_id === insightId ? newDebate : d),
          }
          : { results: [newDebate] },
      }));
    } catch (e) {
      console.error("regenerate failed", e);
      alert(`Regenerate failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRegenerating(prev => {
        const next = new Set(prev);
        next.delete(insightId);
        return next;
      });
    }
  }, [state.aggregated, mode, apiKey, brandContext, onboardingPlan]);

  const isRunning = state.progress.stage !== "idle"
    && state.progress.stage !== "complete"
    && state.progress.stage !== "error";

  const allInsights = state.aggregated?.aggregated_insights ?? [];
  const surfacedInsights = useMemo(() => {
    if (state.filteredInsightIds.length === 0) return [];
    const order = state.filteredInsightIds;
    return order
      .map(id => allInsights.find(i => i.insight_id === id))
      .filter((i): i is NonNullable<typeof i> => !!i);
  }, [allInsights, state.filteredInsightIds]);

  const actions = state.actions?.actions ?? [];
  const actionsByInsight = useMemo(() => {
    const m = new Map<string, Action>();
    for (const a of actions) {
      for (const sid of a.supporting_insights) {
        if (!m.has(sid)) m.set(sid, a);
      }
    }
    return m;
  }, [actions]);
  const debateByInsight = useMemo(() => {
    const m = new Map<string, DebateResult>();
    for (const d of state.debate?.results ?? []) m.set(d.insight_id, d);
    return m;
  }, [state.debate]);

  const elapsed = state.progress.completedAt && state.progress.startedAt
    ? ((state.progress.completedAt - state.progress.startedAt) / 1000).toFixed(1)
    : null;

  const exportFeedback = () => {
    const jsonl = exportFeedbackJsonl();
    if (!jsonl) {
      alert("No feedback yet. Rate insights first.");
      return;
    }
    const blob = new Blob([jsonl], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `squareup-feedback-${new Date().toISOString().slice(0, 10)}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Header onConfigureKey={() => setKeyDialogOpen(true)} mode={mode} hasKey={!!apiKey} />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <section className="mb-10">
          <div className="inline-flex items-center gap-2 pill bg-accent-50 text-accent-700 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
            v2 · debate-refined · onboarding-aware · feedback-trained
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-ink-950 leading-tight tracking-tight">
            Voice transcripts in.<br />
            <span className="text-accent-500">Decisions out.</span>
          </h1>
          <p className="text-lg text-ink-600 mt-4 max-w-2xl">
            Six specialised agents extract themes, score severity, detect contradictions —
            then 3 framers debate the top insights and a judge picks the winner.
            Every quote traces back to its source. No hallucinations reach the report.
          </p>
        </section>

        {/* Controls grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="card p-5 lg:col-span-1">
            <ModeSelector mode={mode} onChange={setMode} hasServerKey={hasServerKey} />
            {mode === "live" && (
              <button
                onClick={() => setKeyDialogOpen(true)}
                className="mt-3 text-sm text-accent-500 hover:text-accent-600 font-medium"
              >
                {apiKey ? "✓ Key set (replace)" : "Set API key →"}
              </button>
            )}
            {mode === "live" && apiKey && (
              <p className="text-xs text-ink-400 mt-2">Stored in this browser only — won&apos;t need to re-enter.</p>
            )}
          </div>

          <div className="card p-5 lg:col-span-2">
            <label className="text-xs font-medium text-ink-500 uppercase tracking-wider">Brand context</label>
            <input
              value={brandContext}
              onChange={e => setBrandContext(e.target.value)}
              disabled={isRunning}
              className="w-full mt-2 px-3 py-2 text-sm border border-ink-200 rounded-lg
                         focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
              placeholder="e.g., Wildstone, men's grooming, India"
            />
            <p className="text-xs text-ink-500 mt-2">
              Used by Action Composer for sharper team routing.
            </p>
          </div>
        </section>

        {/* Onboarding plan + Filters */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="lg:col-span-2">
            <OnboardingInput value={onboardingPlan} onChange={setOnboardingPlan} disabled={isRunning} />
          </div>
          <div className="lg:col-span-1">
            <InsightControls filters={filters} onChange={setFilters} disabled={isRunning} />
          </div>
        </section>

        {/* Transcripts */}
        <section className="mb-6">
          <TranscriptInput transcripts={transcripts} onChange={setTranscripts} disabled={isRunning} mode={mode} />
        </section>

        {/* Run button */}
        <section className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="text-sm text-ink-500">
            {transcripts.length === 0 && mode !== "playback" && "Add at least one transcript to run"}
            {transcripts.length > 0 && `${transcripts.length} transcript${transcripts.length === 1 ? "" : "s"} ready · ${filters.topN} insight${filters.topN === 1 ? "" : "s"} max · ${filters.priorities.join("/")}`}
          </div>
          <button
            onClick={onRun}
            disabled={isRunning || (mode !== "playback" && transcripts.length === 0) || filters.priorities.length === 0}
            className="btn-primary text-base px-6 py-3"
          >
            {isRunning ? "Running…" : "Run synthesis"}
          </button>
        </section>

        {/* Pipeline view + Trust panel */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <div className="lg:col-span-2">
            <PipelineView state={state} />
          </div>
          <div className="lg:col-span-1">
            <TrustPanel verification={state.verification} hasUserKey={!!apiKey} currentMode={mode} />
          </div>
        </section>

        {/* Stats */}
        {(state.progress.stage === "complete" || surfacedInsights.length > 0) && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Stat label="Surfaced" value={surfacedInsights.length} />
            <Stat label="Total mined" value={allInsights.length} />
            <Stat label="Hallucinations rejected" value={state.verification.rejected} accent={state.verification.rejected > 0} />
            <Stat label="Elapsed" value={elapsed ? `${elapsed}s` : "—"} />
          </section>
        )}

        {/* Insights */}
        {surfacedInsights.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-ink-900">Insights</h2>
                <p className="text-sm text-ink-500 mt-0.5">
                  Top {surfacedInsights.length} of {allInsights.length} mined · debate-refined · ranked by impact
                </p>
              </div>
              <button onClick={exportFeedback} className="btn-secondary text-sm">
                Export feedback (.jsonl)
              </button>
            </div>
            <div className="space-y-4">
              {surfacedInsights.map((insight, i) => (
                <InsightCard
                  key={insight.insight_id}
                  rank={i + 1}
                  insight={insight}
                  action={actionsByInsight.get(insight.insight_id)}
                  debate={debateByInsight.get(insight.insight_id)}
                  onRegenerate={mode === "playback" ? undefined : onRegenerate}
                  regenerating={regenerating.has(insight.insight_id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Insights below the cut */}
        {allInsights.length > surfacedInsights.length && state.progress.stage === "complete" && (
          <section className="mt-8 card p-5">
            <details>
              <summary className="text-sm font-medium text-ink-700 cursor-pointer">
                {allInsights.length - surfacedInsights.length} additional insight{allInsights.length - surfacedInsights.length === 1 ? "" : "s"} mined but filtered out by your settings
              </summary>
              <ul className="mt-3 space-y-1 text-sm text-ink-600">
                {allInsights
                  .filter(i => !state.filteredInsightIds.includes(i.insight_id))
                  .map(i => (
                    <li key={i.insight_id} className="flex items-baseline gap-2">
                      <code className="text-xs font-mono text-ink-400">{i.insight_id}</code>
                      <span className="text-sm text-ink-700">{i.theme_name}</span>
                      <span className="text-xs text-ink-400 ml-auto">sev {i.avg_severity?.toFixed(1) ?? "—"}</span>
                    </li>
                  ))
                }
              </ul>
            </details>
          </section>
        )}
      </main>

      <Footer />

      <ApiKeyDialog
        open={keyDialogOpen}
        onClose={() => setKeyDialogOpen(false)}
        currentKey={apiKey}
        onSave={(k) => { setApiKey(k); setStoredApiKey(k); }}
      />
    </div>
  );
}

function Header({ onConfigureKey, mode, hasKey }: { onConfigureKey: () => void; mode: Mode; hasKey: boolean }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-accent-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zM3 9h4v4H3V9zm6 0h4v4H9V9z" />
            </svg>
          </div>
          <span className="font-bold text-ink-900">SquareUp</span>
          <span className="text-ink-300">/</span>
          <span className="text-ink-600 text-sm font-medium">Synthesis v2</span>
        </div>
        <div className="flex items-center gap-3">
          {mode === "live" && (
            <button onClick={onConfigureKey} className="text-sm text-ink-600 hover:text-ink-900">
              {hasKey ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-signal-green" />
                  Key set
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-signal-amber" />
                  Set key
                </span>
              )}
            </button>
          )}
          <a href="/transcripts" className="btn-secondary text-sm">Transcripts →</a>
          <a href="https://joinsquareup.com/pilot" className="btn-secondary text-sm" target="_blank" rel="noreferrer">
            joinsquareup.com →
          </a>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-ink-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-accent-500" : "text-ink-900"}`}>{value}</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-100 mt-16 py-8">
      <div className="max-w-6xl mx-auto px-6 text-xs text-ink-500 flex items-center justify-between flex-wrap gap-3">
        <div>SquareUp Synthesis · v2 · 6-agent pipeline + 3-agent debate</div>
        <div className="flex items-center gap-4">
          <span>Anti-hallucination active</span>
          <span className="w-1 h-1 rounded-full bg-ink-300" />
          <span>Span-grounded</span>
          <span className="w-1 h-1 rounded-full bg-ink-300" />
          <span>Onboarding-aware</span>
          <span className="w-1 h-1 rounded-full bg-ink-300" />
          <span>Federated-ready</span>
        </div>
      </div>
    </footer>
  );
}
