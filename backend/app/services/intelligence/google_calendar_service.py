import google.oauth2.credentials
import google_auth_oauthlib.flow
from googleapiclient.discovery import build
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from uuid import UUID
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from loguru import logger

from app.core.config import settings
from app.models.calendar_connection import CalendarConnection
import json

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
        try:
            company_id_str, user_id = state.split(":")
            company_id = UUID(company_id_str)
            # user_id is a string (Firebase UID)
        except Exception:
            raise ValueError("Invalid state payload")

        flow = self.get_flow()
        flow.fetch_token(code=code)
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
            client_id=conn.credentials.get("client_id"),
            client_secret=conn.credentials.get("client_secret"),
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
        """Fetches free/busy status for the next 7 days across ALL calendars in parallel."""
        # 1. Create Service (Blocking, so run in executor if heavy, but usually fast enough. 
        # However, for pure async correctness, we'll keep it simple for now as build() is local mostly if not doing discovery)
        # Actually discovery IS network. So let's wrap the whole interaction in executors.
        
        import asyncio
        
        loop = asyncio.get_running_loop()

        def _build_service():
            creds = google.oauth2.credentials.Credentials(
                token=conn.credentials.get("token"),
                refresh_token=conn.credentials.get("refresh_token"),
                token_uri=conn.credentials.get("token_uri"),
                client_id=conn.credentials.get("client_id"),
                client_secret=conn.credentials.get("client_secret"),
                scopes=conn.credentials.get("scopes"),
            )
            return build('calendar', 'v3', credentials=creds)

        # Offload service creation (discovery)
        service = await loop.run_in_executor(None, _build_service)

        # Ensure ISO format with 'Z'
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        time_min = today_start.isoformat().replace('+00:00', 'Z')
        time_max = (today_start + timedelta(days=7)).isoformat().replace('+00:00', 'Z')

        try:
            # 2. Get List of Calendars (Blocking Network Call)
            def _fetch_calendar_list():
                return service.calendarList().list().execute()

            calendar_list = await loop.run_in_executor(None, _fetch_calendar_list)

            # STRICT FIX: User requested "Shared Team Calendars" (Reader/Writer) as well.
            calendar_ids = [
                c.get('id') for c in calendar_list.get('items', []) 
                if c.get('accessRole') in ['owner', 'writer', 'reader']
                and 'holiday' not in c.get('id', '') 
                and 'contacts' not in c.get('id', '')
            ]

            if not calendar_ids:
                calendar_ids = ['primary']
            
            # 3. Fetch Events in Parallel (Fan-out)
            def _fetch_events(cal_id):
                try:
                    # Create a new service instance for this thread
                    # This is crucial for thread safety as the googleapiclient service object is not thread-safe
                    creds = google.oauth2.credentials.Credentials(
                        token=conn.credentials.get("token"),
                        refresh_token=conn.credentials.get("refresh_token"),
                        token_uri=conn.credentials.get("token_uri"),
                        client_id=conn.credentials.get("client_id"),
                        client_secret=conn.credentials.get("client_secret"),
                        scopes=conn.credentials.get("scopes"),
                    )
                    service = build('calendar', 'v3', credentials=creds, cache_discovery=False)
                    
                    return service.events().list(
                        calendarId=cal_id,
                        timeMin=time_min,
                        timeMax=time_max,
                        singleEvents=True,
                        orderBy='startTime'
                    ).execute()
                except Exception as cal_err:
                    logger.warning(f"Error fetching events for calendar {cal_id}: {cal_err}")
                    return None

            # Create coroutines for each calendar
            tasks = [
                loop.run_in_executor(None, _fetch_events, cal_id)
                for cal_id in calendar_ids
            ]
            
            # Gather results
            results = await asyncio.gather(*tasks)

            all_busy = []
            for events_result in results:
                if not events_result:
                    continue

                for event in events_result.get('items', []):
                    start = event.get('start')
                    end = event.get('end')
                    
                    # Skip if:
                    # 1. It's an all-day event (only has 'date', no 'dateTime')
                    # 2. It's marked as 'transparent' (Free)
                    if not start or not end or 'dateTime' not in start or event.get('transparency') == 'transparent':
                        continue
                    
                    all_busy.append({
                        'start': start['dateTime'],
                        'end': end['dateTime']
                    })
            
            # Sort by start time
            all_busy.sort(key=lambda x: x.get('start'))
            
            # Debug log to file
            diag_info = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "mode": "parallel_async",
                "calendars": calendar_ids,
                "busy_slots_count": len(all_busy)
            }
            # Optional: Comment out file logging if performance is critical, but good for verification
            # with open("/button/backend/calendar_debug.log", "a") as f:
            #     f.write(json.dumps(diag_info) + "\n")
                
            return all_busy

        except Exception as e:
            logger.error(f"Error in get_availability: {e}")
            raise

    async def sync_campaign_windows(self, conn: CalendarConnection, campaign: Any) -> int:
        """
        Syncs campaign execution windows to the user's primary Google Calendar.
        Maps day names (Monday, etc.) to the upcoming week's dates.
        Returns the number of events created.
        """
        import asyncio
        from datetime import time as dt_time
        
        loop = asyncio.get_running_loop()

        def _get_service():
            creds = google.oauth2.credentials.Credentials(
                token=conn.credentials.get("token"),
                refresh_token=conn.credentials.get("refresh_token"),
                token_uri=conn.credentials.get("token_uri"),
                client_id=conn.credentials.get("client_id"),
                client_secret=conn.credentials.get("client_secret"),
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

        today = datetime.now(timezone.utc).date()
        events_created = 0

        for window in execution_windows:
            day_str = window.get('day')
            start_time_str = window.get('start')
            end_time_str = window.get('end')
            
            logger.info(f"Processing window: day={day_str}, start={start_time_str}, end={end_time_str}")

            if not day_str or not start_time_str or not end_time_str:
                logger.warning(f"Missing data for window: {window}")
                continue

            try:
                # Direct Date Parsing
                event_date = datetime.strptime(day_str, "%Y-%m-%d").date()
            except ValueError:
                logger.warning(f"Invalid date format in sync: {day_str}")
                continue
            
            try:
                start_h, start_m = map(int, start_time_str.split(':'))
                end_h, end_m = map(int, end_time_str.split(':'))
                
                start_dt = datetime.combine(event_date, dt_time(hour=start_h, minute=start_m), tzinfo=timezone.utc)
                end_dt = datetime.combine(event_date, dt_time(hour=end_h, minute=end_m), tzinfo=timezone.utc)

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
                events_created += 1
            except Exception as e:
                logger.error(f"Failed to sync window for {day_str} {start_time_str}: {e}")

        return events_created

    async def create_single_execution_event(self, conn: CalendarConnection, campaign: Any, window: Dict[str, Any]):
        """
        Creates a single execution window event in Google Calendar.
        """
        import asyncio
        from datetime import time as dt_time
        
        loop = asyncio.get_running_loop()

        def _get_service():
            creds = google.oauth2.credentials.Credentials(
                token=conn.credentials.get("token"),
                refresh_token=conn.credentials.get("refresh_token"),
                token_uri=conn.credentials.get("token_uri"),
                client_id=conn.credentials.get("client_id"),
                client_secret=conn.credentials.get("client_secret"),
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
            # Parse the date string (YYYY-MM-DD)
            event_date = datetime.strptime(day_str, "%Y-%m-%d").date()
        except ValueError:
            # Fallback for legacy "Day Name" (Monday, etc.) support if needed, or just strict fail
            # For now, let's just log and fail if format is wrong, assuming frontend sends YYYY-MM-DD
            logger.warning(f"Invalid date format: {day_str}. Expected YYYY-MM-DD")
            return

        try:
            start_h, start_m = map(int, start_time_str.split(':'))
            end_h, end_m = map(int, end_time_str.split(':'))
                
            start_dt = datetime.combine(event_date, dt_time(hour=start_h, minute=start_m), tzinfo=timezone.utc)
            end_dt = datetime.combine(event_date, dt_time(hour=end_h, minute=end_m), tzinfo=timezone.utc)

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


