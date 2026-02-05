"""
Sentiment Analysis Utilities for Call Transcripts

Analyzes customer sentiment based on call transcripts, outcomes, and duration.
Uses keyword-based heuristics for fast, reliable sentiment detection.
"""

from typing import Dict, Optional


def analyze_sentiment(
    transcript: str,
    outcome: str,
    duration: int,
    extracted_data: Optional[Dict] = None
) -> Dict[str, any]:
    """
    Analyze sentiment from call data.
    
    Args:
        transcript: Full call transcript or last user message
        outcome: Call outcome (e.g., "Interested", "Not Interested")
        duration: Call duration in seconds
        extracted_data: Optional extracted data from Bolna
    
    Returns:
        Dict with sentiment analysis:
        {
            "emoji": str,
            "label": str,  # "positive" | "neutral" | "negative" | "frustrated"
            "score": float  # 0-1
        }
    """
    if not transcript:
        return _get_default_sentiment()
    
    transcript_lower = transcript.lower()
    outcome_upper = (outcome or "").upper()
    
    # 1. Check for frustrated/angry sentiment (highest priority)
    frustrated_keywords = [
        "already told", "keep calling", "stop calling", "annoying", 
        "harassment", "lawyer", "report", "complaint", "angry",
        "fed up", "sick of", "enough", "repeatedly"
    ]
    if any(kw in transcript_lower for kw in frustrated_keywords):
        return {
            "emoji": "😡",
            "label": "frustrated",
            "score": 0.1
        }
    
    # 2. Check for negative sentiment
    negative_keywords = [
        "not interested", "no thanks", "don't call", "remove me",
        "stop", "unsubscribe", "never", "waste of time", "busy",
        "no need", "not now", "leave me alone"
    ]
    negative_outcomes = ["NOT INTERESTED", "NOT_INTERESTED", "DNC", "HANGUP"]
    
    if any(kw in transcript_lower for kw in negative_keywords) or outcome_upper in negative_outcomes:
        return {
            "emoji": "😞",
            "label": "negative",
            "score": 0.3
        }
    
    # 3. Check for positive sentiment
    positive_keywords = [
        "interested", "sounds good", "great", "perfect", "yes",
        "sure", "absolutely", "definitely", "love", "excellent",
        "thank you", "appreciate", "helpful", "wonderful", "amazing",
        "tell me more", "how much", "pricing", "sign up", "schedule"
    ]
    positive_outcomes = ["INTERESTED", "SCHEDULED", "INTENT_YES"]
    
    if any(kw in transcript_lower for kw in positive_keywords) or outcome_upper in positive_outcomes:
        return {
            "emoji": "😊",
            "label": "positive",
            "score": 0.9
        }
    
    # 4. Check for engaged/curious (medium positive)
    engaged_keywords = [
        "what", "how", "when", "tell me", "explain", "curious",
        "more information", "details", "maybe", "possibly", "consider"
    ]
    
    # Engaged if they asked questions and stayed on call for reasonable time
    if duration > 20 and any(kw in transcript_lower for kw in engaged_keywords):
        return {
            "emoji": "🤔",
            "label": "curious",
            "score": 0.6
        }
    
    # 5. Default to neutral
    return _get_default_sentiment()


def _get_default_sentiment() -> Dict[str, any]:
    """Return default neutral sentiment."""
    return {
        "emoji": "😐",
        "label": "neutral",
        "score": 0.5
    }


def get_sentiment_emoji(sentiment_label: str) -> str:
    """
    Map sentiment label to emoji.
    
    Args:
        sentiment_label: One of "positive", "neutral", "negative", "frustrated", "curious"
    
    Returns:
        Emoji string
    """
    emoji_map = {
        "positive": "😊",
        "neutral": "😐",
        "negative": "😞",
        "frustrated": "😡",
        "curious": "🤔"
    }
    
    return emoji_map.get(sentiment_label.lower(), "😐")
