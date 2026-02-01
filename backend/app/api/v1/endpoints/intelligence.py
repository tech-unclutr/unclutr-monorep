"""
Intelligence API Endpoints - Phase 3

Exposes the full intelligence deck with validation and enrichment.
"""

# Force reload - debugging local_kw ghost

from typing import Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Header, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, case, desc
from loguru import logger
from sqlmodel import select

from app.core.db import get_session
from app.core.config import settings
from app.services.intelligence.insight_engine import insight_engine
from app.models.company import Workspace
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.models.insight_tracking import InsightImpression
from app.models.calendar_connection import CalendarConnection
from app.services.intelligence.google_calendar_service import google_calendar_service
from app.api.deps import get_current_active_user
from app.models.user import User
from fastapi.responses import RedirectResponse
from app.services.intelligence.campaign_service import campaign_service
from app.models.campaign import Campaign
from app.models.archived_campaign import ArchivedCampaign
from app.models.campaign_lead import CampaignLead
from sqlalchemy import desc
from app.schemas.campaign import CampaignSettingsUpdate, CampaignContextSuggestions
from fastapi.responses import Response


router = APIRouter()


class ImpressionCreate(BaseModel):
    brand_id: UUID
    insight_id: str
    clicked: bool = False
    dismissed: bool = False
    action_taken: Optional[str] = None


