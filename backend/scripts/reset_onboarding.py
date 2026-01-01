import asyncio
from sqlmodel import select, delete
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.models.user import User
from app.models.company import Company, Brand, Workspace
from app.models.iam import CompanyMembership, WorkspaceMembership
from app.models.onboarding_state import OnboardingState
from app.models.integration import Integration
from app.models.audit import AuditTrail

async def reset_onboarding():
    async with AsyncSession(engine) as session:
        print("🗑️  Starting onboarding reset...")

        # 1. Reset Users
        print("users...")
        users = await session.exec(select(User))
        for user in users.all():
            user.onboarding_completed = False
            session.add(user)
        
        # 2. Delete Onboarding State
        print("onboarding states...")
        await session.exec(delete(OnboardingState))
        
        # 3. Delete Company Data (Cascading manually to be safe)
        # Delete Memberships
        print("memberships...")
        await session.exec(delete(CompanyMembership))
        await session.exec(delete(WorkspaceMembership))
        
        # Delete Integrations
        print("integrations...")
        await session.exec(delete(Integration))
        
        # Delete Hierarchy
        print("workspaces...")
        await session.exec(delete(Workspace))
        print("brands...")
        await session.exec(delete(Brand))
        print("companies...")
        await session.exec(delete(Company))
        
        print("audit trails...")
        await session.exec(delete(AuditTrail))

        await session.commit()
        print("✅ Successfully reset onboarding for all users.")

if __name__ == "__main__":
    asyncio.run(reset_onboarding())
