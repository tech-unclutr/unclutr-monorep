"""
Study Execution — Call Outcome Determination

Pure functions for categorizing Bolna call results into definitive statuses
and deciding whether to retry. No DB dependencies.
"""

from typing import Any, Dict


# ── Constants ──────────────────────────────────────────────────────

MAX_EXECUTION_COUNT = 2
RETRY_COOLDOWN_MINUTES = 10
RETRY_MAX_DURATION_SECONDS = 10  # 10-second rule: don't retry if call lasted > 10s
COMPLETED_MIN_DURATION_SECONDS = 30  # Calls that talked ≥30s are real interviews, not retries

TERMINAL_CALL_STATES = [
    "completed",
    "failed",
    "call-disconnected",
    "voicemail_detected",
    "no-answer",
    "busy",
    "canceled",
]

RETRIABLE_STATES = [
    "VOICEMAIL",
    "NO_ANSWER",
    "BUSY",
    "HANGUP",
    "SILENCE",
    "LANGUAGE_BARRIER",
    "FAILED_CONNECT",
    "FAX_ROBOT",
    # AMBIGUOUS is intentionally NOT retriable: if a real call happened
    # but we couldn't classify intent, retrying it spams the participant.
]

HUMAN_OUTCOME_MAP = {
    "COMPLETED": "Completed",
    "INTENT_YES": "Interested",
    "INTENT_NO": "Not Interested",
    "DNC": "DNC / Stop",
    "WRONG_PERSON": "Wrong Person",
    "SCHEDULED": "Scheduled",
    "VOICEMAIL": "Voicemail",
    "NO_ANSWER": "No Answer",
    "BUSY": "Busy",
    "HANGUP": "Immediate Hangup",
    "SILENCE": "Silence",
    "LANGUAGE_BARRIER": "Language Barrier",
    "FAILED_CONNECT": "Connection Failed",
    "FAX_ROBOT": "Fax/Robot",
    "AMBIGUOUS": "Ambiguous",
    "DISCONNECTED": "Disconnected",
}

DNC_KEYWORDS = [
    "stop calling",
    "remove me",
    "don't call",
    "do not call",
    "wrong number",
    "harassment",
    "take me off",
]


# ── Functions ──────────────────────────────────────────────────────

def is_terminal_state(status: str, payload: Dict[str, Any]) -> bool:
    """Check if a webhook payload represents a terminal call state."""
    normalized = (status or "").lower()
    if normalized in TERMINAL_CALL_STATES:
        return True
    if payload.get("answered_by_voice_mail"):
        return True
    return False


def determine_call_outcome(
    payload: Dict[str, Any],
    extracted_data: Dict[str, Any],
    call_status: str,
    duration: int,
    termination_reason: str,
) -> str:
    """
    Categorize a Bolna call result into a definitive status string.

    Priority order:
    1. Voicemail (payload flag or termination_reason keyword)
    2. Technical signals (no-answer, busy, failed, fax/machine)
    3. DNC (extracted flag or transcript keywords)
    4. Intent extraction (interested, not_interested, wrong_person, language_barrier)
    5. Scheduling intent (callback_time, reschedule_slot, preferred_time)
    6. Behavioral analysis (duration + transcript presence)
    """
    call_status = (call_status or "").lower()
    termination_reason = (termination_reason or "").lower()

    # 1. Voicemail
    if (
        payload.get("answered_by_voice_mail")
        or "voicemail" in termination_reason
        or "voice mail" in termination_reason
    ):
        return "VOICEMAIL"

    # 2. Technical signals
    if call_status == "no-answer":
        return "NO_ANSWER"
    if call_status == "busy":
        return "BUSY"
    if call_status == "failed":
        return "FAILED_CONNECT"
    if "machine" in termination_reason or "fax" in termination_reason:
        return "FAX_ROBOT"

    # 3. DNC — hard refusals override intent
    if extracted_data.get("dnc") or extracted_data.get("stop_calling"):
        return "DNC"

    transcript_text = ""
    raw_transcript = payload.get("transcript", "")
    if isinstance(raw_transcript, str):
        transcript_text = raw_transcript.lower()
    elif isinstance(raw_transcript, list):
        transcript_text = " ".join(
            t.get("content", "") for t in raw_transcript if isinstance(t, dict)
        ).lower()

    if any(kw in transcript_text for kw in DNC_KEYWORDS):
        return "DNC"

    # 4. Intent extraction
    if extracted_data.get("interested"):
        return "INTENT_YES"
    if extracted_data.get("wrong_person"):
        return "WRONG_PERSON"
    if extracted_data.get("language_barrier"):
        return "LANGUAGE_BARRIER"
    if extracted_data.get("not_interested"):
        return "INTENT_NO"

    # 5. Scheduling intent
    if (
        extracted_data.get("callback_time")
        or extracted_data.get("reschedule_slot")
        or extracted_data.get("preferred_time")
    ):
        return "SCHEDULED"

    # 6. Behavioral analysis
    if call_status == "completed":
        if duration < 5:
            return "HANGUP"

        # Check for silence / ghost
        transcript = payload.get("transcript")
        is_silent = False
        if not transcript:
            is_silent = True
        elif isinstance(transcript, str) and not transcript.strip():
            is_silent = True
        elif isinstance(transcript, list) and len(transcript) == 0:
            is_silent = True

        if is_silent:
            return "SILENCE"

        # Real interview happened (≥30s with a transcript) but no specific
        # intent was extracted — treat as a successfully completed interview
        # rather than ambiguous/disconnected. Research calls often don't
        # produce a clean yes/no signal.
        if duration >= COMPLETED_MIN_DURATION_SECONDS:
            return "COMPLETED"

        # Short conversation (5-29s) with a transcript but no intent →
        # not enough signal, mark as disconnected (not retriable).
        return "DISCONNECTED"

    # Catch-all for failed/disconnected with significant duration
    if call_status in ("failed", "call-disconnected") and duration > 10:
        return "DISCONNECTED"

    return "AMBIGUOUS"


def should_retry(status: str, execution_count: int, call_duration: int) -> bool:
    """
    Determine if a call should be retried.

    Rules:
    - Must be in RETRIABLE_STATES
    - Call duration must be ≤ 10s (10-second rule: don't spam after real conversation)
    - execution_count must be < MAX_EXECUTION_COUNT
    """
    if status not in RETRIABLE_STATES:
        return False
    if call_duration > RETRY_MAX_DURATION_SECONDS:
        return False
    if execution_count >= MAX_EXECUTION_COUNT:
        return False
    return True


def human_outcome(status: str) -> str:
    """Map internal status string to a human-readable label."""
    return HUMAN_OUTCOME_MAP.get(status, status.replace("_", " ").title())
