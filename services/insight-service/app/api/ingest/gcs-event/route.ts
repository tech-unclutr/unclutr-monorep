// Pub/Sub push endpoint. Receives GCS Object Finalize notifications, fetches the
// transcript, runs the synthesis pipeline server-side, writes the result back to
// GCS at results/<id>.json (or results/<id>.error.json on failure).
//
// The push subscription is configured with an OIDC service-account token; we
// verify it here so unauthenticated callers can't trigger expensive runs.

import { NextRequest, NextResponse } from "next/server";
import {
  parseTranscriptIdFromGcsName, getTranscriptTextByObjectName,
  resultExists, putResult, putErrorResult,
} from "@/lib/gcs";
import { verifyPubSubAuth, decodeGcsEvent, type PubSubPushBody } from "@/lib/pubsub-auth";
import { runServerPipeline } from "@/lib/pipeline-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. Auth
  const auth = await verifyPubSubAuth(req.headers.get("authorization"));
  if (!auth.ok) {
    console.warn("[ingest] auth rejected:", auth.reason);
    return NextResponse.json({ error: "unauthorized", reason: auth.reason }, { status: 401 });
  }

  // 2. Parse body
  let body: PubSubPushBody;
  try {
    body = await req.json();
  } catch (e) {
    console.warn("[ingest] body not valid JSON:", e);
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  let event, eventType, messageId;
  try {
    ({ event, eventType, messageId } = decodeGcsEvent(body));
  } catch (e) {
    console.warn("[ingest] failed to decode GCS event:", e);
    return NextResponse.json({ error: "invalid event payload" }, { status: 400 });
  }

  console.log(`[ingest] msg=${messageId} eventType=${eventType} bucket=${event.bucket} name=${event.name}`);

  // 3. Filter: only Object Finalize events on inbox/*.txt files
  if (eventType && eventType !== "OBJECT_FINALIZE") {
    return NextResponse.json({ ok: true, skipped: `eventType=${eventType}` });
  }
  const transcriptId = parseTranscriptIdFromGcsName(event.name);
  if (!transcriptId) {
    return NextResponse.json({ ok: true, skipped: `name=${event.name} does not match inbox/*.txt` });
  }

  // 4. Idempotency: skip if a result already exists
  try {
    if (await resultExists(transcriptId)) {
      console.log(`[ingest] skip: result already exists for ${transcriptId}`);
      return NextResponse.json({ ok: true, skipped: "result already exists", transcript_id: transcriptId });
    }
  } catch (e) {
    console.warn("[ingest] resultExists check failed (continuing):", e);
  }

  // 5. Fetch transcript
  let transcriptText: string;
  try {
    transcriptText = await getTranscriptTextByObjectName(event.name);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error(`[ingest] failed to download ${event.name}:`, reason);
    await safelyPutError(transcriptId, `download failed: ${reason}`, "fetch");
    return NextResponse.json({ ok: true, error: "download failed" });
  }

  if (!transcriptText.trim()) {
    await safelyPutError(transcriptId, "transcript is empty", "fetch");
    return NextResponse.json({ ok: true, error: "empty transcript" });
  }

  // 6. Run pipeline
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ingest] ANTHROPIC_API_KEY env not set");
    await safelyPutError(transcriptId, "ANTHROPIC_API_KEY env missing", "config");
    return NextResponse.json({ ok: true, error: "server misconfigured" });
  }

  try {
    const result = await runServerPipeline({
      transcripts: [{ id: transcriptId, text: transcriptText }],
      apiKey,
      brandContext: process.env.DEFAULT_BRAND_CONTEXT,
      onboardingPlan: process.env.DEFAULT_ONBOARDING_PLAN,
      // On Vercel Hobby (60s timeout), keep ingest under budget by debating
      // only the top 3 insights. The /transcripts/[id] page can later expose a
      // "deepen this insight" button that runs full debate on demand.
      filters: { topN: 3, priorities: ["P0", "P1", "P2"] },
    });
    // Augment with provenance
    const payload = {
      ...result,
      gcs_source_object: event.name,
      pubsub_message_id: messageId,
      pusher_email: auth.email,
    };
    await putResult(transcriptId, payload);
    console.log(`[ingest] ${transcriptId}: ${result.aggregated.aggregated_insights.length} insights, ${result.elapsed_seconds.toFixed(1)}s, ${result.usage.input_tokens}in/${result.usage.output_tokens}out`);
    return NextResponse.json({ ok: true, transcript_id: transcriptId, insights: result.aggregated.aggregated_insights.length });
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error(`[ingest] pipeline failed for ${transcriptId}:`, reason);
    await safelyPutError(transcriptId, reason, "pipeline");
    // Still return 200 — we don't want Pub/Sub to redeliver bad data forever
    return NextResponse.json({ ok: true, error: "pipeline failed" });
  }
}

async function safelyPutError(transcriptId: string, reason: string, stage: string) {
  try { await putErrorResult(transcriptId, reason, stage); }
  catch (e) { console.error("[ingest] putErrorResult itself failed:", e); }
}
