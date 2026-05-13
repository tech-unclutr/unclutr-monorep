// POST /api/transcripts/aggregate
// Body: { transcript_ids: string[], onboarding_plan?: string, brand_context?: string, top_n?: number }
//
// Cross-transcript synthesis. Reuses each selected transcript's already-stored
// per-transcript pipeline result (extractor / contradiction / severity), so we
// pay zero extra LLM cost on those stages. Only the aggregator (free), debate,
// and action composer run for cross.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { aggregate } from "@/lib/aggregate";
import { debateOneInsight, runActionComposer, runClusterer } from "@/lib/agents";
import {
  getResult, getTranscriptText, putCrossRun,
} from "@/lib/gcs";
import type {
  ExtractorOutput, ContradictionOutput, SeverityOutput,
  AggregatedInsight, DebateResult, InsightFilters,
} from "@/lib/types";
import type { ServerPipelineResult } from "@/lib/pipeline-server";

export const runtime = "nodejs";
export const maxDuration = 60;

function applyFilters(insights: AggregatedInsight[], filters: InsightFilters): AggregatedInsight[] {
  const tagged = insights.map(ins => {
    const sev = ins.avg_severity ?? 5;
    const freq = ins.frequency_pct;
    let priority: "P0" | "P1" | "P2" | "P3" = "P3";
    if (sev >= 9 && freq >= 0.5) priority = "P0";
    else if (sev >= 7 && freq >= 0.4) priority = "P1";
    else if (sev >= 5) priority = "P2";
    return { ins, priority };
  });
  return tagged
    .filter(({ priority }) => filters.priorities.includes(priority))
    .map(({ ins }) => ins)
    .slice(0, filters.topN);
}

export async function POST(req: NextRequest) {
  let body: { transcript_ids?: string[]; onboarding_plan?: string; brand_context?: string; top_n?: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid JSON body" }, { status: 400 }); }

  const ids = body.transcript_ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "transcript_ids must be a non-empty array" }, { status: 400 });
  }
  if (ids.length > 25) {
    return NextResponse.json({ error: "max 25 transcripts per cross-run" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const started = Date.now();

  // 1. Pull each per-transcript result + raw transcript text (for evidence verification)
  const extractor: Record<string, ExtractorOutput> = {};
  const contradiction: Record<string, ContradictionOutput> = {};
  const severity: Record<string, SeverityOutput> = {};
  const transcriptsMap: Record<string, string> = {};
  const missing: string[] = [];

  await Promise.all(ids.map(async tid => {
    const res = await getResult<ServerPipelineResult>(tid);
    if (!res?.per_transcript) { missing.push(tid); return; }
    if (res.per_transcript.extractor[tid]) extractor[tid] = res.per_transcript.extractor[tid];
    if (res.per_transcript.contradiction[tid]) contradiction[tid] = res.per_transcript.contradiction[tid];
    if (res.per_transcript.severity[tid]) severity[tid] = res.per_transcript.severity[tid];
    try { transcriptsMap[tid] = await getTranscriptText(tid); }
    catch { /* transcript file missing — aggregator will skip its evidence verification */ }
  }));

  if (missing.length > 0) {
    return NextResponse.json({
      error: "some transcripts have no per-transcript result",
      missing,
      hint: "Wait for ingest to complete on those transcripts before adding them to a cross-run.",
    }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const ctx = { onboardingPlan: body.onboarding_plan, brandContext: body.brand_context };
  const usage = { input_tokens: 0, output_tokens: 0 };

  // 2. Semantic clusterer (LLM). Cheap (~$0.02), but the difference between
  //    "37 singletons" and "real cross-transcript themes" is the entire reason
  //    this endpoint exists. Fall back to Jaccard if it fails after retries.
  let clustersOverride: string[][] | undefined;
  if (ids.length >= 2) {
    try {
      const clusterResult = await runClusterer(client, extractor);
      if (clusterResult !== null) {
        usage.input_tokens += clusterResult.usage.input_tokens;
        usage.output_tokens += clusterResult.usage.output_tokens;
        clustersOverride = (clusterResult.data.clusters ?? [])
          .map(c => (c.theme_keys ?? []).filter(k => typeof k === "string"));
      }
    } catch (e) {
      console.warn("[cross-run] clusterer failed, falling back to Jaccard:", e instanceof Error ? e.message : String(e));
    }
  }

  // 3. Aggregate (deterministic; uses cluster override when present)
  const aggregated = aggregate(extractor, contradiction, severity, transcriptsMap, 0.45, clustersOverride);

  // 4. Filter
  const filters: InsightFilters = {
    topN: body.top_n ?? 5,
    priorities: ["P0", "P1", "P2"],
  };
  const filtered = applyFilters(aggregated.aggregated_insights, filters);
  const filteredIds = filtered.map(i => i.insight_id);

  // 5. Debate (LLM, ~$0.05/insight)
  const debateResults: DebateResult[] = [];
  const concurrency = 4;
  for (let i = 0; i < filtered.length; i += concurrency) {
    const batch = filtered.slice(i, i + concurrency);
    const settled = await Promise.all(batch.map(ins => debateOneInsight(client, ins, ctx)));
    for (const s of settled) {
      debateResults.push(s.result);
      usage.input_tokens += s.usage.input_tokens;
      usage.output_tokens += s.usage.output_tokens;
    }
  }

  // 6. Action composer
  const actionsOut = await runActionComposer(client, aggregated, ctx, filteredIds);
  usage.input_tokens += actionsOut.usage.input_tokens;
  usage.output_tokens += actionsOut.usage.output_tokens;

  // 7. Write
  const runId = `cross-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const payload = {
    pipeline_version: "v2-cross",
    run_id: runId,
    generated_at: new Date().toISOString(),
    elapsed_seconds: (Date.now() - started) / 1000,
    transcript_ids: ids,
    brand_context: body.brand_context,
    onboarding_plan: body.onboarding_plan,
    aggregated,
    filtered_insight_ids: filteredIds,
    debate: { results: debateResults },
    actions: actionsOut.data,
    usage,
  };
  await putCrossRun(runId, payload);

  return NextResponse.json({
    run_id: runId,
    insights: aggregated.aggregated_insights.length,
    surfaced: filteredIds.length,
    elapsed_seconds: payload.elapsed_seconds,
    usage,
  });
}
