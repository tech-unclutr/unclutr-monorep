"""
Per-section input builders for the voice-agent prompt generator.

Each section meta-prompt under `prompts/voice_agent_prompt_sections/` consumes
a JSON payload with a known shape. These builders shape the cohort brief +
study into that payload — one builder per section.
"""

from typing import Any, Dict

from app.models.designed_study import DesignedStudy
from app.services.cohort_brief import CohortBrief, ScriptKrqGroup


def _study_payload(study: DesignedStudy) -> Dict[str, Any]:
    return {
        "title": study.title or "",
        "briefing": study.briefing or "",
        "topic_guide": study.topic_guide or {"objectives": []},
    }


def build_touchpoints_input(
    brief: CohortBrief,
    study: DesignedStudy,
) -> Dict[str, Any]:
    """Payload for the additional_touchpoints section meta-prompt."""
    return {
        "cohort_brief": brief.model_dump(mode="json"),
        "study": _study_payload(study),
        "focus_krq": None,
    }


def build_guardrails_input(
    brief: CohortBrief,
    study: DesignedStudy,
) -> Dict[str, Any]:
    """Payload for the guardrails section meta-prompt."""
    return {
        "cohort_brief": brief.model_dump(mode="json"),
        "study": _study_payload(study),
        "focus_krq": None,
    }


def build_wrap_up_input(
    brief: CohortBrief,
    study: DesignedStudy,
) -> Dict[str, Any]:
    """Payload for the wrap_up section meta-prompt."""
    return {
        "cohort_brief": brief.model_dump(mode="json"),
        "study": _study_payload(study),
        "focus_krq": None,
    }


def build_krq_block_input(
    brief: CohortBrief,
    study: DesignedStudy,
    krq_group: ScriptKrqGroup,
    step_offset: int,
) -> Dict[str, Any]:
    """Payload for one krq_block section meta-prompt call."""
    return {
        "cohort_brief": brief.model_dump(mode="json"),
        "study": _study_payload(study),
        "focus_krq": krq_group.model_dump(mode="json"),
        "step_offset": step_offset,
    }
