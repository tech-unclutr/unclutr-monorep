"""
Meta-prompt LLM call: feed the structured brief through Gemini using the
voice-agent meta-prompt as the system instruction. Returns the generated
Bolna agent script as markdown.

Mirrors the existing study_designer.py LLM call sites (executive summary,
title/brief, etc.) — same llm_service singleton, same timeout treatment.
"""

import json
from pathlib import Path

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.designed_study import DesignedStudy
from app.models.study_designer.research_cohort import ResearchCohort
from app.services.intelligence.llm_service import llm_service

from .input_builder import build_meta_prompt_input


_META_PROMPT_PATH = (
    Path(__file__).parents[1] / "prompts" / "voice_agent_meta_prompt.md"
)

# The meta-prompt produces the full 12-section Bolna script (~5k tokens of
# output). On Gemini Flash that's typically 30-90s but spikes past 2 minutes
# on dense cohorts (10+ KRQ groups). Generous ceiling, since the alternative
# is the user clicking "Get Agent Prompt" twice.
_GENERATION_TIMEOUT_SECONDS = 240.0


async def generate_agent_prompt(
    session: AsyncSession,
    study: DesignedStudy,
    cohort: ResearchCohort,
) -> str:
    """
    Generate the Bolna voice agent prompt for one (study, cohort) pair.

    Caller is responsible for caching / persistence — this function is pure
    I/O: input → LLM call → output string.

    Raises:
        TimeoutError if Gemini times out (caller should map to 504)
        RuntimeError if the meta-prompt file is missing or LLM is unconfigured
    """
    try:
        meta_prompt = _META_PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError as e:
        raise RuntimeError(
            f"Meta-prompt file not found at {_META_PROMPT_PATH}"
        ) from e

    payload = await build_meta_prompt_input(session, study, cohort)
    payload_json = json.dumps(payload, ensure_ascii=False, indent=2)

    prompt = f"{meta_prompt}\n\n# INPUT\n\n```json\n{payload_json}\n```"

    llm_service._ensure_configured()
    if not llm_service.model:
        raise RuntimeError(
            "AI service unavailable. GEMINI_API_KEY may not be configured."
        )

    return await llm_service._generate(
        prompt,
        timeout_override=_GENERATION_TIMEOUT_SECONDS,
    )
