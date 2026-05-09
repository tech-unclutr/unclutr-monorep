// Client-side pipeline orchestrator. Calls /api/synthesize per stage with
// progress callbacks. Three modes: live (browser key), playback (fixture), production (server key).

"use client";

import type {
  Mode, PipelineProgress, PipelineState, PipelineStage,
  ExtractorOutput, ContradictionOutput, SeverityOutput, AggregatedOutput, ActionsOutput,
  AggregatedInsight, DebateResult, DebateOutput, InsightFilters, RunVerification,
} from "./types";

export type RunOptions = {
  mode: Mode;
  apiKey?: string | null;
  brandContext?: string;
  onboardingPlan?: string;
  similarityThreshold?: number;
  filters?: InsightFilters;
  onProgress?: (state: PipelineState) => void;
};

export type Transcript = { id: string; text: string };

const initialVerification = (): RunVerification => ({
  totalSpans: 0, exact: 0, autoCorrected: 0, rejected: 0, perStage: {},
});

const initialState = (): PipelineState => ({
  progress: { stage: "idle" },
  extractor: {}, contradiction: {}, severity: {},
  aggregated: null,
  filteredInsightIds: [],
  debate: null,
  actions: null,
  verification: initialVerification(),
  error: null,
});

export async function runPipeline(transcripts: Transcript[], opts: RunOptions): Promise<PipelineState> {
  const state = initialState();
  state.progress.startedAt = Date.now();

  const emit = (stage: PipelineStage, message?: string) => {
    state.progress = { ...state.progress, stage, message };
    opts.onProgress?.({ ...state });
  };

  const setPerTranscript = (tid: string, agent: "extractor" | "contradiction" | "severity", status: "running" | "done" | "verified" | "error") => {
    const next = { ...(state.progress.perTranscript ?? {}) };
    next[tid] = { ...(next[tid] ?? {}), [agent]: status };
    state.progress.perTranscript = next;
    opts.onProgress?.({ ...state });
  };

  const recordVerification = (stage: string, report?: { total: number; passed: number; corrected: number; failures: { reason: string }[] }) => {
    if (!report) return;
    state.verification.totalSpans += report.total;
    state.verification.autoCorrected += report.corrected;
    state.verification.exact += (report.passed - report.corrected);
    state.verification.rejected += report.failures.length;
    state.verification.perStage[stage] = {
      total: (state.verification.perStage[stage]?.total ?? 0) + report.total,
      corrected: (state.verification.perStage[stage]?.corrected ?? 0) + report.corrected,
      rejected: (state.verification.perStage[stage]?.rejected ?? 0) + report.failures.length,
    };
  };

  if (opts.mode === "playback") {
    return runPlayback(state, opts);
  }

  try {
    const ctx = { onboarding_plan: opts.onboardingPlan, brand_context: opts.brandContext };

    // Stage 1 — extract per transcript
    emit("extracting", `Extracting themes from ${transcripts.length} transcript(s)`);
    for (const t of transcripts) {
      setPerTranscript(t.id, "extractor", "running");
      const { data, verifyReport } = await callApi<ExtractorOutput>("extract", {
        transcript_id: t.id, transcript: t.text, ...ctx,
      }, opts);
      state.extractor[t.id] = data;
      recordVerification("extractor", verifyReport);
      setPerTranscript(t.id, "extractor", "verified");
    }

    // Stage 2 — contradiction
    emit("contradicting", "Detecting contradictions");
    for (const t of transcripts) {
      setPerTranscript(t.id, "contradiction", "running");
      const { data, verifyReport } = await callApi<ContradictionOutput>("contradiction", {
        transcript_id: t.id, transcript: t.text, extractor: state.extractor[t.id], ...ctx,
      }, opts);
      state.contradiction[t.id] = data;
      recordVerification("contradiction", verifyReport);
      setPerTranscript(t.id, "contradiction", "verified");
    }

    // Stage 3 — severity
    emit("severing", "Calibrating severity scores");
    for (const t of transcripts) {
      setPerTranscript(t.id, "severity", "running");
      const { data, verifyReport } = await callApi<SeverityOutput>("severity", {
        transcript_id: t.id, transcript: t.text, extractor: state.extractor[t.id], ...ctx,
      }, opts);
      state.severity[t.id] = data;
      recordVerification("severity", verifyReport);
      setPerTranscript(t.id, "severity", "verified");
    }

    // Stage 4 — aggregate (deterministic)
    emit("aggregating", "Clustering across transcripts");
    const transcriptsMap: Record<string, string> = {};
    transcripts.forEach(t => { transcriptsMap[t.id] = t.text; });
    const { data: aggregated } = await callApi<AggregatedOutput>("aggregate", {
      transcripts: transcriptsMap,
      extractors: state.extractor,
      contradictions: state.contradiction,
      severities: state.severity,
      similarity_threshold: opts.similarityThreshold ?? 0.45,
    }, opts);
    state.aggregated = aggregated;

    // Stage 4.5 — apply filters
    emit("filtering", "Applying priority + count filters");
    const filtered = applyFilters(aggregated.aggregated_insights, opts.filters);
    state.filteredInsightIds = filtered.map(i => i.insight_id);

    // Stage 5 — debate (3 framers + judge per filtered insight, parallel)
    emit("debating", `Running 3-agent debate on ${filtered.length} insight${filtered.length === 1 ? "" : "s"}`);
    const debateResults: DebateResult[] = [];
    // Run debates with limited concurrency (4 at a time) so we don't blow up rate limits
    const concurrency = 4;
    for (let i = 0; i < filtered.length; i += concurrency) {
      const batch = filtered.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(insight => callApi<DebateResult>("debate", { insight, ...ctx }, opts))
      );
      debateResults.push(...batchResults.map(r => r.data));
    }
    state.debate = { results: debateResults };

    // Stage 6 — action composer (only for filtered insights)
    emit("actioning", "Composing routed actions");
    const { data: actions } = await callApi<ActionsOutput>("action", {
      aggregated, filtered_insight_ids: state.filteredInsightIds, ...ctx,
    }, opts);
    state.actions = actions;

    state.progress.completedAt = Date.now();
    emit("complete", "Synthesis complete");
    return { ...state };
  } catch (e) {
    state.error = e instanceof Error ? e.message : String(e);
    emit("error", state.error);
    return { ...state };
  }
}

