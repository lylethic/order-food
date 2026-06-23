from sqlalchemy.ext.asyncio import AsyncSession
from app.providers.vatConfiguration_provider import vat_configuration_provider
from app.schemas.vat_configuration import VatConfigurationCreate, VatConfigurationUpdate
from app.utils.app_error import AppError
from typing import Optional


async def get_all(
    db: AsyncSession,
    limit: int = 10,
    cursor: Optional[int] = None,
    order: str = "desc",
    search: Optional[str] = None,
) -> dict:
    rows = await vat_configuration_provider.find_all(
        db, limit=limit, cursor=cursor, order=order, search=search
    )
    has_next = len(rows) > limit
    items = rows[:limit] if has_next else rows
    next_cursor = items[-1].id if has_next and items else None
    return {
        "data": items,
        "limit": limit,
        "nextCursor": next_cursor,
        "hasNextPage": has_next,
    }


async def find_by_id(db: AsyncSession, id: int):
    cat = await vat_configuration_provider.find_by_id(db, id)
    if not cat:
        raise AppError(404, "Data not found")
    return cat


async def create(db: AsyncSession, item: VatConfigurationCreate):
    return await vat_configuration_provider.create(db, item)


async def update(db: AsyncSession, item: VatConfigurationUpdate, id: int):
    cat = await vat_configuration_provider.update(db, id, item)
    if not cat:
        raise AppError(404, "Data not found")
    return cat


async def delete(db: AsyncSession, id: int):
    cat = await vat_configuration_provider.soft_delete(db, id)
    if not cat:
        raise AppError(404, "Data not found")
    return cat
