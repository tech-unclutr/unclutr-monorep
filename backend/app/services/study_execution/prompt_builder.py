"""
Study Execution — Prompt Builder

Composes per-combination (cohort × interview_type) execution prompts
server-side. Substitutes study/cohort/question variables; leaves
runtime placeholders intact for prompt_resolver.py to fill at call time.
"""

from pathlib import Path
from typing import Any
from uuid import UUID

from loguru import logger
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.designed_study import DesignedStudy
from app.models.study_designer.research_cohort import ResearchCohort
from app.models.study_designer.research_cohort_question import ResearchCohortQuestion
from app.models.study_designer.research_question import ResearchQuestion


_TEMPLATE_PATH = (
    Path(__file__).parents[1]
    / "intelligence"
    / "prompts"
    / "execution_prompt_template.md"
)

_BUCKET_INTERVIEW_TYPE_LABEL = {
    "chat": "chat screening",
    "audioA": "audio interview",
    "audioB": "audio interview",
    "audioC": "audio interview",
}


def _read_template() -> str:
    """Read execution_prompt_template.md and extract the body between fences."""
    content = _TEMPLATE_PATH.read_text(encoding="utf-8")
    marker = "## PROMPT TEMPLATE"
    idx = content.find(marker)
    if idx == -1:
        return content
    after = content[idx + len(marker):]
    start = after.find("```")
    if start == -1:
        return after.strip()
    start = after.find("\n", start) + 1
    end = after.find("```", start)
    return after[start:end].strip() if end != -1 else after[start:].strip()


def _format_objectives(study: DesignedStudy) -> str:
    """
    Format topic_guide.objectives for the {research_objectives} variable.
    Renders titles + descriptions only — questions are intentionally omitted
    so they don't duplicate (or override) the cohort × interview-type
    selection that lives in {question_set}.
    """
    topic_guide = study.topic_guide or {}
    objectives = topic_guide.get("objectives", []) if isinstance(topic_guide, dict) else []
    if not objectives:
        return "[not specified]"

    lines: list[str] = []
    for i, obj in enumerate(objectives):
        title = obj.get("title", "")
        lines.append(f"{i + 1}. {title}")
        desc = obj.get("description", "")
        if desc:
            lines.append(f"   {desc}")
    return "\n".join(lines)


def _format_questions(questions: list[ResearchQuestion]) -> str:
    """Format a list of ResearchQuestion rows into a numbered list string."""
    if not questions:
        return "[no questions]"
    lines: list[str] = []
    sorted_qs = sorted(questions, key=lambda q: q.sort_order or 0)
    for i, q in enumerate(sorted_qs):
        objective = ""
        if q.meta_data and isinstance(q.meta_data, dict):
            objective = q.meta_data.get("objective_title", "") or ""
        objective_part = f" ({objective})" if objective else ""
        qtype = (q.type or "open_ended").replace("_", "-")
        lines.append(f"{i + 1}. {q.text}{objective_part} [{qtype}]")
    return "\n".join(lines)


def _substitute(template: str, variables: dict[str, str]) -> str:
    """Plain {key} → value replacement."""
    result = template
    for key, value in variables.items():
        result = result.replace(f"{{{key}}}", value)
    return result


async def build_per_combination_prompts(
    session: AsyncSession,
    study_id: UUID,
) -> dict[str, dict[str, Any]]:
    """
    Build prompts for every (cohort × interview_type) combination of this study
    that has at least one question selected.

    Returns a dict keyed by f"{cohort_name}::{bucket}".
    Each value: { cohort, interviewType, label, questionCount, prompt }.

    Study/cohort/question variables are substituted.
    Runtime placeholders ({participant_name}, etc.) are LEFT INTACT
    for prompt_resolver.py to fill at call time.
    """
    study = await session.get(DesignedStudy, study_id)
    if not study:
        raise ValueError(f"Study {study_id} not found")

    template = _read_template()

    # Cohorts for this study's company
    cohort_stmt = select(ResearchCohort).where(
        ResearchCohort.company_id == study.company_id
    )
    cohorts = (await session.exec(cohort_stmt)).all()
    cohort_by_id = {c.id: c for c in cohorts}

    if not cohorts:
        logger.warning(f"[PromptBuilder] No cohorts found for study {study_id}")
        return {}

    # Questions for this study
    q_stmt = select(ResearchQuestion).where(
        ResearchQuestion.study_id == study_id
    )
    questions = (await session.exec(q_stmt)).all()
    question_by_id = {q.id: q for q in questions}

    # Cohort × question links
    link_stmt = select(ResearchCohortQuestion).where(
        ResearchCohortQuestion.cohort_id.in_([c.id for c in cohorts])
    )
    links = (await session.exec(link_stmt)).all()

    # Group by (cohort_id, interview_type) -> [questions]
    grouped: dict[UUID, dict[str, list[ResearchQuestion]]] = {}
    for link in links:
        q = question_by_id.get(link.question_id)
        if not q:
            continue
        grouped.setdefault(link.cohort_id, {}).setdefault(link.interview_type, []).append(q)

    # Pre-compute study-level strings
    study_title = study.title or "[study title not set]"
    research_brief = study.briefing or "[research brief not provided]"
    objectives_str = _format_objectives(study)

    results: dict[str, dict[str, Any]] = {}

    for cohort_id, by_bucket in grouped.items():
        cohort = cohort_by_id.get(cohort_id)
        if not cohort:
            continue
        cohort_name = cohort.name
        cohort_incentive = (cohort.incentive or "").strip()

        for bucket, qs in by_bucket.items():
            if not qs:
                continue

            is_chat = bucket == "chat"
            interview_type_label = _BUCKET_INTERVIEW_TYPE_LABEL.get(bucket, "audio interview")

            qualification_criteria = (
                _format_questions(qs)
                if is_chat
                else "[see chat screening prompt for qualification]"
            )
            incentive_line = (
                cohort_incentive
                if (cohort_incentive and not is_chat)
                else "[no incentive configured]"
            )

            variables = {
                "study_title": study_title,
                "research_brief": research_brief,
                "research_objectives": objectives_str,
                "cohort_name": cohort_name,
                "interview_type": interview_type_label,
                "question_set": _format_questions(qs),
                "qualification_criteria": qualification_criteria,
                "incentive_line": incentive_line,
            }

            prompt_text = _substitute(template, variables)
            key = f"{cohort_name}::{bucket}"
            results[key] = {
                "cohort": cohort_name,
                "interviewType": bucket,
                "label": f"{cohort_name} — {bucket}",
                "questionCount": len(qs),
                "prompt": prompt_text,
            }

    logger.info(
        f"[PromptBuilder] Built {len(results)} combination prompts for study {study_id}"
    )
    return results
