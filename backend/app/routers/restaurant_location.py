from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth import authenticate, UserContext
from app.middleware.rbac import is_admin
from app.schemas.restaurant_location import UpsertRestaurantLocation, ToggleGeofence
from app.services import restaurant_location_service
from app.utils.response import send_response
from app.schemas.common import ApiResponse
from typing import Any

router = APIRouter()

def _format_location(loc) -> dict:
    return {
        "id": str(loc.id),
        "name": loc.name,
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "radius_meters": loc.radius_meters,
        "geofence_enabled": loc.geofence_enabled,
    }

@router.get("/restaurant/location", response_model=ApiResponse[Any])
async def get_location(db: AsyncSession = Depends(get_db)):
    data = await restaurant_location_service.get_active(db)
    return send_response(data=_format_location(data), message="Lấy vị trí nhà hàng thành công", message_en="Restaurant location retrieved successfully")

@router.put("/restaurant/location", response_model=ApiResponse[Any])
async def update_location(body: UpsertRestaurantLocation, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    data = await restaurant_location_service.upsert(db, body.model_dump(exclude_none=True), int(current_user.user_id))
    return send_response(data=_format_location(data), message="Cập nhật vị trí nhà hàng thành công", message_en="Restaurant location updated successfully")

@router.patch("/restaurant/location/geofence", response_model=ApiResponse[Any])
async def toggle_geofence(body: ToggleGeofence, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    data = await restaurant_location_service.toggle_geofence(db, body.enabled, int(current_user.user_id))
    msg = "Đã bật kiểm tra vị trí GPS" if body.enabled else "Đã tắt kiểm tra vị trí GPS"
    msg_en = "Geofence check enabled" if body.enabled else "Geofence check disabled"
    return send_response(data=_format_location(data), message=msg, message_en=msg_en)
