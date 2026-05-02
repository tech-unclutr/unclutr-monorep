"""
Agent Resolver — single source of truth for "which execution agent identity
should this cohort use?".

Resolution chain:
1. cohort.agent_configuration_id  -> the linked agent
2. company default (is_default=true within the cohort's company)
3. hardcoded fallback (preserves pre-agent_configurations behavior)

Used by the meta-prompt input builder (agent_prompt_generator/input_builder.py)
and the runtime call path (study_execution/caller.py + prompt_resolver.py)
so the generated agent prompt and the actual call always share one identity.
"""

from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.study_designer import AgentConfiguration, ResearchCohort


HARDCODED_FALLBACK_NAME = "Aditi"
HARDCODED_FALLBACK_GENDER = "female"
HARDCODED_FALLBACK_LANGUAGE = "en-IN"
HARDCODED_FALLBACK_VOICE_ID = "default"
HARDCODED_FALLBACK_CONVERSATION_LANGUAGE = "english"


@dataclass(frozen=True)
class ResolvedAgent:
    name: str
    gender: str
    language: str
    voice_id: str
    conversation_language: str
    source: str  # "cohort" | "company_default" | "fallback"


_FALLBACK = ResolvedAgent(
    name=HARDCODED_FALLBACK_NAME,
    gender=HARDCODED_FALLBACK_GENDER,
    language=HARDCODED_FALLBACK_LANGUAGE,
    voice_id=HARDCODED_FALLBACK_VOICE_ID,
    conversation_language=HARDCODED_FALLBACK_CONVERSATION_LANGUAGE,
    source="fallback",
)


def _to_resolved(agent: AgentConfiguration, source: str) -> ResolvedAgent:
    gender_value = getattr(agent.gender, "value", agent.gender) or HARDCODED_FALLBACK_GENDER
    conv_lang_value = (
        getattr(agent.conversation_language, "value", agent.conversation_language)
        or HARDCODED_FALLBACK_CONVERSATION_LANGUAGE
    )
    return ResolvedAgent(
        name=agent.name,
        gender=gender_value,
        language=agent.language,
        voice_id=agent.voice_id,
        conversation_language=conv_lang_value,
        source=source,
    )


async def resolve_for_cohort(
    session: AsyncSession,
    cohort: ResearchCohort,
) -> ResolvedAgent:
    """Resolve the agent for a known cohort row. Never raises; always returns a value."""
    if cohort.agent_configuration_id is not None:
        agent = await session.get(AgentConfiguration, cohort.agent_configuration_id)
        if agent is not None and agent.company_id == cohort.company_id:
            return _to_resolved(agent, "cohort")

    return await _resolve_company_default_or_fallback(session, cohort.company_id)


async def resolve_for_cohort_id(
    session: AsyncSession,
    cohort_id: Optional[UUID],
    company_id: UUID,
) -> ResolvedAgent:
    """Resolve when only the cohort id is in hand (e.g. from a lead). Falls back gracefully on missing cohort."""
    if cohort_id is None:
        return await _resolve_company_default_or_fallback(session, company_id)

    cohort = await session.get(ResearchCohort, cohort_id)
    if cohort is None or cohort.company_id != company_id:
        return await _resolve_company_default_or_fallback(session, company_id)

    return await resolve_for_cohort(session, cohort)


async def get_company_default(
    session: AsyncSession,
    company_id: UUID,
) -> Optional[AgentConfiguration]:
    """Return the company's default AgentConfiguration row, or None."""
    stmt = select(AgentConfiguration).where(
        AgentConfiguration.company_id == company_id,
        AgentConfiguration.is_default == True,  # noqa: E712
    )
    return (await session.exec(stmt)).first()


async def _resolve_company_default_or_fallback(
    session: AsyncSession,
    company_id: UUID,
) -> ResolvedAgent:
    default = await get_company_default(session, company_id)
    if default is not None:
        return _to_resolved(default, "company_default")
    return _FALLBACK
