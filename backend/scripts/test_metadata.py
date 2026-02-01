"""
Quick test to check if SQLAlchemy metadata matches the database schema
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import inspect, text
from app.core.config import settings
from app.models.campaign import Campaign

async def test_metadata():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        # Get actual columns from database
        result = await conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'campaigns' ORDER BY column_name"
        ))
        db_columns = {row[0] for row in result}
        
        # Get columns from SQLAlchemy model
        inspector = inspect(Campaign)
        model_columns = {col.name for col in inspector.columns}
        
        print("Database columns:", sorted(db_columns))
        print("\nModel columns:", sorted(model_columns))
        
        # Find differences
        only_in_db = db_columns - model_columns
        only_in_model = model_columns - db_columns
        
        if only_in_db:
            print(f"\n❌ Columns in DB but not in model: {sorted(only_in_db)}")
        if only_in_model:
            print(f"\n❌ Columns in model but not in DB: {sorted(only_in_model)}")
            
        if not only_in_db and not only_in_model:
            print("\n✅ Model and database schemas match!")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_metadata())
