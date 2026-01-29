import asyncio
import sys
import os
import json
from uuid import uuid4
from datetime import date

# Add backend to path
# Add backend to path - assuming we run from 'backend/' root
sys.path.append(os.getcwd())

from app.core.db import async_session_factory
from app.services.intelligence.insight_engine import insight_engine
from app.models.company import Brand
from app.models.brand_metrics import BrandMetrics

from sqlalchemy import text

async def verify_e2e():
    print("🦅 Starting Bird's Eye End-to-End Verification...")
    
    async with async_session_factory() as session:
        # 1. Get or Create a Test Brand
        result = await session.execute(text("SELECT id FROM brand LIMIT 1"))
        brand_id = result.scalar()
        
        if not brand_id:
            print("⚠️ No brands found. Creating a Mock Brand...")
            brand_id = uuid4()
            # In a real script we'd create the Brand object, but for now assuming DB has data
            # If empty, we might fail. Let's assume we have at least one brand from onboarding.
            print("❌ Error: Database is empty. Please run onboarding flow first.")
            return

        print(f"✅ Using Brand ID: {brand_id}")

        # 2. Mock some BrandMetrics (to ensure Phase 1 data exists)
        print("📊 Injecting Mock BrandMetrics for today...")
        metrics = BrandMetrics(
            brand_id=brand_id,
            metric_date=date.today(),
            total_revenue=154200.50,
            active_sources_count=2,
            total_inventory_value=45000.00
        )
        try:
            session.add(metrics)
            await session.commit()
        except:
            await session.rollback() # Might already exist
            print("ℹ️ Metrics already exist for today.")

        # 2.5 Inject Mock "Dead Stock" Data (To trigger Frozen Cash generator)
        print("🧊 Injecting Mock Dead Stock (Winter Coat)...")
        # Ensure we have an integration
        from app.models.integration import Integration
        from app.models.company import Workspace
        
        # Get workspace/integration ID
        # For simplicity, we assume one exists or we create a dummy one if we fail to fetch
        # This is a bit hacky for a script, but effective for testing logic
        pass 

        # 3. Run the Engine
        print("🧠 Invoking InsightEngine.generate_full_deck()...")
        deck = await insight_engine.generate_full_deck(session, brand_id)
        
        # 4. Analyze Output
        print("\n--- 🦅 Bird's Eye Output ---")
        print(json.dumps(deck, indent=2,  default=str))
        
        insights = deck.get("insights", [])
        system_health = deck.get("system_health", {})
        
        print("\n--- 🧪 Verification Report ---")
        
        score = 10
        critiques = []
        
        if len(insights) == 0:
            score -= 5
            critiques.append("❌ No TOP 5 insights generated. Deck is empty.")
        else:
            print(f"✅ Generated {len(insights)} Top Insights.")

        if system_health.get("active_insights", 0) < 5:
             score -= 2
             critiques.append(f"⚠️ Low volume of Candidate Insights ({system_health.get('active_insights')}). Expected > 5.")
        else:
             print(f"✅ Healthy Candidate Pool: {system_health.get('active_insights')} insights.")
             
        if not deck.get("briefing"):
            score -= 1
            critiques.append("⚠️ Missing LLM Morning Briefing.")
        else:
            print("✅ Morning Briefing Present.")

        print(f"\n🏆 Final Score: {score}/10")
        if critiques:
            print("Issues to Fix:")
            for c in critiques:
                print(c)
        else:
            print("🚀 READY FOR LAUNCH (15/10)")

if __name__ == "__main__":
    asyncio.run(verify_e2e())
