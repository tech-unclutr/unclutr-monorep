import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel

from app.services.intelligence.llm_service import llm_service

router = APIRouter()


# ── Request / Response schemas ──

class ChatMessage(BaseModel):
    role: str
    content: str


class StudyDesignerChatRequest(BaseModel):
    study_state: Dict[str, Any]
    messages: List[ChatMessage]
    user_message: str


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


class StudyDesignerChatResponse(BaseModel):
    reply: str
    proposals: List[Proposal]
    actions: List[AIAction]
    follow_up_chips: List[str]


# ── System prompt ──

SYSTEM_PROMPT = """You are a research study design assistant for SquareUp, a consumer research platform.
Your job is to guide users step-by-step through designing a complete qualitative research study.

YOU HAVE A CLEAR GOAL: Help the user complete ALL of these fields, in order:
1. Study Title — a concise, descriptive title for the study
2. Research Brief — 2-3 sentences explaining what this study is about and why it matters
3. Welcome Page Title — a warm greeting title for participants
4. Welcome Page Message — a reassuring message explaining what participants can expect
5. Research Objectives — 2-4 objectives in the topic guide, each with a title and description
6. Questions per Objective — 2-4 open-ended interview questions under each objective

YOUR WORKFLOW:
- Look at the current study state to see which fields are EMPTY or INCOMPLETE
- Focus on the NEXT incomplete field in the order above
- Propose concrete values for that field
- Once the user accepts or discusses it, move to the next incomplete field
- When everything is filled, congratulate the user and offer to refine any section

IMPORTANT BEHAVIORS:
- On the FIRST message, the user provides their research goal/topic. The study state starts EMPTY. You must analyze their research goal and propose:
  1. A concise, professional study title (not just repeating their prompt)
  2. A proper research brief (2-3 sentences explaining the study's purpose, methodology, and expected outcomes — NOT just copying the user's prompt)
- The research brief should read like a professional document, e.g.: "This qualitative study aims to explore [topic]. Through in-depth interviews with [target audience], we will uncover [what]. The findings will inform [decisions]."
- Always propose structured changes — never just describe what you'd do, actually propose it
- Ask clarifying questions ONLY if the user's intent is genuinely unclear
- Keep replies to 1-2 sentences — be direct, not chatty
- Follow-up chips MUST suggest actions to populate the NEXT empty fields in the study. Examples:
  - If welcome page is next: "Define the welcome page title", "Write a message for participants", "Set up the welcome page for me"
  - If objectives are next: "Create research objectives for this study", "Suggest 3 key research themes", "What objectives should I focus on?"
  - If questions are next: "Generate questions for [objective name]", "Write interview questions", "What should I ask participants?"
  - Never use generic chips like "Suggestion 1" or "Continue" — always reference the specific next field to fill

RESPONSE FORMAT:
You must respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "reply": "Your conversational response",
  "proposals": [
    {
      "type": "<change_type>",
      "label": "Short description",
      "value": <the value>,
      "targetId": null,
      "parentId": null
    }
  ],
  "actions": [
    {
      "type": "<action_type>",
      "objectiveIndex": 0,
      "questionIndex": 0
    }
  ],
  "follow_up_chips": ["Chip 1", "Chip 2", "Chip 3"]
}

PROPOSALS vs ACTIONS:
- "proposals" are SUGGESTIONS that the user reviews and accepts/rejects (adding content, updating fields)
- "actions" are DIRECT COMMANDS that execute immediately (deleting, reordering) — use these when the user explicitly asks to remove or move something
- When the user says "remove", "delete", "drop", "get rid of" → use actions, NOT proposals
- When the user says "add", "create", "suggest", "write" → use proposals

Available action types:
- "delete_question": removes a question. Requires "objectiveIndex" (0-based) and "questionIndex" (0-based)
  Example: user says "remove 3rd question from 2nd objective" → {"type": "delete_question", "objectiveIndex": 1, "questionIndex": 2}
- "delete_objective": removes an entire objective. Requires "objectiveIndex" (0-based)
  Example: user says "remove the first objective" → {"type": "delete_objective", "objectiveIndex": 0}
- "reorder_question": moves a question within an objective. Requires "objectiveIndex", "questionIndex" (from), "toIndex" (to)
- "reorder_objective": moves an objective. Requires "objectiveIndex" (from), "toIndex" (to)

IMPORTANT: Use the STUDY COMPLETION STATUS section to find the correct indices. The indices shown there are 0-based.

Available proposal change types:
- "update_title": value is a string
- "update_briefing": value is a string
- "update_welcome_title": value is a string
- "update_welcome_description": value is a string
- "add_objective": value is {"title": "...", "description": "...", "questions": [{"text": "...", "context": "...", "participantCount": N, "interviewMode": "video_call|audio_call|chat"}]}. CRITICAL: "questions" array is REQUIRED and must contain 2-4 questions. NEVER propose an objective without questions.
- "update_objective": value is {"title": "...", "description": "..."}, requires targetId
- "add_question": value is {"text": "...", "context": "...", "participantCount": N, "interviewMode": "video_call|audio_call|chat"}, requires parentId (the objective ID). "context" is interviewer guidance — what to probe for, how to use the question, what to listen for.
- "toggle_emotion_detection": value is true or false
- "set_languages": value is {"participantLanguages": [...], "reportingLanguage": "..."}

Questions MUST be open-ended, conversational, and suitable for qualitative in-depth interviews.
Every question MUST include:
- "context": interviewer guidance — what to probe for, how to use the question, what to listen for
- "participantCount": recommended number of participants (integer). Guidelines:
  - Deep exploratory questions (emotions, motivations, stories) → 6-8 participants, video_call
  - Behavioral/preference questions → 10-15 participants, audio_call or video_call
  - Quick opinion/association questions → 15-25 participants, chat
- "interviewMode": one of "video_call", "audio_call", "chat". Choose based on:
  - "video_call" — when you need to observe reactions, show stimuli, or explore emotions
  - "audio_call" — when conversational depth matters but face-to-face isn't needed
  - "chat" — when you need scale, quick responses, or the question is straightforward

Example: {"text": "When you think about healthy drinks, what comes to mind?", "context": "Probe for specific attributes, ingredients, or brands.", "participantCount": 15, "interviewMode": "chat"}
Always return valid JSON only."""


