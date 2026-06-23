from sqlalchemy.ext.asyncio import AsyncSession
from app.providers.category_provider import category_provider
from app.utils.app_error import AppError
from typing import Optional

async def get_all(db: AsyncSession, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None) -> dict:
    rows = await category_provider.find_all(db, limit=limit, cursor=cursor, order=order, search=search)
    has_next = len(rows) > limit
    items = rows[:limit] if has_next else rows
    next_cursor = items[-1].id if has_next and items else None
    return {"data": items, "limit": limit, "nextCursor": next_cursor, "hasNextPage": has_next}

async def find_by_id(db: AsyncSession, category_id: int):
    cat = await category_provider.find_by_id(db, category_id)
    if not cat:
        raise AppError(404, "Category not found")
    return cat

async def create(db: AsyncSession, name: str):
    return await category_provider.create(db, name)

async def update(db: AsyncSession, name: str, category_id: int):
    cat = await category_provider.update(db, category_id, name=name)
    if not cat:
        raise AppError(404, "Category not found")
    return cat

async def update_img(db: AsyncSession, category_id: int, img: str):
    cat = await category_provider.update(db, category_id, img=img)
    if not cat:
        raise AppError(404, "Category not found")
    return cat

async def delete(db: AsyncSession, category_id: int):
    cat = await category_provider.soft_delete(db, category_id)
    if not cat:
        raise AppError(404, "Category not found")
    return cat
