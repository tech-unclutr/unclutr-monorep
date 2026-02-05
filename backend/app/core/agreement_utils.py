"""
Agreement Detection Utilities

Detects whether a customer agreed, declined, or gave an unclear response
during a call, with confidence levels.
"""

from typing import Dict, Optional


def detect_agreement_status(
    user_intent: str,
    outcome: str,
    extracted_data: Optional[Dict] = None
) -> Dict[str, any]:
    """
    Detect agreement status from call data.
    
    Args:
        user_intent: Enriched user intent from call
        outcome: Call outcome
        extracted_data: Optional extracted data from Bolna
    
    Returns:
        Dict with agreement status:
        {
            "agreed": bool,
            "status": str,  # "yes" | "no" | "unclear"
            "confidence": str  # "high" | "medium" | "low"
        }
    """
    if not user_intent and not outcome:
        return _get_unclear_status("low")
    
    intent_lower = (user_intent or "").lower()
    outcome_upper = (outcome or "").upper()
    
    # Extract additional signals from extracted_data if available
    scheduling_requested = False
    explicit_yes = False
    explicit_no = False
    
    if extracted_data:
        scheduling_requested = bool(extracted_data.get("scheduling_preferences"))
        
        # Check for explicit yes/no in extracted data
        user_response = str(extracted_data.get("user_response", "")).lower()
        if user_response:
            explicit_yes = any(word in user_response for word in ["yes", "sure", "okay", "definitely"])
            explicit_no = any(word in user_response for word in ["no", "nope", "not interested"])
    
    # 1. CLEAR YES - High Confidence
    clear_yes_keywords = [
        "interested", "yes", "schedule", "book", "sign up", "register",
        "sounds good", "perfect", "great", "absolutely", "definitely",
        "want to try", "tell me more", "how do i", "when can"
    ]
    clear_yes_outcomes = ["INTERESTED", "SCHEDULED", "INTENT_YES"]
    
    has_yes_keyword = any(kw in intent_lower for kw in clear_yes_keywords)
    has_yes_outcome = outcome_upper in clear_yes_outcomes
    
    if (has_yes_keyword and has_yes_outcome) or (explicit_yes and has_yes_outcome) or scheduling_requested:
        return {
            "agreed": True,
            "status": "yes",
            "confidence": "high"
        }
    
    # 2. LIKELY YES - Medium Confidence
    likely_yes_keywords = [
        "maybe", "possibly", "consider", "think about", "sounds interesting",
        "call back", "follow up", "more info", "pricing", "cost"
    ]
    
    if any(kw in intent_lower for kw in likely_yes_keywords) and outcome_upper not in ["NOT_INTERESTED", "DNC"]:
        return {
            "agreed": True,
            "status": "yes",
            "confidence": "medium"
        }
    
    # 3. CLEAR NO - High Confidence
    clear_no_keywords = [
        "not interested", "no thanks", "don't call", "remove", "stop",
        "unsubscribe", "never", "no need", "not now", "busy"
    ]
    clear_no_outcomes = ["NOT_INTERESTED", "NOT INTERESTED", "DNC", "DNC / STOP"]
    
    has_no_keyword = any(kw in intent_lower for kw in clear_no_keywords)
    has_no_outcome = outcome_upper in clear_no_outcomes or "DNC" in outcome_upper
    
    if (has_no_keyword and has_no_outcome) or explicit_no or has_no_outcome:
        return {
            "agreed": False,
            "status": "no",
            "confidence": "high"
        }
    
    # 4. LIKELY NO - Medium Confidence
    likely_no_keywords = [
        "not right now", "maybe later", "too busy", "not the right time"
    ]
    
    if any(kw in intent_lower for kw in likely_no_keywords):
        return {
            "agreed": False,
            "status": "no",
            "confidence": "medium"
        }
    
    # 5. UNCLEAR - Low Confidence (default)
    # This includes technical failures, voicemails, short calls, etc.
    technical_outcomes = ["VOICEMAIL", "NO_ANSWER", "BUSY", "FAILED", "SILENCE", "HANGUP"]
    
    if outcome_upper in technical_outcomes:
        return {
            "agreed": False,
            "status": "unclear",
            "confidence": "low"
        }
    
    # Default unclear
    return _get_unclear_status("low")


def _get_unclear_status(confidence: str = "low") -> Dict[str, any]:
    """Return default unclear status."""
    return {
        "agreed": False,
        "status": "unclear",
        "confidence": confidence
    }


def should_copy_to_queue(agreement_status: Dict[str, any]) -> bool:
    """
    Determine if a lead should be automatically copied to user queue.
    
    Args:
        agreement_status: Agreement status dict from detect_agreement_status
    
    Returns:
        True if lead should be copied to queue
    """
    # Only copy if agreed with high or medium confidence
    return (
        agreement_status.get("agreed", False) and
        agreement_status.get("status") == "yes" and
        agreement_status.get("confidence") in ["high", "medium"]
    )
