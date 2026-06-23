from sqlalchemy.ext.asyncio import AsyncSession
from app.providers.menu_item_provider import menu_item_provider
from app.providers.menu_item_image_provider import menu_item_image_provider
from app.utils.app_error import AppError
from typing import Optional

async def get_all(db: AsyncSession, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None, category_id: Optional[int] = None) -> dict:
    rows = await menu_item_provider.find_all(db, limit=limit, cursor=cursor, order=order, search=search, category_id=category_id)
    has_next = len(rows) > limit
    items = rows[:limit] if has_next else rows
    next_cursor = items[-1].id if has_next and items else None
    return {"data": items, "limit": limit, "nextCursor": next_cursor, "hasNextPage": has_next}

async def find_by_id(db: AsyncSession, item_id: int):
    item = await menu_item_provider.find_by_id(db, item_id)
    if not item:
        raise AppError(404, "Menu item not found")
    return item

async def create(db: AsyncSession, dto: dict):
    data = {k: v for k, v in dto.items() if v is not None and k != "image"}
    return await menu_item_provider.create(db, **data)

async def update(db: AsyncSession, item_id: int, dto: dict):
    data = {k: v for k, v in dto.items() if v is not None and k != "image"}
    item = await menu_item_provider.update(db, item_id, **data)
    if not item:
        raise AppError(404, "Menu item not found")
    return item

async def delete(db: AsyncSession, item_id: int):
    item = await menu_item_provider.soft_delete(db, item_id)
    if not item:
        raise AppError(404, "Menu item not found")
    return item

async def add_image(db: AsyncSession, menu_item_id: int, image_url: str, is_primary: bool = False) -> dict:
    return await menu_item_image_provider.create(db, menu_item_id, image_url, is_primary)

async def delete_image(db: AsyncSession, image_id: int) -> None:
    await menu_item_image_provider.delete(db, image_id)

async def set_primary_image(db: AsyncSession, menu_item_id: int, image_id: int) -> None:
    await menu_item_image_provider.set_primary(db, menu_item_id, image_id)
