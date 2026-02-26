"""
Contact Model — a company-scoped entity representing a person/organization.

Contacts live across campaigns. A CampaignLead can optionally link to a Contact
to access structured profile data (title, company, industry, location, etc.).

Dedup key: (company_id, primary_phone)
"""
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import JSON, Column, UniqueConstraint
from sqlmodel import Field, SQLModel


class Contact(SQLModel, table=True):
    __tablename__ = "contacts"
    __table_args__ = (
        UniqueConstraint("company_id", "primary_phone", name="uq_company_contact_phone"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(index=True, nullable=False)

    # ── Person ──────────────────────────────────────────
    first_name: Optional[str] = Field(default=None)
    last_name: Optional[str] = Field(default=None)
    full_name: Optional[str] = Field(default=None)  # Denormalized for display
    title: Optional[str] = Field(default=None)  # e.g. "CEO", "Marketing Head"
    email: Optional[str] = Field(default=None)
    linkedin_url: Optional[str] = Field(default=None)

    # ── Company ─────────────────────────────────────────
    company_name: Optional[str] = Field(default=None)
    industry: Optional[str] = Field(default=None)
    employee_count: Optional[str] = Field(default=None)

    # ── Contact ─────────────────────────────────────────
    primary_phone: str = Field(index=True, nullable=False)
    alt_phone: Optional[str] = Field(default=None)

    # ── Location ────────────────────────────────────────
    city: Optional[str] = Field(default=None)
    country: Optional[str] = Field(default=None)

    # ── Flexible overflow for unmapped fields ───────────
    custom_fields: Optional[Dict[str, Any]] = Field(default={}, sa_column=Column(JSON))

    # ── Metadata ────────────────────────────────────────
    source: Optional[str] = Field(default="csv_upload")  # csv_upload, api, enrichment
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