def _analyze_completion(study: Dict[str, Any]) -> str:
    """Analyze which fields are complete vs empty, with indexed objective/question listings."""
    status = []
    title = study.get("title", "")
    briefing = study.get("briefing", "")
    welcome = study.get("welcomePage", {})
    objectives = study.get("topicGuide", {}).get("objectives", [])

    status.append(f"- Title: {'FILLED' if title else 'EMPTY'}")
    status.append(f"- Research Brief: {'FILLED' if briefing else 'EMPTY'}")
    status.append(f"- Welcome Page Title: {'FILLED' if welcome.get('title') else 'EMPTY'}")
    status.append(f"- Welcome Page Message: {'FILLED' if welcome.get('description') else 'EMPTY'}")

    if not objectives:
        status.append("- Research Objectives: EMPTY (need 2-4)")
    else:
        status.append(f"\nOBJECTIVES ({len(objectives)} total):")
        for i, obj in enumerate(objectives):
            questions = obj.get("questions", [])
            status.append(f"  Objective {i + 1} (index {i}): \"{obj.get('title', 'Untitled')}\"")
            if questions:
                for j, q in enumerate(questions):
                    status.append(f"    Question {j + 1} (index {j}): \"{q.get('text', '')[:80]}\"")
            else:
                status.append(f"    (no questions)")

    # Determine next step
    if not welcome.get("title") or not welcome.get("description"):
        next_step = "NEXT STEP: Propose welcome page title and message"
    elif not objectives:
        next_step = "NEXT STEP: Propose 2-3 research objectives with questions"
    elif any(not o.get("questions") for o in objectives):
        empty_obj = next(o for o in objectives if not o.get("questions"))
        next_step = f"NEXT STEP: Add questions to objective '{empty_obj.get('title', 'Untitled')}'"
    elif len(objectives) < 2:
        next_step = "NEXT STEP: Propose more objectives (aim for 2-4 total)"
    else:
        next_step = "ALL FIELDS COMPLETE. Offer to refine any section or add more depth."

    status.append(f"\n{next_step}")
    return "\n".join(status)


