"""
Agreement Detection Utilities

Detects whether a customer agreed, declined, or gave an unclear response
during a call, with confidence levels.
"""

from typing import Dict, Optional


def detect_agreement_status(
    user_intent: str,
    outcome: str,
    extracted_data: Optional[Dict] = None,
    transcript_text: Optional[str] = None
) -> Dict[str, any]:
    """
    Detect agreement status from call data, prioritizing transcript analysis.
    
    Args:
        user_intent: Enriched user intent from call
        outcome: Call outcome
        extracted_data: Optional extracted data from Bolna
        transcript_text: Full transcript text (SOURCE OF TRUTH)
    
    Returns:
        Dict with agreement status:
        {
            "agreed": bool,
            "status": str,  # "yes" | "no" | "unclear"
            "confidence": str  # "high" | "medium" | "low"
        }
    """
    if not user_intent and not outcome and not transcript_text:
        return _get_unclear_status("low")
    
    # ========== TRANSCRIPT ANALYSIS (PRIMARY SOURCE OF TRUTH) ==========
    if transcript_text:
        transcript_lower = transcript_text.lower()
        
        # Extract customer responses (lines starting with "user:" or "customer:")
        customer_lines = []
        for line in transcript_lower.split('\n'):
            line = line.strip()
            if line.startswith('user:') or line.startswith('customer:'):
                # Remove the prefix and get the actual response
                response = line.split(':', 1)[1].strip() if ':' in line else line
                customer_lines.append(response)
        
        customer_text = ' '.join(customer_lines)
        
        # Minimum engagement check - allow shorter affirmative responses for Hinglish
        if len(customer_lines) < 2 or len(customer_text) < 10:
            # Not enough conversation to determine agreement
            return _get_unclear_status("low")
        
        # ========== NEGATION DETECTION (HIGHEST PRIORITY) ==========
        # These patterns indicate clear rejection and should override everything
        hard_rejection_patterns = [
            "not interested", "no thanks", "no thank you",
            "don't call", "do not call", "stop calling", "remove me",
            "take me off", "unsubscribe", "harassment",
            "not interested", "no thanks", "no thank you",
            "don't call", "do not call", "stop calling", "remove me",
            "take me off", "unsubscribe", "harassment",
            "wrong number", "wrong person",
            # Hindi / Hinglish Rejections
            "nahi", "koi interest nahi", "not interested", "mat karo",
            "नॉट इंट्रेस्टेड", "नहीं चाहिए", "नहीं"
        ]
        
        # Check for hard rejections
        for pattern in hard_rejection_patterns:
            if pattern in customer_text:
                return {
                    "agreed": False,
                    "status": "no",
                    "confidence": "high"
                }
        
        # ========== SOFT REJECTION PATTERNS ==========
        soft_rejection_patterns = [
            "maybe later", "not now", "too busy", "not the right time",
            "already have", "not looking", "not needed", "not right now",
            "busy", "call back later"
        ]
        
        soft_rejection_count = sum(1 for pattern in soft_rejection_patterns if pattern in customer_text)
        
        if soft_rejection_count >= 1:
            return {
                "agreed": False,
                "status": "no",
                "confidence": "medium"
            }
        
        # ========== STRONG POSITIVE SIGNALS ==========
        # These indicate clear interest
        strong_interest_patterns = [
            "i'm interested", "i am interested", "interested",
            "sounds good", "that works", "perfect", "great idea",
            "let's do it", "let's go", "sign me up",
            "book it", "schedule", "when can", "how do i",
            "tell me more", "i want", "i'd like", "i would like",
            "send me", "email me", "what's the next step",
            # Hinglish / Hindi Strong Signals
            "kar do", "kardo", "kaardo", "bhejo", "laga do", 
            "book kar", "schedule kar", "fix kar",
            "कर दो", "कॉल करो", "बुक करो", "हाँ", "हा", "हूँ"
        ]
        
        # ========== MODERATE POSITIVE SIGNALS ==========
        moderate_interest_patterns = [
            "maybe", "possibly", "might be", "could be",
            "thinking about", "considering", "sounds interesting",
            "call me back", "follow up", 
            "more information", "pricing", "cost", "how much",
            "what does it include", "tell me about"
        ]
        
        # Count pattern matches
        strong_interest_count = sum(1 for pattern in strong_interest_patterns if pattern in customer_text)
        moderate_interest_count = sum(1 for pattern in moderate_interest_patterns if pattern in customer_text)
        
        # ========== SIMPLE AFFIRMATIVE ANALYSIS ==========
        # Only count simple yes/no words if they appear in proper context
        simple_yes_words = [
            "yes", "yeah", "yep", "sure", "absolutely", "definitely", "okay", "ok",
            # Hindi / Devanagari
            "हाँ", "हा", "जी", "शुर", "येस", "सही", "achha"
        ]
        simple_no_words = [
            "no", "nope", "nah",
            # Hindi
            "नहीं", "ना", "mat", "nhi", "nahi"
        ]
        
        affirmative_count = 0
        negative_count = 0
        
        for line in customer_lines:
            # Strip standard punctuation AND Hindi danda (।)
            line_stripped = line.strip().rstrip('.,!?।|')
            
            # Check for standalone affirmatives
            if line_stripped in simple_yes_words:
                affirmative_count += 1
            # Check for affirmatives at start of sentence (not in questions)
            elif any(line_stripped.startswith(word + " ") for word in simple_yes_words):
                # Make sure it's not negated (e.g., "yes, don't call")
                if not any(neg in line for neg in ["don't", "do not", "stop", "not"]):
                    affirmative_count += 1
            
            # Check for standalone negatives
            if line_stripped in simple_no_words:
                negative_count += 1
            elif any(line_stripped.startswith(word + " ") for word in simple_no_words):
                negative_count += 1
        
        # ========== QUESTION DETECTION (REDUCES FALSE POSITIVES) ==========
        # Questions like "how much?" shouldn't count as strong interest without confirmation
        question_indicators = ["?", "how", "what", "when", "where", "why", "who"]
        question_count = sum(1 for line in customer_lines if any(q in line for q in question_indicators))
        
        # If most responses are questions, reduce confidence
        is_mostly_questions = question_count > len(customer_lines) / 2
        
        # ========== DECISION LOGIC ==========
        
        # Strong YES: Multiple strong signals OR strong signal + affirmatives
        if strong_interest_count >= 2 or (strong_interest_count >= 1 and affirmative_count >= 2):
            return {
                "agreed": True,
                "status": "yes",
                "confidence": "high"
            }
        
        # Medium YES: Single strong signal + affirmative OR multiple moderate signals
        if (strong_interest_count >= 1 and affirmative_count >= 1) or moderate_interest_count >= 2:
            # Downgrade if mostly questions
            confidence = "medium" if not is_mostly_questions else "low"
            if confidence == "low":
                return _get_unclear_status("low")
            return {
                "agreed": True,
                "status": "yes",
                "confidence": confidence
            }
        
        # Low YES: Single moderate signal + affirmative
        if moderate_interest_count >= 1 and affirmative_count >= 1 and not is_mostly_questions:
            return {
                "agreed": True,
                "status": "yes",
                "confidence": "medium"
            }
        
        # NO: Any negative signals
        if negative_count >= 1:
            return {
                "agreed": False,
                "status": "no",
                "confidence": "high"
            }
    
    # ========== FALLBACK TO EXISTING LOGIC ==========
    
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
