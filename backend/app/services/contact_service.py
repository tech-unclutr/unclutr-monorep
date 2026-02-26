"""
Contact Service — handles upsert logic for Contact records during lead ingestion.

Key behavior:
- Upserts based on (company_id, primary_phone) — the unique key
- If a Contact already exists, it is updated with any new non-null fields
- If no Contact exists, one is created
- Returns the Contact UUID for linking to CampaignLead
"""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact import Contact

logger = logging.getLogger(__name__)

# Standard mapping from contact_profile keys to Contact model fields
PROFILE_FIELD_MAP = {
    "first_name": "first_name",
    "last_name": "last_name",
    "full_name": "full_name",
    "title": "title",
    "email": "email",
    "linkedin_url": "linkedin_url",
    "company_name": "company_name",
    "industry": "industry",
    "employee_count": "employee_count",
    "alt_phone": "alt_phone",
    "city": "city",
    "country": "country",
}

# All known Contact columns (for determining what goes to custom_fields)
KNOWN_FIELDS = set(PROFILE_FIELD_MAP.keys())


async def upsert_contact(
    session: AsyncSession,
    company_id: UUID,
    primary_phone: str,
    customer_name: str,
    contact_profile: Optional[Dict[str, Any]] = None,
    source: str = "csv_upload",
) -> UUID:
    """
    Create or update a Contact record based on (company_id, primary_phone).
    
    Args:
        session: DB session
        company_id: Tenant ID
        primary_phone: The dedup key
        customer_name: Fallback for full_name if not provided in profile
        contact_profile: Structured profile dict from the column mapper
        source: Origin of the data
        
    Returns:
        UUID of the upserted Contact
    """
    profile = contact_profile or {}
    
    # Look up existing Contact
    stmt = select(Contact).where(
        Contact.company_id == company_id,
        Contact.primary_phone == primary_phone,
    )
    result = await session.execute(stmt)
    existing = result.scalars().first()
    
    if existing:
        # Update: Only overwrite with non-null values
        updated = False
        for profile_key, model_field in PROFILE_FIELD_MAP.items():
            value = profile.get(profile_key)
            if value is not None and value != "":
                current = getattr(existing, model_field, None)
                if current != value:
                    setattr(existing, model_field, value)
                    updated = True
        
        # Update full_name if first/last changed but full_name wasn't explicitly set
        if "full_name" not in profile and ("first_name" in profile or "last_name" in profile):
            fn = existing.first_name or ""
            ln = existing.last_name or ""
            computed = f"{fn} {ln}".strip()
            if computed and existing.full_name != computed:
                existing.full_name = computed
                updated = True
        
        # Merge custom_fields
        custom = {k: v for k, v in profile.items() if k not in KNOWN_FIELDS and v is not None}
        if custom:
            merged = dict(existing.custom_fields or {})
            merged.update(custom)
            existing.custom_fields = merged
            updated = True
        
        if updated:
            existing.updated_at = datetime.utcnow()
            session.add(existing)
        
        return existing.id
    
    else:
        # Create new Contact
        # Determine full_name
        full_name = profile.get("full_name") or customer_name
        if not full_name and (profile.get("first_name") or profile.get("last_name")):
            full_name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
        
        # Separate known fields from custom
        known_data = {}
        custom_data = {}
        for k, v in profile.items():
            if v is None or v == "":
                continue
            if k in PROFILE_FIELD_MAP:
                known_data[PROFILE_FIELD_MAP[k]] = v
            else:
                custom_data[k] = v
        
        contact = Contact(
            id=uuid4(),
            company_id=company_id,
            primary_phone=primary_phone,
            full_name=full_name,
            source=source,
            custom_fields=custom_data if custom_data else {},
            **known_data,
        )
        session.add(contact)
        return contact.id


async def bulk_upsert_contacts(
    session: AsyncSession,
    company_id: UUID,
    leads_data: List[Dict[str, Any]],
    source: str = "csv_upload",
) -> Dict[str, UUID]:
    """
    Batch upsert Contacts for a list of leads.
    
    Args:
        session: DB session
        company_id: Tenant ID
        leads_data: List of lead dicts, each with at minimum 'contact_number' and 'customer_name'
        source: Origin of the data
        
    Returns:
        Dict mapping contact_number -> Contact UUID
    """
    # Collect all phone numbers
    phones = [str(ld.get("contact_number", "")).strip() for ld in leads_data]
    phones = [p for p in phones if p]
    
    if not phones:
        return {}
    
    # Batch fetch existing contacts
    stmt = select(Contact).where(
        Contact.company_id == company_id,
        Contact.primary_phone.in_(phones),
    )
    result = await session.execute(stmt)
    existing_contacts = {c.primary_phone: c for c in result.scalars().all()}
    
    phone_to_contact_id: Dict[str, UUID] = {}
    
    for lead in leads_data:
        phone = str(lead.get("contact_number", "")).strip()
        if not phone:
            continue
            
        name = lead.get("customer_name", "Unknown")
        profile = lead.get("contact_profile") or {}
        
        existing = existing_contacts.get(phone)
        
        if existing:
            # Update existing
            updated = False
            for profile_key, model_field in PROFILE_FIELD_MAP.items():
                value = profile.get(profile_key)
                if value is not None and value != "":
                    current = getattr(existing, model_field, None)
                    if current != value:
                        setattr(existing, model_field, value)
                        updated = True
            
            # Update full_name
            if "full_name" not in profile and ("first_name" in profile or "last_name" in profile):
                fn = existing.first_name or ""
                ln = existing.last_name or ""
                computed = f"{fn} {ln}".strip()
                if computed and existing.full_name != computed:
                    existing.full_name = computed
                    updated = True
            
            # Merge custom
            custom = {k: v for k, v in profile.items() if k not in KNOWN_FIELDS and v is not None}
            if custom:
                merged = dict(existing.custom_fields or {})
                merged.update(custom)
                existing.custom_fields = merged
                updated = True
            
            if updated:
                existing.updated_at = datetime.utcnow()
                session.add(existing)
            
            phone_to_contact_id[phone] = existing.id
        
        else:
            # Create new
            full_name = profile.get("full_name") or name
            if not full_name and (profile.get("first_name") or profile.get("last_name")):
                full_name = f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip()
            
            known_data = {}
            custom_data = {}
            for k, v in profile.items():
                if v is None or v == "":
                    continue
                if k in PROFILE_FIELD_MAP:
                    known_data[PROFILE_FIELD_MAP[k]] = v
                else:
                    custom_data[k] = v
            
            contact = Contact(
                id=uuid4(),
                company_id=company_id,
                primary_phone=phone,
                full_name=full_name,
                source=source,
                custom_fields=custom_data if custom_data else {},
                **known_data,
            )
            session.add(contact)
            existing_contacts[phone] = contact  # Cache for dedup within batch
            phone_to_contact_id[phone] = contact.id
    
    return phone_to_contact_id
