"""
Study Execution — Runtime Prompt Resolver

One function, one job: take a prompt with {runtime_var} placeholders
and return it with every placeholder replaced by real per-call values.

Used by the Bolna caller AND the lead-card-modal endpoint so both
display exactly the same text that Bolna will see at call time.
"""

import re
from typing import Optional

from app.models.company import Company
from app.models.designed_study import DesignedStudy
from app.models.study_designer.research_lead import ResearchLead
from app.models.user import User


# The complete set of runtime placeholders the template may contain.
# Every one of these MUST be substituted before the prompt leaves the backend.
RUNTIME_VAR_NAMES = [
    "participant_name",
    "agent_name",
    "company_name",
    "language_preference",
    "disclosure_line",
    "consent_line",
    "recording_line",
    "calendar_link",
    "whatsapp_followup_link",
    "email_followup_address",
    "support_contact",
]

_LEFTOVER_PLACEHOLDER_RE = re.compile(
    r"\{(" + "|".join(RUNTIME_VAR_NAMES) + r")\}"
)


def build_runtime_replacements(
    lead: ResearchLead,
    study: Optional[DesignedStudy],
    company: Optional[Company],
    user: Optional[User],
) -> dict[str, str]:
    """Build the {placeholder_name: real_value} dict for a specific call."""
    lead_first_name = (
        (lead.first_name or "there").split()[0]
        if lead and lead.first_name
        else "there"
    )

    agent_name = "Research Assistant"
    if user and user.full_name:
        agent_name = user.full_name.split()[0]

    company_name = (
        (company.brand_name if company else None)
        or (study.title if study else None)
        or "our team"
    )

    language = "English"
    if study and getattr(study, "participant_languages", None):
        langs = study.participant_languages or []
        if langs:
            language = langs[0]

    support_contact = ""
    email_followup = ""
    if company:
        support_contact = company.support_email or company.support_phone or ""
        email_followup = company.support_email or ""

    return {
        "participant_name": lead_first_name,
        "agent_name": agent_name,
        "company_name": company_name,
        "language_preference": language,
        "disclosure_line": "This call is part of a research study. I'm an AI assistant.",
        "consent_line": "Do you consent to participate in this research study?",
        "recording_line": "This call may be recorded for research purposes.",
        "calendar_link": "",
        "whatsapp_followup_link": "",
        "email_followup_address": email_followup,
        "support_contact": support_contact,
    }


def resolve_runtime_vars(
    prompt_text: str,
    lead: ResearchLead,
    study: Optional[DesignedStudy],
    company: Optional[Company],
    user: Optional[User],
) -> str:
    """
    Substitute every runtime placeholder in `prompt_text` with real values.

    Guarantee: the returned string contains ZERO {placeholder} strings from
    RUNTIME_VAR_NAMES. Any unmatched placeholders are stripped as a final
    safety pass.
    """
    if not prompt_text:
        return ""

    replacements = build_runtime_replacements(lead, study, company, user)

    result = prompt_text
    for key, value in replacements.items():
        result = result.replace(f"{{{key}}}", value)

    # Safety net: strip any remaining {runtime_var} patterns.
    result = _LEFTOVER_PLACEHOLDER_RE.sub("", result)
    return result
