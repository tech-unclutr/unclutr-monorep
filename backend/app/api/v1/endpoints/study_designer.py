import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# Global cap on concurrent script-gen LLM calls across all users/requests.
# Each call takes ~60-120s; 6 keeps a single user's finalize fully parallel
# while preventing a thundering herd when multiple users hit finalize at once.
_SCRIPT_GEN_SEMA = asyncio.Semaphore(6)

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from sqlalchemy import delete

from app.core.db import get_session
from app.core.security import get_current_user
from app.models.designed_study import DesignedStudy
from app.models.study_designer import (
    AgentConfiguration,
    CohortQuestionScript,
    ConversationLanguage,
    ResearchCohort,
    ResearchLead,
    ResearchParticipant,
)
from app.models.user import User
from app.models.iam import CompanyMembership
from app.services.agent_resolver import get_company_default
from app.services.cohort_brief import CohortBrief, build_cohort_brief
from app.services.intelligence.agent_prompt_generator import generate_agent_prompt
from app.services.intelligence.llm_service import llm_service
from app.services.intelligence.schemas.cohort_script import (
    COHORT_SCRIPT_GEMINI_SCHEMA,
    CohortScriptResponse,
)

router = APIRouter()

_PROMPT_TEMPLATE_PATH = Path(__file__).parents[4] / "app" / "services" / "intelligence" / "prompts" / "execution_prompt_template.md"
_EXEC_SUMMARY_PROMPT_PATH = Path(__file__).parents[4] / "app" / "services" / "intelligence" / "prompts" / "executive_summary_prompt.md"
_TITLE_BRIEF_PROMPT_PATH = Path(__file__).parents[4] / "app" / "services" / "intelligence" / "prompts" / "title_brief_prompt.md"
_OBJECTIVES_PROMPT_PATH = Path(__file__).parents[4] / "app" / "services" / "intelligence" / "prompts" / "objectives_prompt.md"
_RESEARCH_QUESTIONS_PROMPT_PATH = Path(__file__).parents[4] / "app" / "services" / "intelligence" / "prompts" / "research_questions_prompt.md"
_WELCOME_PAGE_PROMPT_PATH = Path(__file__).parents[4] / "app" / "services" / "intelligence" / "prompts" / "welcome_page_prompt.md"
_COHORT_DEFINITIONS_PROMPT_PATH = Path(__file__).parents[4] / "app" / "services" / "intelligence" / "prompts" / "cohort_definitions_prompt.md"
_COHORT_INTERVIEW_SCRIPT_PROMPT_PATH = Path(__file__).parents[4] / "app" / "services" / "intelligence" / "prompts" / "cohort_interview_script_prompt.md"


def _strip_json_fences(raw_text: str) -> str:
    """Strip markdown code fences from LLM output so it can be JSON-parsed."""
    text = (raw_text or "").strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    return text.replace("```json", "").replace("```", "").strip()


def _extract_prompt_from_md(content: str) -> str:
    """Extract the raw prompt text from between the first ``` fences after '## PROMPT TEMPLATE'."""
    marker = "## PROMPT TEMPLATE"
    idx = content.find(marker)
    if idx == -1:
        return content
    after_marker = content[idx + len(marker):]
    start = after_marker.find("```")
    if start == -1:
        return after_marker.strip()
    # skip the opening fence line
    start = after_marker.find("\n", start) + 1
    end = after_marker.find("```", start)
    return after_marker[start:end].strip() if end != -1 else after_marker[start:].strip()


@router.get("/prompt-template")
async def get_execution_prompt_template():
    """Return the raw execution prompt template for client-side variable substitution."""
    try:
        content = _PROMPT_TEMPLATE_PATH.read_text(encoding="utf-8")
        return {"template": _extract_prompt_from_md(content)}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Prompt template file not found")


# ── Auth helpers ──

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


# ── Request / Response schemas ──

class ChatMessage(BaseModel):
    role: str
    content: str


class Proposal(BaseModel):
    type: str
    label: str
    value: Any
    targetId: Optional[str] = None
    parentId: Optional[str] = None


class AIAction(BaseModel):
    type: str
    objectiveIndex: Optional[int] = None
    questionIndex: Optional[int] = None
    toIndex: Optional[int] = None


# ── Executive Summary (first-step synthesis from raw brief) ──

class ExecutiveSummaryRequest(BaseModel):
    research_brief: str
    mode: Optional[str] = "initial"  # "initial" | "regenerate"


class ProposalEnvelopeResponse(BaseModel):
    reply: str
    proposals: List[Proposal]
    actions: List[AIAction]
    follow_up_chips: List[str]


async def _persist_cohort_candidates(
    session: AsyncSession, company_id: uuid.UUID, cohorts: list[dict]
) -> tuple[int, int]:
    """Upsert cohort candidates into research_cohorts (company-scoped).

    Names are used verbatim (no normalization). Behavior:
    - New cohort row → insert with description + hypothesis.
    - Existing cohort (matched by name within company) → update description and hypothesis
      only when the incoming payload provides a non-empty value for that field.
    Returns (created_count, updated_count). Best-effort: any failure is logged and
    swallowed — cohort persistence must never break the caller.
    """
    if not cohorts:
        return 0, 0
    try:
        existing_stmt = select(ResearchCohort).where(
            ResearchCohort.company_id == company_id
        )
        existing_by_name: dict[str, ResearchCohort] = {
            c.name: c for c in (await session.exec(existing_stmt)).all()
        }

        # Look up the company's default agent once. New cohorts get linked to
        # it on insert so the FK is concrete from creation; existing cohorts
        # are left alone (they were already backfilled by migration).
        default_agent = await get_company_default(session, company_id)
        default_agent_id = default_agent.id if default_agent else None

        created = 0
        updated = 0
        for c in cohorts:
            name = (c.get("name") or "").strip()
            if not name:
                continue
            description = (c.get("description") or "").strip()
            hypothesis = (c.get("hypothesis") or "").strip()
            include_criteria = c.get("include_criteria") or []
            exclude_criteria = c.get("exclude_criteria") or []
            has_screening = bool(include_criteria) or bool(exclude_criteria)

            row = existing_by_name.get(name)
            if row is None:
                new_meta: Dict[str, Any] = {}
                if has_screening:
                    new_meta["screening_criteria"] = {
                        "include_criteria": include_criteria,
                        "exclude_criteria": exclude_criteria,
                    }
                session.add(
                    ResearchCohort(
                        company_id=company_id,
                        name=name,
                        description=description or None,
                        hypothesis=hypothesis or None,
                        meta_data=new_meta,
                        agent_configuration_id=default_agent_id,
                    )
                )
                created += 1
            else:
                changed = False
                if description and description != row.description:
                    row.description = description
                    changed = True
                if hypothesis and hypothesis != row.hypothesis:
                    row.hypothesis = hypothesis
                    changed = True
                if has_screening:
                    next_meta: Dict[str, Any] = dict(row.meta_data or {})
                    next_meta["screening_criteria"] = {
                        "include_criteria": include_criteria,
                        "exclude_criteria": exclude_criteria,
                    }
                    if next_meta != (row.meta_data or {}):
                        row.meta_data = next_meta
                        changed = True
                if changed:
                    session.add(row)
                    updated += 1

        await session.commit()
        return created, updated
    except Exception as e:
        logger.warning(f"Failed to persist cohort candidates: {e}")
        await session.rollback()
        return 0, 0


