from app.core.intelligence_utils import enrich_user_intent

def test_enrichment():
    cases = [
        {
            "name": "Generic with Voicemail transcript",
            "raw_intent": "The user did not explicitly state an intent in the provided transcript.",
            "outcome": "COMPLETED",
            "duration": 5,
            "transcript": "assistant: Hello\nuser: your call has been forwarded to voicemail",
            "expected": "Call reached voicemail. No engagement possible."
        },
        {
            "name": "Generic with Hangup",
            "raw_intent": "The user did not state an intent.",
            "outcome": "HANGUP",
            "duration": 4,
            "transcript": "assistant: Hello\nuser: hello",
            "expected": "User hung up immediately after 4s."
        },
        {
            "name": "Generic with Silence",
            "raw_intent": "No intent was mentioned.",
            "outcome": "COMPLETED",
            "duration": 10,
            "transcript": "",
            "expected": "Call was silent. No audio detected from the user."
        },
        {
            "name": "Actual Intent preserved",
            "raw_intent": "The user is interested in a demo.",
            "outcome": "INTENT_YES",
            "duration": 60,
            "transcript": "...",
            "expected": "The user is interested in a demo."
        }
    ]

    for case in cases:
        result = enrich_user_intent(
            case["raw_intent"], 
            case["outcome"], 
            case["duration"], 
            case["transcript"]
        )
        print(f"Test: {case['name']}")
        print(f"  Input: {case['raw_intent']}")
        print(f"  Result: {result}")
        print(f"  Passed: {result == case['expected']}")
        print("-" * 20)

if __name__ == "__main__":
    test_enrichment()
