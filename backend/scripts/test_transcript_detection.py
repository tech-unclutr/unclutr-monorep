"""
Test script for transcript-based agreement detection
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.core.agreement_utils import detect_agreement_status

# Test cases with sample transcripts
test_cases = [
    {
        "name": "Strong Yes - Interested",
        "transcript": """
assistant: Hi! I'm calling about our new service. Are you interested?
user: Yes, definitely! Sounds great.
assistant: Perfect! When would be a good time to schedule?
user: I'd like to book it for next week.
        """,
        "expected": {"agreed": True, "status": "yes", "confidence": "high"}
    },
    {
        "name": "Moderate Yes - Maybe",
        "transcript": """
assistant: Would you like to learn more about our product?
user: Maybe, I'm thinking about it.
assistant: I can send you more information.
user: Sure, send me the pricing.
        """,
        "expected": {"agreed": True, "status": "yes", "confidence": "medium"}
    },
    {
        "name": "Strong No - Not Interested",
        "transcript": """
assistant: Hi, calling about our service.
user: No thanks, not interested.
assistant: Are you sure?
user: Yes, please don't call again.
        """,
        "expected": {"agreed": False, "status": "no", "confidence": "high"}
    },
    {
        "name": "Moderate No - Busy",
        "transcript": """
assistant: Would you like to hear about our offer?
user: Not right now, I'm too busy.
assistant: Can I call back later?
user: Maybe later.
        """,
        "expected": {"agreed": False, "status": "no", "confidence": "medium"}
    },
    {
        "name": "Unclear - Short conversation",
        "transcript": """
assistant: Hello?
user: Hello.
assistant: Can you hear me?
        """,
        "expected": {"agreed": False, "status": "unclear", "confidence": "low"}
    }
]

print("\n" + "="*60)
print("TRANSCRIPT-BASED AGREEMENT DETECTION TESTS")
print("="*60 + "\n")

passed = 0
failed = 0

for test in test_cases:
    result = detect_agreement_status(
        user_intent="",
        outcome="",
        extracted_data={},
        transcript_text=test["transcript"]
    )
    
    expected = test["expected"]
    match = (
        result["agreed"] == expected["agreed"] and
        result["status"] == expected["status"] and
        result["confidence"] == expected["confidence"]
    )
    
    status = "✅ PASS" if match else "❌ FAIL"
    
    print(f"{status} | {test['name']}")
    print(f"  Expected: {expected}")
    print(f"  Got:      {result}")
    
    if match:
        passed += 1
    else:
        failed += 1
    print()

print("="*60)
print(f"Results: {passed} passed, {failed} failed")
print("="*60 + "\n")
