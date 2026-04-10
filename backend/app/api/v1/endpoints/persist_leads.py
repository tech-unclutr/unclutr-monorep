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

router = APIRouter()


# ── Request / Response models ────────────────────────────────────

class LeadPayload(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    contact_number: str
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

        for name in cohort_names - set(cohort_map.keys()):
            new_cohort = ResearchCohort(company_id=company_id, name=name)
            session.add(new_cohort)
            await session.flush()
            cohort_map[name] = new_cohort.id
            logger.info(f"[PersistLeads] Created cohort '{name}' → {new_cohort.id}")

    # 3. Fetch existing leads for this company to skip duplicates
    existing_phones_result = await session.exec(
        select(ResearchLead.contact_number).where(
            ResearchLead.company_id == company_id,
        )
    )
    existing_phones = set(existing_phones_result.all())

    # 4. Insert leads
    inserted = 0
    skipped = 0
    response_leads: List[LeadResponse] = []

    for lp in req.leads:
        phone = lp.contact_number.strip()
        if not phone or phone in existing_phones:
            skipped += 1
            continue

        cohort_id = cohort_map.get(lp.cohort) if lp.cohort else None

        lead = ResearchLead(
            company_id=company_id,
            cohort_id=cohort_id,
            first_name=lp.first_name,
            last_name=lp.last_name,
            contact_number=phone,
            contact_profile=lp.contact_profile or {},
            meta_data=lp.meta_data or {},
        )
        session.add(lead)
        existing_phones.add(phone)
        inserted += 1

        response_leads.append(LeadResponse(
            id=str(lead.id),
            first_name=lead.first_name,
            last_name=lead.last_name,
            contact_number=lead.contact_number,
            cohort_id=str(cohort_id) if cohort_id else None,
            cohort_name=lp.cohort,
        ))

    # 5. Link leads to study via research_participants
    if req.study_id:
        study_uuid = UUID(req.study_id)
        await session.flush()  # ensure lead IDs are assigned
        for lr in response_leads:
            participant = ResearchParticipant(
                lead_id=UUID(lr.id),
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
