import pytest
from datetime import datetime, date, timedelta
from app.services.intelligence.google_calendar_service import GoogleCalendarService
from unittest.mock import MagicMock, patch

@pytest.mark.asyncio
async def test_sync_campaign_windows_day_parsing():
    service = GoogleCalendarService()
    
    # Mock connection, campaign, etc.
    conn = MagicMock()
    conn.credentials = {"scopes": ["https://www.googleapis.com/auth/calendar.events"]}
    
    campaign = MagicMock()
    campaign.name = "Test Campaign"
    campaign.execution_windows = [
        {"day": "2026-02-10", "start": "09:00", "end": "11:00"},
        {"day": "Monday", "start": "14:00", "end": "16:00"}
    ]
    
    # Mock Google API service
    mock_gcal_service = MagicMock()
    
    with patch("app.services.intelligence.google_calendar_service.build", return_value=mock_gcal_service), \
         patch("app.services.intelligence.google_calendar_service.logger") as mock_logger:
        
        # Mock the list and insert calls
        mock_gcal_service.events().list().execute.return_value = {"items": []}
        mock_gcal_service.events().insert().execute.return_value = {"id": "new_event_id"}
        
        # Use a fixed today for testing the fallback
        test_today = date(2026, 2, 1) # Sunday
        with patch("app.services.intelligence.google_calendar_service.datetime") as mock_datetime:
            # We need to be careful with datetime mocking as it's a built-in
            mock_datetime.now.return_value.date.return_value = test_today
            mock_datetime.strptime.side_effect = datetime.strptime
            mock_datetime.combine.side_effect = datetime.combine
            
            # Reset mock to clear setup calls
            mock_gcal_service.events().insert.reset_mock()

            # Run sync
            events_created = await service.sync_campaign_windows(conn, campaign, timezone_str="UTC")
            
            assert events_created == 2
            
            # Verify the calls
            # First window: 2026-02-10
            # Second window: Monday -> Next Monday after Feb 1 (Sunday) is Feb 2
            
            insert_calls = mock_gcal_service.events().insert.call_args_list
            assert len(insert_calls) == 2
            
            # Check for mapping logs
            mock_logger.info.assert_any_call("Mapped day name 'Monday' to 2026-02-02")
