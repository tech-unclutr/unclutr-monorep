"""
Persist Leads — Upload and store extracted leads with cohort resolution.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.models.study_designer.research_cohort import ResearchCohort
from app.models.study_designer.research_lead import ResearchLead
from app.models.study_designer.research_participant import ResearchParticipant
from app.services.agent_resolver import get_company_default

router = APIRouter()


# ── Request / Response models ────────────────────────────────────

class LeadPayload(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    contact_number: str
    language: Optional[str] = None
    cohort: Optional[str] = None
    contact_profile: Optional[Dict[str, Any]] = None
    meta_data: Optional[Dict[str, Any]] = None


class LeadsUploadRequest(BaseModel):
    company_id: str
    study_id: Optional[str] = None
    leads: List[LeadPayload]


class LeadResponse(BaseModel):
    id: str
    first_name: str
    last_name: Optional[str]
    contact_number: str
    cohort_id: Optional[str]
    cohort_name: Optional[str]


class LeadsUploadResponse(BaseModel):
    inserted: int
    skipped: int
    leads: List[LeadResponse]


# ── Endpoint ─────────────────────────────────────────────────────

@router.post("/upload", response_model=LeadsUploadResponse)
async def upload_leads(
    req: LeadsUploadRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Persist extracted leads into research_leads with cohort resolution.
    - Looks up research_cohorts by (company_id, name); creates if missing.
    - Upserts research_leads by (company_id, contact_number); skips duplicates.
    """
    company_id = UUID(req.company_id)

    # 1. Collect unique cohort names from payload
    cohort_names = {l.cohort for l in req.leads if l.cohort}

    # 2. Resolve cohort name → id (create missing ones)
    cohort_map: Dict[str, UUID] = {}
    if cohort_names:
        existing = await session.exec(
            select(ResearchCohort).where(
                ResearchCohort.company_id == company_id,
                ResearchCohort.name.in_(cohort_names),
            )
        )
        for c in existing.all():
            cohort_map[c.name] = c.id

        missing_names = cohort_names - set(cohort_map.keys())
        if missing_names:
            default_agent = await get_company_default(session, company_id)
            default_agent_id = default_agent.id if default_agent else None
            for name in missing_names:
                new_cohort = ResearchCohort(
                    company_id=company_id,
                    name=name,
                    agent_configuration_id=default_agent_id,
                )
                session.add(new_cohort)
                await session.flush()
                cohort_map[name] = new_cohort.id
                logger.info(f"[PersistLeads] Created cohort '{name}' → {new_cohort.id}")

    # 3. Fetch existing leads for this company (phone → lead) to handle duplicates
    existing_leads_result = await session.exec(
        select(ResearchLead).where(
            ResearchLead.company_id == company_id,
        )
    )
    existing_leads_by_phone: Dict[str, ResearchLead] = {
        l.contact_number: l for l in existing_leads_result.all()
    }

    # 4. Insert new leads; collect all lead IDs (new + existing) for participant linking
    inserted = 0
    skipped = 0
    response_leads: List[LeadResponse] = []

    for lp in req.leads:
        phone = lp.contact_number.strip()
        if not phone:
            skipped += 1
            continue

        cohort_id = cohort_map.get(lp.cohort) if lp.cohort else None

        if phone in existing_leads_by_phone:
            # Lead already exists — still collect it for participant linking below
            existing_lead = existing_leads_by_phone[phone]
            skipped += 1
            response_leads.append(LeadResponse(
                id=str(existing_lead.id),
                first_name=existing_lead.first_name,
                last_name=existing_lead.last_name,
                contact_number=existing_lead.contact_number,
                cohort_id=str(existing_lead.cohort_id) if existing_lead.cohort_id else None,
                cohort_name=lp.cohort,
            ))
            continue

        lead = ResearchLead(
            company_id=company_id,
            cohort_id=cohort_id,
            first_name=lp.first_name,
            last_name=lp.last_name,
            contact_number=phone,
            language=lp.language,
            contact_profile=lp.contact_profile or {},
            meta_data=lp.meta_data or {},
        )
        session.add(lead)
        existing_leads_by_phone[phone] = lead
        inserted += 1

        response_leads.append(LeadResponse(
            id=str(lead.id),
            first_name=lead.first_name,
            last_name=lead.last_name,
            contact_number=lead.contact_number,
            cohort_id=str(cohort_id) if cohort_id else None,
            cohort_name=lp.cohort,
        ))

    # 5. Link all leads (new + existing) to study via research_participants
    if req.study_id:
        study_uuid = UUID(req.study_id)
        await session.flush()  # ensure new lead IDs are assigned

        # Fetch already-linked participant lead_ids for this study
        existing_participants_result = await session.exec(
            select(ResearchParticipant.lead_id).where(
                ResearchParticipant.study_id == study_uuid,
            )
        )
        already_linked = set(existing_participants_result.all())

        # Deduplicate response_leads by lead ID before inserting
        # (same phone appearing twice in the CSV would otherwise create two rows)
        seen_lead_ids: set[UUID] = set()
        for lr in response_leads:
            lead_uuid = UUID(lr.id)
            if lead_uuid in already_linked or lead_uuid in seen_lead_ids:
                continue
            seen_lead_ids.add(lead_uuid)
            participant = ResearchParticipant(
                lead_id=lead_uuid,
                study_id=study_uuid,
            )
            session.add(participant)

    await session.commit()
    logger.info(f"[PersistLeads] Uploaded {inserted} leads, skipped {skipped} duplicates for company {company_id}")

    return LeadsUploadResponse(
        inserted=inserted,
        skipped=skipped,
        leads=response_leads,
    )
