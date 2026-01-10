import asyncio
from sqlmodel import select
from app.core.db import get_session
from app.models.company import Company
from app.models.iam import CompanyMembership

async def inspect_company_fields():
    session_gen = get_session()
    session = await session_gen.__anext__()
    
    stmt = select(Company)
    result = await session.exec(stmt)
    companies = result.all()
    
    for company in companies:
        print(f"--- Company: {company.brand_name} ({company.id}) ---")
        print(f"stack_summary: {company.stack_summary}")
        print(f"channels_summary: {company.channels_summary}")
        
        # Check if there are ANY other suspicious fields via __dict__
        attrs = company.__dict__
        for key in attrs:
            if 'stack' in key or 'channel' in key or 'data' in key:
                print(f"Found related attr: {key} = {attrs[key]}")

    await session.close()

if __name__ == "__main__":
    asyncio.run(inspect_company_fields())
