from typing import Any

from sqlalchemy import event
from sqlalchemy.orm import Session

from app.core.context import get_company_ctx, get_user_ctx

# Models that MUST be scoped by company_id
SCOPED_MODELS = [
    "Brand",
    "Workspace",
    "AuditTrail",
    "Integration",
    "IntegrationMetrics",
    "ShopifyRawIngest",
    "ShopifyOrder",
    "ShopifyLineItem",
    "ShopifyCustomer",
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
    Also stamps 'created_by' and 'updated_by' if applicable.
    """
    company_id = get_company_ctx()
    user_id = get_user_ctx()
    
    for obj in session.new:
        # 1. Company Stamping
        if type(obj).__name__ in SCOPED_MODELS:
            if company_id:
                obj.company_id = company_id
            elif not hasattr(obj, "company_id") or obj.company_id is None:
                # Allow explicit None for system-level overrides if absolutely needed, 
                # but generally warn/error
                pass 

        # 2. User Stamping (Created By)
        if hasattr(obj, "created_by") and obj.created_by is None and user_id:
            obj.created_by = user_id
            
        # 3. User Stamping (Updated By)
        if hasattr(obj, "updated_by") and user_id:
            obj.updated_by = user_id

    for obj in session.dirty:
        # 4. User Stamping on Update
        if hasattr(obj, "updated_by") and user_id:
            obj.updated_by = user_id

def init_stamping(engine):
    # This is where we could attach global listeners if needed for pure SQLAlchemy
    # But for SQLModel/FastAPI, listeners on Query/Session are usually enough.
    pass
