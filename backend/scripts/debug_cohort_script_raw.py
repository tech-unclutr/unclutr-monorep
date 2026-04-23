"""
One-off diagnostic: for the failing cohorts in study 1d4959af-...,
rebuild the script prompt, call Gemini, and print the raw output so we
can see exactly what the model returned (without going through the HTTP
endpoint or touching the DB).
"""
import asyncio
import sys
import uuid
from pathlib import Path

# Ensure `app` import works when run via `python backend/scripts/...`.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import select

from app.core.db import async_session_factory
from app.models.designed_study import DesignedStudy
from app.models.study_designer.research_cohort import ResearchCohort
from app.services.intelligence.llm_service import llm_service
from app.services.intelligence.schemas.cohort_script import COHORT_SCRIPT_GEMINI_SCHEMA
from app.api.v1.endpoints.study_designer import (
    _build_cohort_script_prompt,
    _parse_structured_cohort_script,
)


STUDY_ID = uuid.UUID("1d4959af-67c9-4c2b-905b-2ea964b0ded7")
TARGET_COHORT_NAMES = {"Lapsers", "Not Interested"}


async def main() -> None:
    llm_service._ensure_configured()
    if not llm_service.model:
        print("GEMINI not configured; aborting")
        return

    async with async_session_factory() as session:
        study = await session.get(DesignedStudy, STUDY_ID)
        if not study:
            print(f"Study {STUDY_ID} not found")
            return
        print(f"Study: {study.title or '(untitled)'}")
        print(f"  company_id = {study.company_id}")
        print(f"  KRQs count = {len(study.key_research_questions or [])}")
        print()

        stmt = select(ResearchCohort).where(
            ResearchCohort.company_id == study.company_id,
            ResearchCohort.name.in_(list(TARGET_COHORT_NAMES)),
        )
        cohorts = (await session.exec(stmt)).all()
        if not cohorts:
            print("No target cohorts found")
            return

        for cohort in cohorts:
            print("=" * 78)
            print(f"COHORT: {cohort.name}  (id={cohort.id})")
            print(f"  description_len = {len(cohort.description or '')}")
            print(f"  hypothesis_len  = {len(cohort.hypothesis or '')}")

            prompt = _build_cohort_script_prompt(study, cohort)
            print(f"  prompt_len      = {len(prompt)}")

            try:
                raw = await llm_service._generate(
                    prompt,
                    response_schema=COHORT_SCRIPT_GEMINI_SCHEMA,
                    timeout_override=120.0,
                )
            except Exception as e:
                print(f"  LLM ERROR: {e}")
                continue

            raw = raw or ""
            print(f"  raw_len         = {len(raw)}")
            parsed = _parse_structured_cohort_script(raw, study.key_research_questions or [])
            print(f"  parsed_count    = {len(parsed)}")
            print()
            print("--- RAW OUTPUT (first 2000 chars) ---")
            print(raw[:2000])
            print("--- END RAW ---")
            print()


if __name__ == "__main__":
    asyncio.run(main())
