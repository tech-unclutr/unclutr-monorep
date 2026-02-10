import os
from datetime import datetime, timedelta, timezone
from datetime import time as dt_time
from typing import Any, Dict, List
from uuid import UUID

import google.oauth2.credentials
import google_auth_oauthlib.flow
import pytz
from googleapiclient.discovery import build
from loguru import logger
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.calendar_connection import CalendarConnection


class GoogleCalendarService:
    SCOPES = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
    ]

    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI

    def get_flow(self, state: str = None):
        """Creates the OAuth flow object."""
        flow = google_auth_oauthlib.flow.Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri],
                }
            },
            scopes=self.SCOPES,
            state=state
        )
        flow.redirect_uri = self.redirect_uri
        return flow

    async def get_auth_url(self, company_id: UUID, user_id: str) -> str:
        """Generates the Google OAuth URL."""
        # We pass company_id and user_id in state to retrieve them in the callback
        state = f"{company_id}:{user_id}"
        flow = self.get_flow(state=state)
        
        # access_type='offline' is critical for getting a refresh_token
        # prompt='consent' forces show of the grant screen even if previously approved
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        return auth_url

    async def handle_callback(self, code: str, state: str, session: AsyncSession) -> CalendarConnection:
        """Exchanges auth code for tokens and saves them."""
        # Force OAUTHLIB_INSECURE_TRANSPORT for development
        # This is critical for ngrok/localhost where HTTPS might not be fully recognized by oauthlib
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        # Relax token scope validation as Google might return more scopes than requested
        os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
        
        try:
            company_id_str, user_id = state.split(":")
            company_id = UUID(company_id_str)
            # user_id is a string (Firebase UID)
        except Exception:
            raise ValueError("Invalid state payload")

        flow = self.get_flow()
        try:
            logger.info(f"Google OAuth: Fetching token with redirect_uri: {self.redirect_uri}")
            flow.fetch_token(code=code)
        except Exception as e:
            import traceback
            logger.error(f"Google OAuth fetch_token failed: {e}")
            logger.error(traceback.format_exc())
            raise ValueError(f"Failed to fetch token from Google: {e}")
            
        credentials = flow.credentials

        # Prepare tokens for storage
        token_data = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
        }

        # Upsert CalendarConnection
        stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == company_id,
            CalendarConnection.user_id == user_id,
            CalendarConnection.provider == "google"
        )
        result = await session.execute(stmt)
        conn = result.scalars().first()

        if not conn:
            conn = CalendarConnection(
                company_id=company_id,
                user_id=user_id,
                provider="google"
            )

        conn.credentials = token_data
        conn.status = "active"
        if credentials.expiry:
             conn.expiry = credentials.expiry.replace(tzinfo=None) # Store as naive UTC
        
        conn.updated_at = datetime.utcnow()
        session.add(conn)
        await session.commit()
        await session.refresh(conn)
        
        # Start watching for changes
        try:
            await self.watch_calendar(conn)
        except Exception as e:
            logger.warning(f"Failed to start watch for connection {conn.id}: {e}")
        
        return conn

    async def watch_calendar(self, conn: CalendarConnection) -> Dict[str, Any]:
        """Registers a push notification channel for the primary calendar."""
        creds = google.oauth2.credentials.Credentials(
            token=conn.credentials.get("token"),
            refresh_token=conn.credentials.get("refresh_token"),
            token_uri=conn.credentials.get("token_uri"),
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=conn.credentials.get("scopes"),
        )

        service = build('calendar', 'v3', credentials=creds)

        # We use the connection ID as the channel ID
        channel_id = str(conn.id)
        
        body = {
            "id": channel_id,
            "type": "web_hook",
            "address": f"{settings.BACKEND_URL}/api/v1/intelligence/calendar/webhook",
            "params": {
                "ttl": "3600" # 1 hour for now, we can refresh it periodically
            }
        }

        # Watch the 'primary' calendar
        watch_response = service.events().watch(calendarId='primary', body=body).execute()
        
        # Store watch info in credentials metadata
        conn.credentials["watch"] = {
            "channel_id": channel_id,
            "resource_id": watch_response.get("resourceId"),
            "expiration": watch_response.get("expiration")
        }
        # In a real app, use a proper session to save this
        # For now, we assume the caller will commit if needed, 
        # but here we are in a service, so we should probably take a session as arg.
        return watch_response

    async def disconnect_calendar(self, session: AsyncSession, company_id: UUID) -> bool:
        """Removes the calendar connection for a company."""
        try:
            stmt = select(CalendarConnection).where(
                CalendarConnection.company_id == company_id,
                CalendarConnection.provider == "google"
            )
            result = await session.execute(stmt)
            conn = result.scalars().first()

            if not conn:
                logger.warning(f"No Google Calendar connection found for company {company_id}")
                return False

            # In a real app, you might want to revoke the token with Google as well
            # However, for now, simply deleting it from our DB is sufficient.
            
            await session.delete(conn)
            await session.commit()
            logger.info(f"Disconnected Google Calendar for company {company_id}")
            return True

        except Exception as e:
            logger.error(f"Error disconnecting Google Calendar: {e}")
            await session.rollback()
            raise

    async def get_availability(self, conn: CalendarConnection) -> List[Dict[str, Any]]:
        """Fetches free/busy status for the next 7 days across ALL calendars using Batch API."""
        import asyncio
        
        loop = asyncio.get_running_loop()

        def _build_service():
            creds = google.oauth2.credentials.Credentials(
                token=conn.credentials.get("token"),
                refresh_token=conn.credentials.get("refresh_token"),
                token_uri=conn.credentials.get("token_uri"),
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                scopes=conn.credentials.get("scopes"),
            )
            # Use cache_discovery=False to avoid issues with dynamic path discovery in some environments
            # but usually it's better to build once. 
            return build('calendar', 'v3', credentials=creds)

        service = await loop.run_in_executor(None, _build_service)

        # Ensure ISO format with 'Z'
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        time_min = today_start.isoformat().replace('+00:00', 'Z')
        time_max = (today_start + timedelta(days=7)).isoformat().replace('+00:00', 'Z')

        try:
            # 1. Get List of Calendars (Blocking Network Call)
            def _fetch_calendar_list():
                return service.calendarList().list().execute()

            calendar_list = await loop.run_in_executor(None, _fetch_calendar_list)

            # Filter calendars (Owner, Writer, Reader)
            calendar_ids = [
                c.get('id') for c in calendar_list.get('items', []) 
                if c.get('accessRole') in ['owner', 'writer', 'reader']
                and 'holiday' not in c.get('id', '') 
                and 'contacts' not in c.get('id', '')
            ]

            if not calendar_ids:
                calendar_ids = ['primary']
            
            # 2. Fetch Events using Batch API (Safe and Fast)
            batch = service.new_batch_http_request()
            batch_results = {}
            
            def callback(request_id, response, exception):
                if exception is not None:
                    logger.warning(f"Error fetching events for calendar {request_id}: {exception}")
                else:
                    batch_results[request_id] = response

            for cal_id in calendar_ids:
                batch.add(service.events().list(
                    calendarId=cal_id,
                    timeMin=time_min,
                    timeMax=time_max,
                    singleEvents=True,
                    orderBy='startTime'
                ), callback=callback, request_id=cal_id)

            # Execute batch in executor to not block async loop
            # We use a 20s timeout for the batch execution itself
            await asyncio.wait_for(
                loop.run_in_executor(None, batch.execute),
                timeout=20.0
            )

            all_busy = []
            for cal_id, events_result in batch_results.items():
                if not events_result:
                    continue

                for event in events_result.get('items', []):
                    start = event.get('start')
                    end = event.get('end')
                    
                    transparency = event.get('transparency', 'opaque')
                    
                    if transparency == 'transparent':
                        continue

                    # Try to get dateTime (Time-based events)
                    s_dt = start.get('dateTime')
                    e_dt = end.get('dateTime')

                    # Fallback to date (All-Day events)
                    if not s_dt and 'date' in start:
                        s_dt = f"{start['date']}T00:00:00Z"
                        e_dt = f"{end['date']}T00:00:00Z"
                    
                    if not s_dt or not e_dt:
                        continue
                        
                    all_busy.append({
                        'start': s_dt,
                        'end': e_dt,
                        'summary': event.get('summary', ''),
                        'transparency': transparency
                    })
            
            # Sort by start time
            all_busy.sort(key=lambda x: x.get('start'))
            
            return all_busy

        except asyncio.TimeoutError:
            logger.error("Timeout fetching calendar availability after 20s (Batch API)")
            raise Exception("Calendar availability fetch timed out. Please try again.")
        except Exception as e:
            logger.error(f"Error in get_availability: {e}")
            raise

    async def sync_campaign_windows(self, conn: CalendarConnection, campaign: Any, timezone_str: str = "UTC") -> int:
        """
        Syncs campaign execution windows to the user's primary Google Calendar.
        Maps day names (Monday, etc.) to the upcoming week's dates.
        Returns the number of events created.
        """
        import asyncio
        
        loop = asyncio.get_running_loop()

        def _get_service():
            creds = google.oauth2.credentials.Credentials(
                token=conn.credentials.get("token"),
                refresh_token=conn.credentials.get("refresh_token"),
                token_uri=conn.credentials.get("token_uri"),
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                scopes=conn.credentials.get("scopes"),
            )
            return build('calendar', 'v3', credentials=creds)

        try:
            service = await loop.run_in_executor(None, _get_service)
        except Exception as e:
            import traceback
            logger.error(f"Failed to build Google Calendar service: {e}")
            logger.error(traceback.format_exc())
            raise

        logger.info(f"Starting sync for campaign {campaign.id} with {len(campaign.execution_windows or [])} windows")
        execution_windows = campaign.execution_windows or []
        if not execution_windows:
            logger.warning(f"No execution windows found for campaign {campaign.id}")
            return 0

        # Check for write permissions
        required_scope = 'https://www.googleapis.com/auth/calendar.events'
        stored_scopes = conn.credentials.get("scopes", [])
        # Also check for the catch-all 'calendar' scope just in case
        has_write_permission = any(s in stored_scopes for s in [required_scope, 'https://www.googleapis.com/auth/calendar'])
        
        logger.info(f"[CALENDAR_SYNC] Connection {conn.id} - Stored scopes: {stored_scopes}")
        logger.info(f"[CALENDAR_SYNC] Has write permission: {has_write_permission}")
        
        if not has_write_permission:
            logger.error(f"Insufficient permissions for connection {conn.id}. Scopes found: {stored_scopes}")
            raise ValueError("Insufficient permissions. Please disconnect and reconnect your Google Calendar to grant write access.")


        today = datetime.now(timezone.utc).date()
        execution_windows = campaign.execution_windows or []
        logger.info(f"Syncing campaign {campaign.id}. Total windows found in campaign object: {len(execution_windows)}")
        logger.info(f"Full windows data: {execution_windows}")
        
        # STEP 1: Delete all existing events for this campaign
        event_summary_prefix = f'{campaign.name} powered by SquareUp'
        
        def _delete_existing_campaign_events():
            time_min = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            time_max = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
            
            events_result = service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                q=event_summary_prefix,
                singleEvents=True
            ).execute()
            
            events = events_result.get('items', [])
            deleted_count = 0
            
            for event in events:
                if event.get('summary', '').startswith(event_summary_prefix):
                    try:
                        service.events().delete(
                            calendarId='primary',
                            eventId=event['id']
                        ).execute()
                        deleted_count += 1
                        logger.debug(f"Deleted event: {event.get('summary')} (ID: {event['id']})")
                    except Exception as e:
                        logger.warning(f"Failed to delete event {event['id']}: {e}")
            
            return deleted_count
        
        deleted_count = await loop.run_in_executor(None, _delete_existing_campaign_events)
        logger.info(f"Deleted {deleted_count} existing events for campaign {campaign.id}")
        
        # STEP 2: Create fresh events from current execution windows
        events_created = 0

        for i, window in enumerate(execution_windows):
            logger.info(f"[SYNC_DEBUG] Processing window {i+1}/{len(execution_windows)}: {window}")
            day_str = window.get('day')
            start_time_str = window.get('start')
            end_time_str = window.get('end')
            
            if not day_str or not start_time_str or not end_time_str:
                logger.warning(f"[SYNC_DEBUG] Missing data for window: {window}")
                continue

            # Direct Date Parsing
            if 'T' in day_str:
                day_str = day_str.split('T')[0]
            
            try:
                event_date = datetime.strptime(day_str, "%Y-%m-%d").date()
            except ValueError:
                # FALLBACK: Handle day names (e.g., "Monday")
                day_map = {
                    'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
                    'friday': 4, 'saturday': 5, 'sunday': 6
                }
                target_day = day_map.get(day_str.lower())
                if target_day is not None:
                    current_day = today.weekday()
                    days_ahead = target_day - current_day
                    if days_ahead < 0:
                        days_ahead += 7
                    event_date = today + timedelta(days=days_ahead)
                    logger.info(f"Mapped day name '{day_str}' to {event_date}")
                else:
                    logger.warning(f"Invalid date/day format in sync: {day_str}. Skipping.")
                    continue
            
            try:
                start_h, start_m = map(int, start_time_str.split(':'))
                end_h, end_m = map(int, end_time_str.split(':'))

                tz = pytz.timezone(timezone_str or "UTC")
                
                # Combine date and time, then localize to the specified timezone
                start_dt_local = tz.localize(datetime.combine(event_date, dt_time(hour=start_h, minute=start_m)))
                end_dt_local = tz.localize(datetime.combine(event_date, dt_time(hour=end_h, minute=end_m)))
                
                # Convert to UTC for Google Calendar API recommendation (though it accepts other TZs, UTC is safest)
                start_dt = start_dt_local.astimezone(pytz.utc)
                end_dt = end_dt_local.astimezone(pytz.utc)

                logger.info(f"[SYNC_DEBUG] Window converted: Local({start_dt_local}) -> UTC({start_dt}) using TZ: {timezone_str}")

                event_summary = f'{campaign.name} powered by SquareUp'
                event_body = {
                    'summary': event_summary,
                    'description': f'Execution window for campaign: {campaign.name}. Expecting customer calls.',
                    'start': {
                        'dateTime': start_dt.isoformat().replace('+00:00', 'Z'),
                        'timeZone': 'UTC',
                    },
                    'end': {
                        'dateTime': end_dt.isoformat().replace('+00:00', 'Z'),
                        'timeZone': 'UTC',
                    },
                    'reminders': {
                        'useDefault': True,
                    },
                }

                def _insert_event():
                    return service.events().insert(calendarId='primary', body=event_body).execute()

                res = await loop.run_in_executor(None, _insert_event)
                events_created += 1
                logger.info(f"[SYNC_DEBUG] Successfully created event. ID: {res.get('id')} Summary: {event_summary}")
                
            except Exception as e:
                logger.error(f"[SYNC_DEBUG] Failed to sync window {i+1} ({day_str} {start_time_str}): {e}")
                import traceback
                logger.error(traceback.format_exc())

        return events_created

    async def create_single_execution_event(self, conn: CalendarConnection, campaign: Any, window: Dict[str, Any], timezone_str: str = "UTC"):
        """
        Creates a single execution window event in Google Calendar.
        """
        import asyncio
        
        loop = asyncio.get_running_loop()

        def _get_service():
            creds = google.oauth2.credentials.Credentials(
                token=conn.credentials.get("token"),
                refresh_token=conn.credentials.get("refresh_token"),
                token_uri=conn.credentials.get("token_uri"),
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                scopes=conn.credentials.get("scopes"),
            )
            return build('calendar', 'v3', credentials=creds)

        service = await loop.run_in_executor(None, _get_service)

        today = datetime.now(timezone.utc).date()

        day_str = window.get('day')
        start_time_str = window.get('start')
        end_time_str = window.get('end')
            
        logger.info(f"Creating single execution event: {day_str}, {start_time_str}-{end_time_str}")

        if not day_str or not start_time_str or not end_time_str:
             logger.warning(f"Invalid window data: {window}")
             return

        try:
            event_date = datetime.strptime(day_str, "%Y-%m-%d").date()
        except ValueError:
            logger.warning(f"Invalid date format: {day_str}. Expected YYYY-MM-DD")
            return

        try:
            start_h, start_m = map(int, start_time_str.split(':'))
            end_h, end_m = map(int, end_time_str.split(':'))

            tz = pytz.timezone(timezone_str or "UTC")
            start_dt_local = tz.localize(datetime.combine(event_date, dt_time(hour=start_h, minute=start_m)))
            end_dt_local = tz.localize(datetime.combine(event_date, dt_time(hour=end_h, minute=end_m)))
            
            start_dt = start_dt_local.astimezone(pytz.utc)
            end_dt = end_dt_local.astimezone(pytz.utc)

            event_body = {
                'summary': f'{campaign.name} powered by SquareUp',
                'description': f'Execution window for campaign: {campaign.name}. Expecting customer calls.',
                'start': {
                    'dateTime': start_dt.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_dt.isoformat(),
                    'timeZone': 'UTC',
                },
                'reminders': {
                    'useDefault': True,
                },
            }

            def _insert_event():
                return service.events().insert(calendarId='primary', body=event_body).execute()

            await loop.run_in_executor(None, _insert_event)
            logger.info("Event created successfully")
        except Exception as e:
            logger.error(f"Failed to create single event: {e}")
            raise

google_calendar_service = GoogleCalendarService()
