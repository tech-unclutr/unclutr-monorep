// POST /api/process
//
// Cloud Tasks target. Receives a single transcript reference, runs the full
// per-transcript pipeline via runServerPipeline(), and persists the result to
// GCS via putResult(). Returns 200 on success, non-2xx on failure (Cloud Tasks
// retries with exponential backoff).
//
// Body:    { call_log_id: string, transcript_gcs_path: string }
// Auth:    Google-signed OIDC JWT in Authorization header (dev-mode bypass)
// Result:  gs://<GCS_TRANSCRIPTS_BUCKET>/results/<call_log_id>.json

import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

import { verifyOidc } from "@/lib/oidc";
import { runServerPipeline } from "@/lib/pipeline-server";

export const runtime = "nodejs";
export const maxDuration = 900;

type ProcessRequest = {
  call_log_id?: string;
  company_id?: string;
  study_id?: string;
  transcript_gcs_path?: string;
};

type TranscriptObject = {
  transcript?: string;
  recording_url?: string | null;
  duration_seconds?: number | null;
  bolna_call_id?: string | null;
  uploaded_at?: string | null;
};

let _storage: Storage | null = null;
function getStorage(): Storage {
  if (!_storage) _storage = new Storage({ projectId: process.env.GCP_PROJECT_ID });
  return _storage;
}

function parseGcsUri(uri: string): { bucket: string; object: string } | null {
  const m = uri.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (!m) return null;
  return { bucket: m[1], object: m[2] };
}

export async function POST(req: NextRequest) {
  const auth = await verifyOidc(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: ProcessRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const callLogId = body.call_log_id?.trim();
  const companyId = body.company_id?.trim();
  const studyId = body.study_id?.trim();
  const transcriptPath = body.transcript_gcs_path?.trim();
  if (!callLogId || !companyId || !studyId || !transcriptPath) {
    return NextResponse.json(
      {
        error:
          "call_log_id, company_id, study_id, and transcript_gcs_path are all required",
      },
      { status: 400 },
    );
  }

  const parsed = parseGcsUri(transcriptPath);
  if (!parsed) {
    return NextResponse.json(
      { error: `transcript_gcs_path must be a gs:// URI, got ${transcriptPath}` },
      { status: 400 },
    );
  }

  const resultsBucket = process.env.GCS_TRANSCRIPTS_BUCKET;
  if (!resultsBucket) {
    return NextResponse.json(
      { error: "GCS_TRANSCRIPTS_BUCKET env var not set" },
      { status: 500 },
    );
  }
  const resultObjectName = `${companyId}/${studyId}/${callLogId}_insights.json`;
  const resultGcsPath = `gs://${resultsBucket}/${resultObjectName}`;

  // 1. Download the transcript JSON
  let transcriptText: string;
  try {
    const [buf] = await getStorage().bucket(parsed.bucket).file(parsed.object).download();
    const obj = JSON.parse(buf.toString("utf-8")) as TranscriptObject;
    if (!obj.transcript || typeof obj.transcript !== "string") {
      return NextResponse.json(
        { error: ".transcript field missing or not a string in transcript object" },
        { status: 422 },
      );
    }
    transcriptText = obj.transcript;
  } catch (e) {
    return NextResponse.json(
      { error: `failed to read transcript from ${transcriptPath}: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }

  // 2. Run the pipeline
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY env var is not set on this service" },
      { status: 503 },
    );
  }

  const started = Date.now();
  let result;
  try {
    result = await runServerPipeline({
      transcripts: [{ id: callLogId, text: transcriptText }],
      apiKey,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `pipeline failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
  }

  // 3. Persist to tenant-scoped path. Writes via @google-cloud/storage directly
  //    because lib/gcs.ts's putResult() is hard-coded to the legacy flat scheme
  //    (results/<id>.json) used by the R&D demo and can't address this path.
  try {
    await getStorage()
      .bucket(resultsBucket)
      .file(resultObjectName)
      .save(JSON.stringify(result, null, 2), {
        contentType: "application/json",
        resumable: false,
        metadata: {
          metadata: {
            source: "insight-service-api-process",
            call_log_id: callLogId,
            company_id: companyId,
            study_id: studyId,
          },
        },
      });
  } catch (e) {
    return NextResponse.json(
      { error: `failed to write result to ${resultGcsPath}: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    call_log_id: callLogId,
    result_gcs_path: resultGcsPath,
    elapsed_seconds: (Date.now() - started) / 1000,
    usage: result.usage,
    oidc_bypassed: "bypassed" in auth ? auth.bypassed : false,
  });
}
