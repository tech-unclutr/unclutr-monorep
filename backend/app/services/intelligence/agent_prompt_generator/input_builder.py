"""
Builds the structured JSON input the meta-prompt expects.

Walks DesignedStudy + ResearchCohort + CohortQuestionScript + AgentConfiguration
and shapes them into the {study, cohorts: [...], execution_config} object that
the meta-prompt at prompts/voice_agent_meta_prompt.md operates on.
"""

from typing import Any, Dict

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.company import Company
from app.models.designed_study import DesignedStudy
from app.models.study_designer.research_cohort import ResearchCohort
from app.models.user import User
from app.services.agent_resolver import resolve_for_cohort
from app.services.cohort_brief import build_cohort_brief
from app.services.study_execution.prompt_resolver import RUNTIME_VAR_NAMES


# Hardcoded execution_config defaults. Each TODO marks a future column read
# (see plan tasks 4/6/7/8) — for now we ship one consistent posture per call.
_DEFAULT_LANGUAGE_PREFERENCE = "mirror_user"  # TODO(task-4): read from agent_configurations.language_preference
_DEFAULT_SECONDARY_LANGUAGE = "none"          # TODO(task-4): pair with language_preference
_DEFAULT_CALL_TYPE = "research"               # TODO(task-6): per-study override
_DEFAULT_CONTACT_SOURCE = "your past purchase"  # TODO(task-6): per-cohort override


async def build_meta_prompt_input(
    session: AsyncSession,
    study: DesignedStudy,
    cohort: ResearchCohort,
) -> Dict[str, Any]:
    """
    Assemble the meta-prompt's input JSON for one (study, cohort) pair.

    Returns a dict with shape:
        {
            "study": {...},
            "cohorts": [{...}],   # always a single-cohort list for this call
            "execution_config": {...},
        }

    See voice_agent_meta_prompt.md for the full expected schema.
    """
    brief = await build_cohort_brief(session, study, cohort)
    agent = await resolve_for_cohort(session, cohort)

    company = await session.get(Company, study.company_id)
    user = (
        await session.get(User, study.user_id)
        if study.user_id
        else None
    )

    cohort_payload: Dict[str, Any] = {
        "name": cohort.name,
        **brief.model_dump(mode="json", exclude={"incentive"}),
    }

    return {
        "study": {
            "title": study.title or "",
            "briefing": study.briefing or "",
            "executive_summary": study.executive_summary or "",
            "topic_guide": study.topic_guide or {"objectives": []},
            "key_research_questions": study.key_research_questions or [],
        },
        "cohorts": [cohort_payload],
        "execution_config": {
            "agent": {
                "name": agent.name,
                "gender": agent.gender,
            },
            "company": {
                "name": (company.brand_name if company else "") or "",
                "researcher_name": (user.full_name if user and user.full_name else "") or "",
            },
            "language_preference": _DEFAULT_LANGUAGE_PREFERENCE,
            "secondary_language": _DEFAULT_SECONDARY_LANGUAGE,
            "call_type": _DEFAULT_CALL_TYPE,
            "contact_source": _DEFAULT_CONTACT_SOURCE,
            "runtime_variables": list(RUNTIME_VAR_NAMES),
        },
    }
