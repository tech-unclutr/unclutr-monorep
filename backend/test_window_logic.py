
from datetime import datetime, timedelta

def validate_window(windows, now_local):
    is_in_active_window = False
    for w in windows:
        day = w.get('day', '')
        st = w.get('start', '')
        et = w.get('end', '')
        
        if day and st and et:
            try:
                start_dt = datetime.fromisoformat(f"{day}T{st}:00")
                end_dt = datetime.fromisoformat(f"{day}T{et}:00")
                
                print(f"Checking window: {start_dt} to {end_dt} against {now_local}")
                if start_dt <= now_local <= end_dt:
                    is_in_active_window = True
                    break
            except Exception as e:
                print(f"Error parsing window: {e}")
                continue
    return is_in_active_window

# Mimic extend_window logic
now = datetime.now()
day_str = now.strftime("%Y-%m-%d")
start_time_str = now.strftime("%H:%M")
end_local = now + timedelta(hours=2)
end_time_str = end_local.strftime("%H:%M")

new_window = {
    "day": day_str,
    "start": start_time_str,
    "end": end_time_str
}

print(f"Generated new window: {new_window}")

# Mimic start_session logic called immediately after
# We'll use the same 'now' or a slightly later one
print("Test 1: Same second")
ok = validate_window([new_window], now)
print(f"Result: {ok}")

print("\nTest 2: 1 second later")
ok = validate_window([new_window], now + timedelta(seconds=1))
print(f"Result: {ok}")

print("\nTest 3: 1 second earlier (reproduce failure?)")
ok = validate_window([new_window], now - timedelta(seconds=1))
print(f"Result: {ok}")
