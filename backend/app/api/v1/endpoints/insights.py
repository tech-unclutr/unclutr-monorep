"""Insights read endpoints.

Backend proxy over GCS for the /dashboard/insights frontend.

- GET /insights/transcripts                 → list of completed calls + status
- GET /insights/transcripts/{call_log_id}   → flattened per-transcript insights

Reads results written by insights-service (`/api/process`) at the conventional
tenant-scoped path: gs://<bucket>/<company_id>/<study_id>/<call_log_id>_insights.json

Stays read-only. Stays stateless w.r.t. insights data — GCS is the source of
truth; this module only formats it into the shape the UI expects.
"""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.db import get_session
from app.core.security import get_current_user
from app.models.iam import CompanyMembership
from app.models.user import User


router = APIRouter()


# ── Auth helper (same shape as agent_execution.py) ──

async def _get_company_id(
    session: AsyncSession = Depends(get_session),
    current_user_token: dict = Depends(get_current_user),
) -> uuid.UUID:
    user_id = current_user_token.get("uid")
    user = await session.get(User, user_id)
    if user and user.current_company_id:
        return user.current_company_id
    stmt = select(CompanyMembership).where(CompanyMembership.user_id == user_id)
    membership = (await session.exec(stmt)).first()
    if not membership:
        raise HTTPException(status_code=404, detail="No company found for user")
    return membership.company_id


# ── GCS helpers (lazy client, ADC) ──

_storage_client = None


def _get_storage_client():
    global _storage_client
    if _storage_client is None:
        from google.cloud import storage

        _storage_client = storage.Client(
            project=settings.GCP_PROJECT_ID or settings.GOOGLE_CLOUD_PROJECT
        )
    return _storage_client


def _result_object_name(company_id: uuid.UUID, study_id: uuid.UUID, call_log_id: uuid.UUID) -> str:
    return f"{company_id}/{study_id}/{call_log_id}_insights.json"


def _transcript_object_name(company_id: uuid.UUID, study_id: uuid.UUID, call_log_id: uuid.UUID) -> str:
    return f"{company_id}/{study_id}/{call_log_id}_transcript.json"


def _list_ready_insights_sync(company_id: uuid.UUID) -> set[str]:
    """One bucket listing per company. Returns the set of call_log_ids that have
    an _insights.json blob under the company's prefix."""
    bucket_name = settings.GCS_TRANSCRIPTS_BUCKET
    if not bucket_name:
        return set()
    bucket = _get_storage_client().bucket(bucket_name)
    ready: set[str] = set()
    for blob in bucket.list_blobs(prefix=f"{company_id}/"):
        # Path is <company>/<study>/<call_log_id>_insights.json
        if not blob.name.endswith("_insights.json"):
            continue
        # Strip the trailing "_insights.json" and pull the basename
        leaf = blob.name.rsplit("/", 1)[-1]
        cid = leaf[: -len("_insights.json")]
        ready.add(cid)
    return ready


def _download_json_sync(object_name: str) -> Optional[dict]:
    bucket_name = settings.GCS_TRANSCRIPTS_BUCKET
    if not bucket_name:
        return None
    blob = _get_storage_client().bucket(bucket_name).blob(object_name)
    if not blob.exists():
        return None
    return json.loads(blob.download_as_bytes())


# ── Response schemas (match the frontend MockTranscript / MockInsight) ──


class TranscriptListItem(BaseModel):
    id: str  # call_log_id
    name: str
    status: str  # "done" | "pending" | "failed"
    ingested_at: str
    duration_minutes: int
    persona: str


class EvidenceItem(BaseModel):
    transcript_id: Optional[str] = None
    speaker: Optional[str] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    verbatim: str
    source_theme_id: Optional[str] = None
    source_theme_confidence: Optional[float] = None


class ContradictionClaim(BaseModel):
    label: Optional[str] = None
    speaker: Optional[str] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    verbatim: str
    summary_role: Optional[str] = None


