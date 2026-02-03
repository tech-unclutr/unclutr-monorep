
from datetime import datetime, timedelta

def validate_window_with_fix(windows, now_local):
    is_in_active_window = False
    for w in windows:
        day = w.get('day', '')
        st = w.get('start', '')
        et = w.get('end', '')
        
        if day and st and et:
            try:
                start_dt = datetime.fromisoformat(f"{day}T{st}:00")
                end_dt = datetime.fromisoformat(f"{day}T{et}:00")
                
                # FIXED LOGIC
                effective_start = start_dt - timedelta(minutes=2)
                
                print(f"Checking window: {start_dt} (effective: {effective_start}) to {end_dt} against {now_local}")
                if effective_start <= now_local <= end_dt:
                    is_in_active_window = True
                    break
            except Exception as e:
                print(f"Error parsing window: {e}")
                continue
    return is_in_active_window

# Mimic FIXED extend_window logic
now = datetime.now()
# Start 5 mins in past
start_time_local = now - timedelta(minutes=5)
day_str = start_time_local.strftime("%Y-%m-%d")
start_time_str = start_time_local.strftime("%H:%M")
end_local = now + timedelta(hours=2)
end_time_str = end_local.strftime("%H:%M")

new_window = {
    "day": day_str,
    "start": start_time_str,
    "end": end_time_str
}

print(f"Generated new window (fixed): {new_window}")

# Mimic start_session logic called IMMEDIATELY after
print("Test 1: Same second (should be TRUE now)")
ok = validate_window_with_fix([new_window], now)
print(f"Result: {ok}")

# Test 1 second before the window "officially" starts (due to grace period)
print("\nTest 2: 1 second before 'start_time_str' (should be TRUE due to grace)")
window_official_start = datetime.fromisoformat(f"{day_str}T{start_time_str}:00")
ok = validate_window_with_fix([new_window], window_official_start - timedelta(seconds=1))
print(f"Result: {ok}")

# Test outside grace period
print("\nTest 3: 3 minutes before 'start_time_str' (should be FALSE)")
ok = validate_window_with_fix([new_window], window_official_start - timedelta(minutes=3))
print(f"Result: {ok}")
