// Single API endpoint — dispatches by stage.
// Each call runs one agent step. Frontend orchestrates by calling these in sequence.

import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic-client";
import {
  runExtractor, runContradiction, runSeverity, runActionComposer,
  debateOneInsight, regenerateInsightWithFeedback,
} from "@/lib/agents";
import { verifyAndCorrect } from "@/lib/verify";
import { aggregate } from "@/lib/aggregate";
import type {
  ExtractorOutput, ContradictionOutput, SeverityOutput,
  AggregatedOutput, AggregatedInsight,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Stage = "extract" | "contradiction" | "severity" | "aggregate" | "action" | "debate" | "regenerate";

type ContextFields = {
  onboarding_plan?: string;
  brand_context?: string;
};

type ExtractRequest = ContextFields & { stage: "extract"; transcript_id: string; transcript: string };
type ContradictionRequest = ContextFields & { stage: "contradiction"; transcript_id: string; transcript: string; extractor: ExtractorOutput };
type SeverityRequest = ContextFields & { stage: "severity"; transcript_id: string; transcript: string; extractor: ExtractorOutput };
type AggregateRequest = {
  stage: "aggregate";
  transcripts: Record<string, string>;
  extractors: Record<string, ExtractorOutput>;
  contradictions: Record<string, ContradictionOutput>;
  severities: Record<string, SeverityOutput>;
  similarity_threshold?: number;
};
type ActionRequest = ContextFields & {
  stage: "action";
  aggregated: AggregatedOutput;
  filtered_insight_ids?: string[];
};
type DebateRequest = ContextFields & { stage: "debate"; insight: AggregatedInsight };
type RegenerateRequest = ContextFields & { stage: "regenerate"; insight: AggregatedInsight; feedback_note: string };

type AnyStageRequest =
  | ExtractRequest | ContradictionRequest | SeverityRequest
  | AggregateRequest | ActionRequest | DebateRequest | RegenerateRequest;

export async function POST(req: NextRequest) {
  let body: AnyStageRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const stage = body.stage as Stage;
  const apiKeyHeader = req.headers.get("x-anthropic-api-key");
  const modeHeader = (req.headers.get("x-mode") ?? "production") as "live" | "production";

  // Aggregate stage is deterministic — no API key needed
  if (stage === "aggregate") {
    const r = body as AggregateRequest;
    try {
      const out = aggregate(
        r.extractors, r.contradictions, r.severities, r.transcripts,
        r.similarity_threshold ?? 0.45,
      );
      return NextResponse.json({ stage, data: out });
    } catch (e) {
      return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
    }
  }

  let client;
  try {
    client = getAnthropicClient({ apiKeyHeader, mode: modeHeader });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 401 });
  }

  try {
    if (stage === "extract") {
      const r = body as ExtractRequest;
      const ctx = { onboardingPlan: r.onboarding_plan, brandContext: r.brand_context };
      const { data, usage } = await runExtractor(client, r.transcript_id, r.transcript, ctx);
      const verifyReport = verifyAndCorrect(r.transcript, data, "extractor");
      return NextResponse.json({ stage, data, usage, verifyReport });
    }
    if (stage === "contradiction") {
      const r = body as ContradictionRequest;
      const ctx = { onboardingPlan: r.onboarding_plan, brandContext: r.brand_context };
      const { data, usage } = await runContradiction(client, r.transcript_id, r.transcript, r.extractor, ctx);
      const verifyReport = verifyAndCorrect(r.transcript, data, "contradiction");
      return NextResponse.json({ stage, data, usage, verifyReport });
    }
    if (stage === "severity") {
      const r = body as SeverityRequest;
      const ctx = { onboardingPlan: r.onboarding_plan, brandContext: r.brand_context };
      const { data, usage } = await runSeverity(client, r.transcript_id, r.transcript, r.extractor, ctx);
      const verifyReport = verifyAndCorrect(r.transcript, data, "severity");
      return NextResponse.json({ stage, data, usage, verifyReport });
    }
    if (stage === "action") {
      const r = body as ActionRequest;
      const ctx = { onboardingPlan: r.onboarding_plan, brandContext: r.brand_context };
      const { data, usage } = await runActionComposer(client, r.aggregated, ctx, r.filtered_insight_ids);
      return NextResponse.json({ stage, data, usage });
    }
    if (stage === "debate") {
      const r = body as DebateRequest;
      const ctx = { onboardingPlan: r.onboarding_plan, brandContext: r.brand_context };
      const { result, usage } = await debateOneInsight(client, r.insight, ctx);
      return NextResponse.json({ stage, data: result, usage });
    }
    if (stage === "regenerate") {
      const r = body as RegenerateRequest;
      const ctx = { onboardingPlan: r.onboarding_plan, brandContext: r.brand_context };
      const { result, usage } = await regenerateInsightWithFeedback(client, r.insight, r.feedback_note, ctx);
      return NextResponse.json({ stage, data: result, usage });
    }
    return NextResponse.json({ error: `Unknown stage: ${stage}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e), stage }, { status: 500 });
  }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
