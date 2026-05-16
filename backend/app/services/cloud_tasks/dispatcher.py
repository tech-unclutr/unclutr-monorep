"""Enqueue Cloud Tasks that trigger the insights-service /api/process route.

The synchronous google-cloud-tasks client is wrapped in `asyncio.to_thread` so
the webhook handler stays async. Failure to enqueue is the caller's problem to
handle — this module raises on any GCP error.

Configuration knobs (all in `app.core.config.settings`):
- CLOUD_TASKS_PROJECT, CLOUD_TASKS_LOCATION, CLOUD_TASKS_QUEUE_INSIGHTS — queue address.
- INSIGHTS_SERVICE_URL — target Cloud Run URL (also used as the OIDC audience).
- BACKEND_SA_EMAIL — the service account that signs the OIDC token. Cloud Tasks
  mints a token with `email=<this SA>`. Insights-service verifies the token's
  audience matches its own URL.

If CLOUD_TASKS_QUEUE_INSIGHTS or INSIGHTS_SERVICE_URL is unset, `is_enabled()`
returns False so the webhook handler can skip dispatch silently in local dev.
"""

from __future__ import annotations

import asyncio
import json
from typing import Optional
from uuid import UUID

from google.cloud import tasks_v2
from loguru import logger

from app.core.config import settings


_client: Optional[tasks_v2.CloudTasksClient] = None


def _get_client() -> tasks_v2.CloudTasksClient:
    global _client
    if _client is None:
        _client = tasks_v2.CloudTasksClient()
    return _client


def is_enabled() -> bool:
    """True iff the dispatcher has every config value it needs."""
    return bool(
        settings.CLOUD_TASKS_QUEUE_INSIGHTS
        and settings.INSIGHTS_SERVICE_URL
        and settings.BACKEND_SA_EMAIL
        and (settings.CLOUD_TASKS_PROJECT or settings.GCP_PROJECT_ID)
    )


def _create_task_sync(
    *,
    call_log_id: str,
    company_id: str,
    study_id: str,
    transcript_gcs_path: str,
) -> str:
    """Blocking enqueue. Runs inside asyncio.to_thread(). Returns the task name."""
    project = settings.CLOUD_TASKS_PROJECT or settings.GCP_PROJECT_ID
    location = settings.CLOUD_TASKS_LOCATION
    queue = settings.CLOUD_TASKS_QUEUE_INSIGHTS
    target_url = f"{settings.INSIGHTS_SERVICE_URL.rstrip('/')}/api/process"

    parent = _get_client().queue_path(project, location, queue)

    body = json.dumps(
        {
            "call_log_id": call_log_id,
            "company_id": company_id,
            "study_id": study_id,
            "transcript_gcs_path": transcript_gcs_path,
        }
    ).encode("utf-8")

    task = {
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST,
            "url": target_url,
            "headers": {"Content-Type": "application/json"},
            "body": body,
            "oidc_token": {
                "service_account_email": settings.BACKEND_SA_EMAIL,
                "audience": settings.INSIGHTS_SERVICE_URL,
            },
        }
    }

    response = _get_client().create_task(request={"parent": parent, "task": task})
    return response.name


async def enqueue_insights_task(
    *,
    call_log_id: UUID | str,
    company_id: UUID | str,
    study_id: UUID | str,
    transcript_gcs_path: str,
) -> str:
    """Enqueue one Cloud Task per transcript. Returns the created task name.

    Raises on any GCP error; caller decides whether to fail or swallow.
    """
    if not is_enabled():
        raise RuntimeError("Cloud Tasks dispatcher not configured (missing env vars)")

    task_name = await asyncio.to_thread(
        _create_task_sync,
        call_log_id=str(call_log_id),
        company_id=str(company_id),
        study_id=str(study_id),
        transcript_gcs_path=transcript_gcs_path,
    )
    logger.info(
        f"[InsightsDispatch] Enqueued task={task_name} call_log_id={call_log_id} "
        f"company_id={company_id} study_id={study_id} transcript={transcript_gcs_path}"
    )
    return task_name
