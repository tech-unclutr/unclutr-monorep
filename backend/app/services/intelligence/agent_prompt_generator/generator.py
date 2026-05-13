"""
Voice-agent prompt orchestrator.

Reads `voice_agent_prompt.md` (the static template), substitutes
generation-time variables from the cohort brief, and fills the three
{llm_generated_*} slots with section meta-prompt outputs from
`prompts/voice_agent_prompt_sections/`. Returns a structured GeneratedPrompt
so the assembled string + per-section outputs are both available to callers
that may later expose per-section regeneration.

Section calls fan out in parallel (asyncio.gather):
  - additional_touchpoints  : 1 call
  - guardrails              : 1 call
  - krq_blocks              : N calls, one per KRQ group, joined in order

Phase headers are code-injected from `brief.structure_section.phases` —
deterministic, never LLM-derived.
"""

import asyncio
import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.designed_study import DesignedStudy
from app.models.study_designer.research_cohort import ResearchCohort
from app.services.agent_resolver import resolve_for_cohort
from app.services.cohort_brief import CohortBrief, build_cohort_brief
from app.services.intelligence.llm_service import llm_service

from .input_builder import (
    build_guardrails_input,
    build_krq_block_input,
    build_touchpoints_input,
    build_wrap_up_input,
)


logger = logging.getLogger(__name__)


_PROMPTS_DIR = Path(__file__).parents[1] / "prompts"
_TEMPLATE_PATH = _PROMPTS_DIR / "voice_agent_prompt.md"
_SECTIONS_DIR = _PROMPTS_DIR / "voice_agent_prompt_sections"
_TOUCHPOINTS_PATH = _SECTIONS_DIR / "additional_touchpoints.md"
_GUARDRAILS_PATH = _SECTIONS_DIR / "guardrails.md"
_KRQ_BLOCK_PATH = _SECTIONS_DIR / "krq_block.md"
_WRAP_UP_PATH = _SECTIONS_DIR / "wrap_up.md"

# Per-section calls are smaller than the legacy single-shot meta-prompt — Gemini
# Flash typically lands in 15-45s. Keep a generous ceiling for dense KRQs.
_GENERATION_TIMEOUT_SECONDS = 180.0

# Step numbering: Steps 1-3 are reserved for the welcome/consent flow that
# lives in the static template. The first KRQ question is Step 4.
_FIRST_KRQ_STEP_OFFSET = 4


@dataclass
class GeneratedPrompt:
    """Full assembled prompt plus the per-section LLM outputs.

    `prompt` is the runtime-ready string (with simple {var} placeholders left
    for prompt_resolver.py to substitute at call time). `sections` exposes the
    raw section outputs so a future ?section= endpoint can return / regenerate
    one without re-rolling the rest.
    """
    prompt: str
    sections: dict = field(default_factory=dict)


async def generate_agent_prompt(
    session: AsyncSession,
    study: DesignedStudy,
    cohort: ResearchCohort,
) -> GeneratedPrompt:
    """Generate the Bolna voice-agent prompt for one (study, cohort) pair.

    Pure I/O: input → template read → parallel LLM calls → assembled output.
    Caller handles caching / persistence.

    Raises:
        TimeoutError if any section call times out (caller maps to 504)
        RuntimeError if a meta-prompt file is missing or LLM is unconfigured
    """
    template = _read(_TEMPLATE_PATH)
    touchpoints_meta = _read(_TOUCHPOINTS_PATH)
    guardrails_meta = _read(_GUARDRAILS_PATH)
    krq_block_meta = _read(_KRQ_BLOCK_PATH)
    wrap_up_meta = _read(_WRAP_UP_PATH)

    brief = await build_cohort_brief(session, study, cohort)
    agent = await resolve_for_cohort(session, cohort)

    llm_service._ensure_configured()
    if not llm_service.model:
        raise RuntimeError(
            "AI service unavailable. GEMINI_API_KEY may not be configured."
        )

    krq_groups = (
        brief.script_section.krq_groups if brief.script_section else []
    )
    # Filter each KRQ group's questions to only those the user has selected
    # (cohort.meta_data.selected_question_ids). Empty list = no opt-in = no KRQs.
    # Groups that end up with zero selected questions are dropped entirely so
    # the prompt doesn't render an empty phase block.
    selected_ids = set(brief.selected_question_ids or [])
    filtered_groups = []
    for g in krq_groups:
        kept = [q for q in g.questions if q.id in selected_ids]
        if not kept:
            continue
        filtered_groups.append(
            g.__class__(
                krq_index=g.krq_index,
                krq_section_text=g.krq_section_text,
                questions=kept,
                total_estimated_minutes=round(
                    sum(q.estimated_minutes or 0.0 for q in kept), 2
                ),
            )
        )
    krq_groups = filtered_groups
    if brief.script_section is not None:
        brief.script_section.krq_groups = filtered_groups
        brief.script_section.total_estimated_minutes = round(
            sum(g.total_estimated_minutes for g in filtered_groups), 2
        )

    step_offsets = _compute_step_offsets(krq_groups)

    touchpoints_task = _generate_section(
        touchpoints_meta,
        build_touchpoints_input(brief, study),
    )
    guardrails_task = _generate_section(
        guardrails_meta,
        build_guardrails_input(brief, study),
    )
    wrap_up_task = _generate_section(
        wrap_up_meta,
        build_wrap_up_input(brief, study),
    )
    krq_block_tasks = [
        _generate_section(
            krq_block_meta,
            build_krq_block_input(brief, study, group, step_offsets[i]),
        )
        for i, group in enumerate(krq_groups)
    ]

    touchpoints, guardrails, wrap_up, *krq_blocks = await asyncio.gather(
        touchpoints_task,
        guardrails_task,
        wrap_up_task,
        *krq_block_tasks,
    )

    sections_text = _stitch_with_phases(krq_blocks, brief)

    prompt = _substitute_generation_vars(template, brief, study, agent.gender)
    prompt = prompt.replace(
        "{llm_generated_additional_touchpoints}", touchpoints.strip()
    )
    prompt = prompt.replace(
        "{llm_generated_guardrails}", guardrails.strip()
    )
    prompt = prompt.replace("{llm_generated_sections}", sections_text)
    prompt = prompt.replace("{llm_generated_wrap_up}", wrap_up.strip())

    return GeneratedPrompt(
        prompt=prompt,
        sections={
            "touchpoints": touchpoints.strip(),
            "guardrails": guardrails.strip(),
            "wrap_up": wrap_up.strip(),
            "krq_blocks": [b.strip() for b in krq_blocks],
        },
    )


