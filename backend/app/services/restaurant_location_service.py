from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from app.models.restaurant_location import RestaurantLocation
from app.utils.app_error import AppError

async def get_active(db: AsyncSession) -> RestaurantLocation:
    result = await db.execute(
        select(RestaurantLocation).where(RestaurantLocation.active == True).order_by(RestaurantLocation.id.desc()).limit(1)
    )
    location = result.scalar_one_or_none()
    if not location:
        raise AppError(404, "No active restaurant location configured")
    return location

async def upsert(db: AsyncSession, dto: dict, updated_by: int) -> RestaurantLocation:
    # Try to find existing active location
    result = await db.execute(
        select(RestaurantLocation).where(RestaurantLocation.active == True).order_by(RestaurantLocation.id.desc()).limit(1)
    )
    existing = result.scalar_one_or_none()
    update_data = {k: v for k, v in dto.items() if v is not None}
    update_data["updated_by"] = updated_by
    if existing:
        for key, val in update_data.items():
            setattr(existing, key, val)
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        location = RestaurantLocation(**{**dto, "updated_by": updated_by})
        db.add(location)
        await db.commit()
        await db.refresh(location)
        return location

async def toggle_geofence(db: AsyncSession, enabled: bool, updated_by: int) -> RestaurantLocation:
    location = await get_active(db)
    location.geofence_enabled = enabled
    location.updated_by = updated_by
    await db.commit()
    await db.refresh(location)
    return location
