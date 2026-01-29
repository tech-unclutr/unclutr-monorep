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
    SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

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
        """Fetches free/busy status for the next 7 days across ALL calendars."""
        creds = google.oauth2.credentials.Credentials(
            token=conn.credentials.get("token"),
            refresh_token=conn.credentials.get("refresh_token"),
            token_uri=conn.credentials.get("token_uri"),
            client_id=conn.credentials.get("client_id"),
            client_secret=conn.credentials.get("client_secret"),
            scopes=conn.credentials.get("scopes"),
        )

        service = build('calendar', 'v3', credentials=creds)

        # Ensure ISO format with 'Z'
        now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
        one_week_later = (datetime.now(timezone.utc) + timedelta(days=7)).replace(microsecond=0).isoformat().replace('+00:00', 'Z')

        try:
            # 1. Get List of Calendars
            calendar_list = service.calendarList().list().execute()
            # Filter for primary or owned calendars to avoid spamming public ones
            # but usually for availability we want at least 'primary'. 
            # We'll take all calendars where accessRole is 'owner' or 'writer'
            calendar_ids = [
                c.get('id') for c in calendar_list.get('items', []) 
                if c.get('accessRole') in ['owner', 'writer', 'reader']
            ]
            if not calendar_ids:
                calendar_ids = ['primary']
            
            # logger.info(f"Checking availability for calendars: {calendar_ids}")
            
            # 2. FreeBusy Query
            body = {
                "timeMin": now,
                "timeMax": one_week_later,
                "items": [{"id": cid} for cid in calendar_ids]
            }

            result = service.freebusy().query(body=body).execute()
            
            # 3. Aggregate all busy slots
            all_busy = []
            for cal_id, cal_data in result.get('calendars', {}).items():
                busy = cal_data.get('busy', [])
                all_busy.extend(busy)
            
            # Sort by start time
            all_busy.sort(key=lambda x: x.get('start'))
            
            # logger.info(f"Total busy slots found across {len(calendar_ids)} calendars: {len(all_busy)}")
            
            # Debug log to file
            diag_info = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "calendars": calendar_ids,
                "busy_slots": all_busy
            }
            with open("/Users/param/Documents/Unclutr/backend/calendar_debug.log", "a") as f:
                f.write(json.dumps(diag_info) + "\n")
                
            return all_busy

        except Exception as e:
            logger.error(f"Error in get_availability: {e}")
            raise

google_calendar_service = GoogleCalendarService()
