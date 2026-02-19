
import unittest
from datetime import datetime, timedelta
import pytz
from app.services.intelligence.scheduling_service import scheduling_service

class TestTimezoneValidation(unittest.TestCase):
    def test_window_validation_with_timezone(self):
        # Case: Current time is 2:00 AM IST (Asia/Kolkata)
        # Server time is likely 8:30 PM UTC (of previous day)
        
        timezone_str = "Asia/Kolkata"
        tz = pytz.timezone(timezone_str)
        
        # 1. Mock "Now" in IST
        now_ist = tz.localize(datetime(2026, 2, 12, 2, 0, 0))
        
        # 2. Window defining 1:00 AM to 3:00 AM on 2026-02-12
        windows = [
            {'day': '2026-02-12', 'start': '01:00', 'end': '03:00'}
        ]
        
        # Current logic (failing because it uses naive now or server local):
        # We simulate the backend failure by using UTC now vs IST windows
        now_utc = now_ist.astimezone(pytz.UTC)
        print(f"DEBUG: Now IST: {now_ist}")
        print(f"DEBUG: Now UTC: {now_utc}")
        
        # This is what SchedulingService SHOULD do if fixed
        is_active = scheduling_service.is_slot_in_windows(now_utc, windows, timezone_str)
        print(f"DEBUG: Fixed Logic Result: {is_active}")
        self.assertTrue(is_active, "Should be active when localized correctly")
        
        # Simulate OLD logic in execution.py (approximate)
        # It does datetime.fromisoformat(f"{day}T{st}:00") which is naive
        # and compares with datetime.now() which is also naive (server local)
        
        naive_now = datetime(2026, 2, 12, 2, 0, 0) # This is what user thinks "now" is
        # But if server is UTC, datetime.now() is actually:
        server_now = datetime(2026, 2, 11, 20, 30, 0) # UTC equivalent
        
        window_start = datetime.fromisoformat("2026-02-12T01:00:00")
        window_end = datetime.fromisoformat("2026-02-12T03:00:00")
        
        is_active_old = window_start <= server_now <= window_end
        print(f"DEBUG: Old Logic (Server=UTC, User=IST) Result: {is_active_old}")
        # This is expected to be FALSE, which matches the user's issue.

if __name__ == "__main__":
    unittest.main()
