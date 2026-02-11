import logging
from datetime import datetime
from datetime import time as dt_time
from typing import Any, Dict, List

import pytz

logger = logging.getLogger(__name__)

class SchedulingService:
    @staticmethod
    def is_slot_in_windows(slot: datetime, windows: List[Dict[str, Any]], timezone_str: str = "UTC") -> bool:
        """
        Checks if a given slot falls within any of the defined execution windows.
        
        Windows format:
        [
            {"day": "2024-05-20", "start": "09:00", "end": "11:00"},
            {"day": "Monday", "start": "14:00", "end": "17:00"}
        ]
        """
        if not windows:
            return False

        # Ensure slot is naive if we are comparing with native combines, 
        # but let's localize everything to the requested timezone for accuracy.
        # Robust timezone handling
        if slot.tzinfo is None:
            # Assume naive datetime is UTC (standard backend practice)
            slot_localized = pytz.UTC.localize(slot).astimezone(pytz.timezone(timezone_str))
        else:
            # Already has TZ info, just convert
            slot_localized = slot.astimezone(pytz.timezone(timezone_str))

        slot_date = slot_localized.date()
        slot_time = slot_localized.time()
        slot_weekday = slot_localized.strftime("%A")

        for window in windows:
            day_str = window.get("day")
            start_str = window.get("start")
            end_str = window.get("end")

            if not day_str or not start_str or not end_str:
                continue

            # Check Day/Date
            day_match = False
            if "-" in day_str:  # YYYY-MM-DD format
                try:
                    window_date = datetime.strptime(day_str, "%Y-%m-%d").date()
                    if slot_date == window_date:
                        day_match = True
                except ValueError:
                    logger.warning(f"Invalid date format in window: {day_str}")
            else:  # Day name format (Monday, Tuesday, etc.)
                if slot_weekday.lower() == day_str.lower():
                    day_match = True

            if not day_match:
                continue

            # Check Time
            try:
                start_h, start_m = map(int, start_str.split(":"))
                end_h, end_m = map(int, end_str.split(":"))
                
                window_start = dt_time(hour=start_h, minute=start_m)
                window_end = dt_time(hour=end_h, minute=end_m)

                if window_start <= slot_time <= window_end:
                    return True
            except (ValueError, AttributeError) as e:
                logger.warning(f"Invalid time format in window: {start_str}-{end_str}: {e}")

        return False

    def check_slot_availability(self, slot: datetime, windows: List[Dict[str, Any]], timezone_str: str = "UTC") -> bool:
        """
        Higher level check that could eventually incorporate Google Calendar free/busy 
        if we decide to block Bolna based on specific event conflicts.
        For now, it strictly checks against campaign execution windows.
        """
        return self.is_slot_in_windows(slot, windows, timezone_str)

scheduling_service = SchedulingService()
