
import asyncio
import os
import sys
from uuid import UUID

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.db import async_session_factory
from app.services.intelligence.insight_engine import insight_engine
from app.models.company import Brand
from sqlalchemy import select

async def verify_phase3():
    print("🚀 Starting Phase 3 Verification...")
    
    async with async_session_factory() as session:
        # 1. Get a brand (first one found)
        stmt = select(Brand).limit(1)
        brand = (await session.execute(stmt)).scalar_one_or_none()
        
        if not brand:
            print("❌ No brand found to test with.")
            return

        print(f"🏢 Testing with Brand: {brand.name} ({brand.id})")
        
        # 2. Check API Key
        api_key = os.getenv("GEMINI_API_KEY")
        print(f"🔑 GEMINI_API_KEY present: {'✅ Yes' if api_key else '❌ No'}")
        
        # 3. Generate Deck
        print("\n🧠 Generating Intelligence Deck...")
        start_time = asyncio.get_event_loop().time()
        deck = await insight_engine.generate_full_deck(session, brand.id)
        duration = asyncio.get_event_loop().time() - start_time
        
        print(f"⏱️  Generation took: {duration:.2f}s")
        
        # 4. Verify Content
        insights = deck.get("insights", [])
        briefing = deck.get("briefing")
        
        print(f"\n📊 Generated {len(insights)} top insights (Total: {len(deck.get('full_deck', []))})")
        
        if briefing:
            print(f"\n☀️  Morning Briefing: \n'{briefing}'")
            if "Good morning" in briefing:
                print("   ✅ Valid Briefing Format")
        else:
            print("❌ No Morning Briefing generated")
            
        print("\n🔍 Checking LLM Enrichment:")
        enriched_count = 0
        for i, insight in enumerate(insights):
            context = insight.get("meta", {}).get("llm_context")
            recs = insight.get("meta", {}).get("llm_recommendations")
            
            print(f"   Insight {i+1}: {insight.get('title')}")
            if context:
                print(f"     ✅ Context: {context[:50]}...")
            else:
                print(f"     ❌ No Context")
                
            if recs:
                print(f"     ✅ Recs: {len(recs)} found")
                enriched_count += 1
            else:
                print(f"     ❌ No Recommendations")
                
        if enriched_count > 0:
            print("\n✨ Phase 3 Verification SUCCESS! Magic is real.")
        else:
            print("\n⚠️  Phase 3 Verification PARTIAL. Check LLM logs.")

if __name__ == "__main__":
    asyncio.run(verify_phase3())
