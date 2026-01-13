
import asyncio
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine
from app.services.metrics_service import MetricsService
from datetime import date

async def test_metrics():
    async with AsyncSession(engine) as session:
        print("Testing get_overview_metrics...")
        try:
            metrics = await MetricsService.get_overview_metrics(session)
            print(f"SUCCESS! Overview metrics returned:")
            print(f" - Total Users: {metrics['total_users']}")
            print(f" - Active Users (Daily): {metrics['active_users_daily']}")
            print(f" - Onboarding Completion: {metrics['onboarding_completion_rate']}%")
            print(f" - Recent Activity Count: {len(metrics['recent_activity'])}")
        except Exception as e:
            print(f"FAILURE: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_metrics())
