from sqlalchemy.ext.asyncio import AsyncSession
from app.providers.role_provider import role_provider
from app.utils.app_error import AppError
from typing import Optional

async def get_all(db: AsyncSession, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None) -> dict:
    rows = await role_provider.find_all(db, limit=limit, cursor=cursor, order=order, search=search)
    has_next = len(rows) > limit
    items = rows[:limit] if has_next else rows
    next_cursor = items[-1].id if has_next and items else None
    return {"data": items, "limit": limit, "nextCursor": next_cursor, "hasNextPage": has_next}

async def find_by_id(db: AsyncSession, role_id: int):
    role = await role_provider.find_by_id(db, role_id)
    if not role:
        raise AppError(404, "Role not found")
    return role

async def create(db: AsyncSession, name: str, description: Optional[str] = None):
    return await role_provider.create(db, name=name, description=description)

async def update(db: AsyncSession, role_id: int, **data):
    role = await role_provider.update(db, role_id, **{k: v for k, v in data.items() if v is not None})
    if not role:
        raise AppError(404, "Role not found")
    return role

async def delete(db: AsyncSession, role_id: int):
    role = await role_provider.soft_delete(db, role_id)
    if not role:
        raise AppError(404, "Role not found")
    return role
