// GCS wrapper. Two auth modes:
//   1. GCP_SERVICE_ACCOUNT_KEY env (parsed JSON) — used on Vercel and when running
//      locally with a downloaded key file inlined into the env.
//   2. Application Default Credentials — used automatically on Cloud Run (via the
//      metadata server) and locally after `gcloud auth application-default login`.

import { Storage } from "@google-cloud/storage";

let _storage: Storage | null = null;

function getStorage(): Storage {
  if (_storage) return _storage;
  const raw = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (raw) {
    let credentials;
    try {
      credentials = JSON.parse(raw);
    } catch (e) {
      throw new Error(`GCP_SERVICE_ACCOUNT_KEY is not valid JSON: ${e instanceof Error ? e.message : e}`);
    }
    _storage = new Storage({
      credentials,
      projectId: process.env.GCP_PROJECT_ID || credentials.project_id,
    });
  } else {
    _storage = new Storage({ projectId: process.env.GCP_PROJECT_ID });
  }
  return _storage;
}

function getBucketName(): string {
  const name = process.env.GCS_TRANSCRIPTS_BUCKET;
  if (!name) throw new Error("GCS_TRANSCRIPTS_BUCKET env var is not set");
  return name;
}

const INBOX_PREFIX = "inbox/";
const RESULTS_PREFIX = "results/";

/** Strip inbox/ prefix and .txt suffix to derive a stable transcript id from a GCS object name. */
export function parseTranscriptIdFromGcsName(name: string): string | null {
  if (!name.startsWith(INBOX_PREFIX)) return null;
  const stripped = name.slice(INBOX_PREFIX.length);
  if (!stripped.endsWith(".txt")) return null;
  const id = stripped.slice(0, -".txt".length);
  // Sanitise: id must be safe for filesystem-style storage paths
  if (!/^[A-Za-z0-9_\-./]+$/.test(id)) return null;
  return id;
}

export function gcsResultObjectName(transcriptId: string): string {
  return `${RESULTS_PREFIX}${transcriptId}.json`;
}

export function gcsTranscriptObjectName(transcriptId: string): string {
  return `${INBOX_PREFIX}${transcriptId}.txt`;
}

export type TranscriptListItem = {
  transcript_id: string;
  object_name: string;
  size_bytes: number;
  uploaded_at: string;          // ISO timestamp
  status: "pending" | "done" | "failed";
  result_object_name?: string;
  result_updated_at?: string;
};

/** List inbox/*.txt with derived status (done if results/<id>.json exists, failed if .error.json exists). */
export async function listTranscripts(): Promise<TranscriptListItem[]> {
  const bucket = getStorage().bucket(getBucketName());

  const [inboxFiles] = await bucket.getFiles({ prefix: INBOX_PREFIX });
  const [resultFiles] = await bucket.getFiles({ prefix: RESULTS_PREFIX });

  const resultsByName = new Map<string, { name: string; updated: string }>();
  for (const f of resultFiles) {
    resultsByName.set(f.name, { name: f.name, updated: f.metadata.updated as string });
  }

  const items: TranscriptListItem[] = [];
  for (const f of inboxFiles) {
    const id = parseTranscriptIdFromGcsName(f.name);
    if (!id) continue;
    const okResultName = gcsResultObjectName(id);
    const errResultName = `${RESULTS_PREFIX}${id}.error.json`;
    let status: TranscriptListItem["status"] = "pending";
    let resultObj: { name: string; updated: string } | undefined;
    if (resultsByName.has(okResultName)) {
      status = "done";
      resultObj = resultsByName.get(okResultName);
    } else if (resultsByName.has(errResultName)) {
      status = "failed";
      resultObj = resultsByName.get(errResultName);
    }
    items.push({
      transcript_id: id,
      object_name: f.name,
      size_bytes: Number(f.metadata.size ?? 0),
      uploaded_at: (f.metadata.updated as string) ?? new Date().toISOString(),
      status,
      result_object_name: resultObj?.name,
      result_updated_at: resultObj?.updated,
    });
  }
  // Newest first
  items.sort((a, b) => (b.uploaded_at ?? "").localeCompare(a.uploaded_at ?? ""));
  return items;
}

export async function getTranscriptText(transcriptId: string): Promise<string> {
  const bucket = getStorage().bucket(getBucketName());
  const file = bucket.file(gcsTranscriptObjectName(transcriptId));
  const [buf] = await file.download();
  return buf.toString("utf-8");
}

