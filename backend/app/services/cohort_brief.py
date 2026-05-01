"""
Cohort Brief — single source of truth for the cohort-brief data shape and the
DB→brief transform.

Used by:
- GET /studies/{study_id}/cohorts/{cohort_id}/brief — returned to the frontend
- agent_prompt_generator.input_builder — wrapped with execution_config and fed
  to the meta-prompt LLM call
- Future: report exports, background jobs, tests

The Pydantic response models live here too because they ARE the canonical
shape — the wire format and the in-memory shape are the same thing.
"""

import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.designed_study import DesignedStudy
from app.models.study_designer.cohort_question_script import CohortQuestionScript
from app.models.study_designer.research_cohort import ResearchCohort


# ── Hardcoded defaults ─────────────────────────────────────────────────────
# These are the same content for every cohort today. Lifted into config /
# per-cohort overrides when the moderator/structure sections become editable.

_COHORT_HYPOTHESIS_PLACEHOLDER = (
    "Hypothesis authoring is coming soon. For now, treat this as a placeholder "
    "while you validate definition and objectives."
)

_DEFAULT_MODERATOR_INTRO_SCRIPT = (
    "Hi {participant_name}, thanks for making the time. This is a short "
    "research conversation — no sales, no pitches. There are no right or "
    "wrong answers; we're just here to learn from your experience."
)
_DEFAULT_MODERATOR_CONSENT = (
    "We'll record audio for note-taking only. Your name won't appear in any "
    "report, and you can stop any time."
)
_DEFAULT_MODERATOR_TONE = (
    "Warm, curious, non-judgmental. Let silences breathe. Probe tangents when "
    "emotion surfaces. Stay neutral — never validate answers with 'that's "
    "great' or 'amazing.'"
)
_DEFAULT_MODERATOR_DOS: List[str] = [
    "Mirror the participant's exact vocabulary",
    "Pause 3 seconds after each answer before probing",
    "Ask for one concrete example whenever they generalize",
    "Anchor every probe to a real past moment",
]
_DEFAULT_MODERATOR_DONTS: List[str] = [
    "Don't lead with brand names — let the participant name them first",
    "Don't validate answers with 'that's great' or 'amazing'",
    "Don't skip probes to stay on schedule",
    "Don't ask 'would you' or future-hypothetical questions",
]

_DEFAULT_IDEAL_RESPONDENT_PROFILE = (
    "A participant who can speak in concrete detail about a recent decision, "
    "including the trade-offs they weighed and what almost changed their mind. "
    "They're comfortable telling stories about their actual behavior, not "
    "hypotheticals, and willing to share specifics about brands, prices, and "
    "moments of friction."
)

_DEFAULT_STRUCTURE_PHASES: List[Dict[str, str]] = [
    {
        "name": "Warm-up",
        "duration": "2 min",
        "description": "Build rapport and surface context. No leading questions.",
    },
    {
        "name": "Core Exploration",
        "duration": "9 min",
        "description": "Walk through a recent, concrete decision in detail. Probe for the trade-offs and break-points.",
    },
    {
        "name": "Trade-off Probe",
        "duration": "2 min",
        "description": "Test stated vs revealed preferences. Anchor every probe to a real past moment.",
    },
    {
        "name": "Wrap-up",
        "duration": "1 min",
        "description": "Recap the 2–3 things they said, capture one-word associations, and close warmly.",
    },
]


# ── Pydantic models (canonical shape, also used as the HTTP response) ──────

class ContextSection(BaseModel):
    definition: str
    hypothesis: str
    objectives: List[str]


class ScriptQuestion(BaseModel):
    id: uuid.UUID
    question_number: int
    text: str
    uncovers: str
    objective_link: str
    tag: str
    depth: int
    type_descriptor: str
    probes: List[str]
    estimated_minutes: float
    priority: str  # "must_ask" | "if_time_permits"


class ScriptKrqGroup(BaseModel):
    krq_index: int
    krq_section_text: str
    questions: List[ScriptQuestion]
    total_estimated_minutes: float


class ScriptSection(BaseModel):
    krq_groups: List[ScriptKrqGroup]
    total_estimated_minutes: float


class ScreeningSection(BaseModel):
    include_criteria: List[str]
    exclude_criteria: List[str]
    ideal_respondent_profile: str


class ModeratorSection(BaseModel):
    intro_script: str
    consent: str
    tone: str
    dos: List[str]
    donts: List[str]


class StructurePhase(BaseModel):
    name: str
    duration: str
    description: str


class StructureSection(BaseModel):
    phases: List[StructurePhase]


class CohortBrief(BaseModel):
    """The complete cohort brief — wire format for the brief endpoint."""
    context_section: ContextSection
    script_section: Optional[ScriptSection] = None
    screening_section: Optional[ScreeningSection] = None
    moderator_section: ModeratorSection
    structure_section: StructureSection
    incentive: str


