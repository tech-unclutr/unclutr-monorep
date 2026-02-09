"""
Enhanced test script for improved transcript-based agreement detection
Tests edge cases and scenarios that could cause false positives/negatives
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.core.agreement_utils import detect_agreement_status

# Enhanced test cases including edge cases
test_cases = [
    {
        "name": "Strong Yes - Multiple Signals",
        "transcript": """
assistant: Hi! I'm calling about our new service. Are you interested?
user: Yes, definitely! Sounds great.
assistant: Perfect! When would be a good time to schedule?
user: I'd like to book it for next week.
        """,
        "expected": {"agreed": True, "status": "yes", "confidence": "high"}
    },
    {
        "name": "Moderate Yes - Questions + Interest",
        "transcript": """
assistant: Would you like to learn more about our product?
user: Maybe, I'm thinking about it.
assistant: I can send you more information.
user: Sure, send me the pricing.
user: How much does it cost?
        """,
        "expected": {"agreed": True, "status": "yes", "confidence": "medium"}
    },
    {
        "name": "Strong No - Clear Rejection",
        "transcript": """
assistant: Hi, calling about our service.
user: No thanks, not interested.
assistant: Are you sure?
user: Yes, please don't call again.
        """,
        "expected": {"agreed": False, "status": "no", "confidence": "high"}
    },
    {
        "name": "Moderate No - Soft Rejection",
        "transcript": """
assistant: Would you like to hear about our offer?
user: Not right now, I'm too busy.
assistant: Can I call back later?
user: Maybe later.
        """,
        "expected": {"agreed": False, "status": "no", "confidence": "medium"}
    },
    {
        "name": "Unclear - Very Short Call",
        "transcript": """
assistant: Hello?
user: Hello.
        """,
        "expected": {"agreed": False, "status": "unclear", "confidence": "low"}
    },
    {
        "name": "FALSE POSITIVE TEST: Only Questions",
        "transcript": """
assistant: We have a new product.
user: What is it?
user: How much?
user: When is it available?
        """,
        "expected": {"agreed": False, "status": "unclear", "confidence": "low"}
    },
    {
        "name": "FALSE NEGATIVE TEST: Interested but Cautious",
        "transcript": """
assistant: Would you like to try our service?
user: Yeah, I'm interested.
assistant: Great! Can I schedule a demo?
user: Sure, that works.
        """,
        "expected": {"agreed": True, "status": "yes", "confidence": "high"}
    },
    {
        "name": "EDGE CASE: Yes followed by No",
        "transcript": """
assistant: Are you interested?
user: Yes, but actually no thanks.
user: Not interested.
        """,
        "expected": {"agreed": False, "status": "no", "confidence": "high"}
    },
    {
        "name": "EDGE CASE: Polite Rejection",
        "transcript": """
assistant: Can I tell you about our offer?
user: That's nice but I already have something similar.
user: Thanks anyway.
        """,
        "expected": {"agreed": False, "status": "no", "confidence": "medium"}
    },
    {
        "name": "STRONG YES: Booking Intent",
        "transcript": """
assistant: Would you like to schedule a call?
user: Yes, when can we do it?
assistant: How about next Tuesday?
user: Perfect, let's book it.
        """,
        "expected": {"agreed": True, "status": "yes", "confidence": "high"}
    }
]

print("\n" + "="*70)
print("ENHANCED TRANSCRIPT-BASED AGREEMENT DETECTION TESTS")
print("="*70 + "\n")

passed = 0
failed = 0
edge_case_passed = 0
edge_case_total = 0

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
    
    is_edge_case = "EDGE CASE" in test["name"] or "FALSE" in test["name"]
    if is_edge_case:
        edge_case_total += 1
        if match:
            edge_case_passed += 1
    
    status = "✅ PASS" if match else "❌ FAIL"
    
    print(f"{status} | {test['name']}")
    if not match:
        print(f"  Expected: {expected}")
        print(f"  Got:      {result}")
    print()
    
    if match:
        passed += 1
    else:
        failed += 1

print("="*70)
print(f"Overall Results: {passed}/{len(test_cases)} passed ({passed/len(test_cases)*100:.0f}%)")
print(f"Edge Cases: {edge_case_passed}/{edge_case_total} passed ({edge_case_passed/edge_case_total*100:.0f}% if edge_case_total > 0 else 0)")
print("="*70 + "\n")
