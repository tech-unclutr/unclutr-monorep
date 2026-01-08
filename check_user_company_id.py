
import asyncio
import sys
import os

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.db import engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from app.models.user import User

async def main():
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    target_user_id = "QrOwZmlu4ycKYdaUMz09rh0CoCc2" 
    
    async with async_session_factory() as session:
        print(f"--- Checking User {target_user_id} ---")
        user = await session.get(User, target_user_id)
        if user:
            print(f"User Found.")
            print(f"Current Company ID: {user.current_company_id}")
            
            if not user.current_company_id:
                print("Confirmed: current_company_id is None/Null")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(main())
