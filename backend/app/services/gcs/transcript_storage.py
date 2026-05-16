"""Stash Bolna transcripts to GCS.

Called from the study-bolna webhook handler on terminal events. Idempotent —
the same call_log_id always writes to the same object path, so webhook
replays overwrite in place instead of creating duplicate blobs.

Synchronous google-cloud-storage client is wrapped in `asyncio.to_thread` and
gated by `asyncio.wait_for` so a hung GCS can never exceed the configured
timeout. Caller is expected to swallow exceptions (fail-soft) — the webhook
must still return 200 to Bolna even if GCS is unreachable.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from google.cloud import storage
from google.oauth2 import service_account
from loguru import logger

from app.core.config import settings


_client: Optional[storage.Client] = None


def _build_client() -> storage.Client:
    """Build a lazily-cached GCS client.

    Resolves credentials from `GCS_SERVICE_ACCOUNT_KEY` (filesystem path OR
    inlined JSON). Falls back to Application Default Credentials if unset —
    which is what Cloud Run uses via its service-account binding.
    """
    key = settings.GCS_SERVICE_ACCOUNT_KEY
    project = settings.GCP_PROJECT_ID or settings.GOOGLE_CLOUD_PROJECT

    if key:
        stripped = key.strip()
        if stripped.startswith("{"):
            info = json.loads(stripped)
            creds = service_account.Credentials.from_service_account_info(info)
        else:
            creds = service_account.Credentials.from_service_account_file(stripped)
        return storage.Client(project=project, credentials=creds)

    return storage.Client(project=project)


def _get_client() -> storage.Client:
    global _client
    if _client is None:
        _client = _build_client()
    return _client


def _build_object_name(company_id: UUID, study_id: UUID, call_log_id: UUID) -> str:
    return f"{company_id}/{study_id}/{call_log_id}_transcript.json"


def _upload_sync(
    bucket_name: str,
    object_name: str,
    body: bytes,
) -> str:
    """Blocking GCS upload — runs inside asyncio.to_thread()."""
    client = _get_client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    blob.upload_from_string(body, content_type="application/json")
    return f"gs://{bucket_name}/{object_name}"


async def upload_transcript(
    *,
    company_id: UUID,
    study_id: UUID,
    call_log_id: UUID,
    transcript_text: str,
    metadata: Dict[str, Any],
    timeout_seconds: float,
) -> str:
    """Upload one transcript and return its gs:// URL.

    Raises asyncio.TimeoutError on slow GCS, or whatever the GCS client throws
    on credential / network errors. Caller is responsible for swallowing.
    """
    bucket_name = settings.GCS_TRANSCRIPTS_BUCKET
    if not bucket_name:
        raise RuntimeError("GCS_TRANSCRIPTS_BUCKET is not configured")

    object_name = _build_object_name(company_id, study_id, call_log_id)
    body = {
        "transcript": transcript_text,
        "recording_url": metadata.get("recording_url"),
        "duration_seconds": metadata.get("duration_seconds"),
        "bolna_call_id": metadata.get("bolna_call_id"),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
    payload = json.dumps(body, ensure_ascii=False).encode("utf-8")

    gs_path = await asyncio.wait_for(
        asyncio.to_thread(_upload_sync, bucket_name, object_name, payload),
        timeout=timeout_seconds,
    )
    logger.info(
        f"[GCSTranscript] Uploaded {gs_path} bytes={len(payload)} "
        f"company_id={company_id} study_id={study_id} call_log_id={call_log_id}"
    )
    return gs_path
