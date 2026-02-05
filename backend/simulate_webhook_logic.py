
import asyncio
import sys
import os
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine

# Add backend to path
sys.path.append(os.getcwd())

from app.api.v1.endpoints.bolna_webhook import bolna_webhook
from app.core.config import settings

# Setup DB
engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def main():
    payload = {
        "execution_id": "0c351111-ea87-4e84-a611-dc0b7cf44b7b",
        "status": "ringing",
        "duration": 5,
        "total_cost": 0.01,
        "currency": "USD"
    }

    print("Starting simulation...")
    async with async_session() as session:
        try:
            result = await bolna_webhook(payload, session)
            print("Success:", result)
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
