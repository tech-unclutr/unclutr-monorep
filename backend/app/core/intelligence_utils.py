from typing import Optional, Tuple

def enrich_user_intent(raw_intent: str, outcome: str, duration: int, transcript: str) -> str:
    """
    Enriches generic 'no intent' messages with technical context from the call.
    Shared utility used by both the webhook handler and the dashboard API.
    """
    if not isinstance(raw_intent, str):
        raw_intent = str(raw_intent) if raw_intent else ""
        
    generic_phrases = [
        "did not explicitly state an intent",
        "no intent was mentioned",
        "no specific intent",
        "did not provide any specific intent",
        "did not state an intent"
    ]
    
    is_generic = any(phrase in raw_intent.lower() for phrase in generic_phrases)
    
    if not is_generic and raw_intent.strip():
        return raw_intent
        
    # Transcript analysis for broader context
    transcript_lower = (transcript or "").lower()
    outcome = (outcome or "").upper()
    
    if "voicemail" in transcript_lower or "voice mail" in transcript_lower or outcome == "VOICEMAIL":
        return "Call reached voicemail. No engagement possible."
        
    if outcome == "HANGUP" or (duration < 5 and duration > 0 and transcript_lower):
        return f"User hung up immediately after {duration}s."
        
    if outcome == "SILENCE" or not transcript_lower.strip():
        return "Call was silent. No audio detected from the user."
        
    if outcome == "NO_ANSWER":
        return "User did not answer the call."
        
    if outcome == "BUSY":
        return "Line was busy."
        
    if outcome == "LANGUAGE_BARRIER":
        return "A language barrier was detected; lead likely did not understand the agent."

    if "forwarded to voicemail" in transcript_lower:
        return "Call was automatically forwarded to voicemail."
    
    return raw_intent

def extract_next_step(intent: str) -> Tuple[str, Optional[str]]:
    """
    Separates the core insight (Observation) from the next step (Action).
    Returns (insight, next_step).
    """
    if not intent:
        return "", None
        
    intent_lower = intent.lower()
    
    # Pattern 1: "... and schedule ..."
    if " and schedule " in intent_lower:
        parts = intent.split(" and schedule ", 1)
        return parts[0].strip(), "Schedule " + parts[1].strip()
        
    # Pattern 2: "... and wants to schedule ..."
    if " and wants to schedule " in intent_lower:
        parts = intent.split(" and wants to schedule ", 1)
        return parts[0].strip(), "Schedule " + parts[1].strip()

    # Pattern 3: "Schedule a ..." (Imperative start)
    if intent_lower.startswith("schedule ") or intent_lower.startswith("book "):
        return "User intends to book a slot.", intent
        
    # Pattern 4: "Call back ..."
    if intent_lower.startswith("call back") or " wants a call back" in intent_lower:
        return "User requested a callback.", "Call back user"

    return intent, None