function applyFilters(insights: AggregatedInsight[], filters?: InsightFilters): AggregatedInsight[] {
  if (!filters) return insights.slice(0, 5);
  // Note: priorities are assigned by Action Composer downstream; for filtering,
  // we use impact-derived priority approximation: avg_severity-based.
  const insightWithApproxPriority = insights.map(ins => {
    const sev = ins.avg_severity ?? 5;
    const freq = ins.frequency_pct;
    let priority: "P0" | "P1" | "P2" | "P3" = "P3";
    if (sev >= 9 && freq >= 0.5) priority = "P0";
    else if (sev >= 7 && freq >= 0.4) priority = "P1";
    else if (sev >= 5) priority = "P2";
    return { insight: ins, priority };
  });
  const filtered = insightWithApproxPriority
    .filter(({ priority }) => filters.priorities.includes(priority))
    .map(({ insight }) => insight);
  return filtered.slice(0, filters.topN);
}

async function callApi<T>(stage: string, payload: Record<string, unknown>, opts: RunOptions): Promise<{ data: T; usage?: unknown; verifyReport?: { total: number; passed: number; corrected: number; failures: { reason: string }[] } }> {
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-Mode": opts.mode };
  if (opts.mode === "live" && opts.apiKey) headers["X-Anthropic-Api-Key"] = opts.apiKey;
  const res = await fetch("/api/synthesize", {
    method: "POST",
    headers,
    body: JSON.stringify({ stage, ...payload }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(`Stage "${stage}" failed: ${errBody.error ?? res.statusText}`);
  }
  return res.json();
}

/** Regenerate one insight using user feedback. Used by InsightCard's regenerate button. */
export async function regenerateInsight(
  insight: AggregatedInsight,
  feedbackNote: string,
  opts: RunOptions,
): Promise<DebateResult> {
  const ctx = { onboarding_plan: opts.onboardingPlan, brand_context: opts.brandContext };
  const { data } = await callApi<DebateResult>("regenerate", {
    insight, feedback_note: feedbackNote, ...ctx,
  }, opts);
  return data;
}

// ---- Playback mode (uses static fixtures) ----

async function runPlayback(state: PipelineState, opts: RunOptions): Promise<PipelineState> {
  const emit = (stage: PipelineStage, message?: string) => {
    state.progress = { ...state.progress, stage, message };
    opts.onProgress?.({ ...state });
  };
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  emit("extracting", "Extracting themes from 1 transcript (playback)");
  state.progress.perTranscript = { T1: { extractor: "running" } };
  opts.onProgress?.({ ...state });
  await sleep(1200);
  state.extractor = { T1: await fetchFixture<ExtractorOutput>("extractor.json") };
  // Synthesize verification stats for the fixture (16/17 corrected based on validation run)
  state.verification.totalSpans += 17;
  state.verification.autoCorrected += 16;
  state.verification.exact += 0;
  state.verification.rejected += 1;
  state.verification.perStage["extractor"] = { total: 17, corrected: 16, rejected: 1 };
  state.progress.perTranscript = { T1: { extractor: "verified" } };
  opts.onProgress?.({ ...state });
  await sleep(300);

  emit("contradicting", "Detecting contradictions");
  state.progress.perTranscript = { T1: { extractor: "verified", contradiction: "running" } };
  opts.onProgress?.({ ...state });
  await sleep(900);
  state.contradiction = { T1: await fetchFixture<ContradictionOutput>("contradiction.json") };
  state.verification.totalSpans += 6;
  state.verification.autoCorrected += 6;
  state.verification.perStage["contradiction"] = { total: 6, corrected: 6, rejected: 0 };
  state.progress.perTranscript = { T1: { extractor: "verified", contradiction: "verified" } };
  opts.onProgress?.({ ...state });
  await sleep(300);

  emit("severing", "Calibrating severity scores");
  state.progress.perTranscript = { T1: { extractor: "verified", contradiction: "verified", severity: "running" } };
  opts.onProgress?.({ ...state });
  await sleep(1100);
  state.severity = { T1: await fetchFixture<SeverityOutput>("severity.json") };
  state.verification.totalSpans += 10;
  state.verification.autoCorrected += 10;
  state.verification.perStage["severity"] = { total: 10, corrected: 10, rejected: 0 };
  state.progress.perTranscript = { T1: { extractor: "verified", contradiction: "verified", severity: "verified" } };
  opts.onProgress?.({ ...state });
  await sleep(300);

  emit("aggregating", "Clustering across transcripts");
  await sleep(500);
  state.aggregated = await fetchFixture<AggregatedOutput>("aggregated.json");

  // Apply filters
  emit("filtering", "Applying priority + count filters");
  const filtered = applyFilters(state.aggregated.aggregated_insights, opts.filters);
  state.filteredInsightIds = filtered.map(i => i.insight_id);
  await sleep(300);

  // Debate stage — try to load real debate fixture, fall back to mock
  emit("debating", `Running 3-agent debate on ${filtered.length} insight${filtered.length === 1 ? "" : "s"}`);
  await sleep(1400);
  const debateMocks = filtered.map(ins => buildMockDebate(ins));
  state.debate = { results: debateMocks };

  emit("actioning", "Composing routed actions");
  await sleep(700);
  state.actions = await fetchFixture<ActionsOutput>("actions.json");

  state.progress.completedAt = Date.now();
  emit("complete", "Synthesis complete (playback)");
  return { ...state };
}

async function fetchFixture<T>(name: string): Promise<T> {
  const res = await fetch(`/fixtures/${name}`);
  if (!res.ok) throw new Error(`Failed to load fixture ${name}: ${res.statusText}`);
  return res.json();
}

function buildMockDebate(insight: AggregatedInsight): DebateResult {
  // Deterministic-feeling mock for playback. Real debate runs in live/production.
  const sev = insight.avg_severity ?? 5;
  const freq = (insight.frequency_pct * 100).toFixed(0);
  return {
    insight_id: insight.insight_id,
    proposals: [
      {
        agent: "conservative",
        theme_name: insight.theme_name,
        executive_summary: `${freq}% of interviews surfaced this; severity averages ${sev.toFixed(1)}/10 across ${insight.transcripts_mentioning.length} customer${insight.transcripts_mentioning.length === 1 ? "" : "s"}. Evidence cluster is consistent.`,
        recommended_action_framing: "Action should be narrowly scoped against the strongest verbatim evidence; resist over-extrapolating to new SKUs without further data.",
        evidence_emphasis: `${insight.evidence_pool.length} verbatim quotes verified across the cluster — direct customer language is the strongest grounding.`,
      },
      {
        agent: "aggressive",
        theme_name: insight.theme_name,
        executive_summary: `Blocking signal — ${freq}% of customers flag this; competitor displacement implied. Move now or cede segment.`,
        recommended_action_framing: "Initiate the response within 30 days; tie ownership to a single team and tight deadline; reframe as competitive opportunity.",
        evidence_emphasis: insight.contradictions_referenced.length > 0
          ? "Hidden contradiction reveals stated-vs-revealed gap — the most decision-revealing signal in this insight."
          : "Concentration of mentions itself is the signal: this is what customers raise unprompted.",
      },
      {
        agent: "balanced",
        theme_name: insight.theme_name,
        executive_summary: `Severity ${sev.toFixed(1)}/10 across ${freq}% of customers, with concrete verbatim support. Strategic implication is clear; sequencing matters more than urgency.`,
        recommended_action_framing: "Pair the immediate fix with a related strategic move that builds on the same insight, so a single quarter's effort delivers compounding value.",
        evidence_emphasis: "Combine the strongest customer quote with the cross-transcript frequency stat — that's what makes this brief-able to leadership.",
      },
    ],
    scores: {
      conservative: { evidence: 22, actionability: 14, impact: 13, specificity: 18, total: 67 },
      aggressive:   { evidence: 14, actionability: 21, impact: 22, specificity: 16, total: 73 },
      balanced:     { evidence: 19, actionability: 20, impact: 19, specificity: 20, total: 78 },
    },
    winner: "balanced",
    judge_reasoning: "Balanced framing wins by combining the conservative's evidence discipline with the aggressive's stakes-framing — actionable without overreaching the data.",
  };
}
