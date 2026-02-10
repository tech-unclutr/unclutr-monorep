
import asyncio
from uuid import UUID
from sqlalchemy import select
from app.core.db import get_session
from app.models.calendar_connection import CalendarConnection
from app.api.v1.endpoints.intelligence import get_calendar_status
from app.models.user import User

async def reproduce():
    session_gen = get_session()
    session = await session_gen.__anext__()
    try:
        # Mocking current_user
        current_user = User(id="QrOwZmlu4ycKYdaUMz09rh0CoCc2")
        x_company_id = "d47da809-b1aa-49c3-ace7-624aeddad9bd"
        
        print(f"Calling get_calendar_status for company {x_company_id} and user {current_user.id}")
        result = await get_calendar_status(
            current_user=current_user,
            x_company_id=x_company_id,
            session=session
        )
        print("Result:", result)
    except Exception as e:
        import traceback
        print("Reproduction failed with exception:")
        print(e)
        print(traceback.format_exc())
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(reproduce())
