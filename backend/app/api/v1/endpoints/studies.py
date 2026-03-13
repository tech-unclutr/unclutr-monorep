"""
Study Explorer API endpoints.
Public endpoints for browsing the research study catalog.
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from loguru import logger
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.models.study import (
    Department,
    IndustryModel,
    LifecycleStage,
    StartupStage,
    StudyCategory,
    StudyCost,
    StudyModel,
)

router = APIRouter()


@router.get("/meta")
async def get_study_meta(
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """
    Returns all lookup/filter data for the Study Explorer:
    industries, departments, categories, lifecycle stages, startup stages.
    """
    try:
        # Fetch all lookups in parallel-style (sequential but fast at this scale)
        industries_result = await session.exec(
            select(IndustryModel).order_by(
                IndustryModel.is_popular.desc(),
                IndustryModel.display_order,
            )
        )
        industries = industries_result.all()

        departments_result = await session.exec(
            select(Department).order_by(Department.display_order)
        )
        departments = departments_result.all()

        categories_result = await session.exec(
            select(StudyCategory).order_by(StudyCategory.category_id)
        )
        categories = categories_result.all()

        lifecycle_result = await session.exec(
            select(LifecycleStage).order_by(LifecycleStage.display_order)
        )
        lifecycle_stages = lifecycle_result.all()

        startup_result = await session.exec(
            select(StartupStage).order_by(StartupStage.display_order)
        )
        startup_stages = startup_result.all()

        return {
            "industries": [
                {
                    "id": i.industry_id,
                    "name": i.industry_name,
                    "slug": i.industry_slug,
                    "illustration_key": i.illustration_key,
                    "is_popular": i.is_popular,
                    "display_order": i.display_order,
                }
                for i in industries
            ],
            "departments": [
                {
                    "id": d.dept_id,
                    "name": d.dept_name,
                    "display_order": d.display_order,
                }
                for d in departments
            ],
            "categories": [
                {
                    "id": c.category_id,
                    "name": c.category_name,
                    "slug": c.category_slug,
                }
                for c in categories
            ],
            "lifecycle_stages": [
                {
                    "id": s.stage_id,
                    "name": s.stage_name,
                    "display_order": s.display_order,
                }
                for s in lifecycle_stages
            ],
            "startup_stages": [
                {
                    "id": s.stage_id,
                    "name": s.stage_name,
                    "display_order": s.display_order,
                }
                for s in startup_stages
            ],
        }
    except Exception as e:
        logger.error(f"Failed to fetch study meta: {e}")
        raise


@router.get("")
async def get_all_studies(
    session: AsyncSession = Depends(get_session),
) -> List[Dict[str, Any]]:
    """
    Returns all studies with their departments and industries arrays.
    This replaces the static studies.ts file on the frontend.
    """
    try:
        # Load studies with related department and industry links
        result = await session.exec(
            select(StudyModel)
            .options(
                selectinload(StudyModel.department_links),
                selectinload(StudyModel.industry_links),
                selectinload(StudyModel.category),
            )
            .order_by(StudyModel.study_id)
        )
        studies = result.all()

        # Now we need the dept and industry names, load the lookups
        dept_result = await session.exec(select(Department))
        dept_map = {d.dept_id: d.dept_name for d in dept_result.all()}

        ind_result = await session.exec(select(IndustryModel))
        ind_map = {i.industry_id: i.industry_name for i in ind_result.all()}

        return [
            {
                "id": f"study-{s.study_id}",
                "name": s.study_name,
                "family": s.study_family or (s.category.category_name if s.category else None),
                "description": s.tagline,
                "departments": [
                    dept_map.get(dl.dept_id, f"dept-{dl.dept_id}")
                    for dl in s.department_links
                ],
                "industries": [
                    ind_map.get(il.industry_id, f"ind-{il.industry_id}")
                    for il in s.industry_links
                ],
                "urgency": s.urgency,
                "method": s.method_type,
                # Extended fields for detail view
                "signal_type": s.signal_type,
                "primary_goal": s.primary_goal,
                "questions_answered": s.questions_answered,
                "decisions_unlocked": s.decisions_unlocked,
                "best_timing_trigger": s.best_timing_trigger,
                "frequency_cadence": s.frequency_cadence,
                "practice_level": s.practice_level,
                "priority_label": s.priority_label,
                "dri_role": s.dri_role,
                "typical_sample_type": s.typical_sample_type,
                "typical_sample_size": s.typical_sample_size,
                "best_execution_method": s.best_execution_method,
                "time_to_insight": s.time_to_insight,
                "priority_score": s.priority_score,
                "roi_score": s.roi_score,
                "is_featured": s.is_featured,
                "is_locked": s.is_locked,
            }
            for s in studies
        ]
    except Exception as e:
        logger.error(f"Failed to fetch studies: {e}")
        raise


@router.get("/{study_id}")
async def get_study_detail(
    study_id: int,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """
    Returns a single study with all related data including costs, cadence, etc.
    """
    try:
        result = await session.exec(
            select(StudyModel)
            .where(StudyModel.study_id == study_id)
            .options(
                selectinload(StudyModel.department_links),
                selectinload(StudyModel.industry_links),
                selectinload(StudyModel.lifecycle_stage_links),
                selectinload(StudyModel.startup_stage_links),
                selectinload(StudyModel.costs),
                selectinload(StudyModel.cadence_links),
                selectinload(StudyModel.category),
            )
        )
        study = result.first()

        if not study:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Study not found")

        # Load lookup maps
        dept_result = await session.exec(select(Department))
        dept_map = {d.dept_id: d.dept_name for d in dept_result.all()}

        ind_result = await session.exec(select(IndustryModel))
        ind_map = {i.industry_id: i.industry_name for i in ind_result.all()}

        lc_result = await session.exec(select(LifecycleStage))
        lc_map = {s.stage_id: s.stage_name for s in lc_result.all()}

        su_result = await session.exec(select(StartupStage))
        su_map = {s.stage_id: s.stage_name for s in su_result.all()}

        return {
            "id": f"study-{study.study_id}",
            "name": study.study_name,
            "family": study.study_family or (study.category.category_name if study.category else None),
            "category": study.category.category_name if study.category else None,
            "description": study.tagline,
            "alternate_names": study.alternate_names,
            "signal_type": study.signal_type,
            "primary_goal": study.primary_goal,
            "questions_answered": study.questions_answered,
            "decisions_unlocked": study.decisions_unlocked,
            "best_timing_trigger": study.best_timing_trigger,
            "frequency_cadence": study.frequency_cadence,
            "urgency": study.urgency,
            "practice_level": study.practice_level,
            "priority_label": study.priority_label,
            "dri_role": study.dri_role,
            "method": study.method_type,
            "typical_sample_type": study.typical_sample_type,
            "typical_sample_size": study.typical_sample_size,
            "best_execution_method": study.best_execution_method,
            "scrappy_version": study.scrappy_version,
            "gold_standard_version": study.gold_standard_version,
            "india_execution_notes": study.india_execution_notes,
            "language_regional_notes": study.language_regional_notes,
            "online_vs_offline": study.online_vs_offline,
            "key_success_criteria": study.key_success_criteria,
            "guardrails_validity_checks": study.guardrails_validity_checks,
            "output_artifact": study.output_artifact,
            "main_kpis_metrics": study.main_kpis_metrics,
            "common_mistakes": study.common_mistakes,
            "time_to_insight": study.time_to_insight,
            "main_cost_drivers": study.main_cost_drivers,
            "roi_conditions": study.roi_conditions,
            "priority_score": study.priority_score,
            "roi_score": study.roi_score,
            "notes_nuances": study.notes_nuances,
            "requires_direct_touchpoint": study.requires_direct_touchpoint,
            "is_featured": study.is_featured,
            "is_locked": study.is_locked,
            "is_prioritization_pack": study.is_prioritization_pack,
            "priority_rank": study.priority_rank,
            "why_it_matters_short": study.why_it_matters_short,
            "departments": [
                {
                    "name": dept_map.get(dl.dept_id),
                    "ownership_type": dl.ownership_type,
                }
                for dl in study.department_links
            ],
            "industries": [
                {
                    "name": ind_map.get(il.industry_id),
                    "must_do": il.must_do,
                    "can_skip": il.can_skip,
                }
                for il in study.industry_links
            ],
            "lifecycle_stages": [
                lc_map.get(sl.stage_id)
                for sl in study.lifecycle_stage_links
            ],
            "startup_stages": [
                su_map.get(sl.stage_id)
                for sl in study.startup_stage_links
            ],
            "costs": [
                {
                    "tier": c.cost_tier,
                    "min_inr": c.cost_min_inr,
                    "max_inr": c.cost_max_inr,
                }
                for c in study.costs
            ],
            "cadence": [c.cadence_type for c in study.cadence_links],
        }
    except Exception as e:
        logger.error(f"Failed to fetch study {study_id}: {e}")
        raise
