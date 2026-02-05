
def _human_readable_duration(seconds: int) -> str:
    """Converts seconds into a natural-sounding string like '10 minutes'."""
    if not seconds or seconds <= 0:
        return "0 seconds"
        
    minutes = seconds // 60
    remaining_seconds = seconds % 60
    
    parts = []
    if minutes > 0:
        parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")
    if remaining_seconds > 0:
        parts.append(f"{remaining_seconds} second{'s' if remaining_seconds != 1 else ''}")
        
    if len(parts) == 0:
        return "0 seconds"
    return " and ".join(parts)

def test_duration():
    test_cases = [
        (0, "0 seconds"),
        (-10, "0 seconds"),
        (60, "1 minute"),
        (120, "2 minutes"),
        (600, "10 minutes"),
        (65, "1 minute and 5 seconds"),
        (125, "2 minutes and 5 seconds"),
        (1, "1 second"),
        (59, "59 seconds"),
    ]
    
    all_passed = True
    print(f"{'Input (s)':<10} | {'Expected':<25} | {'Actual':<25} | {'Status'}")
    print("-" * 80)
    for seconds, expected in test_cases:
        actual = _human_readable_duration(seconds)
        status = "✅ PASS" if actual == expected else f"❌ FAIL"
        print(f"{seconds:<10} | {expected:<25} | {actual:<25} | {status}")
        if actual != expected:
            all_passed = False
            
    if all_passed:
        print("\n✨ All tests passed!")
    else:
        print("\n🚨 Some tests failed.")

if __name__ == "__main__":
    test_duration()
