from contextvars import ContextVar
from typing import Optional
import uuid

# Context Variables for global access within a request
company_id_ctx: ContextVar[Optional[uuid.UUID]] = ContextVar("company_id", default=None)
workspace_id_ctx: ContextVar[Optional[uuid.UUID]] = ContextVar("workspace_id", default=None)
user_id_ctx: ContextVar[Optional[str]] = ContextVar("user_id", default=None)

def set_company_ctx(company_id: uuid.UUID):
    company_id_ctx.set(company_id)

def get_company_ctx() -> Optional[uuid.UUID]:
    return company_id_ctx.get()

def set_workspace_ctx(workspace_id: uuid.UUID):
    workspace_id_ctx.set(workspace_id)

def get_workspace_ctx() -> Optional[uuid.UUID]:
    return workspace_id_ctx.get()

def set_user_ctx(user_id: str):
    user_id_ctx.set(user_id)

def get_user_ctx() -> Optional[str]:
    return user_id_ctx.get()
