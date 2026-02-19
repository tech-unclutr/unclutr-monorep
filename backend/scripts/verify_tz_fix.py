
import asyncio
import pytz
from datetime import datetime, time as dt_time
from app.services.intelligence.scheduling_service import scheduling_service

async def verify_fixes():
    # Scenario: Company is in Asia/Kolkata (IST), server is in UTC.
    # Current time is 2:05 AM IST on 2026-02-12.
    # This corresponds to 8:35 PM UTC on 2026-02-11.
    
    timezone_str = "Asia/Kolkata"
    tz = pytz.timezone(timezone_str)
    
    # User's "Now" (IST)
    now_ist = tz.localize(datetime(2026, 2, 12, 2, 5, 0))
    # Server's "Now" (UTC)
    now_utc = now_ist.astimezone(pytz.UTC)
    
    print(f"--- Verification Scenario ---")
    print(f"Company Timezone: {timezone_str}")
    print(f"Current Time (User/IST): {now_ist}")
    print(f"Current Time (Server/UTC): {now_utc}")
    
    # 1. Test Window Validation (The core fix)
    windows = [
        {'day': '2026-02-12', 'start': '01:00', 'end': '03:00'}
    ]
    print(f"Campaign Windows: {windows}")
    
    # In execution.py, we now do:
    is_active = scheduling_service.is_slot_in_windows(
        slot=now_utc, 
        windows=windows, 
        timezone_str=timezone_str
    )
    
    print(f"Window Check Result: {is_active}")
    assert is_active == True, "FIX FAILED: Window check should be True for 2:05 AM IST"
    
    # 2. Test SchedulingService with naive UTC (Standard backend practice)
    # If we pass naive UTC, it should assume it's UTC and convert to IST.
    now_utc_naive = now_utc.replace(tzinfo=None)
    is_active_naive = scheduling_service.is_slot_in_windows(
        slot=now_utc_naive,
        windows=windows,
        timezone_str=timezone_str
    )
    print(f"Window Check (Naive UTC) Result: {is_active_naive}")
    assert is_active_naive == True, "FIX FAILED: Naive UTC check should also be True"
    
    # 3. Test Outside Window
    past_now_utc = (now_ist - timedelta(hours=3)).astimezone(pytz.UTC) # 11:05 PM IST (of previous day)
    is_active_past = scheduling_service.is_slot_in_windows(
        slot=past_now_utc,
        windows=windows,
        timezone_str=timezone_str
    )
    print(f"Window Check (Outside Window) Result: {is_active_past}")
    assert is_active_past == False, "FIX FAILED: Should be False for time outside window"

    print("\n✅ Verification SUCCESS! The system is now timezone-aware.")

if __name__ == "__main__":
    from datetime import timedelta
    asyncio.run(verify_fixes())
