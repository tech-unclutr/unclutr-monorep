"""
Agent Configurations — CRUD for reusable execution-agent identities.

A company maintains multiple personas (e.g. "Riya" for D2C consumer studies,
"Jordan" for B2B founder calls). Each ResearchCohort references one via
`research_cohorts.agent_configuration_id`. Runtime resolution falls back to
the company default if a cohort's FK is NULL, and to a hardcoded default if
no agent config exists at all (cohort data is preserved across deletions
because the FK is `ON DELETE SET NULL`).
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import update as sql_update
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.core.security import get_current_user
from app.models.iam import CompanyMembership
from app.models.study_designer import AgentConfiguration, VoiceProvider
from app.models.user import User

router = APIRouter()


# ── Auth helper (mirrors study_designer.py) ──

async def _get_company_id(
    session: AsyncSession = Depends(get_session),
    current_user_token: dict = Depends(get_current_user),
) -> uuid.UUID:
    user_id = current_user_token.get("uid")
    user = await session.get(User, user_id)
    if user and user.current_company_id:
        return user.current_company_id
    stmt = select(CompanyMembership).where(CompanyMembership.user_id == user_id)
    membership = (await session.exec(stmt)).first()
    if not membership:
        raise HTTPException(status_code=404, detail="No company found for user")
    return membership.company_id


# ── Schemas ──

class AgentConfigurationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    display_name: Optional[str] = Field(default=None, max_length=128)
    description: Optional[str] = Field(default=None, max_length=500)
    voice_id: str = Field(..., min_length=1)
    voice_provider: VoiceProvider = Field(default=VoiceProvider.BOLNA)
    language: str = Field(default="en-IN")
    is_default: bool = Field(default=False)


class AgentConfigurationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=64)
    display_name: Optional[str] = Field(default=None, max_length=128)
    description: Optional[str] = Field(default=None, max_length=500)
    voice_id: Optional[str] = Field(default=None, min_length=1)
    voice_provider: Optional[VoiceProvider] = None
    language: Optional[str] = None
    is_default: Optional[bool] = None


class AgentConfigurationResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    name: str
    display_name: Optional[str]
    description: Optional[str]
    voice_id: str
    voice_provider: VoiceProvider
    language: str
    is_default: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str]


# ── Helpers ──

async def _get_agent_or_404(
    session: AsyncSession,
    agent_id: uuid.UUID,
    company_id: uuid.UUID,
) -> AgentConfiguration:
    agent = await session.get(AgentConfiguration, agent_id)
    if not agent or agent.company_id != company_id:
        raise HTTPException(status_code=404, detail="Agent configuration not found")
    return agent


async def _demote_other_defaults(
    session: AsyncSession,
    company_id: uuid.UUID,
    keep_id: Optional[uuid.UUID],
) -> None:
    """Set is_default=false on every default agent in the company except `keep_id`.

    Issued as a single Core UPDATE so the demotion lands on the DB *before*
    the promotion write. This dodges `uq_agent_configuration_company_default`,
    which would otherwise see two rows with `is_default=true` if the ORM
    flushed the new/promoted row first. Callers must invoke this before
    dirtying or inserting the row being promoted.
    """
    stmt = sql_update(AgentConfiguration).where(
        AgentConfiguration.company_id == company_id,
        AgentConfiguration.is_default == True,  # noqa: E712
    ).values(is_default=False, updated_at=datetime.utcnow())
    if keep_id is not None:
        stmt = stmt.where(AgentConfiguration.id != keep_id)
    await session.execute(stmt)


# ── Endpoints ──

@router.get("", response_model=List[AgentConfigurationResponse])
async def list_agent_configurations(
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """List all agent configurations for the current company."""
    stmt = (
        select(AgentConfiguration)
        .where(AgentConfiguration.company_id == company_id)
        .order_by(AgentConfiguration.is_default.desc(), AgentConfiguration.created_at.desc())
    )
    return (await session.exec(stmt)).all()


@router.post(
    "",
    response_model=AgentConfigurationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_agent_configuration(
    payload: AgentConfigurationCreate,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
    current_user_token: dict = Depends(get_current_user),
):
    """Create a new agent configuration. If is_default=True, demotes any existing default."""
    existing_stmt = select(AgentConfiguration).where(
        AgentConfiguration.company_id == company_id,
        AgentConfiguration.name == payload.name,
    )
    if (await session.exec(existing_stmt)).first():
        raise HTTPException(
            status_code=409,
            detail=f"Agent configuration '{payload.name}' already exists for this company",
        )

    agent = AgentConfiguration(
        company_id=company_id,
        name=payload.name,
        display_name=payload.display_name,
        description=payload.description,
        voice_id=payload.voice_id,
        voice_provider=payload.voice_provider,
        language=payload.language,
        is_default=payload.is_default,
        created_by=current_user_token.get("uid"),
    )

    if payload.is_default:
        await _demote_other_defaults(session, company_id, keep_id=None)

    session.add(agent)
    await session.commit()
    await session.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=AgentConfigurationResponse)
async def get_agent_configuration(
    agent_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    return await _get_agent_or_404(session, agent_id, company_id)


@router.patch("/{agent_id}", response_model=AgentConfigurationResponse)
async def update_agent_configuration(
    agent_id: uuid.UUID,
    payload: AgentConfigurationUpdate,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    agent = await _get_agent_or_404(session, agent_id, company_id)

    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates and updates["name"] != agent.name:
        clash_stmt = select(AgentConfiguration).where(
            AgentConfiguration.company_id == company_id,
            AgentConfiguration.name == updates["name"],
        )
        if (await session.exec(clash_stmt)).first():
            raise HTTPException(
                status_code=409,
                detail=f"Agent configuration '{updates['name']}' already exists for this company",
            )

    promoting_to_default = updates.get("is_default") is True and not agent.is_default

    # Demote others FIRST (before dirtying `agent`), so the partial unique
    # index sees only one `is_default=true` row at every statement boundary.
    if promoting_to_default:
        await _demote_other_defaults(session, company_id, keep_id=agent.id)

    for key, value in updates.items():
        setattr(agent, key, value)
    agent.updated_at = datetime.utcnow()

    session.add(agent)
    await session.commit()
    await session.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent_configuration(
    agent_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    company_id: uuid.UUID = Depends(_get_company_id),
):
    """
    Hard delete. Cohort data is unaffected — the FK on research_cohorts is
    `ON DELETE SET NULL`, so referencing cohorts get their FK cleared and the
    runtime resolution chain falls back to the company default (or hardcoded
    fallback if the deleted agent was the company default).
    """
    agent = await _get_agent_or_404(session, agent_id, company_id)
    await session.delete(agent)
    await session.commit()
    return None
