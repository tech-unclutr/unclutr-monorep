from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.user import User, UserCreate, UserRead
from datetime import datetime

from app.models.iam import CompanyMembership


async def sync_user(session: AsyncSession, user_in: UserCreate) -> UserRead:
    # 1. Try to find by ID (Standard Case)
    statement = select(User).where(User.id == user_in.id)
    result = await session.exec(statement)
    user = result.first()
    
    if not user:
        # 2. Check for Email Collision (Migration Case)
        # Firebase UID changed but email remains same (e.g. deleted/recreated auth user)
        email_stmt = select(User).where(User.email == user_in.email)
        email_result = await session.exec(email_stmt)
        existing_user_by_email = email_result.first()
        
        if existing_user_by_email:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"User Migration Triggered: Email {user_in.email} exists on old UID {existing_user_by_email.id}. Migrating to new UID {user_in.id}")
            
            old_uid = existing_user_by_email.id
            new_uid = user_in.id
            
            # --- MIGRATION: Update References ---
            from textwrap import dedent
            from sqlalchemy import text
            
            # We use raw SQL for efficient bulk updates without loading everything
            # Note: We rely on the fact that these are string/UUID fields.
            
            # 1. Memberships (Foreign Keys)
            await session.exec(text(f"UPDATE company_membership SET user_id = '{new_uid}' WHERE user_id = '{old_uid}'"))
            await session.exec(text(f"UPDATE workspace_membership SET user_id = '{new_uid}' WHERE user_id = '{old_uid}'"))
            
            # 2. Onboarding State (Foreign Key-ish)
            await session.exec(text(f"UPDATE onboarding_state SET user_id = '{new_uid}' WHERE user_id = '{old_uid}'"))
            
            # 3. Audit / Tracking Fields (Strings)
            # Update created_by/updated_by on key tables
            # Only include tables that inherit UserTrackedModel or have these fields
            tables_to_audit_update = ["company", "brand", "workspace"]
            for tbl in tables_to_audit_update:
                try:
                    await session.exec(text(f"UPDATE {tbl} SET created_by = '{new_uid}' WHERE created_by = '{old_uid}'"))
                    await session.exec(text(f"UPDATE {tbl} SET updated_by = '{new_uid}' WHERE updated_by = '{old_uid}'"))
                except Exception:
                    # Log but continue if table/column missing
                    pass
            
            # 4. Delete Old User (to free email constraint)
            await session.delete(existing_user_by_email)
            await session.flush() # Commit intermediate delete
            
            logger.info("Migration successful. Creating new user record.")
            
        # Create new
        user = User(
            id=user_in.id,
            email=user_in.email,
            full_name=user_in.full_name,
            picture_url=user_in.picture_url,
            created_at=datetime.utcnow(),
            last_login_at=datetime.utcnow()
        )
        session.add(user)
    else:
        # Update existing
        if not user.full_name:
            user.full_name = user_in.full_name
        user.picture_url = user_in.picture_url
        user.email = user_in.email
        user.last_login_at = datetime.utcnow()
        session.add(user)
    
    # Check if onboarding is completed
    # Note: We must flush user first to ensure it exists for FK queries if needed, 
    # but here we just query membership.
    await session.commit()
    await session.refresh(user) 
    
    membership_stmt = select(CompanyMembership).where(CompanyMembership.user_id == user.id)
    membership_result = await session.exec(membership_stmt)
    memberships = membership_result.all()
    
    membership = next((m for m in memberships if m.company_id == user.current_company_id), None)
    if not membership and memberships:
        membership = memberships[0]
        user.current_company_id = membership.company_id
    
    if membership:
        user.role = membership.role
        
    # Auto-populate designation from most recent campaign if not set
    if not user.designation:
        from app.models.campaign import Campaign
        from sqlmodel import desc
        
        campaign_stmt = select(Campaign).where(
            Campaign.user_id == user.id
        ).order_by(desc(Campaign.created_at)).limit(1)
        
        campaign_result = await session.exec(campaign_stmt)
        latest_campaign = campaign_result.first()
        
        if latest_campaign and latest_campaign.team_member_role:
            user.designation = latest_campaign.team_member_role
            session.add(user)
            await session.commit()
            await session.refresh(user)
    
    is_onboarded = membership is not None
    
    # Attach transient attribute for the response serializer
    user_read = UserRead.from_orm(user)
    user_read.onboarding_completed = is_onboarded
    user_read.current_company_id = user.current_company_id
    user_read.role = user.role # Now using the persistent field
    
    return user_read

