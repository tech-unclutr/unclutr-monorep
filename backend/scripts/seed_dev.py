import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine, init_db
from app.models.iam import Permission, Module

async def seed_data():
    await init_db()
    async with AsyncSession(engine) as session:
        # 1. Seed Permissions
        permissions = [
            Permission(id="workspace:invite", description="Invite new members to workspace"),
            Permission(id="workspace:remove", description="Remove members from workspace"),
            Permission(id="truth:read", description="View truth engine metrics"),
            Permission(id="truth:reconcile", description="Trigger manual reconciliation"),
            Permission(id="billing:manage", description="Manage company billing"),
        ]
        for p in permissions:
            stmt = select(Permission).where(Permission.id == p.id)
            if not (await session.exec(stmt)).first():
                session.add(p)
        
        # 2. Seed Modules
        modules = [
            Module(id="truth_engine", name="Truth Engine", description="Core reconciliation and financial truth."),
            Module(id="decision_cards", name="Decision Cards", description="AI-powered insights and action items."),
            Module(id="connectors", name="Integrations", description="Shopify, Amazon, and Gateway connectors."),
        ]
        for m in modules:
            stmt = select(Module).where(Module.id == m.id)
            if not (await session.exec(stmt)).first():
                session.add(m)
        
        await session.commit()
        print("Success: Development fixtures seeded.")

if __name__ == "__main__":
    asyncio.run(seed_data())