class ContradictionItem(BaseModel):
    type: Optional[str] = None
    summary: Optional[str] = None
    claim_a: Optional[ContradictionClaim] = None
    claim_b: Optional[ContradictionClaim] = None
    rationale: Optional[str] = None
    confidence: Optional[str] = None
    actionability_hint: Optional[str] = None
    transcript_id: Optional[str] = None


class DebateProposalItem(BaseModel):
    agent: str  # conservative | aggressive | balanced
    theme_name: Optional[str] = None
    executive_summary: Optional[str] = None
    recommended_action_framing: Optional[str] = None
    evidence_emphasis: Optional[str] = None


class JudgeScores(BaseModel):
    evidence: int = 0
    actionability: int = 0
    impact: int = 0
    specificity: int = 0
    total: int = 0


class DebateBundle(BaseModel):
    winner: str  # conservative | aggressive | balanced
    proposals: List[DebateProposalItem]
    scores: Dict[str, JudgeScores]   # keyed by agent name
    judge_reasoning: Optional[str] = None


class ActionItem(BaseModel):
    action_id: Optional[str] = None
    owner_team: Optional[str] = None
    action_text: Optional[str] = None
    deadline: Optional[str] = None
    context_for_team: Optional[str] = None
    expected_impact: Optional[str] = None
    priority: Optional[str] = None
    confidence: Optional[str] = None


class SourceTheme(BaseModel):
    transcript_id: Optional[str] = None
    theme_id: Optional[str] = None
    theme_name: Optional[str] = None


class InsightItem(BaseModel):
    """Mirrors the AggregatedInsight shape from the GCS file. Sibling data
    (debate, action) is attached when this insight_id appears in those sections.
    No derived fields, no formatting — every value is exactly what's in the JSON."""

    insight_id: str
    theme_name: str
    category: Optional[str] = None
    transcripts_mentioning: List[str] = []
    transcripts_total: Optional[int] = None
    frequency_pct: Optional[float] = None
    total_mentions: Optional[int] = None
    emotional_valence_majority: Optional[str] = None
    severity_distribution: List[float] = []
    avg_severity: Optional[float] = None
    max_severity: Optional[float] = None
    min_severity: Optional[float] = None
    modal_urgency: Optional[str] = None
    impact_score: Optional[float] = None

    evidence_pool: List[EvidenceItem] = []
    source_themes: List[SourceTheme] = []
    contradictions: List[ContradictionItem] = []   # = contradictions_referenced

    # Joined from siblings in the same file when the insight was debated /
    # had an action composed.
    action: Optional[ActionItem] = None
    debate: Optional[DebateBundle] = None




class TranscriptMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    text: str


class TranscriptDetailResponse(BaseModel):
    id: str
    name: str
    status: str
    ingested_at: str
    duration_minutes: int
    persona: str
    transcript: List[TranscriptMessage]
    transcript_raw: Optional[str] = None
    recording_url: Optional[str] = None
    insights: Optional[List[InsightItem]] = None  # null while pipeline is still running


# ── Shape transformation helpers ──


_ROLE_PREFIX_RE = None  # lazy compile below


def _parse_transcript(raw: str) -> List[TranscriptMessage]:
    """Parse Bolna's plain-text role-tagged transcript into structured messages.

    Bolna writes one line per turn like:
        assistant: Hi there.
        user: Hey.
        assistant: How are you?
    Continuation lines (no `role:` prefix) get appended to the previous message.
    Falls back to a single "system" message if the input has no recognisable
    role lines at all.
    """
    import re
    global _ROLE_PREFIX_RE
    if _ROLE_PREFIX_RE is None:
        _ROLE_PREFIX_RE = re.compile(r"^\s*(assistant|user|system|agent|caller)\s*:\s*", re.IGNORECASE)

    messages: List[TranscriptMessage] = []
    for line in (raw or "").splitlines():
        if not line.strip():
            continue
        m = _ROLE_PREFIX_RE.match(line)
        if m:
            role = m.group(1).lower()
            # Normalise: "agent" → "assistant", "caller" → "user"
            if role == "agent":
                role = "assistant"
            elif role == "caller":
                role = "user"
            text = line[m.end():].strip()
            messages.append(TranscriptMessage(role=role, text=text))
        else:
            if messages:
                # Continuation of the previous turn
                messages[-1] = TranscriptMessage(
                    role=messages[-1].role,
                    text=(messages[-1].text + " " + line.strip()).strip(),
                )
            else:
                # No role line yet — treat as system/preamble
                messages.append(TranscriptMessage(role="system", text=line.strip()))
    return messages


