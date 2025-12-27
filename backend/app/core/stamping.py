from sqlalchemy import event, select
from sqlalchemy.orm import Session, Query, decl_api
from app.core.context import get_company_ctx
import uuid
from typing import Any

# Models that MUST be scoped by company_id
SCOPED_MODELS = [
    "Brand",
    "Workspace",
    "AuditTrail"
]

@event.listens_for(Session, "do_orm_execute")
def do_orm_execute(orm_execute_state):
    """
    Automatically injects company_id filter for scoped models.
    """
    company_id = get_company_ctx()
    
    # If we have a company_id in context, enforce it on all scoped models
    if company_id and not orm_execute_state.is_column_load and not orm_execute_state.is_relationship_load:
        # Check if the query involves any scoped models
        for ent in orm_execute_state.all_mappers:
            if ent.class_.__name__ in SCOPED_MODELS:
                # Apply criteria globally to this execution
                orm_execute_state.statement = orm_execute_state.statement.where(
                    ent.class_.company_id == company_id
                )

@event.listens_for(Session, "before_flush")
def before_flush(session: Session, flush_context: Any, instances: Any):
    """
    Ensures company_id is correctly set on all new objects before saving.
    """
    company_id = get_company_ctx()
    
    for obj in session.new:
        if type(obj).__name__ in SCOPED_MODELS:
            # If context exists, override/set it
            if company_id:
                obj.company_id = company_id
            # If no context and no manual ID set, this is a dangerous write
            elif not hasattr(obj, "company_id") or obj.company_id is None:
                raise ValueError(f"Security Error: Attempting to save {type(obj).__name__} without company_id context.")

def init_stamping(engine):
    # This is where we could attach global listeners if needed for pure SQLAlchemy
    # But for SQLModel/FastAPI, listeners on Query/Session are usually enough.
    pass
