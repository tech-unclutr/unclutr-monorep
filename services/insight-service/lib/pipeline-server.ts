// Server-side pipeline. Same shape as lib/pipeline.ts but calls agents directly
// (no fetch). Used by the GCS ingest endpoint where we don't have a browser to
// drive per-stage requests.

import Anthropic from "@anthropic-ai/sdk";
import {
  runExtractor, runContradiction, runSeverity, runActionComposer,
  debateOneInsight,
} from "./agents";
import { verifyAndCorrect } from "./verify";
import { aggregate } from "./aggregate";
import type {
  ExtractorOutput, ContradictionOutput, SeverityOutput,
  AggregatedOutput, ActionsOutput, DebateResult, RunVerification,
  AggregatedInsight, InsightFilters,
} from "./types";

export type ServerPipelineInput = {
  transcripts: { id: string; text: string }[];
  apiKey: string;
  brandContext?: string;
  onboardingPlan?: string;
  filters?: InsightFilters;
  similarityThreshold?: number;
};

export type ServerPipelineResult = {
  pipeline_version: "v2";
  generated_at: string;
  elapsed_seconds: number;
  brand_context?: string;
  onboarding_plan?: string;
  transcripts: { id: string; size: number }[];
  per_transcript: {
    extractor: Record<string, ExtractorOutput>;
    contradiction: Record<string, ContradictionOutput>;
    severity: Record<string, SeverityOutput>;
  };
  aggregated: AggregatedOutput;
  filtered_insight_ids: string[];
  debate: { results: DebateResult[] };
  actions: ActionsOutput;
  verification: RunVerification;
  usage: { input_tokens: number; output_tokens: number };
};

const DEFAULT_FILTERS: InsightFilters = { topN: 5, priorities: ["P0", "P1", "P2"] };

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

export async function runServerPipeline(input: ServerPipelineInput): Promise<ServerPipelineResult> {
  const started = Date.now();
  const client = new Anthropic({ apiKey: input.apiKey });
  const ctx = { onboardingPlan: input.onboardingPlan, brandContext: input.brandContext };
  const filters = input.filters ?? DEFAULT_FILTERS;

  const verification: RunVerification = {
    totalSpans: 0, exact: 0, autoCorrected: 0, rejected: 0, perStage: {},
  };
  const usage = { input_tokens: 0, output_tokens: 0 };

  const recordVerify = (stage: string, report: ReturnType<typeof verifyAndCorrect>) => {
    verification.totalSpans += report.total;
    verification.autoCorrected += report.corrected;
    verification.exact += (report.passed - report.corrected);
    verification.rejected += report.failures.length;
    const cur = verification.perStage[stage] ?? { total: 0, corrected: 0, rejected: 0 };
    verification.perStage[stage] = {
      total: cur.total + report.total,
      corrected: cur.corrected + report.corrected,
      rejected: cur.rejected + report.failures.length,
    };
  };

  const extractor: Record<string, ExtractorOutput> = {};
  const contradiction: Record<string, ContradictionOutput> = {};
  const severity: Record<string, SeverityOutput> = {};

  // Per-transcript pipeline. Optimised for Vercel's 60s function timeout:
  //   1. Extract first (everything depends on it)
  //   2. Then contradiction + severity in PARALLEL (they don't depend on each other)
  // Saves ~10s per transcript vs. sequential.
  for (const t of input.transcripts) {
    const eOut = await runExtractor(client, t.id, t.text, ctx);
    usage.input_tokens += eOut.usage.input_tokens;
    usage.output_tokens += eOut.usage.output_tokens;
    recordVerify("extractor", verifyAndCorrect(t.text, eOut.data, "extractor"));
    extractor[t.id] = eOut.data;

    const [cOut, sOut] = await Promise.all([
      runContradiction(client, t.id, t.text, eOut.data, ctx),
      runSeverity(client, t.id, t.text, eOut.data, ctx),
    ]);
    usage.input_tokens += cOut.usage.input_tokens + sOut.usage.input_tokens;
    usage.output_tokens += cOut.usage.output_tokens + sOut.usage.output_tokens;
    recordVerify("contradiction", verifyAndCorrect(t.text, cOut.data, "contradiction"));
    recordVerify("severity", verifyAndCorrect(t.text, sOut.data, "severity"));
    contradiction[t.id] = cOut.data;
    severity[t.id] = sOut.data;
  }

  // Aggregate (deterministic)
  const transcriptsMap: Record<string, string> = {};
  input.transcripts.forEach(t => { transcriptsMap[t.id] = t.text; });
  const aggregated = aggregate(
    extractor, contradiction, severity, transcriptsMap,
    input.similarityThreshold ?? 0.45,
  );

  // Filter
  const filtered = applyFilters(aggregated.aggregated_insights, filters);
  const filteredIds = filtered.map(i => i.insight_id);

  // Debate (3 framers + judge per filtered insight, parallel with concurrency cap)
  const concurrency = 4;
  const debateResults: DebateResult[] = [];
  for (let i = 0; i < filtered.length; i += concurrency) {
    const batch = filtered.slice(i, i + concurrency);
    const settled = await Promise.all(batch.map(ins => debateOneInsight(client, ins, ctx)));
    for (const s of settled) {
      debateResults.push(s.result);
      usage.input_tokens += s.usage.input_tokens;
      usage.output_tokens += s.usage.output_tokens;
    }
  }

  // Action composer (only for filtered insights)
  const actionsOut = await runActionComposer(client, aggregated, ctx, filteredIds);
  usage.input_tokens += actionsOut.usage.input_tokens;
  usage.output_tokens += actionsOut.usage.output_tokens;

  return {
    pipeline_version: "v2",
    generated_at: new Date().toISOString(),
    elapsed_seconds: (Date.now() - started) / 1000,
    brand_context: input.brandContext,
    onboarding_plan: input.onboardingPlan,
    transcripts: input.transcripts.map(t => ({ id: t.id, size: t.text.length })),
    per_transcript: { extractor, contradiction, severity },
    aggregated,
    filtered_insight_ids: filteredIds,
    debate: { results: debateResults },
    actions: actionsOut.data,
    verification,
    usage,
  };
}