# NOTE: priority is no longer derived. The only authoritative `priority` value
# lives on actions.actions[i].priority and is surfaced via InsightItem.action.priority
# when an action was composed. Insights that didn't get an action have no priority.


def _claim_from_dict(raw: Optional[dict]) -> Optional[ContradictionClaim]:
    if not isinstance(raw, dict) or not raw.get("verbatim"):
        return None
    return ContradictionClaim(**{k: raw.get(k) for k in ContradictionClaim.model_fields})


def _evidence_from_dict(raw: Optional[dict]) -> Optional[EvidenceItem]:
    if not isinstance(raw, dict) or not raw.get("verbatim"):
        return None
    return EvidenceItem(**{k: raw.get(k) for k in EvidenceItem.model_fields})


def _flatten_insights(raw: dict, call_log_id: str) -> List[InsightItem]:
    """Strip-and-pass-through. Every field comes from the GCS JSON exactly as
    written. The only synthesis we do is *joining* sibling sections (debate,
    actions) onto the matching insight_id."""
    aggregated = (raw.get("aggregated") or {}).get("aggregated_insights") or []
    debate_results = (raw.get("debate") or {}).get("results") or []
    actions = (raw.get("actions") or {}).get("actions") or []

    # Index the full debate bundle per insight_id (no transformation — pass through)
    debate_by_id: Dict[str, DebateBundle] = {}
    for r in debate_results:
        iid = r.get("insight_id")
        if not iid:
            continue
        scores_raw = r.get("scores") or {}
        scores: Dict[str, JudgeScores] = {}
        for agent_name, s in scores_raw.items():
            scores[agent_name] = JudgeScores(**{k: (s or {}).get(k, 0) for k in JudgeScores.model_fields})
        debate_by_id[iid] = DebateBundle(
            winner=r.get("winner") or "",
            proposals=[
                DebateProposalItem(**{k: p.get(k) for k in DebateProposalItem.model_fields})
                for p in (r.get("proposals") or [])
            ],
            scores=scores,
            judge_reasoning=r.get("judge_reasoning"),
        )

    # Index actions by insight_id (first composed action wins per insight)
    action_by_insight: Dict[str, ActionItem] = {}
    for a in actions:
        ai = ActionItem(**{k: a.get(k) for k in ActionItem.model_fields})
        for supporting in (a.get("supporting_insights") or []):
            action_by_insight.setdefault(supporting, ai)

    out: List[InsightItem] = []
    for ins in aggregated:
        iid = ins.get("insight_id") or ""
        evidence_pool = [e for e in (_evidence_from_dict(x) for x in (ins.get("evidence_pool") or [])) if e]
        contradictions: List[ContradictionItem] = []
        for c in (ins.get("contradictions_referenced") or []):
            if not isinstance(c, dict):
                continue
            contradictions.append(
                ContradictionItem(
                    type=c.get("type"),
                    summary=c.get("summary"),
                    claim_a=_claim_from_dict(c.get("claim_a")),
                    claim_b=_claim_from_dict(c.get("claim_b")),
                    rationale=c.get("rationale"),
                    confidence=c.get("confidence"),
                    actionability_hint=c.get("actionability_hint"),
                    transcript_id=c.get("transcript_id"),
                )
            )

        source_themes = [
            SourceTheme(**{k: s.get(k) for k in SourceTheme.model_fields})
            for s in (ins.get("source_themes") or [])
            if isinstance(s, dict)
        ]

        out.append(
            InsightItem(
                insight_id=iid,
                theme_name=ins.get("theme_name") or "",
                category=ins.get("category"),
                transcripts_mentioning=list(ins.get("transcripts_mentioning") or []),
                transcripts_total=ins.get("transcripts_total"),
                frequency_pct=ins.get("frequency_pct"),
                total_mentions=ins.get("total_mentions"),
                emotional_valence_majority=ins.get("emotional_valence_majority"),
                severity_distribution=list(ins.get("severity_distribution") or []),
                avg_severity=ins.get("avg_severity"),
                max_severity=ins.get("max_severity"),
                min_severity=ins.get("min_severity"),
                modal_urgency=ins.get("modal_urgency"),
                impact_score=ins.get("impact_score"),
                evidence_pool=evidence_pool,
                source_themes=source_themes,
                contradictions=contradictions,
                action=action_by_insight.get(iid),
                debate=debate_by_id.get(iid),
            )
        )

    return out