export async function getTranscriptTextByObjectName(objectName: string): Promise<string> {
  const bucket = getStorage().bucket(getBucketName());
  const file = bucket.file(objectName);
  const [buf] = await file.download();
  return buf.toString("utf-8");
}

export async function resultExists(transcriptId: string): Promise<boolean> {
  const bucket = getStorage().bucket(getBucketName());
  const [ok] = await bucket.file(gcsResultObjectName(transcriptId)).exists();
  return ok;
}

export async function getResult<T = unknown>(transcriptId: string): Promise<T | null> {
  const bucket = getStorage().bucket(getBucketName());
  const file = bucket.file(gcsResultObjectName(transcriptId));
  const [exists] = await file.exists();
  if (!exists) return null;
  const [buf] = await file.download();
  return JSON.parse(buf.toString("utf-8")) as T;
}

export async function getErrorResult(transcriptId: string): Promise<{ error: string; stage?: string; timestamp?: string } | null> {
  const bucket = getStorage().bucket(getBucketName());
  const file = bucket.file(`${RESULTS_PREFIX}${transcriptId}.error.json`);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [buf] = await file.download();
  return JSON.parse(buf.toString("utf-8"));
}

export async function putResult(transcriptId: string, payload: unknown): Promise<void> {
  const bucket = getStorage().bucket(getBucketName());
  const file = bucket.file(gcsResultObjectName(transcriptId));
  await file.save(JSON.stringify(payload, null, 2), {
    contentType: "application/json",
    resumable: false,
    metadata: { metadata: { source: "insight-service", transcript_id: transcriptId } },
  });
}

export async function putErrorResult(transcriptId: string, error: string, stage?: string): Promise<void> {
  const bucket = getStorage().bucket(getBucketName());
  const file = bucket.file(`${RESULTS_PREFIX}${transcriptId}.error.json`);
  const payload = { error, stage, timestamp: new Date().toISOString(), transcript_id: transcriptId };
  await file.save(JSON.stringify(payload, null, 2), {
    contentType: "application/json",
    resumable: false,
  });
}

// ── Cross-transcript runs ───────────────────────────────────────────────
const CROSS_RUNS_PREFIX = "cross-runs/";

export type CrossRunListItem = {
  run_id: string;
  object_name: string;
  generated_at: string;
  transcript_ids: string[];
  insight_count: number;
  surfaced_count: number;
};

export function gcsCrossRunObjectName(runId: string): string {
  return `${CROSS_RUNS_PREFIX}${runId}.json`;
}

export async function putCrossRun(runId: string, payload: unknown): Promise<void> {
  const bucket = getStorage().bucket(getBucketName());
  const file = bucket.file(gcsCrossRunObjectName(runId));
  await file.save(JSON.stringify(payload, null, 2), {
    contentType: "application/json",
    resumable: false,
    metadata: { metadata: { source: "insight-service-cross", run_id: runId } },
  });
}

export async function getCrossRun<T = unknown>(runId: string): Promise<T | null> {
  const bucket = getStorage().bucket(getBucketName());
  const file = bucket.file(gcsCrossRunObjectName(runId));
  const [exists] = await file.exists();
  if (!exists) return null;
  const [buf] = await file.download();
  return JSON.parse(buf.toString("utf-8")) as T;
}

export async function listCrossRuns(): Promise<CrossRunListItem[]> {
  const bucket = getStorage().bucket(getBucketName());
  const [files] = await bucket.getFiles({ prefix: CROSS_RUNS_PREFIX });
  const items: CrossRunListItem[] = [];
  for (const f of files) {
    if (!f.name.endsWith(".json")) continue;
    const runId = f.name.slice(CROSS_RUNS_PREFIX.length, -".json".length);
    try {
      const [buf] = await f.download();
      const data = JSON.parse(buf.toString("utf-8"));
      items.push({
        run_id: runId,
        object_name: f.name,
        generated_at: data.generated_at ?? (f.metadata.updated as string),
        transcript_ids: data.transcript_ids ?? [],
        insight_count: data.aggregated?.aggregated_insights?.length ?? 0,
        surfaced_count: data.filtered_insight_ids?.length ?? 0,
      });
    } catch {
      // skip malformed
    }
  }
  items.sort((a, b) => (b.generated_at ?? "").localeCompare(a.generated_at ?? ""));
  return items;
}
