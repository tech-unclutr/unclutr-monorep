"""
Calendar Booking API Endpoint

Provides functionality to create calendar booking links for leads
who request calls outside execution windows.
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_active_user, get_session
from app.models.campaign import Campaign
from app.models.campaign_lead import CampaignLead
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


class CalendarBookingRequest(BaseModel):
    preferred_start_time: str  # ISO format
    preferred_end_time: Optional[str] = None
    call_duration_minutes: Optional[int] = None


@router.post("/campaign/{campaign_id}/lead/{lead_id}/book-call")
async def create_calendar_booking(
    campaign_id: UUID,
    lead_id: UUID,
    request: CalendarBookingRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a calendar booking link for a lead who requested a call outside execution windows.
    
    This generates a Google Calendar event link that the user can click to add to their calendar.
    """
    try:
        # 1. Fetch campaign and lead
        campaign = await session.get(Campaign, campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        lead = await session.get(CampaignLead, lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # 2. Parse times
        try:
            start_time = datetime.fromisoformat(request.preferred_start_time.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start time format")
        
        # 3. Calculate end time
        if request.preferred_end_time:
            try:
                end_time = datetime.fromisoformat(request.preferred_end_time.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end time format")
        else:
            # Use call duration from request or campaign
            duration_mins = request.call_duration_minutes or campaign.call_duration or 30
            from datetime import timedelta
            end_time = start_time + timedelta(minutes=duration_mins)
        
        # 4. Create calendar event details
        event_title = f"Follow-up Call: {lead.customer_name}"
        event_description = f"""
Follow-up call with {lead.customer_name} from {campaign.name} campaign.

Lead Details:
- Name: {lead.customer_name}
- Phone: {lead.contact_number}
- Cohort: {lead.cohort or 'General'}

Campaign: {campaign.name}
        """.strip()
        
        # 5. Generate Google Calendar link
        # Format: https://calendar.google.com/calendar/render?action=TEMPLATE&text=TITLE&dates=START/END&details=DESCRIPTION
        from urllib.parse import quote
        
        # Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
        start_str = start_time.strftime("%Y%m%dT%H%M%SZ")
        end_str = end_time.strftime("%Y%m%dT%H%M%SZ")
        
        calendar_link = (
            f"https://calendar.google.com/calendar/render?"
            f"action=TEMPLATE&"
            f"text={quote(event_title)}&"
            f"dates={start_str}/{end_str}&"
            f"details={quote(event_description)}"
        )
        
        return {
            "success": True,
            "calendar_link": calendar_link,
            "event_details": {
                "title": event_title,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "lead_name": lead.customer_name,
                "lead_phone": lead.contact_number
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error creating calendar booking: {e}")
        raise HTTPException(status_code=500, detail=str(e))