# ── Endpoints ──


@router.get("/transcripts", response_model=List[TranscriptListItem])
async def list_transcripts(
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """List every completed Bolna call for the current company, with status of
    whether insights are ready for it in GCS.

    Reads:
    - `study_call_logs` + `research_leads` + `research_cohorts` (the lead's
      cohort name becomes the UI's "persona" field)
    - GCS bucket listing for the company prefix (one listing call)
    """
    # Join: every StudyCallLog row whose lead belongs to this company
    sql = text(
        """
        SELECT scl.id AS call_log_id,
               scl.call_status,
               scl.call_duration,
               scl.created_at,
               scl.transcript_gcs_path,
               rl.first_name,
               rl.last_name,
               rc.name AS cohort_name
        FROM study_call_logs scl
        JOIN research_leads rl ON rl.id = scl.lead_id
        LEFT JOIN research_cohorts rc ON rc.id = rl.cohort_id
        WHERE rl.company_id = :company_id
        ORDER BY scl.created_at DESC
        LIMIT 200
        """
    )
    rows = (await session.execute(sql, {"company_id": company_id})).mappings().all()

    # One bucket listing → set of call_log_ids with insights ready
    ready_ids: set[str] = set()
    try:
        ready_ids = await asyncio.to_thread(_list_ready_insights_sync, company_id)
    except Exception as exc:
        logger.warning(f"[Insights] failed to list bucket for company={company_id}: {exc!r}")

    items: List[TranscriptListItem] = []
    for r in rows:
        call_log_id = str(r["call_log_id"])
        status_lower = (r["call_status"] or "").lower()
        # Status mapping:
        #   - insights file exists in GCS  → "done"
        #   - terminal status, no insights → "pending" (pipeline running or failed at LLM)
        #   - non-terminal call_status     → "pending" (call in progress)
        #   - call_status == "failed"      → "failed"
        if call_log_id in ready_ids:
            status = "done"
        elif status_lower in ("failed", "no-answer", "busy", "canceled", "call-disconnected"):
            status = "failed"
        else:
            status = "pending"

        full_name = " ".join(
            p for p in (r.get("first_name"), r.get("last_name")) if p
        ).strip() or "Unnamed lead"

        items.append(
            TranscriptListItem(
                id=call_log_id,
                name=full_name,
                status=status,
                ingested_at=(r["created_at"]).isoformat() if r["created_at"] else "",
                duration_minutes=int((r["call_duration"] or 0) / 60),
                persona=(r["cohort_name"] or "").strip() or "Unknown cohort",
            )
        )

    return items


@router.get("/transcripts/{call_log_id}", response_model=TranscriptDetailResponse)
async def get_transcript_insights(
    call_log_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Return the flattened insights for one call. 404 if no insights file yet."""
    sql = text(
        """
        SELECT scl.id AS call_log_id,
               scl.study_id,
               scl.call_status,
               scl.call_duration,
               scl.created_at,
               rl.first_name,
               rl.last_name,
               rl.company_id AS lead_company_id,
               rc.name AS cohort_name
        FROM study_call_logs scl
        JOIN research_leads rl ON rl.id = scl.lead_id
        LEFT JOIN research_cohorts rc ON rc.id = rl.cohort_id
        WHERE scl.id = :call_log_id
        """
    )
    row = (
        await session.execute(sql, {"call_log_id": call_log_id})
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Transcript not found")
    if row["lead_company_id"] != company_id:
        raise HTTPException(status_code=404, detail="Transcript not found")
    if not row["study_id"]:
        raise HTTPException(status_code=404, detail="Transcript not tied to a study")

    study_id = row["study_id"]
    transcript_obj_name = _transcript_object_name(company_id, study_id, call_log_id)
    insights_obj_name = _result_object_name(company_id, study_id, call_log_id)

    # Read transcript + insights from GCS in parallel.
    try:
        transcript_raw, insights_raw = await asyncio.gather(
            asyncio.to_thread(_download_json_sync, transcript_obj_name),
            asyncio.to_thread(_download_json_sync, insights_obj_name),
        )
    except Exception as exc:
        logger.error(f"[Insights] GCS read failed for {call_log_id}: {exc!r}")
        raise HTTPException(status_code=502, detail=f"GCS read failed: {exc}")

    if transcript_raw is None:
        raise HTTPException(
            status_code=404,
            detail="Transcript not found in GCS for this call",
        )

    transcript_text = transcript_raw.get("transcript") or ""
    messages = _parse_transcript(transcript_text)
    recording_url = transcript_raw.get("recording_url")

    insights_items: Optional[List[InsightItem]] = None
    if insights_raw is not None:
        insights_items = _flatten_insights(insights_raw, str(call_log_id))

    status = "done" if insights_items is not None else "pending"

    full_name = " ".join(
        p for p in (row.get("first_name"), row.get("last_name")) if p
    ).strip() or "Unnamed lead"

    return TranscriptDetailResponse(
        id=str(call_log_id),
        name=full_name,
        status=status,
        ingested_at=(row["created_at"]).isoformat() if row["created_at"] else "",
        duration_minutes=int((row["call_duration"] or 0) / 60),
        persona=(row["cohort_name"] or "").strip() or "Unknown cohort",
        transcript=messages,
        transcript_raw=transcript_text,
        recording_url=recording_url,
        insights=insights_items,
    )


# ═══════════════════════════════════════════════════════════════════════════
# Cross-runs
# ═══════════════════════════════════════════════════════════════════════════


def _cross_run_object_name(company_id: uuid.UUID, run_id: str) -> str:
    return f"{company_id}/cross-runs/{run_id}.json"


def _mint_oidc_token_sync(audience: str) -> str:
    """Mint a Google-signed OIDC ID token for the given audience using ADC.

    Used to authenticate synchronous HTTP calls from this backend to the
    insights-service Cloud Run revision (which verifies the same audience).
    Works in production via the Cloud Run service-account; in local dev,
    requires `gcloud auth application-default login`.
    """
    import google.auth
    import google.auth.transport.requests
    from google.oauth2 import id_token

    auth_req = google.auth.transport.requests.Request()
    return id_token.fetch_id_token(auth_req, audience)


def _upload_json_sync(object_name: str, payload: dict) -> str:
    bucket_name = settings.GCS_TRANSCRIPTS_BUCKET
    if not bucket_name:
        raise RuntimeError("GCS_TRANSCRIPTS_BUCKET not configured")
    blob = _get_storage_client().bucket(bucket_name).blob(object_name)
    blob.upload_from_string(
        json.dumps(payload).encode("utf-8"),
        content_type="application/json",
    )
    return f"gs://{bucket_name}/{object_name}"


def _list_cross_runs_sync(company_id: uuid.UUID) -> List[dict]:
    bucket_name = settings.GCS_TRANSCRIPTS_BUCKET
    if not bucket_name:
        return []
    bucket = _get_storage_client().bucket(bucket_name)
    items: List[dict] = []
    for blob in bucket.list_blobs(prefix=f"{company_id}/cross-runs/"):
        if not blob.name.endswith(".json"):
            continue
        # /<company>/cross-runs/<run_id>.json
        leaf = blob.name.rsplit("/", 1)[-1]
        run_id = leaf[: -len(".json")]
        items.append({
            "run_id": run_id,
            "object_name": blob.name,
            "generated_at": blob.updated.isoformat() if blob.updated else None,
            "size_bytes": blob.size,
        })
    items.sort(key=lambda x: x["generated_at"] or "", reverse=True)
    return items


# ── Request / response schemas ──


class CrossRunTriggerRequest(BaseModel):
    call_log_ids: List[uuid.UUID]
    brand_context: Optional[str] = None
    onboarding_plan: Optional[str] = None
    top_n: Optional[int] = None


class CrossRunTriggerResponse(BaseModel):
    run_id: str
    result_gcs_path: str
    insights_count: int
    surfaced_count: int
    elapsed_seconds: float


class CrossRunListItem(BaseModel):
    run_id: str
    generated_at: Optional[str] = None
    size_bytes: Optional[int] = None


class CrossRunDetailResponse(BaseModel):
    run_id: str
    generated_at: Optional[str] = None
    elapsed_seconds: Optional[float] = None
    transcript_ids: List[str] = []
    insights: List[InsightItem] = []
    filtered_insight_ids: List[str] = []
    usage: Optional[Dict[str, Any]] = None


# ── Trigger endpoint ──


@router.post("/cross-runs", response_model=CrossRunTriggerResponse)
async def trigger_cross_run(
    body: CrossRunTriggerRequest,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Run cross-transcript synthesis over the given call_log_ids.

    Fetches each call's _insights.json + _transcript.json from GCS, posts the
    inline per-transcript data to insights-service's /api/cross-runs, writes
    the result back to GCS under `<company>/cross-runs/<run_id>.json`.
    """
    if not body.call_log_ids or len(body.call_log_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="cross-runs need at least 2 call_log_ids",
        )

    if not settings.INSIGHTS_SERVICE_URL:
        raise HTTPException(
            status_code=503,
            detail="INSIGHTS_SERVICE_URL is not configured",
        )

    # 1) Verify every call belongs to this company + resolve study_id per call
    sql = text(
        """
        SELECT scl.id AS call_log_id, scl.study_id, rl.company_id
        FROM study_call_logs scl
        JOIN research_leads rl ON rl.id = scl.lead_id
        WHERE scl.id = ANY(:ids)
        """
    )
    rows = (
        await session.execute(sql, {"ids": [str(cid) for cid in body.call_log_ids]})
    ).mappings().all()
    by_id = {str(r["call_log_id"]): r for r in rows}
    for cid in body.call_log_ids:
        r = by_id.get(str(cid))
        if not r:
            raise HTTPException(status_code=404, detail=f"call_log {cid} not found")
        if r["company_id"] != company_id:
            raise HTTPException(status_code=404, detail=f"call_log {cid} not found")
        if not r["study_id"]:
            raise HTTPException(
                status_code=400,
                detail=f"call_log {cid} has no study_id (cross-run requires it)",
            )

    # 2) Pull every _insights.json + _transcript.json from GCS in parallel
    async def _load(cid: uuid.UUID) -> dict:
        r = by_id[str(cid)]
        study_id = r["study_id"]
        ins_path = _result_object_name(company_id, study_id, cid)
        tr_path = _transcript_object_name(company_id, study_id, cid)
        ins, tr = await asyncio.gather(
            asyncio.to_thread(_download_json_sync, ins_path),
            asyncio.to_thread(_download_json_sync, tr_path),
        )
        if ins is None:
            raise HTTPException(
                status_code=400,
                detail=f"call_log {cid}: no insights file at {ins_path}",
            )
        if tr is None:
            raise HTTPException(
                status_code=400,
                detail=f"call_log {cid}: no transcript file at {tr_path}",
            )
        per = ins.get("per_transcript") or {}
        # AggregatedInsight per-transcript outputs are stored by the source theme key
        # which may be either the call_log_id we used as transcript id OR the original
        # bolna call id. Take the first available.
        def _first(d: dict) -> Any:
            if not isinstance(d, dict):
                return None
            return next(iter(d.values()), None)

        extractor = _first(per.get("extractor")) or None
        contradiction = _first(per.get("contradiction")) or None
        severity = _first(per.get("severity")) or None
        if not extractor or not contradiction or not severity:
            raise HTTPException(
                status_code=400,
                detail=f"call_log {cid}: insights file missing per_transcript outputs",
            )
        return {
            "id": str(cid),
            "text": tr.get("transcript") or "",
            "extractor": extractor,
            "contradiction": contradiction,
            "severity": severity,
        }

    transcripts = await asyncio.gather(*[_load(cid) for cid in body.call_log_ids])

    # 3) POST inline to insights-service /api/cross-runs
    svc_url = settings.INSIGHTS_SERVICE_URL.rstrip("/") + "/api/cross-runs"
    headers = {"Content-Type": "application/json"}
    # Mint OIDC token (skipped in dev — insights-service bypasses verification there)
    if settings.ENVIRONMENT != "development":
        try:
            token = await asyncio.to_thread(
                _mint_oidc_token_sync, settings.INSIGHTS_SERVICE_URL
            )
            headers["Authorization"] = f"Bearer {token}"
        except Exception as exc:
            logger.error(f"[CrossRun] OIDC mint failed: {exc!r}")
            raise HTTPException(status_code=503, detail=f"OIDC mint failed: {exc}")

    payload = {
        "transcripts": transcripts,
        "brand_context": body.brand_context,
        "onboarding_plan": body.onboarding_plan,
        "top_n": body.top_n,
    }

    async with httpx.AsyncClient(timeout=600.0) as client:
        try:
            resp = await client.post(svc_url, json=payload, headers=headers)
        except httpx.HTTPError as exc:
            logger.error(f"[CrossRun] HTTP call failed: {exc!r}")
            raise HTTPException(status_code=502, detail=f"insights-service unreachable: {exc}")
    if resp.status_code != 200:
        logger.error(f"[CrossRun] insights-service returned {resp.status_code}: {resp.text[:500]}")
        raise HTTPException(
            status_code=502,
            detail=f"insights-service returned {resp.status_code}: {resp.text[:300]}",
        )

    result = resp.json()

    # 4) Persist result to GCS at <company>/cross-runs/<run_id>.json
    run_id = f"cross-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}-{uuid.uuid4().hex[:8]}"
    # Stamp call_log_ids back onto the payload before persisting (insights-service
    # echoes transcript_ids as the inline `id`s we passed — already the call_log_ids).
    result["run_id"] = run_id
    result["company_id"] = str(company_id)
    obj_name = _cross_run_object_name(company_id, run_id)
    gs_path = await asyncio.to_thread(_upload_json_sync, obj_name, result)

    return CrossRunTriggerResponse(
        run_id=run_id,
        result_gcs_path=gs_path,
        insights_count=len((result.get("aggregated") or {}).get("aggregated_insights") or []),
        surfaced_count=len(result.get("filtered_insight_ids") or []),
        elapsed_seconds=float(result.get("elapsed_seconds") or 0.0),
    )


# ── List + detail endpoints ──


@router.get("/cross-runs", response_model=List[CrossRunListItem])
async def list_cross_runs(
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """List every cross-run blob for the current company."""
    items = await asyncio.to_thread(_list_cross_runs_sync, company_id)
    return [
        CrossRunListItem(
            run_id=i["run_id"],
            generated_at=i.get("generated_at"),
            size_bytes=i.get("size_bytes"),
        )
        for i in items
    ]


@router.get("/cross-runs/{run_id}", response_model=CrossRunDetailResponse)
async def get_cross_run(
    run_id: str,
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Return one cross-run's flattened insights from GCS."""
    obj_name = _cross_run_object_name(company_id, run_id)
    try:
        raw = await asyncio.to_thread(_download_json_sync, obj_name)
    except Exception as exc:
        logger.error(f"[CrossRun] GCS read failed for {run_id}: {exc!r}")
        raise HTTPException(status_code=502, detail=f"GCS read failed: {exc}")
    if raw is None:
        raise HTTPException(status_code=404, detail="cross-run not found")

    insights = _flatten_insights(raw, run_id)

    return CrossRunDetailResponse(
        run_id=run_id,
        generated_at=raw.get("generated_at"),
        elapsed_seconds=raw.get("elapsed_seconds"),
        transcript_ids=list(raw.get("transcript_ids") or []),
        insights=insights,
        filtered_insight_ids=list(raw.get("filtered_insight_ids") or []),
        usage=raw.get("usage"),
    )