def _build_prompt(request: StudyDesignerChatRequest) -> str:
    """Build the full prompt with system instructions, study state, and conversation."""
    parts = [SYSTEM_PROMPT]

    # Completion analysis
    completion = _analyze_completion(request.study_state)
    parts.append(f"\n\nSTUDY COMPLETION STATUS:\n{completion}")

    parts.append(f"\n\nCurrent study state:\n{json.dumps(request.study_state, indent=2)}")

    if request.messages:
        parts.append("\n\nConversation history:")
        for msg in request.messages[-6:]:  # Keep last 6 messages for context window
            parts.append(f"\n{msg.role}: {msg.content}")

    parts.append(f"\n\nuser: {request.user_message}")
    parts.append("\n\nRespond with ONLY valid JSON:")

    return "\n".join(parts)


def _parse_llm_response(raw_text: str) -> StudyDesignerChatResponse:
    """Parse the LLM response, handling common formatting issues."""
    text = raw_text.strip()

    # Strip markdown code blocks if present
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]  # Remove first line
    if text.endswith("```"):
        text = text.rsplit("```", 1)[0]
    text = text.replace("```json", "").replace("```", "").strip()

    try:
        data = json.loads(text)

        # Validate and fix proposals
        proposals = data.get("proposals", [])
        for p in proposals:
            # Ensure add_objective always has questions with required fields
            if p.get("type") == "add_objective":
                value = p.get("value", {})
                if not isinstance(value, dict):
                    continue
                questions = value.get("questions")
                if not questions or not isinstance(questions, list) or len(questions) == 0:
                    title = value.get("title", "this topic")
                    value["questions"] = [
                        {"text": f"Tell me about your experience with {title.lower()}. What stands out?", "context": f"Open exploration of {title.lower()}. Let the participant set the frame.", "participantCount": 8, "interviewMode": "video_call"},
                        {"text": f"What matters most to you when it comes to {title.lower()}?", "context": "Probe for priorities and values. Ask them to rank if they mention multiple factors.", "participantCount": 10, "interviewMode": "audio_call"},
                    ]
                else:
                    # Ensure each question has participantCount and interviewMode
                    for q in questions:
                        if isinstance(q, dict):
                            q.setdefault("participantCount", 8)
                            q.setdefault("interviewMode", "video_call")
                p["value"] = value

            # Ensure add_question has participantCount and interviewMode
            if p.get("type") == "add_question":
                value = p.get("value", {})
                if isinstance(value, dict):
                    value.setdefault("participantCount", 8)
                    value.setdefault("interviewMode", "video_call")
                    p["value"] = value

        return StudyDesignerChatResponse(
            reply=data.get("reply", "I've updated the study based on your input."),
            proposals=[Proposal(**p) for p in proposals],
            actions=[AIAction(**a) for a in data.get("actions", [])],
            follow_up_chips=data.get("follow_up_chips", []),
        )
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Failed to parse LLM JSON response: {e}\nRaw: {text[:500]}")
        return StudyDesignerChatResponse(
            reply=text[:500] if text else "I can help you design your study. What would you like to work on?",
            proposals=[],
            actions=[],
            follow_up_chips=["Add research objectives", "Set up welcome page", "Configure study settings"],
        )


@router.post("/chat", response_model=StudyDesignerChatResponse)
async def study_designer_chat(request: StudyDesignerChatRequest):
    """Chat endpoint for the AI study designer assistant. Uses Gemini via llm_service."""
    prompt = _build_prompt(request)

    try:
        llm_service._ensure_configured()
        if not llm_service.model:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. GEMINI_API_KEY may not be configured.",
            )
        raw_text = await llm_service._generate(prompt)
        return _parse_llm_response(raw_text)
    except HTTPException:
        raise
    except TimeoutError:
        logger.error("Gemini request timed out")
        raise HTTPException(status_code=504, detail="AI service timed out.")
    except Exception as e:
        logger.error(f"Study designer chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