# ── Builder ────────────────────────────────────────────────────────────────

async def build_cohort_brief(
    session: AsyncSession,
    study: DesignedStudy,
    cohort: ResearchCohort,
) -> CohortBrief:
    """
    Build the complete cohort brief from DB state.

    Pure function: no HTTP, no auth, no caching, no logging. Takes already-
    loaded study + cohort, returns the canonical brief.

    Caller is responsible for loading and authorizing study + cohort.
    """
    objectives = [
        str(o.get("title", "")).strip()
        for o in (study.topic_guide or {}).get("objectives", [])
        if isinstance(o, dict) and o.get("title")
    ]

    context_section = ContextSection(
        definition=cohort.description or "",
        hypothesis=cohort.hypothesis or _COHORT_HYPOTHESIS_PLACEHOLDER,
        objectives=objectives,
    )

    script_section = await _build_script_section(session, cohort.id)
    screening_section = _build_screening_section(cohort)

    return CohortBrief(
        context_section=context_section,
        script_section=script_section,
        screening_section=screening_section,
        moderator_section=ModeratorSection(
            intro_script=_DEFAULT_MODERATOR_INTRO_SCRIPT,
            consent=_DEFAULT_MODERATOR_CONSENT,
            tone=_DEFAULT_MODERATOR_TONE,
            dos=list(_DEFAULT_MODERATOR_DOS),
            donts=list(_DEFAULT_MODERATOR_DONTS),
        ),
        structure_section=StructureSection(
            phases=[StructurePhase(**p) for p in _DEFAULT_STRUCTURE_PHASES],
        ),
        incentive=cohort.incentive,
    )


# ── Internal helpers ───────────────────────────────────────────────────────

async def _build_script_section(
    session: AsyncSession,
    cohort_id: uuid.UUID,
) -> Optional[ScriptSection]:
    """Group CohortQuestionScript rows into KRQ-keyed sections.

    Returns None if no script has been generated for this cohort yet.
    """
    script_stmt = (
        select(CohortQuestionScript)
        .where(CohortQuestionScript.cohort_id == cohort_id)
        .order_by(
            CohortQuestionScript.krq_sort_order,
            CohortQuestionScript.sort_order,
        )
    )
    script_rows = (await session.exec(script_stmt)).all()

    if not script_rows:
        return None

    # Group by krq_index, preserving the order of first appearance
    # (krq_sort_order drives ordering via the ORDER BY above).
    groups_by_index: Dict[int, Dict[str, Any]] = {}
    order_seen: List[int] = []
    for row in script_rows:
        if row.krq_index not in groups_by_index:
            groups_by_index[row.krq_index] = {
                "krq_index": row.krq_index,
                "krq_section_text": row.krq_section_text,
                "questions": [],
                "total_estimated_minutes": 0.0,
            }
            order_seen.append(row.krq_index)
        group = groups_by_index[row.krq_index]
        probes_list = [
            str(p) for p in (row.probes or []) if isinstance(p, str) or p is not None
        ]
        group["questions"].append(
            ScriptQuestion(
                id=row.id,
                question_number=row.question_number,
                text=row.text,
                uncovers=row.uncovers or "",
                objective_link=row.objective_link or "",
                tag=row.tag or "",
                depth=row.depth,
                type_descriptor=row.type_descriptor or "",
                probes=probes_list,
                estimated_minutes=row.estimated_minutes or 0.0,
                priority=row.priority or "must_ask",
            )
        )
        group["total_estimated_minutes"] += row.estimated_minutes or 0.0

    krq_groups = [
        ScriptKrqGroup(
            krq_index=groups_by_index[i]["krq_index"],
            krq_section_text=groups_by_index[i]["krq_section_text"],
            questions=groups_by_index[i]["questions"],
            total_estimated_minutes=round(
                groups_by_index[i]["total_estimated_minutes"], 2
            ),
        )
        for i in order_seen
    ]
    total = round(sum(g.total_estimated_minutes for g in krq_groups), 2)
    return ScriptSection(
        krq_groups=krq_groups,
        total_estimated_minutes=total,
    )


def _build_screening_section(cohort: ResearchCohort) -> ScreeningSection:
    """Pull include/exclude criteria from cohort.meta_data; profile is hardcoded for now."""
    screening_meta = (cohort.meta_data or {}).get("screening_criteria") or {}
    return ScreeningSection(
        include_criteria=[
            str(x).strip()
            for x in (screening_meta.get("include_criteria") or [])
            if str(x).strip()
        ],
        exclude_criteria=[
            str(x).strip()
            for x in (screening_meta.get("exclude_criteria") or [])
            if str(x).strip()
        ],
        ideal_respondent_profile=_DEFAULT_IDEAL_RESPONDENT_PROFILE,
    )
