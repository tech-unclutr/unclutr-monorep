import pytest
from datetime import datetime, timedelta
from app.services.intelligence.scheduling_service import scheduling_service

def test_is_slot_in_windows_date_match():
    windows = [
        {"day": "2024-05-20", "start": "09:00", "end": "11:00"}
    ]
    
    # Inside window
    slot = datetime(2024, 5, 20, 10, 0)
    assert scheduling_service.is_slot_in_windows(slot, windows) is True
    
    # Outside time range
    slot = datetime(2024, 5, 20, 11, 30)
    assert scheduling_service.is_slot_in_windows(slot, windows) is False
    
    # Different date
    slot = datetime(2024, 5, 21, 10, 0)
    assert scheduling_service.is_slot_in_windows(slot, windows) is False

def test_is_slot_in_windows_day_match():
    windows = [
        {"day": "Monday", "start": "14:00", "end": "17:00"}
    ]
    
    # Monday inside window
    slot = datetime(2024, 5, 20, 15, 0) # 2024-05-20 is a Monday
    assert scheduling_service.is_slot_in_windows(slot, windows) is True
    
    # Monday outside window
    slot = datetime(2024, 5, 20, 18, 0)
    assert scheduling_service.is_slot_in_windows(slot, windows) is False
    
    # Tuesday (same time)
    slot = datetime(2024, 5, 21, 15, 0)
    assert scheduling_service.is_slot_in_windows(slot, windows) is False

def test_is_slot_in_windows_multiple_windows():
    windows = [
        {"day": "Monday", "start": "09:00", "end": "10:00"},
        {"day": "Wednesday", "start": "09:00", "end": "10:00"}
    ]
    
    # Monday match
    assert scheduling_service.is_slot_in_windows(datetime(2024, 5, 20, 9, 30), windows) is True
    # Tuesday no match
    assert scheduling_service.is_slot_in_windows(datetime(2024, 5, 21, 9, 30), windows) is False
    # Wednesday match
    assert scheduling_service.is_slot_in_windows(datetime(2024, 5, 22, 9, 30), windows) is True

def test_is_slot_in_windows_timezone():
    windows = [
        {"day": "2024-05-20", "start": "09:00", "end": "11:00"}
    ]
    
    # Slot is 08:30 UTC, but we want to check if it's in window for IST (UTC+5:30)
    # 08:30 UTC = 14:00 IST
    slot = datetime(2024, 5, 20, 8, 30)
    
    # In UTC, 08:30 is NOT in 09:00-11:00
    assert scheduling_service.is_slot_in_windows(slot, windows, timezone_str="UTC") is False
    
    # In IST, 08:30 UTC = 14:00 IST, which is NOT in 09:00-11:00
    assert scheduling_service.is_slot_in_windows(slot, windows, timezone_str="Asia/Kolkata") is False
    
    # Slot is 05:00 UTC = 10:30 IST
    slot = datetime(2024, 5, 20, 5, 0)
    assert scheduling_service.is_slot_in_windows(slot, windows, timezone_str="Asia/Kolkata") is True