@router.post("/executive-summary", response_model=ProposalEnvelopeResponse)
async def generate_executive_summary(request: ExecutiveSummaryRequest):
    """Generate an executive summary from the raw research brief. Uses a dedicated prompt file."""
    try:
        content = _EXEC_SUMMARY_PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Executive summary prompt file not found")

    template = _extract_prompt_from_md(content)
    prompt = template.replace("{{research_brief}}", request.research_brief or "")

    if (request.mode or "initial").lower() == "regenerate":
        prompt += "\n\nProduce a distinctly different angle than a typical first pass — vary the framing, cohort cuts, or strategic lens."

    try:
        llm_service._ensure_configured()
        if not llm_service.model:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. GEMINI_API_KEY may not be configured.",
            )
        raw_text = await llm_service._generate(prompt)
        summary = _strip_json_fences(raw_text)

        return ProposalEnvelopeResponse(
            reply="Here's your executive summary.",
            proposals=[
                Proposal(
                    type="update_executive_summary",
                    label="Executive Summary",
                    value=summary,
                )
            ],
            actions=[],
            follow_up_chips=[],
        )
    except HTTPException:
        raise
    except TimeoutError:
        logger.error("Gemini request timed out (executive summary)")
        raise HTTPException(status_code=504, detail="AI service timed out.")
    except Exception as e:
        logger.error(f"Executive summary generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Title + Brief (dedicated, single-call JSON generation) ──

class TitleBriefRequest(BaseModel):
    research_brief: str
    mode: Optional[str] = "initial"  # "initial" | "regenerate"


def _parse_title_brief_json(raw_text: str) -> tuple[str, str]:
    """Extract title and brief from the LLM's JSON output, tolerating common formatting quirks."""
    text = _strip_json_fences(raw_text)

    try:
        data = json.loads(text)
        title = str(data.get("title", "")).strip()
        brief = str(data.get("brief", "")).strip()
        if title and brief:
            return title, brief
    except (json.JSONDecodeError, Exception):
        pass

    # Regex fallback: pull "title" and "brief" string values
    import re
    title_match = re.search(r'"title"\s*:\s*"((?:[^"\\]|\\.)*)"', text)
    brief_match = re.search(r'"brief"\s*:\s*"((?:[^"\\]|\\.)*)"', text, re.DOTALL)
    if title_match and brief_match:
        return title_match.group(1).strip(), brief_match.group(1).encode().decode("unicode_escape").strip()

    raise ValueError("Could not parse title/brief JSON from LLM output")


@router.post("/title-brief", response_model=ProposalEnvelopeResponse)
async def generate_title_brief(request: TitleBriefRequest):
    """Generate the study Title and Research Brief in a single LLM call. Uses a dedicated prompt file."""
    try:
        content = _TITLE_BRIEF_PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Title/brief prompt file not found")

    template = _extract_prompt_from_md(content)
    prompt = template.replace("{{research_brief}}", request.research_brief or "")

    if (request.mode or "initial").lower() == "regenerate":
        prompt += "\n\nProduce a distinctly different framing, wording, and emphasis than a typical first pass."

    try:
        llm_service._ensure_configured()
        if not llm_service.model:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. GEMINI_API_KEY may not be configured.",
            )
        raw_text = await llm_service._generate(prompt)

        try:
            title, brief = _parse_title_brief_json(raw_text)
        except ValueError as e:
            logger.warning(f"Title/brief parse failure. Raw: {raw_text[:400]}")
            raise HTTPException(status_code=502, detail=f"AI returned unparseable output: {e}")

        return ProposalEnvelopeResponse(
            reply="Here's your title and research brief.",
            proposals=[
                Proposal(type="update_title", label="Study Title", value=title),
                Proposal(type="update_briefing", label="Research Brief", value=brief),
            ],
            actions=[],
            follow_up_chips=[],
        )
    except HTTPException:
        raise
    except TimeoutError:
        logger.error("Gemini request timed out (title/brief)")
        raise HTTPException(status_code=504, detail="AI service timed out.")
    except Exception as e:
        logger.error(f"Title/brief generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Objectives (dedicated, grounded in brief + executive summary) ──

class ObjectivesRequest(BaseModel):
    research_brief: str
    executive_summary: str
    mode: Optional[str] = "initial"  # "initial" | "regenerate"


def _parse_objectives_json(raw_text: str) -> list[dict]:
    """Extract the objectives array from the LLM's JSON output, tolerating common formatting quirks."""
    text = _strip_json_fences(raw_text)

    try:
        data = json.loads(text)
        objectives = data.get("objectives")
        if isinstance(objectives, list) and objectives:
            clean: list[dict] = []
            for obj in objectives:
                if not isinstance(obj, dict):
                    continue
                title = str(obj.get("title", "")).strip()
                description = str(obj.get("description", "")).strip()
                if title and description:
                    clean.append({"title": title, "description": description})
            if clean:
                return clean
    except (json.JSONDecodeError, Exception):
        pass

    raise ValueError("Could not parse objectives JSON from LLM output")


@router.post("/objectives", response_model=ProposalEnvelopeResponse)
async def generate_objectives(request: ObjectivesRequest):
    """Generate research objectives from the research brief + executive summary. Uses a dedicated prompt file."""
    try:
        content = _OBJECTIVES_PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Objectives prompt file not found")

    template = _extract_prompt_from_md(content)
    prompt = (
        template
        .replace("{{research_brief}}", request.research_brief or "")
        .replace("{{executive_summary}}", request.executive_summary or "")
    )

    if (request.mode or "initial").lower() == "regenerate":
        prompt += "\n\nProduce a distinctly different set of research angles than a typical first pass — vary the framing, ordering, and emphasis across the three objectives."

    try:
        llm_service._ensure_configured()
        if not llm_service.model:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. GEMINI_API_KEY may not be configured.",
            )
        raw_text = await llm_service._generate(prompt)

        try:
            objectives = _parse_objectives_json(raw_text)
        except ValueError as e:
            logger.warning(f"Objectives parse failure. Raw: {raw_text[:400]}")
            raise HTTPException(status_code=502, detail=f"AI returned unparseable output: {e}")

        return ProposalEnvelopeResponse(
            reply="Here are your research objectives.",
            proposals=[
                Proposal(
                    type="add_objective",
                    label=obj["title"],
                    value={"title": obj["title"], "description": obj["description"]},
                )
                for obj in objectives
            ],
            actions=[],
            follow_up_chips=[],
        )
    except HTTPException:
        raise
    except TimeoutError:
        logger.error("Gemini request timed out (objectives)")
        raise HTTPException(status_code=504, detail="AI service timed out.")
    except Exception as e:
        logger.error(f"Objectives generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Key Research Questions (dedicated, grounded in brief + executive summary) ──

class ResearchObjectiveInput(BaseModel):
    title: str
    description: str


class ResearchQuestionsRequest(BaseModel):
    research_brief: str
    executive_summary: str
    objectives: List[ResearchObjectiveInput] = []
    mode: Optional[str] = "initial"  # "initial" | "regenerate"


def _parse_research_questions_text(raw_text: str) -> list[dict]:
    """Parse the strict 'KEY RESEARCH QUESTIONS' text format into structured items.

    Tolerates markdown (bold `**...**`, italic `*...*`/`_..._`) and handles titles
    that wrap to the next line when the model uses multi-line formatting.
    """
    import re

    text = _strip_json_fences(raw_text)

    def _clean(s: str) -> str:
        s = s.strip()
        # Strip markdown bold/italic wrappers repeatedly in case of nesting
        while True:
            original = s
            s = re.sub(r"^\*{1,3}\s*", "", s)
            s = re.sub(r"\s*\*{1,3}$", "", s)
            s = re.sub(r"^_{1,2}\s*", "", s)
            s = re.sub(r"\s*_{1,2}$", "", s)
            s = s.strip()
            if s == original:
                break
        # Also strip a leading colon/dash that may be left behind when the
        # model put the delimiter on the question line ("** What specific...").
        s = re.sub(r"^[:\-–]\s*", "", s).strip()
        return s

    # Drop heading / blank lines
    lines: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.upper().startswith("KEY RESEARCH QUESTIONS"):
            continue
        lines.append(stripped)

    items: list[dict] = []
    numbered_re = re.compile(r"^\s*\d+\s*[\.\)]\s*(.+)$")
    inline_split_re = re.compile(r"^(.+?)\s*[:\-–]\s*(.+)$")

    i = 0
    while i < len(lines):
        line = lines[i]
        m = numbered_re.match(line)
        if not m:
            i += 1
            continue

        rest = m.group(1).strip()
        title = ""
        question = ""

        # Case A: title and question on the same line, separated by : - –
        split = inline_split_re.match(rest)
        if split and not split.group(1).endswith("*") and not split.group(1).endswith("_"):
            # Simple inline split (title does not end with stray markdown marker)
            title = split.group(1)
            question = split.group(2)
        elif split:
            # The split may still be valid even if title ends with ** — take it
            title = split.group(1)
            question = split.group(2)
        else:
            # Case B: title alone on this line; question on the following non-numbered line(s)
            title = rest
            # Gather the next lines until we hit another numbered item
            j = i + 1
            collected: list[str] = []
            while j < len(lines) and not numbered_re.match(lines[j]):
                collected.append(lines[j])
                j += 1
            question = " ".join(collected)
            i = j - 1  # outer loop will i+=1

        title = _clean(title)
        question = _clean(question)

        if title and question:
            items.append({"title": title, "question": question})

        i += 1

    if not items:
        raise ValueError("Could not parse any key research questions from LLM output")

    return items


@router.post("/research-questions", response_model=ProposalEnvelopeResponse)
async def generate_research_questions(request: ResearchQuestionsRequest):
    """Generate key research questions from the research brief + executive summary. Uses a dedicated prompt file."""
    try:
        content = _RESEARCH_QUESTIONS_PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Research questions prompt file not found")

    if request.objectives:
        objectives_block = "\n".join(
            f"{i + 1}. {o.title}: {o.description}"
            for i, o in enumerate(request.objectives)
        )
    else:
        objectives_block = "(none provided)"

    template = _extract_prompt_from_md(content)
    prompt = (
        template
        .replace("{{research_brief}}", request.research_brief or "")
        .replace("{{executive_summary}}", request.executive_summary or "")
        .replace("{{objectives}}", objectives_block)
    )

    if (request.mode or "initial").lower() == "regenerate":
        prompt += "\n\nProduce a distinctly different set of high-impact questions than a typical first pass — vary the journey stages, decision areas, and emphasis."

    try:
        llm_service._ensure_configured()
        if not llm_service.model:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. GEMINI_API_KEY may not be configured.",
            )
        raw_text = await llm_service._generate(prompt)

        try:
            items = _parse_research_questions_text(raw_text)
        except ValueError as e:
            logger.warning(f"Research questions parse failure. Raw: {raw_text[:400]}")
            raise HTTPException(status_code=502, detail=f"AI returned unparseable output: {e}")

        return ProposalEnvelopeResponse(
            reply="Here are your key research questions.",
            proposals=[
                Proposal(
                    type="set_research_questions",
                    label="Key Research Questions",
                    value=items,
                )
            ],
            actions=[],
            follow_up_chips=[],
        )
    except HTTPException:
        raise
    except TimeoutError:
        logger.error("Gemini request timed out (research questions)")
        raise HTTPException(status_code=504, detail="AI service timed out.")
    except Exception as e:
        logger.error(f"Research questions generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Welcome Page (dedicated, grounded in brief + executive summary) ──

class WelcomePageRequest(BaseModel):
    research_brief: str
    executive_summary: str
    mode: Optional[str] = "initial"  # "initial" | "regenerate"


def _parse_welcome_page_json(raw_text: str) -> tuple[str, str]:
    """Extract title and description from the LLM's JSON output, tolerating common formatting quirks."""
    text = _strip_json_fences(raw_text)

    try:
        data = json.loads(text)
        title = str(data.get("title", "")).strip()
        description = str(data.get("description", "")).strip()
        if title and description:
            return title, description
    except (json.JSONDecodeError, Exception):
        pass

    import re
    title_match = re.search(r'"title"\s*:\s*"((?:[^"\\]|\\.)*)"', text)
    desc_match = re.search(r'"description"\s*:\s*"((?:[^"\\]|\\.)*)"', text, re.DOTALL)
    if title_match and desc_match:
        return (
            title_match.group(1).strip(),
            desc_match.group(1).encode().decode("unicode_escape").strip(),
        )

    raise ValueError("Could not parse title/description JSON from LLM output")


@router.post("/welcome-page", response_model=ProposalEnvelopeResponse)
async def generate_welcome_page(request: WelcomePageRequest):
    """Generate the participant-facing Welcome Page title and description. Uses a dedicated prompt file."""
    try:
        content = _WELCOME_PAGE_PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Welcome page prompt file not found")

    template = _extract_prompt_from_md(content)
    prompt = (
        template
        .replace("{{research_brief}}", request.research_brief or "")
        .replace("{{executive_summary}}", request.executive_summary or "")
    )

    if (request.mode or "initial").lower() == "regenerate":
        prompt += "\n\nProduce a distinctly different welcome framing than a typical first pass — vary the opening hook, phrasing, and emphasis."

    try:
        llm_service._ensure_configured()
        if not llm_service.model:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. GEMINI_API_KEY may not be configured.",
            )
        raw_text = await llm_service._generate(prompt)

        try:
            title, description = _parse_welcome_page_json(raw_text)
        except ValueError as e:
            logger.warning(f"Welcome page parse failure. Raw: {raw_text[:400]}")
            raise HTTPException(status_code=502, detail=f"AI returned unparseable output: {e}")

        return ProposalEnvelopeResponse(
            reply="Here's your welcome page.",
            proposals=[
                Proposal(type="update_welcome_title", label="Welcome Title", value=title),
                Proposal(type="update_welcome_description", label="Welcome Description", value=description),
            ],
            actions=[],
            follow_up_chips=[],
        )
    except HTTPException:
        raise
    except TimeoutError:
        logger.error("Gemini request timed out (welcome page)")
        raise HTTPException(status_code=504, detail="AI service timed out.")
    except Exception as e:
        logger.error(f"Welcome page generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Prompt Chat (execution prompt assistant) ──

class PromptChatRequest(BaseModel):
    prompt: str
    messages: List[ChatMessage]
    user_message: str


class PromptSuggestion(BaseModel):
    section: str
    description: str
    modified_prompt: str


class PromptChatResponse(BaseModel):
    reply: str
    suggestion: Optional[PromptSuggestion] = None
    follow_up_chips: List[str]


PROMPT_CHAT_SYSTEM = """You are an execution prompt assistant for SquareUp, a consumer research platform.
Your job is to help users refine the AI voice agent's execution prompt before launching a campaign.

The execution prompt controls how the AI voice agent conducts research interviews. It contains:
- ROLE: The agent's persona and purpose
- CORE CONTEXT: Study title, research brief, objectives (filled with real data)
- TONE guidelines
- HARD BEHAVIOR RULES
- CALL FLOW: 10 states (OPENING → CONSENT → SCREENING → QUALIFICATION DECISION → MAIN INTERVIEW → PROBING → STUDY-SPECIFIC BRANCHES → TRANSITIONS → WRAP-UP → SCHEDULING)
- POST-CALL LOGIC

WHAT YOU CAN HELP WITH:
- Modifying the TONE (e.g., "make it warmer", "sound more formal")
- Adjusting CALL FLOW states (e.g., "add a case for churned users", "skip the incentive mention")
- Editing HARD BEHAVIOR RULES (e.g., "allow up to 3 probing questions", "never mention competitors")
- Updating the ROLE or CORE CONTEXT framing
- Adding new STUDY-SPECIFIC BRANCHES for cohorts or decision trees
- Rewording any section for clarity or brand voice

BEHAVIOR:
- When the user requests a change, apply it precisely to the prompt and return the full modified prompt
- When the user asks a question (not a change request), answer it without modifying the prompt
- Keep replies to 1-2 sentences — be direct and confident
- Always return valid JSON only

RESPONSE FORMAT (no markdown, no code blocks):
{
  "reply": "Conversational 1-2 sentence response",
  "suggestion": {
    "section": "The section name you modified (e.g., TONE, CALL FLOW, HARD BEHAVIOR RULES)",
    "description": "Short description of what changed",
    "modified_prompt": "The full modified prompt text here"
  },
  "follow_up_chips": ["Chip 1", "Chip 2", "Chip 3"]
}

If no modification is needed (informational query only), set "suggestion" to null.

Follow-up chips should be actionable next edits the user might want, e.g.:
- "Make the tone warmer"
- "Add a case for churned users"
- "Remove the incentive mention"
- "Shorten the opening script"
- "Add more probing questions"

Always return valid JSON only."""


def _build_prompt_chat_prompt(request: PromptChatRequest) -> str:
    parts = [PROMPT_CHAT_SYSTEM]
    parts.append(f"\n\nCURRENT EXECUTION PROMPT:\n{request.prompt}")
    if request.messages:
        parts.append("\n\nCONVERSATION HISTORY:")
        for msg in request.messages[-6:]:
            parts.append(f"\n{msg.role}: {msg.content}")
    parts.append(f"\n\nuser: {request.user_message}")
    parts.append("\n\nRespond with ONLY valid JSON:")
    return "\n".join(parts)


def _parse_prompt_chat_response(raw_text: str) -> PromptChatResponse:
    text = _strip_json_fences(raw_text)

    try:
        data = json.loads(text)
        suggestion_data = data.get("suggestion")
        suggestion = PromptSuggestion(**suggestion_data) if suggestion_data else None
        return PromptChatResponse(
            reply=data.get("reply", "I've updated the prompt."),
            suggestion=suggestion,
            follow_up_chips=data.get("follow_up_chips", []),
        )
    except Exception as e:
        logger.warning(f"Failed to parse prompt chat LLM response: {e}\nRaw: {text[:500]}")
        return PromptChatResponse(
            reply=text[:500] if text else "I can help you refine the execution prompt. What would you like to change?",
            suggestion=None,
            follow_up_chips=["Make the tone warmer", "Add a decision tree case", "Adjust behavior rules"],
        )


@router.post("/prompt-chat", response_model=PromptChatResponse)
async def prompt_chat(request: PromptChatRequest):
    """Chat endpoint for refining the execution agent prompt using Gemini."""
    llm_prompt = _build_prompt_chat_prompt(request)

    try:
        llm_service._ensure_configured()
        if not llm_service.model:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. GEMINI_API_KEY may not be configured.",
            )
        raw_text = await llm_service._generate(llm_prompt)
        return _parse_prompt_chat_response(raw_text)
    except HTTPException:
        raise
    except TimeoutError:
        logger.error("Gemini prompt-chat request timed out")
        raise HTTPException(status_code=504, detail="AI service timed out.")
    except Exception as e:
        logger.error(f"Prompt chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Persistence schemas ──

class StudySaveRequest(BaseModel):
    id: Optional[uuid.UUID] = None
    title: Optional[str] = ""
    initial_prompt: Optional[str] = ""
    briefing: Optional[str] = ""
    executive_summary: Optional[str] = ""
    emotion_detection: bool = False
    participant_languages: List[str] = ["English"]
    reporting_language: str = "English"
    advanced_settings: Dict[str, Any] = {}
    welcome_page: Dict[str, Any] = {}
    topic_guide: Dict[str, Any] = {}
    key_research_questions: List[Dict[str, Any]] = []
    conversation_history: List[Dict[str, Any]] = []
    status: Optional[str] = "DRAFT"


class StudySummary(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    initial_prompt: Optional[str]
    briefing: Optional[str]
    welcome_page: Optional[Dict[str, Any]] = None
    topic_guide: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── CRUD endpoints ──

@router.post("/save")
async def save_study(
    req: StudySaveRequest,
    session: AsyncSession = Depends(get_session),
    current_user_token: dict = Depends(get_current_user),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Create or update a designed study. Upserts by id (preferred) or (company_id, title)."""
    user_id = current_user_token.get("uid")

    # Prefer id-based lookup; fall back to (company_id, title) for legacy rows saved
    # before the frontend started sending id.
    existing: Optional[DesignedStudy] = None
    if req.id is not None:
        candidate = await session.get(DesignedStudy, req.id)
        if candidate and candidate.company_id == company_id:
            existing = candidate
    if existing is None and req.title:
        stmt = select(DesignedStudy).where(
            DesignedStudy.company_id == company_id,
            DesignedStudy.title == req.title,
        )
        existing = (await session.exec(stmt)).first()

    if existing:
        existing.title = req.title or existing.title
        existing.briefing = req.briefing
        existing.executive_summary = req.executive_summary
        existing.initial_prompt = req.initial_prompt
        existing.emotion_detection = req.emotion_detection
        existing.participant_languages = req.participant_languages
        existing.reporting_language = req.reporting_language
        existing.advanced_settings = req.advanced_settings
        existing.welcome_page = req.welcome_page
        existing.topic_guide = req.topic_guide
        existing.key_research_questions = req.key_research_questions
        existing.conversation_history = req.conversation_history
        existing.status = req.status or existing.status
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        return {"id": str(existing.id), "status": "updated"}

    # Create. Use the client-supplied id when present so subsequent saves stay linked.
    study = DesignedStudy(
        **({"id": req.id} if req.id is not None else {}),
        company_id=company_id,
        user_id=user_id,
        title=req.title or "",
        initial_prompt=req.initial_prompt,
        briefing=req.briefing,
        executive_summary=req.executive_summary,
        emotion_detection=req.emotion_detection,
        participant_languages=req.participant_languages,
        reporting_language=req.reporting_language,
        advanced_settings=req.advanced_settings,
        welcome_page=req.welcome_page,
        topic_guide=req.topic_guide,
        key_research_questions=req.key_research_questions,
        conversation_history=req.conversation_history,
        status=req.status or "DRAFT",
    )
    session.add(study)
    await session.commit()
    await session.refresh(study)
    return {"id": str(study.id), "status": "created"}


@router.get("/studies", response_model=List[StudySummary])
async def list_studies(
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """List all designed studies for the current company."""
    stmt = (
        select(DesignedStudy)
        .where(DesignedStudy.company_id == company_id, DesignedStudy.status != "ARCHIVED")
        .order_by(DesignedStudy.updated_at.desc())
    )
    results = await session.exec(stmt)
    return results.all()


@router.get("/studies/{study_id}")
async def get_study(
    study_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Get a single designed study with full data."""
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")
    return study


@router.delete("/studies/{study_id}")
async def archive_study(
    study_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Soft-delete a study by setting status to ARCHIVED."""
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")
    study.status = "ARCHIVED"
    study.updated_at = datetime.utcnow()
    session.add(study)
    await session.commit()
    return {"status": "archived"}


# ── Cohorts ──

@router.get("/cohorts")
async def list_cohorts(
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """List all research cohorts for the current company."""
    stmt = (
        select(ResearchCohort)
        .where(ResearchCohort.company_id == company_id)
        .order_by(ResearchCohort.created_at.desc())
    )
    results = await session.exec(stmt)
    return results.all()


# ── Cohort Brief (per-tab data for the recruitment Cohort Brief screen) ──
# The brief shape and DB→brief transform live in app.services.cohort_brief
# so the agent-prompt generator can consume the same data without duplicating
# the grouping logic. The Pydantic model `CohortBrief` is the wire format.


class CohortIncentiveUpdateRequest(BaseModel):
    incentive: str


class CohortModeratorLanguageUpdateRequest(BaseModel):
    conversation_language: ConversationLanguage


# ── Agent Prompt (per-cohort, server-rendered) ──

class AgentPromptResponse(BaseModel):
    prompt: str
    generated_at: Optional[datetime] = None


@router.get(
    "/studies/{study_id}/cohorts/{cohort_id}/agent-prompt",
    response_model=AgentPromptResponse,
)
async def get_cohort_agent_prompt(
    study_id: uuid.UUID,
    cohort_id: uuid.UUID,
    regenerate: bool = False,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Return the Bolna voice agent prompt for one cohort.

    Cached on `research_cohorts.voice_agent_prompt`. First read (or
    `?regenerate=true`) runs the meta-prompt LLM call (20-90s) and persists
    the result; subsequent reads return the stored prompt instantly.
    """
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")

    cohort = await session.get(ResearchCohort, cohort_id)
    if not cohort or cohort.company_id != company_id:
        raise HTTPException(status_code=404, detail="Cohort not found")

    if cohort.voice_agent_prompt and not regenerate:
        return AgentPromptResponse(
            prompt=cohort.voice_agent_prompt,
            generated_at=cohort.voice_agent_prompt_generated_at,
        )

    try:
        result = await generate_agent_prompt(session, study, cohort)
    except TimeoutError:
        logger.error("Gemini request timed out (agent prompt generation)")
        raise HTTPException(status_code=504, detail="Agent prompt generation timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent prompt generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    cohort.voice_agent_prompt = result.prompt
    cohort.voice_agent_prompt_generated_at = datetime.utcnow()
    session.add(cohort)
    await session.commit()
    await session.refresh(cohort)

    return AgentPromptResponse(
        prompt=cohort.voice_agent_prompt,
        generated_at=cohort.voice_agent_prompt_generated_at,
    )


@router.get(
    "/studies/{study_id}/cohorts/{cohort_id}/brief",
    response_model=CohortBrief,
)
async def get_cohort_brief(
    study_id: uuid.UUID,
    cohort_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Return the Cohort Brief payload for one cohort within one study.

    Loads + authorizes study + cohort, then delegates the brief assembly to
    `app.services.cohort_brief.build_cohort_brief` so the agent-prompt
    generator can consume the same shape.
    """
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")

    cohort = await session.get(ResearchCohort, cohort_id)
    if not cohort or cohort.company_id != company_id:
        raise HTTPException(status_code=404, detail="Cohort not found")

    return await build_cohort_brief(session, study, cohort)


@router.patch(
    "/studies/{study_id}/cohorts/{cohort_id}/incentive",
    response_model=CohortBrief,
)
async def update_cohort_incentive(
    study_id: uuid.UUID,
    cohort_id: uuid.UUID,
    payload: CohortIncentiveUpdateRequest,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Persist the incentive selected on the cohort brief screen."""
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")

    cohort = await session.get(ResearchCohort, cohort_id)
    if not cohort or cohort.company_id != company_id:
        raise HTTPException(status_code=404, detail="Cohort not found")

    cohort.incentive = payload.incentive.strip() or "No Incentive"
    session.add(cohort)
    await session.commit()
    await session.refresh(cohort)

    return await get_cohort_brief(
        study_id=study_id,
        cohort_id=cohort_id,
        session=session,
        company_id=company_id,
    )


@router.patch(
    "/studies/{study_id}/cohorts/{cohort_id}/moderator-language",
    response_model=CohortBrief,
)
async def update_cohort_moderator_language(
    study_id: uuid.UUID,
    cohort_id: uuid.UUID,
    payload: CohortModeratorLanguageUpdateRequest,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Persist the moderator conversation language selected on the cohort brief.

    Writes to the agent_configuration row resolved for the cohort (cohort's
    bound agent → company default). If multiple cohorts share that agent
    (e.g. the company default), they all see the change — language is a
    property of the agent identity, not the cohort. Returns 400 when no
    DB-backed agent exists yet (the runtime fallback is read-only).
    """
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")

    cohort = await session.get(ResearchCohort, cohort_id)
    if not cohort or cohort.company_id != company_id:
        raise HTTPException(status_code=404, detail="Cohort not found")

    agent: Optional[AgentConfiguration] = None
    if cohort.agent_configuration_id is not None:
        candidate = await session.get(
            AgentConfiguration, cohort.agent_configuration_id
        )
        if candidate is not None and candidate.company_id == company_id:
            agent = candidate
    if agent is None:
        agent = await get_company_default(session, company_id)
    if agent is None:
        raise HTTPException(
            status_code=400,
            detail="No agent configuration available — create one first.",
        )

    agent.conversation_language = payload.conversation_language
    agent.updated_at = datetime.utcnow()
    session.add(agent)
    await session.commit()

    return await get_cohort_brief(
        study_id=study_id,
        cohort_id=cohort_id,
        session=session,
        company_id=company_id,
    )


# ── Cohort Definition + Hypothesis generation (end-of-flow synthesis) ──

def _parse_cohorts_json(raw_text: str) -> list[dict]:
    """Extract cohort triples from the LLM's JSON output.

    Expects {"cohorts": [{"name", "description", "hypothesis"}, ...]}.
    Returns an empty list on parse failure so the caller can continue gracefully.
    """
    text = _strip_json_fences(raw_text)
    try:
        data = json.loads(text)
    except (json.JSONDecodeError, Exception):
        logger.warning(f"Cohort JSON parse failed. Raw: {text[:400]}")
        return []

    raw_cohorts = data.get("cohorts") if isinstance(data, dict) else None
    if not isinstance(raw_cohorts, list):
        return []

    def _clean_bullets(raw: Any) -> list[str]:
        if not isinstance(raw, list):
            return []
        out: list[str] = []
        for item in raw:
            if item is None:
                continue
            s = str(item).strip()
            if s:
                out.append(s)
        return out

    cohorts: list[dict] = []
    for c in raw_cohorts:
        if not isinstance(c, dict):
            continue
        name = str(c.get("name", "")).strip()
        if not name:
            continue
        cohorts.append({
            "name": name,
            "description": str(c.get("description", "")).strip(),
            "hypothesis": str(c.get("hypothesis", "")).strip(),
            "include_criteria": _clean_bullets(c.get("include_criteria")),
            "exclude_criteria": _clean_bullets(c.get("exclude_criteria")),
        })
    return cohorts


def _format_objectives_for_prompt(topic_guide: Dict[str, Any]) -> str:
    objectives = (topic_guide or {}).get("objectives", []) or []
    lines = []
    for i, o in enumerate(objectives, start=1):
        if not isinstance(o, dict):
            continue
        title = str(o.get("title", "")).strip()
        description = str(o.get("description", "")).strip()
        if title and description:
            lines.append(f"{i}. {title}: {description}")
        elif title:
            lines.append(f"{i}. {title}")
    return "\n".join(lines) if lines else "(none provided)"


def _format_research_questions_for_prompt(questions: List[Dict[str, Any]]) -> str:
    if not questions:
        return "(none provided)"
    lines = []
    for i, q in enumerate(questions, start=1):
        if not isinstance(q, dict):
            continue
        title = str(q.get("title", "")).strip()
        question = str(q.get("question", "")).strip()
        if title and question:
            lines.append(f"{i}. {title}: {question}")
        elif question:
            lines.append(f"{i}. {question}")
        elif title:
            lines.append(f"{i}. {title}")
    return "\n".join(lines) if lines else "(none provided)"


# ── Interview script helpers ──

def _krq_section_text(known_krq: Dict[str, Any]) -> str:
    title = str(known_krq.get("title", "")).strip()
    question = str(known_krq.get("question", "")).strip()
    if title and question:
        return f"{title}: {question}"
    return title or question


def _parse_structured_cohort_script(
    raw_text: str, known_krqs: List[Dict[str, Any]]
) -> list[dict]:
    """Parse Gemini's structured-output JSON into persist-ready question dicts.

    The LLM is constrained by CohortScriptResponse, so malformed JSON is rare.
    krq_index is authoritative — no fuzzy header matching.
    """
    text = _strip_json_fences(raw_text)
    if not text:
        return []

    try:
        payload = json.loads(text)
        parsed = CohortScriptResponse.model_validate(payload)
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Cohort script JSON parse failed: {e}. Raw preview: {text[:300]!r}")
        return []

    krq_count = len(known_krqs)
    results: list[dict] = []
    krq_first_seen: dict[int, int] = {}
    krq_running_sort: dict[int, int] = {}

    for q in parsed.questions:
        if q.krq_index < 1 or q.krq_index > krq_count:
            logger.warning(
                f"Dropping question with out-of-range krq_index={q.krq_index} "
                f"(known_krq_count={krq_count}). text={q.text[:80]!r}"
            )
            continue

        if q.krq_index not in krq_first_seen:
            krq_first_seen[q.krq_index] = len(krq_first_seen)
            krq_running_sort[q.krq_index] = 0

        results.append({
            "krq_index": q.krq_index,
            "krq_section_text": _krq_section_text(known_krqs[q.krq_index - 1]),
            "krq_sort_order": krq_first_seen[q.krq_index],
            "question_number": q.question_number,
            "sort_order": krq_running_sort[q.krq_index],
            "text": q.text,
            "uncovers": q.uncovers,
            "objective_link": q.objective_link,
            "tag": q.tag,
            "depth": q.depth,
            "type_descriptor": q.type_descriptor,
            "probes": q.probes,
            "estimated_minutes": q.estimated_minutes,
            "priority": q.priority,
        })
        krq_running_sort[q.krq_index] += 1

    return results


async def _persist_cohort_script(
    session: AsyncSession,
    cohort: ResearchCohort,
    study_id: uuid.UUID,
    company_id: uuid.UUID,
    parsed_questions: list[dict],
) -> int:
    """
    Idempotent replace for a cohort's script rows.
    Deletes all existing rows for this cohort, inserts the fresh set.
    Returns the number of rows inserted.
    """
    from sqlalchemy import delete as sa_delete

    await session.exec(
        sa_delete(CohortQuestionScript).where(
            CohortQuestionScript.cohort_id == cohort.id
        )
    )
    inserted = 0
    for row_dict in parsed_questions:
        session.add(
            CohortQuestionScript(
                cohort_id=cohort.id,
                study_id=study_id,
                company_id=company_id,
                krq_index=row_dict["krq_index"],
                krq_section_text=row_dict["krq_section_text"],
                krq_sort_order=row_dict["krq_sort_order"],
                question_number=row_dict["question_number"],
                sort_order=row_dict["sort_order"],
                text=row_dict["text"],
                uncovers=row_dict.get("uncovers", ""),
                objective_link=row_dict.get("objective_link", ""),
                tag=row_dict.get("tag", ""),
                depth=row_dict.get("depth", 1),
                type_descriptor=row_dict.get("type_descriptor", ""),
                probes=row_dict.get("probes", []),
                estimated_minutes=row_dict.get("estimated_minutes", 0.0),
                priority=row_dict.get("priority", "must_ask"),
            )
        )
        inserted += 1
    await session.commit()
    return inserted


def _build_cohort_script_prompt(
    study: DesignedStudy, cohort: ResearchCohort
) -> str:
    """Load the script prompt template and substitute all INPUTS variables."""
    content = _COHORT_INTERVIEW_SCRIPT_PROMPT_PATH.read_text(encoding="utf-8")
    template = _extract_prompt_from_md(content)
    return (
        template
        .replace("{{cohort_name}}", cohort.name or "")
        .replace("{{cohort_definition}}", cohort.description or "")
        .replace("{{cohort_hypothesis}}", cohort.hypothesis or "")
        .replace(
            "{{key_research_questions}}",
            _format_research_questions_for_prompt(study.key_research_questions or []),
        )
        .replace(
            "{{key_research_objectives}}",
            _format_objectives_for_prompt(study.topic_guide or {}),
        )
        .replace("{{research_brief}}", study.briefing or "")
        .replace("{{executive_summary}}", study.executive_summary or "")
    )


class CohortGenerateResponse(BaseModel):
    created: int
    updated: int
    scripts_generated: int = 0


@router.post(
    "/studies/{study_id}/cohorts/generate",
    response_model=CohortGenerateResponse,
)
async def generate_cohorts(
    study_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Generate cohort definitions + hypotheses for a fully-defined study.

    Reads brief, executive summary, objectives, and research questions from the
    designed study, runs a single LLM call, and upserts results into
    research_cohorts. Idempotent — re-running updates existing rows.
    """
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")

    try:
        content = _COHORT_DEFINITIONS_PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Cohort definitions prompt file not found")

    template = _extract_prompt_from_md(content)
    prompt = (
        template
        .replace("{{research_brief}}", study.briefing or "")
        .replace("{{executive_summary}}", study.executive_summary or "")
        .replace("{{objectives}}", _format_objectives_for_prompt(study.topic_guide or {}))
        .replace(
            "{{research_questions}}",
            _format_research_questions_for_prompt(study.key_research_questions or []),
        )
    )

    try:
        llm_service._ensure_configured()
        if not llm_service.model:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. GEMINI_API_KEY may not be configured.",
            )
        raw_text = await llm_service._generate(prompt)
    except HTTPException:
        raise
    except TimeoutError:
        logger.error("Gemini request timed out (cohort generation)")
        raise HTTPException(status_code=504, detail="AI service timed out.")
    except Exception as e:
        logger.error(f"Cohort generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    cohorts = _parse_cohorts_json(raw_text)
    created, updated = await _persist_cohort_candidates(session, company_id, cohorts)

    # ── Per-cohort interview script generation ──
    # Re-query cohort rows to get their persisted IDs (names are verbatim, so
    # filter by the names we just extracted from the LLM output).
    scripts_generated = 0
    if cohorts:
        cohort_names = [c["name"] for c in cohorts if c.get("name")]
        if cohort_names:
            persisted_stmt = select(ResearchCohort).where(
                ResearchCohort.company_id == company_id,
                ResearchCohort.name.in_(cohort_names),
            )
            persisted_cohorts = (await session.exec(persisted_stmt)).all()

            known_krqs = study.key_research_questions or []
            db_lock = asyncio.Lock()

            async def _one(cohort_row: ResearchCohort) -> int:
                try:
                    script_prompt = _build_cohort_script_prompt(study, cohort_row)
                    async with _SCRIPT_GEN_SEMA:
                        script_raw = await llm_service._generate(
                            script_prompt,
                            response_schema=COHORT_SCRIPT_GEMINI_SCHEMA,
                            timeout_override=120.0,
                        )
                    parsed_questions = _parse_structured_cohort_script(script_raw, known_krqs)
                    if not parsed_questions:
                        logger.warning(
                            f"Script parser produced no questions for cohort "
                            f"'{cohort_row.name}' (study {study_id}); skipping persist. "
                            f"raw_len={len(script_raw or '')} "
                            f"preview={(script_raw or '')[:800]!r}"
                        )
                        return 0
                    async with db_lock:
                        await _persist_cohort_script(
                            session, cohort_row, study_id, company_id, parsed_questions
                        )
                    return 1
                except Exception as e:
                    logger.warning(
                        f"Script generation failed for cohort '{cohort_row.name}' "
                        f"(study {study_id}): {e}"
                    )
                    return 0

            results = await asyncio.gather(*[_one(c) for c in persisted_cohorts])
            scripts_generated = sum(results)

    return CohortGenerateResponse(
        created=created, updated=updated, scripts_generated=scripts_generated
    )


# ── Leads & Participants ──

@router.get("/studies/{study_id}/leads")
async def list_study_leads(
    study_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """List all leads enrolled in a study via research_participants."""
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")

    stmt = (
        select(ResearchLead, ResearchParticipant.status, ResearchCohort.name)
        .join(ResearchParticipant, ResearchParticipant.lead_id == ResearchLead.id)
        .outerjoin(ResearchCohort, ResearchCohort.id == ResearchLead.cohort_id)
        .where(ResearchParticipant.study_id == study_id)
        .order_by(ResearchLead.created_at.desc())
    )
    rows = (await session.exec(stmt)).all()

    return [
        {
            "id": str(lead.id),
            "first_name": lead.first_name,
            "last_name": lead.last_name,
            "contact_number": lead.contact_number,
            "cohort_id": str(lead.cohort_id) if lead.cohort_id else None,
            "cohort_name": cohort_name,
            "participant_status": participant_status,
            "contact_profile": lead.contact_profile,
        }
        for lead, participant_status, cohort_name in rows
    ]


@router.delete("/studies/{study_id}/participants/{lead_id}")
async def remove_participant(
    study_id: uuid.UUID,
    lead_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """Remove a lead from a study (deletes research_participants row only, keeps the lead)."""
    study = await session.get(DesignedStudy, study_id)
    if not study or study.company_id != company_id:
        raise HTTPException(status_code=404, detail="Study not found")

    stmt = delete(ResearchParticipant).where(
        ResearchParticipant.study_id == study_id,
        ResearchParticipant.lead_id == lead_id,
    )
    result = await session.exec(stmt)
    await session.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Participant not found")

    return {"status": "removed"}
