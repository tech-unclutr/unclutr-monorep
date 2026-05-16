// POST /api/cross-runs
//
// Inline-data variant of /api/transcripts/aggregate. The caller supplies the
// per-transcript pipeline outputs (extractor / contradiction / severity) and
// the raw transcript text directly in the request body — this route does NOT
// touch GCS for inputs. It runs the cross-transcript pipeline (clusterer →
// deterministic aggregate → debate → action composer) and returns the result
// JSON inline. The caller (Python backend) is responsible for persistence
// (write to GCS) and tenant scoping.
//
// This keeps insights-service path-agnostic: it only knows about the JSON
// shapes from lib/types.ts, never about tenant_id / study_id / call_log_id
// path conventions.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { verifyOidc } from "@/lib/oidc";
import { aggregate } from "@/lib/aggregate";
import { debateOneInsight, runActionComposer, runClusterer } from "@/lib/agents";
import type {
    AggregatedInsight,
    ContradictionOutput,
    DebateResult,
    ExtractorOutput,
    InsightFilters,
    SeverityOutput,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 900;

type InlineTranscript = {
    id: string;
    text: string;
    extractor?: ExtractorOutput;
    contradiction?: ContradictionOutput;
    severity?: SeverityOutput;
};

type CrossRunRequest = {
    transcripts: InlineTranscript[];
    brand_context?: string | null;
    onboarding_plan?: string | null;
    top_n?: number | null;
    similarity_threshold?: number | null;
};

function applyFilters(insights: AggregatedInsight[], filters: InsightFilters): AggregatedInsight[] {
    const tagged = insights.map((ins) => {
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
    const auth = await verifyOidc(req);
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: CrossRunRequest;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const transcripts = body.transcripts ?? [];
    if (!Array.isArray(transcripts) || transcripts.length < 2) {
        return NextResponse.json(
            { error: "need at least 2 transcripts for a cross-run" },
            { status: 400 },
        );
    }
    if (transcripts.length > 25) {
        return NextResponse.json(
            { error: "max 25 transcripts per cross-run" },
            { status: 400 },
        );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "ANTHROPIC_API_KEY env var is not set on this service" },
            { status: 503 },
        );
    }

    const started = Date.now();

    // 1. Index inputs by transcript_id
    const extractor: Record<string, ExtractorOutput> = {};
    const contradiction: Record<string, ContradictionOutput> = {};
    const severity: Record<string, SeverityOutput> = {};
    const transcriptsMap: Record<string, string> = {};
    const missing: string[] = [];

    for (const t of transcripts) {
        if (!t.id || !t.text) continue;
        if (!t.extractor || !t.contradiction || !t.severity) {
            missing.push(t.id);
            continue;
        }
        extractor[t.id] = t.extractor;
        contradiction[t.id] = t.contradiction;
        severity[t.id] = t.severity;
        transcriptsMap[t.id] = t.text;
    }

    if (missing.length > 0) {
        return NextResponse.json(
            {
                error:
                    "some transcripts are missing extractor / contradiction / severity outputs",
                missing,
            },
            { status: 400 },
        );
    }

    const usableIds = Object.keys(extractor);
    if (usableIds.length < 2) {
        return NextResponse.json(
            { error: "need at least 2 transcripts with full per-transcript outputs" },
            { status: 400 },
        );
    }

    const client = new Anthropic({ apiKey });
    const ctx = {
        onboardingPlan: body.onboarding_plan ?? undefined,
        brandContext: body.brand_context ?? undefined,
    };
    const usage = { input_tokens: 0, output_tokens: 0 };

    // 2. Semantic clusterer (LLM) — Jaccard fallback inside aggregate() if omitted
    let clustersOverride: string[][] | undefined;
    try {
        const clusterResult = await runClusterer(client, extractor);
        if (clusterResult !== null) {
            usage.input_tokens += clusterResult.usage.input_tokens;
            usage.output_tokens += clusterResult.usage.output_tokens;
            clustersOverride = (clusterResult.data.clusters ?? []).map((c) =>
                (c.theme_keys ?? []).filter((k) => typeof k === "string"),
            );
        }
    } catch (e) {
        console.warn(
            "[cross-runs] clusterer failed, falling back to Jaccard:",
            e instanceof Error ? e.message : String(e),
        );
    }

    // 3. Aggregate (deterministic)
    const aggregated = aggregate(
        extractor,
        contradiction,
        severity,
        transcriptsMap,
        body.similarity_threshold ?? 0.45,
        clustersOverride,
    );

    // 4. Filter
    const filters: InsightFilters = {
        topN: body.top_n ?? 5,
        priorities: ["P0", "P1", "P2"],
    };
    const filtered = applyFilters(aggregated.aggregated_insights, filters);
    const filteredIds = filtered.map((i) => i.insight_id);

    // 5. Debate (LLM, 3 framers + judge per insight, parallel with concurrency cap)
    const debateResults: DebateResult[] = [];
    const concurrency = 4;
    for (let i = 0; i < filtered.length; i += concurrency) {
        const batch = filtered.slice(i, i + concurrency);
        const settled = await Promise.all(
            batch.map((ins) => debateOneInsight(client, ins, ctx)),
        );
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

    // 7. Return inline — caller (backend) persists to GCS under its tenant-scoped path
    const elapsed_seconds = (Date.now() - started) / 1000;
    return NextResponse.json({
        pipeline_version: "v2-cross",
        generated_at: new Date().toISOString(),
        elapsed_seconds,
        transcript_ids: usableIds,
        brand_context: body.brand_context ?? null,
        onboarding_plan: body.onboarding_plan ?? null,
        aggregated,
        filtered_insight_ids: filteredIds,
        debate: { results: debateResults },
        actions: actionsOut.data,
        usage,
    });
}