# ── Helpers ────────────────────────────────────────────────────────────────


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError as e:
        raise RuntimeError(f"Required prompt file not found at {path}") from e


def _compute_step_offsets(krq_groups: list) -> List[int]:
    """Pre-compute global step numbers for each KRQ block's first question."""
    offsets: List[int] = []
    cursor = _FIRST_KRQ_STEP_OFFSET
    for group in krq_groups:
        offsets.append(cursor)
        cursor += len(group.questions)
    return offsets


async def _generate_section(meta_prompt: str, payload: dict) -> str:
    payload_json = json.dumps(payload, ensure_ascii=False, indent=2)
    prompt = f"{meta_prompt}\n\n# INPUT\n\n```json\n{payload_json}\n```"
    return await llm_service._generate(
        prompt,
        timeout_override=_GENERATION_TIMEOUT_SECONDS,
    )


def _stitch_with_phases(krq_blocks: List[str], brief: CohortBrief) -> str:
    """Interleave phase headers between KRQ blocks.

    Phases come from brief.structure_section.phases. The Wrap-up phase is
    skipped — Step 12/13 in the static template handle that. KRQ N gets the
    matching phase by ordinal index; if there are more KRQs than non-wrap
    phases, the trailing KRQs continue under the last phase (no header
    repeated).
    """
    active_phases = [
        p for p in brief.structure_section.phases
        if p.name.strip().lower() != "wrap-up"
    ]

    parts: List[str] = []
    for i, block in enumerate(krq_blocks):
        if i < len(active_phases):
            phase = active_phases[i]
            parts.append(
                f"## Phase: {phase.name} ({phase.duration})\n"
                f"_{phase.description}_\n"
            )
        parts.append(block.strip())

    return "\n\n".join(parts)


def _substitute_generation_vars(
    template: str,
    brief: CohortBrief,
    study: DesignedStudy,
    agent_gender: str,
) -> str:
    """Fill {variable} placeholders that are known at generation time.

    Runtime placeholders ({participant_name}, {agent_name}, {company_name},
    {language_preference}, etc.) are intentionally left in place — they're
    substituted per-call by prompt_resolver.py.
    """
    cohort_summary = brief.context_section.definition or ""
    research_goal = (study.briefing or study.title or "").strip()
    short_research_goal = _short(research_goal, 50)
    hypothesis = brief.context_section.hypothesis or ""
    objectives_block = "\n".join(
        f"- {obj}" for obj in brief.context_section.objectives if obj
    )
    total_time = _round_minutes(
        brief.script_section.total_estimated_minutes
        if brief.script_section else 0.0
    )

    gender_lower = (agent_gender or "female").lower()
    gender_form = "feminine" if gender_lower == "female" else "masculine"

    replacements = {
        "{cohort_summary}": cohort_summary,
        "{research_goal}": research_goal,
        "{short_research_goal}": short_research_goal,
        "{hypothesis}": hypothesis,
        "{key_research_objectives}": objectives_block,
        "{total_time}": str(total_time),
        "{gender}": gender_lower,
        "{gender? feminine:masculine}": gender_form,
    }

    out = template
    for key, value in replacements.items():
        out = out.replace(key, value)
    return out


def _short(text: str, max_chars: int) -> str:
    text = text.strip()
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 1].rstrip() + "…"


def _round_minutes(minutes: float) -> int:
    if minutes <= 0:
        return 15
    return max(1, round(minutes))
