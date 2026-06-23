from sqlalchemy.ext.asyncio import AsyncSession
from app.providers.user_provider import user_provider
from app.providers.role_provider import role_provider
from app.utils.app_error import AppError
from app.utils.auth_utils import hash_password
from typing import Optional

async def find_all(db: AsyncSession, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None) -> dict:
    rows = await user_provider.find_all(db, limit=limit, cursor=cursor, order=order, search=search)
    has_next = len(rows) > limit
    items = rows[:limit] if has_next else rows
    next_cursor = items[-1].id if has_next and items else None
    return {"data": items, "limit": limit, "nextCursor": next_cursor, "hasNextPage": has_next}

async def find_by_id(db: AsyncSession, user_id: int):
    user = await user_provider.find_by_id(db, user_id)
    if not user:
        raise AppError(404, "User not found")
    return user

async def find_by_phone(db: AsyncSession, phone: str):
    user = await user_provider.find_by_phone(db, phone)
    if not user:
        raise AppError(404, "User not found")
    return user

async def create(db: AsyncSession, dto: dict):
    existing = None
    if dto.get("email"):
        existing = await user_provider.find_by_email(db, dto["email"])
    if existing:
        raise AppError(409, "Email already registered")
    data = {k: v for k, v in dto.items() if v is not None}
    if data.get("password"):
        data["password"] = hash_password(data["password"])
    return await user_provider.create(db, **data)

async def update(db: AsyncSession, dto: dict, user_id: int):
    data = {k: v for k, v in dto.items() if v is not None}
    user = await user_provider.update(db, user_id, **data)
    if not user:
        raise AppError(404, "User not found")
    return user

async def delete(db: AsyncSession, user_id: int):
    user = await user_provider.soft_delete(db, user_id)
    if not user:
        raise AppError(404, "User not found")
    return user

async def update_avatar(db: AsyncSession, user_id: int, img: str):
    user = await user_provider.update_avatar(db, user_id, img)
    if not user:
        raise AppError(404, "User not found")
    return user

async def assign_role(db: AsyncSession, user_id: int, role_id: int) -> bool:
    return await role_provider.assign_role(db, user_id, role_id)

async def remove_assign_role(db: AsyncSession, user_id: int, role_id: int) -> bool:
    return await role_provider.remove_role(db, user_id, role_id)