@router.post("/impression")
async def track_impression(
    impression: ImpressionCreate,
    session: AsyncSession = Depends(get_session),
    x_company_id: str = Header(..., alias="X-Company-ID")
):
    """
    Track user interaction with an insight.
    """
    try:
        # Verify brand belongs to company (Direct Check)
        from app.models.company import Brand
        stmt = select(Brand).where(Brand.id == impression.brand_id, Brand.company_id == UUID(x_company_id))
        result = await session.execute(stmt)
        brand = result.scalars().first()
        
        if not brand:
            raise HTTPException(status_code=403, detail="Brand not found or access denied")
        
        # Create impression record
        db_impression = InsightImpression(
            brand_id=impression.brand_id,
            insight_id=impression.insight_id,
            clicked=impression.clicked,
            dismissed=impression.dismissed,
            action_taken=impression.action_taken
        )
        
        session.add(db_impression)
        await session.commit()
        
        return {"status": "success", "id": db_impression.id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to track impression: {e}")
        raise HTTPException(status_code=500, detail="Failed to track impression")





@router.get("/deck/{brand_id}")
async def get_intelligence_deck(
    brand_id: UUID,
    session: AsyncSession = Depends(get_session),
    x_company_id: str = Header(..., alias="X-Company-ID")
) -> Dict[str, Any]:
    """
    Generate full intelligence deck for a brand.
    
    Returns:
        {
            "insights": [...],  # Top 5 balanced insights
            "full_deck": [...],  # All insights
            "category_distribution": {"financial": 2, "growth": 2, "operational": 1},
            "generation_time_ms": 456.78,
            "generated_at": "2024-01-15T..."
        }
    """
    try:
        # Verify brand belongs to company (Direct Check)
        from app.models.company import Brand
        stmt = select(Brand).where(Brand.id == brand_id, Brand.company_id == UUID(x_company_id))
        result = await session.execute(stmt)
        brand = result.scalars().first()
        
        if not brand:
            raise HTTPException(status_code=403, detail="Brand not found or access denied")
        
        # Generate deck
        deck = await insight_engine.generate_full_deck(session, brand_id)
        
        logger.info(
            f"Intelligence deck API called",
            extra={
                "brand_id": str(brand_id),
                "company_id": x_company_id,
                "insights_count": len(deck.get("insights", []))
            }
        )
        
        return deck
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate intelligence deck: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate intelligence deck")


@router.get("/deck/{brand_id}/top")
async def get_top_insight(
    brand_id: UUID,
    session: AsyncSession = Depends(get_session),
    x_company_id: str = Header(..., alias="X-Company-ID")
) -> Dict[str, Any]:
    """
    Get top insight only (Phase 2 compatibility endpoint).
    
    Returns single insight object or empty dict.
    """
    try:
        # Verify brand belongs to company (Direct Check)
        from app.models.company import Brand
        stmt = select(Brand).where(Brand.id == brand_id, Brand.company_id == UUID(x_company_id))
        result = await session.execute(stmt)
        brand = result.scalars().first()
        
        if not brand:
            raise HTTPException(status_code=403, detail="Brand not found or access denied")
        
        # Generate deck and return top 1
        deck = await insight_engine.generate_deck(session, brand_id)
        
        return deck[0] if deck else {}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get top insight: {e}")
        raise HTTPException(status_code=500, detail="Failed to get top insight")


# ------------------------------------------------------------------
# Phase 6: Strategic Advisor Endpoints
# ------------------------------------------------------------------

from app.services.intelligence.playbook_service import playbook_service
from app.services.intelligence.simulation_service import simulation_service
from app.models.insight_feedback import InsightFeedback

class FeedbackCreate(BaseModel):
    insight_id: str
    brand_id: UUID
    status: str # ACCEPTED, REJECTED, etc
    verification_intent: Optional[Dict[str, Any]] = None
    user_comment: Optional[str] = None

class SimulationRequest(BaseModel):
    scenario_type: str
    inputs: Dict[str, Any]

@router.get("/playbook/{insight_type}")
async def get_playbook_endpoint(
    insight_type: str,
    product_id: Optional[str] = None,
    store_domain: Optional[str] = "demo",
    session: AsyncSession = Depends(get_session),
    x_company_id: str = Header(..., alias="X-Company-ID")
):
    """
    Get dynamic playbook for an insight type.
    """
    context = {"store_domain": store_domain, "product_id": product_id}
    return playbook_service.get_playbook(insight_type, context)

@router.post("/simulation")
async def run_simulation(
    request: SimulationRequest,
    x_company_id: str = Header(..., alias="X-Company-ID")
):
    """
    Run a 'What If' simulation.
    """
    return simulation_service.simulate(request.scenario_type, request.inputs)

@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackCreate,
    session: AsyncSession = Depends(get_session),
    x_company_id: str = Header(..., alias="X-Company-ID")
):
    """
    Submit user feedback and verification intent.
    """
    try:
        # Verify brand belongs to company (Direct Check)
        from app.models.company import Brand
        stmt = select(Brand).where(Brand.id == feedback.brand_id, Brand.company_id == UUID(x_company_id))
        result = await session.execute(stmt)
        brand = result.scalars().first()
        
        if not brand:
             raise HTTPException(status_code=403, detail="Brand not found")

        db_feedback = InsightFeedback(
            insight_id=feedback.insight_id,
            brand_id=feedback.brand_id,
            status=feedback.status,
            verification_intent=feedback.verification_intent,
            verification_status="PENDING" if feedback.verification_intent else "SKIPPED",
            user_comment=feedback.user_comment
        )
        
        session.add(db_feedback)
        await session.commit()
        
        return {"status": "success", "id": db_feedback.id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to save feedback")

# ------------------------------------------------------------------
# Google Calendar Endpoints
# ------------------------------------------------------------------

@router.get("/calendar/google/login")
async def google_calendar_login(
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID")
):
    """
    Initiates Google OAuth flow for calendar access.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    auth_url = await google_calendar_service.get_auth_url(
        company_id=company_id,
        user_id=current_user.id
    )
    return {"url": auth_url}

@router.get("/calendar/google/callback")
async def google_calendar_callback(
    code: str,
    state: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Handles Google OAuth callback.
    """
    try:
        await google_calendar_service.handle_callback(code, state, session)
        # Redirect back to frontend customer intelligence tab
        return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/customer-intelligence?calendar_connected=true")
    except Exception as e:
        logger.error(f"Google OAuth callback failed: {e}")
        return RedirectResponse(f"{settings.FRONTEND_URL}/dashboard-new/customer-intelligence?error=calendar_auth_failed")

@router.get("/calendar/status")
async def get_calendar_status(
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Checks if Google Calendar is connected and returns availability preview.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        return {"connected": False, "error": "Invalid Company ID"}

    stmt = select(CalendarConnection).where(
        CalendarConnection.company_id == company_id,
        CalendarConnection.provider == "google"
    )
    result = await session.execute(stmt)
    conn = result.scalars().first()
    
    # logger.info(f"DEBUG: get_calendar_status for company {company_id} and user {current_user.id}. Connection found? {bool(conn)}. Status: {conn.status if conn else 'N/A'}")
    
    if not conn or conn.status != "active":
        return {"connected": False}
    
    # Optional: fetch fresh availability for the preview
    # For now, just return status. We can expand this to return busy slots.
    # check if writable (has calendar.events scope)
    scopes = conn.credentials.get("scopes", [])
    writable = 'https://www.googleapis.com/auth/calendar.events' in scopes
    
    try:
        busy_slots = await google_calendar_service.get_availability(conn)
        return {
            "connected": True,
            "provider": "google",
            "writable": writable,
            "busy_slots": busy_slots,
            "last_synced_at": conn.last_synced_at
        }
    except Exception as e:
        logger.warning(f"Failed to fetch availability: {e}")
        return {
            "connected": True,
            "provider": "google",
            "writable": writable,
            "error": "Failed to fetch real-time availability"
        }
    finally:
        # logger.info(f"Calendar status for user {current_user.id}: {isCalendarConnected if 'isCalendarConnected' in locals() else 'checked'}")
        pass

@router.post("/calendar/webhook")
async def google_calendar_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Receives push notifications from Google Calendar.
    """
    # Google sends channel ID in X-Goog-Channel-ID header
    channel_id = request.headers.get("X-Goog-Channel-ID")
    resource_state = request.headers.get("X-Goog-Resource-State")
    
    logger.info(f"Received Google Calendar Webhook: Channel={channel_id}, State={resource_state}")
    
    if not channel_id:
        return {"status": "ignored"}
    
    # Resource state 'sync' is just a confirmation of watch registration
    if resource_state == "sync":
        return {"status": "synced"}
        
    # Find the connection
    try:
        stmt = select(CalendarConnection).where(CalendarConnection.id == UUID(channel_id))
        result = await session.execute(stmt)
        conn = result.scalars().first()
        
        if conn:
            # Mark as synced now
            conn.last_synced_at = datetime.utcnow()
            session.add(conn)
            await session.commit()
            logger.info(f"Updated last_synced_at for connection {conn.id}")
            
    except Exception as e:
        logger.error(f"Failed to process Google Calendar webhook: {e}")
        
    return {"status": "received"}

@router.delete("/calendar/disconnect")
async def disconnect_google_calendar(
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Disconnects Google Calendar for the company.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    success = await google_calendar_service.disconnect_calendar(session, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="No active calendar connection found")
    
    return {"status": "success", "message": "Calendar disconnected"}


class OnboardingRequest(BaseModel):
    name: str  # User's full name (to sync back to profile if needed, or just for context)
    phone_number: str
    team_member_role: str
    team_member_department: str
    linkedin: Optional[str] = None

@router.post("/campaigns/onboarding")
async def save_onboarding_details(
    request: OnboardingRequest,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Saves the user's contact details to the latest DRAFT campaign or creates a new one.
    This serves as the "Unlocking" step for Customer Intelligence.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    # Validate phone number (basic check)
    import re
    if not re.match(r'^\+?[1-9]\d{1,14}$', request.phone_number.replace(" ", "").replace("-", "")):
         raise HTTPException(status_code=400, detail="Invalid phone number format")

    # 1. Check for existing DRAFT campaign for this user
    # We want the MOST RECENT one that hasn't started yet.
    stmt = select(Campaign).where(
        Campaign.company_id == company_id,
        Campaign.user_id == current_user.id,
        Campaign.status == "DRAFT"
    ).order_by(desc(Campaign.created_at))
    
    result = await session.execute(stmt)
    campaign = result.scalars().first()
    
    if campaign:
        # Update existing draft
        campaign.phone_number = request.phone_number
        campaign.team_member_role = request.team_member_role
        campaign.team_member_department = request.team_member_department
        campaign.updated_at = datetime.utcnow()
        # Optionally update name on user profile if needed, but for now let's keep it scoped to campaign
        # actually, the UI sends name as well.
        
        session.add(campaign)
        logger.info(f"Updated existing DRAFT campaign {campaign.id} with onboarding details")
    else:
        # Create NEW Campaign
        campaign = Campaign(
            company_id=company_id,
            user_id=current_user.id,
            name=f"Campaign - {datetime.utcnow().strftime('%B %d, %Y')}", # Default name
            status="DRAFT",
            phone_number=request.phone_number,
            team_member_role=request.team_member_role,
            team_member_department=request.team_member_department,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(campaign)
        logger.info(f"Created NEW DRAFT campaign with onboarding details")

    # 2. Sync Onboarding Details to User Profile (Holistic Update)
    try:
        # We already have current_user from Dependency Injection, but ensure it's tracked by session
        user_stmt = select(User).where(User.id == current_user.id)
        user_res = await session.execute(user_stmt)
        user_db = user_res.scalars().first()
        
        if user_db:
            logger.info(f"Syncing onboarding details to user profile for {user_db.id}")
            if request.name: 
                user_db.full_name = request.name
            if request.phone_number: 
                user_db.contact_number = request.phone_number
            if request.team_member_role: 
                user_db.designation = request.team_member_role
            if request.team_member_department: 
                user_db.team = request.team_member_department
            if request.linkedin: 
                user_db.linkedin_profile = request.linkedin
                
            # persistent unlock state
            if not user_db.settings:
                user_db.settings = {}
            user_db.settings["intelligence_unlocked"] = True
            
            session.add(user_db)
            logger.info(f"User profile staged for update: {user_db.full_name}, {user_db.designation}, {user_db.team}, intelligence_unlocked=True")
            
    except Exception as e:
        logger.error(f"Failed to sync onboarding details to User profile: {e}", exc_info=True)
        # We keep this non-blocking for the campaign creation, but logged as error now

    await session.commit()
    await session.refresh(campaign)
    
    return campaign


class PhoneInterviewTriggerRequest(BaseModel):
    phone_number: str
    campaign_id: Optional[UUID] = None


# @router.post("/interview/trigger")
# async def trigger_phone_interview(
#     request: PhoneInterviewTriggerRequest,
#     current_user: User = Depends(get_current_active_user),
#     x_company_id: str = Header(..., alias="X-Company-ID"),
#     session: AsyncSession = Depends(get_session)
# ):
#     """
#     Triggers a REAL phone call via Bolna API.
#     Creates initial campaign record with status INITIATED.
#     """
#     try:
#         company_id = UUID(x_company_id)
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid Company ID format")
# 
#     # Validate phone number format (basic E.164 check)
#     import re
#     if not re.match(r'^\+[1-9]\d{1,14}$', request.phone_number):
#         raise HTTPException(
#             status_code=400, 
#             detail="Invalid phone number format. Use E.164 format (e.g., +14155551234)"
#         )
# 
# 
# 
#     campaign = None
#     
#     try:
#         # from app.services.intelligence.bolna_service import bolna_service
#         import httpx
#         
#         # 1. Get or Create Campaign
#         if request.campaign_id:
#             # Fetch existing campaign
#             stmt = select(Campaign).where(
#                 Campaign.id == request.campaign_id,
#                 Campaign.company_id == company_id,
#                 Campaign.user_id == current_user.id
#             )
#             result = await session.execute(stmt)
#             campaign = result.scalars().first()
#             
#             if not campaign:
#                 raise HTTPException(status_code=404, detail="Campaign not found for retry")
#                 
#             logger.info(f"Retrying existing campaign: {campaign.id}")
#         else:
#             # Create new initial campaign
#             campaign = await campaign_service.create_initial_campaign(
#                 session=session,
#                 company_id=company_id,
#                 user_id=current_user.id,
#                 phone_number=request.phone_number
#             )
#             logger.info(f"Created new campaign: {campaign.id} to DB. Status: {campaign.status}")
#         
#         # 2. Trigger Bolna Call (Passing Campaign ID)
#         # try:
#         #     bolna_response = await bolna_service.trigger_phone_call(
#         #         phone_number=request.phone_number,
#         #         user_full_name=current_user.full_name,
#         #         company_id=str(company_id),
#         #         user_id=current_user.id,
#         #         campaign_id=str(campaign.id) 
#         #     )
#         # except httpx.HTTPStatusError as e:
#         #     # If call fails, mark campaign as FAILED immediately if newly created?
#         #     # Actually, let's keep it basic for now, handled by exceptions below.
#         #     
#         #     # Re-raise to handle with specific status codes
#         #     raise e
#             
#         # Extract execution ID
#         # execution_id = bolna_response.get("id") or bolna_response.get("execution_id") or bolna_response.get("call_id")
#         
#         # if not execution_id:
#         #     logger.error(f"Bolna response missing execution ID. Full response: {bolna_response}")
#         #     raise HTTPException(
#         #         status_code=500, 
#         #         detail="Bolna API did not return execution ID. Please check the logs or contact support."
#         #     )
#         
#         # 3. Update Campaign with Execution ID
#         # campaign = await campaign_service.update_campaign_execution_id(
#         #     session=session,
#         #     campaign_id=campaign.id,
#         #     new_execution_id=execution_id
#         # )
#         
#         return {
#             "status": "success",
#             "execution_id": "mock_execution_id", # execution_id,
#             "campaign_id": str(campaign.id),
#             "message": f"Phone call initiated to {request.phone_number}"
#         }
#         
#     except HTTPException:
#         # Re-raise HTTP exceptions as-is
#         raise
#     except ValueError as e:
#         # Configuration errors (missing API keys, etc.)
#         logger.error(f"Bolna configuration error: {e}")
#         raise HTTPException(
#             status_code=500, 
#             detail="Phone interview service is not properly configured. Please contact support."
#         )
#     # except httpx.TimeoutException:
#     #     logger.error("Bolna API timeout")
#     #     raise HTTPException(
#     #         status_code=504, 
#     #         detail="Request to phone service timed out. Please try again."
#     #     )
#     except Exception as e:
#         import traceback
#         logger.error(f"Failed to trigger phone interview: {str(e)}")
#         logger.error(traceback.format_exc())
#         raise HTTPException(
#             status_code=500, 
#             detail=f"An unexpected error occurred: {str(e)}"
#         )



# @router.post("/interview/bolna-webhook")
# async def bolna_webhook(
#     request: Request,
#     session: AsyncSession = Depends(get_session)
# ):
#     """
#     Receives webhook from Bolna when call completes.
#     Updates campaign with all execution data and generates campaign name.
#     """
#     try:
#         # Parse webhook payload
#         payload = await request.json()
#         logger.info(f"Received Bolna webhook: {payload.get('id')}")
#         
#         from app.services.intelligence.bolna_service import bolna_service
#         
#         # Parse and validate payload
#         parsed_payload = bolna_service.parse_webhook_payload(payload)
#         execution_id = parsed_payload.get("execution_id")
#         
#         if not execution_id:
#             logger.error("Webhook payload missing execution ID")
#             return {"status": "error", "message": "Missing execution ID"}
#         
#         # Update campaign from webhook data
#         campaign = await campaign_service.update_campaign_from_bolna_webhook(
#             session=session,
#             execution_id=execution_id,
#             bolna_payload=parsed_payload
#         )
#         
#         logger.info(f"Campaign {campaign.id} updated from webhook. Status: {campaign.status}")
#         
#         return {
#             "status": "success",
#             "campaign_id": str(campaign.id),
#             "campaign_name": campaign.name,
#             "call_status": campaign.bolna_call_status
#         }
#         
#     except ValueError as e:
#         logger.error(f"Campaign not found for webhook: {e}")
#         return {"status": "error", "message": str(e)}
#     except Exception as e:
#         logger.error(f"Failed to process Bolna webhook: {e}")
#         return {"status": "error", "message": str(e)}


@router.post("/interview/simulate")
async def simulate_interview(
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    LEGACY: Triggers the Bolna-first intake simulation (for testing without real calls).
    Creates a detailed mock transcript and extracts campaign data via Gemini.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    try:
        campaign = await campaign_service.simulate_intake_call(session, company_id, current_user.id)
        return {
            "status": "success", 
            "campaign_id": campaign.id,
            "quality_score": campaign.quality_score,
            "transcript_summary": "Simulation completed."
        }
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        # Return 500 but detail properly
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")




class ExtractedDataUpdate(BaseModel):
    extracted_data: Dict[str, Any]


# @router.patch("/campaigns/{campaign_id}/extracted-data")
# async def update_campaign_extracted_data(
#     campaign_id: UUID,
#     update_data: ExtractedDataUpdate,
#     current_user: User = Depends(get_current_active_user),
#     x_company_id: str = Header(..., alias="X-Company-ID"),
#     session: AsyncSession = Depends(get_session)
# ):
#     """
#     Manually update the extracted data for a campaign.
#     Useful for correcting or refining the AI's extraction.
#     """
#     try:
#         company_id = UUID(x_company_id)
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid Company ID format")
# 
#     # Verify ownership
#     stmt = select(Campaign).where(
#         Campaign.id == campaign_id,
#         Campaign.company_id == company_id, 
#         Campaign.user_id == current_user.id
#     )
#     result = await session.execute(stmt)
#     campaign = result.scalars().first()
# 
#     if not campaign:
#         raise HTTPException(status_code=404, detail="Campaign not found")
# 
#     try:
#         updated_campaign = await campaign_service.update_campaign_extracted_data(
#             session=session,
#             campaign_id=campaign_id,
#             new_extracted_data=update_data.extracted_data
#         )
#         return updated_campaign
#     except Exception as e:
#         logger.error(f"Failed to update extracted data: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to update data: {str(e)}")




class ExecutionWindowCreate(BaseModel):
    day: str
    start: str # HH:MM
    end: str # HH:MM

@router.post("/campaigns/{campaign_id}/windows")
async def add_execution_window(
    campaign_id: UUID,
    window: ExecutionWindowCreate,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Adds a new execution window to the campaign and syncs it to Google Calendar.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    # 1. Get Campaign
    stmt = select(Campaign).where(
        Campaign.id == campaign_id,
        Campaign.company_id == company_id
    )
    result = await session.execute(stmt)
    campaign = result.scalars().first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # 2. Add Window to JSONB List
    current_windows = list(campaign.execution_windows) if campaign.execution_windows else []
    new_window = window.dict()
    current_windows.append(new_window)
    campaign.execution_windows = current_windows
    
    session.add(campaign)
    await session.commit()
    await session.refresh(campaign)
    
    # 3. Sync to Google Calendar (Incremental)
    # Ideally we just create this ONE event, but our service syncs ALL.
    # To prevent duplicates, we should check if we can just trigger a full sync 
    # but the service "sync_campaign_windows" blindly inserts.
    # Let's verify google_calendar_service behavior.
    
    # We will trigger the syncservice. 
    # But wait, looking at google_calendar_service.py: "sync_campaign_windows" iterates and inserts.
    # If we run it again, it ADDS duplicates.
    # FIX: We should improve sync_campaign_windows to be idempotent or just add this ONE.
    # For now, let's modify THIS endpoint to manually add the event using the service logic, 
    # OR update the service to support "add_window".
    
    # Let's try to just add this one window to GCal here for efficiency/correctness.
    try:
        stmt = select(CalendarConnection).where(
            CalendarConnection.company_id == company_id,
            CalendarConnection.provider == "google",
            CalendarConnection.status == "active"
        )
        result = await session.execute(stmt)
        conn = result.scalars().first()
        
        if conn:
            # We reuse the logic from service but single shot
            # Actually, let's assume we can tolerate it or fix the service later.
            # But "duplicating" is bad. 
            # Temporary: We'll just append to DB. 
            # If we call sync_campaign_windows, it duplicates.
            # So I should PROBABLY update the service to have `create_window_event`.
            
            # Let's call a new method `create_single_execution_event` which doesn't exist yet.
            # I will modify google_calendar_service.py in the NEXT step.
            # providing the structure here assuming I will add it.
            await google_calendar_service.create_single_execution_event(conn, campaign, new_window)
            
    except Exception as e:
        logger.error(f"Failed to sync window to GCal: {e}")
        # Don't fail the request if GCal fails, but maybe warn?
        
    return {"status": "success", "execution_windows": campaign.execution_windows}


@router.get("/campaigns/{campaign_id}")
async def get_campaign_by_id(
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Retrieve a specific campaign by ID (for polling during phone interview).
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID format")

    stmt = select(Campaign).where(
        Campaign.id == campaign_id,
        Campaign.company_id == company_id,
        Campaign.user_id == current_user.id
    )

    result = await session.execute(stmt)
    campaign = result.scalars().first()

    if not campaign:
        # Check if it was archived/deleted recently
        archived = await session.get(ArchivedCampaign, campaign_id)
        if archived:
            logger.warning(f"Campaign {campaign_id} NOT FOUND in active table but EXISTS in ArchivedCampaign.")
            raise HTTPException(status_code=404, detail="Campaign was recently deleted and archived")
            
        logger.warning(f"Campaign not found in DB. Search params: ID={campaign_id}, Company={company_id}, User={current_user.id}")
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    # Active Sync: Check with Bolna if the campaign is stuck in a non-terminal state
    # This acts as a fallback if webhooks fail (e.g. local dev, ngrok issues)
    # MOVED TO BACKGROUND TASK to prevent blocking API response
        if campaign.status not in ["COMPLETED", "FAILED"]: # and campaign.bolna_execution_id:
            # Fire and forget background sync
            # background_tasks.add_task(campaign_service.sync_campaign_background, campaign.id)
            pass

    # Calculate stats
    from sqlalchemy import func, case
    stats_stmt = select(
        func.count(CampaignLead.id).label("total"),
        func.sum(case((CampaignLead.status == "COMPLETED", 1), else_=0)).label("completed"),
        func.sum(case((CampaignLead.status.in_(["INITIATED", "RINGING", "IN_PROGRESS"]), 1), else_=0)).label("in_progress")
    ).where(CampaignLead.campaign_id == campaign.id)

    stats_result = await session.execute(stats_stmt)
    stats = stats_result.one()

    # Convert to dict
    campaign_dict = campaign.dict()
    campaign_dict["stats"] = {
        "total_leads": stats.total or 0,
        "completed_leads": stats.completed or 0,
        "in_progress_leads": stats.in_progress or 0
    }
    return campaign_dict


@router.get("/campaigns/latest")
async def get_latest_campaign(
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the most recent Campaign for the current user.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID")
        
    stmt = select(Campaign).where(
        Campaign.company_id == company_id,
        Campaign.user_id == current_user.id
    ).order_by(desc(Campaign.created_at)).limit(1)
    
    result = await session.execute(stmt)
    campaign = result.scalars().first()
    
    if not campaign:
        return {"campaign": None}
        
    return {"campaign": campaign}


@router.get("/campaigns")
async def list_campaigns(
    limit: int = 10,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    List campaigns for the company with pagination.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid company ID")
        
    stmt = (
        select(
            Campaign,
            func.count(CampaignLead.id).label("total"),
            func.sum(case((CampaignLead.status == "COMPLETED", 1), else_=0)).label("completed"),
            func.sum(case((CampaignLead.status.in_(["INITIATED", "RINGING", "IN_PROGRESS"]), 1), else_=0)).label("in_progress")
        )
        .outerjoin(CampaignLead, CampaignLead.campaign_id == Campaign.id)
        .where(Campaign.company_id == company_id)
        .group_by(Campaign.id)
        .order_by(desc(Campaign.created_at))
        .offset(offset)
        .limit(limit)
    )
    
    result = await session.execute(stmt)
    rows = result.all()
    
    enriched_campaigns = []
    
    for row in rows:
        campaign, total, completed, in_progress = row
        
        # Convert SQLModel to dict
        campaign_dict = campaign.dict()
        campaign_dict["stats"] = {
            "total_leads": total or 0,
            "completed_leads": completed or 0,
            "in_progress_leads": in_progress or 0
        }
        enriched_campaigns.append(campaign_dict)

    return {"campaigns": enriched_campaigns}
    

@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: UUID,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Delete a campaign and archive its leads.
    """
    print(f"DEBUG: API DELETE /campaigns/{campaign_id} hit")
    try:
        company_id = UUID(x_company_id)
        print(f"DEBUG: Parsed Company ID: {company_id}")
    except ValueError:
        print(f"DEBUG: Invalid Company ID: {x_company_id}")
        raise HTTPException(status_code=400, detail="Invalid company ID")
        
    success = await campaign_service.delete_campaign(session, campaign_id, company_id)
    print(f"DEBUG: Service returned success={success}")
    
    if not success:
        print(f"DEBUG: Raising 404")
        raise HTTPException(status_code=404, detail="Campaign not found or access denied")
        
    return {"status": "success", "message": "Campaign and related data deleted & archived"}


class CampaignLeadBase(BaseModel):
    customer_name: str
    contact_number: str
    cohort: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = {}

class CreateFromCsvRequest(BaseModel):
    campaign_name: Optional[str] = None
    leads: List[CampaignLeadBase]
    force_create: bool = False

class ReplaceLeadsRequest(BaseModel):
    leads: List[CampaignLeadBase]

@router.put("/campaigns/{campaign_id}/leads")
async def update_campaign_leads(
    campaign_id: UUID,
    request: ReplaceLeadsRequest,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Completely replaces the leads for a campaign.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID")

    # Verify ownership
    stmt = select(Campaign).where(
        Campaign.id == campaign_id,
        Campaign.company_id == company_id,
        Campaign.user_id == current_user.id
    )
    result = await session.execute(stmt)
    campaign = result.scalars().first()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    try:
        # Prepare leads data
        leads_data = [
            {
                "customer_name": lead.customer_name,
                "contact_number": lead.contact_number,
                "cohort": lead.cohort,
                "meta_data": lead.meta_data,
                "status": "PENDING"
            }
            for lead in request.leads
        ]
        
        await campaign_service.replace_campaign_leads(session, campaign_id, leads_data)
        
        return {"status": "success", "message": f"Updated {len(leads_data)} leads"}
        
    except Exception as e:
        logger.error(f"Failed to update leads: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update leads: {str(e)}")


@router.post("/campaigns/create-from-csv")
async def create_campaign_from_csv(
    request: CreateFromCsvRequest,
    current_user: User = Depends(get_current_active_user),
    x_company_id: str = Header(..., alias="X-Company-ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Creates a new Campaign (Batch) and associated CampaignLead records from uploaded CSV data.
    """
    try:
        company_id = UUID(x_company_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Company ID")

    if not request.leads:
        raise HTTPException(status_code=400, detail="No leads provided")

    # Compute Hash
    import hashlib
    import json
    
    # Sort leads to ensure consistent hash regardless of order (optional, but good practice)
    # Actually, order might matter for context, but let's just hash the raw list for now.
    # We'll serialize valid leads to JSON string and hash it.
    leads_dicts = [l.dict() for l in request.leads]
    leads_json = json.dumps(leads_dicts, sort_keys=True)
    source_hash = hashlib.sha256(leads_json.encode()).hexdigest()
    
    # Check for duplicates (Relaxed: Check last 24 hours)
    # NOTE: source_file_hash column was dropped, so disabling this check.
    # if not request.force_create:
    #     one_day_ago = datetime.utcnow() - timedelta(days=1)
    #     stmt = select(Campaign).where(
    #         Campaign.company_id == company_id,
    #         Campaign.source_file_hash == source_hash,
    #         Campaign.created_at >= one_day_ago
    #     ).order_by(desc(Campaign.created_at)).limit(1)
        
    #     result = await session.execute(stmt)
    #     existing_campaign = result.scalars().first()
        
    #     if existing_campaign:
    #         # Return 409 Conflict with details
    #         # We must use JSONResponse to return custom content with 409
    #         from fastapi.responses import JSONResponse
    #         return JSONResponse(
    #             status_code=409,
    #             content={
    #                 "detail": "Duplicate upload detected",
    #                 "code": "DUPLICATE_UPLOAD",
    #                 "campaign_id": str(existing_campaign.id),
    #                 "campaign_name": existing_campaign.name,
    #                 "created_at": existing_campaign.created_at.isoformat()
    #             }
    #         )

    try:
        # 1. Create Parent Campaign
        campaign_name = request.campaign_name or f"Campaign - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
        
        campaign = Campaign(
            company_id=company_id,
            user_id=current_user.id,
            name=campaign_name,
            status="DRAFT", # Batch/Dataset Campaigns start as DRAFT
            phone_number="" # Not applicable for batch container
            # source_file_hash=source_hash # REMOVED: Column dropped
        )
        session.add(campaign)
        await session.flush() # flush to get campaign.id

        # 2. Create Leads
        session.add(campaign)
        await session.flush() # flush to get campaign.id

        # 2. Bulk Create Leads (SQLAlchemy Core - Fastest)
        # Prepare list of dicts for bulk insert
        from sqlalchemy import insert
        
        leads_data = [
            {
                "id": uuid4(),
                "campaign_id": campaign.id,
                "customer_name": lead.customer_name,
                "contact_number": lead.contact_number,
                "cohort": lead.cohort,
                "meta_data": lead.meta_data,
                "status": "PENDING",
                "created_at": datetime.utcnow()
            }
            for lead in request.leads
        ]

        # Execute bulk insert
        if leads_data:
            stmt = insert(CampaignLead).values(leads_data)
            await session.execute(stmt)
            
        await session.commit()
        
        logger.info(f"Created batch campaign {campaign.id} with {len(leads_data)} leads.")
        
        # Calculate time taken for debugging
        # ...

        return {
            "status": "success",
            "campaign_id": campaign.id,
            "leads_count": len(leads_data),
            "campaign_name": campaign.name
        }

    except Exception as e:
        logger.error(f"Failed to create campaign from CSV: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create campaign: {str(e)}")


@router.get("/campaigns/{campaign_id}/context-suggestions", response_model=CampaignContextSuggestions)
async def get_campaign_context_suggestions(
    campaign_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get AI-generated brand context and team info suggestions.
    """
    try:
        suggestions = await campaign_service.get_context_suggestions(session, campaign_id, current_user.id)
        return suggestions
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get context suggestions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get suggestions")


@router.get("/campaigns/{campaign_id}/cohorts")
async def get_campaign_cohorts(
    campaign_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetch unique cohorts for a campaign.
    """
    try:
        result = await campaign_service.get_campaign_cohorts(session, campaign_id)
        return result
    except Exception as e:
        logger.error(f"Failed to get campaign cohorts: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cohorts")


@router.patch("/campaigns/{campaign_id}/settings")
async def update_campaign_settings(
    campaign_id: UUID,
    settings: CampaignSettingsUpdate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update campaign context and execution settings.
    """
    logger.info(f"PATCH /campaigns/{campaign_id}/settings - User: {current_user.id}")
    
    campaign = await session.get(Campaign, campaign_id)
    if not campaign:
        # Check if it was archived/deleted recently
        archived = await session.get(ArchivedCampaign, campaign_id)
        if archived:
            logger.warning(f"Campaign {campaign_id} NOT FOUND in active table but EXISTS in ArchivedCampaign. Deletion likely occurred.")
            raise HTTPException(status_code=404, detail="Campaign was recently deleted and archived")
        
        logger.error(f"Campaign {campaign_id} NOT FOUND in DB. User: {current_user.id}")
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Update fields if provided
    update_data = settings.dict(exclude_unset=True)

    # Validation: Max 3 questions enforcement
    if "preliminary_questions" in update_data and update_data["preliminary_questions"]:
        if len(update_data["preliminary_questions"]) > 3:
            raise HTTPException(status_code=400, detail="Global preliminary questions cannot exceed 3")
    
    if "cohort_questions" in update_data and update_data["cohort_questions"]:
        for cohort, questions in update_data["cohort_questions"].items():
            if len(questions) > 3:
                raise HTTPException(status_code=400, detail=f"Cohort '{cohort}' cannot have more than 3 preliminary questions")

    for key, value in update_data.items():
        setattr(campaign, key, value)

    # Sync cohort_data if older fields or cohort_data itself was updated
    
    # Fallback: If global incentive is empty but cohort incentives exist, set one as default
    # This must happen BEFORE cohort_data logic so it propagates correctly
    if not campaign.incentive and campaign.cohort_incentives:
        first_incentive = next(iter(campaign.cohort_incentives.values()), None)
        if first_incentive:
             campaign.incentive = first_incentive

    if any(k in update_data for k in ["cohort_config", "cohort_questions", "cohort_incentives", "cohort_data", "selected_cohorts", "incentive", "preliminary_questions"]):
        # Use existing or newly set values
        config = campaign.cohort_config or {}
        questions = campaign.cohort_questions or {}
        incentives = campaign.cohort_incentives or {}
        
        # If cohort_data was sent directly, we might want to prioritize it or sync back to old fields
        # For now, let's ensure cohort_data is populated from old fields if it's empty but others aren't
        if "cohort_data" not in update_data or not update_data["cohort_data"]:
            cohort_names = set(config.keys()) | set(questions.keys()) | set(incentives.keys())
            if campaign.selected_cohorts:
                cohort_names = cohort_names | set(campaign.selected_cohorts)
            
            selected_list = campaign.selected_cohorts or []
            new_cohort_data = {}
            for name in cohort_names:
                # Effective values with fallback
                new_cohort_data[name] = {
                    "target": config.get(name, 0),
                    "questions": questions.get(name) if questions.get(name) else (campaign.preliminary_questions or []),
                    "incentive": incentives.get(name) if incentives.get(name) else (campaign.incentive or ""),
                    "isSelected": name in selected_list
                }
            campaign.cohort_data = new_cohort_data
        else:
            # cohort_data was sent directly, let's sync back to old fields for compatibility
            cd = update_data["cohort_data"]
            new_config = {}
            new_questions = {}
            new_incentives = {}
            new_selected = []
            for name, data in cd.items():
                if isinstance(data, dict):
                    new_config[name] = data.get("target", 0)
                    new_questions[name] = data.get("questions", [])
                    new_incentives[name] = data.get("incentive", "")
                    if data.get("isSelected"):
                        new_selected.append(name)
            
            campaign.cohort_config = new_config
            campaign.cohort_questions = new_questions
            campaign.cohort_incentives = new_incentives
            campaign.selected_cohorts = new_selected

    campaign.updated_at = datetime.utcnow()
    
    # NEW: Sync brand_context to Company if present
    if "brand_context" in update_data and update_data["brand_context"]:
        try:
             from app.models.company import Company
             company = await session.get(Company, campaign.company_id)
             if company:
                 company.brand_context = update_data["brand_context"]
                 session.add(company)
                 # logger.info(f"Auto-saved brand_context to Company {company.id}")
        except Exception as e:
             logger.error(f"Failed to auto-save brand_context to company: {e}")

    session.add(campaign)
    await session.commit()
    await session.refresh(campaign)

    
    return campaign


@router.get("/campaigns/{campaign_id}/calendar-export")
async def export_campaign_calendar(
    campaign_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Export campaign execution windows as an .ics file.
    """
    try:
        ics_content = await campaign_service.export_calendar_block(session, campaign_id)
        if not ics_content:
            raise HTTPException(status_code=400, detail="No execution windows defined for this campaign")
            
        return Response(
            content=ics_content,
            media_type="text/calendar",
            headers={
                "Content-Disposition": f"attachment; filename=campaign-{campaign_id}.ics"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export calendar: {e}")
        raise HTTPException(status_code=500, detail="Failed to export calendar")

@router.post("/campaigns/{campaign_id}/calendar-sync")
async def sync_campaign_calendar(
    campaign_id: UUID,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Directly sync campaign execution windows to Google Calendar.
    """
    try:
        events_created = await campaign_service.sync_campaign_to_calendar(session, campaign_id)
        return {
            "status": "success",
            "message": f"Successfully synced {events_created} execution windows to your calendar",
            "events_created": events_created
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to sync calendar: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync calendar")
