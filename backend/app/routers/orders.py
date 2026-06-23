import asyncio
import json
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth import authenticate, optional_authenticate, UserContext
from app.middleware.rbac import is_staff, is_employee
from app.schemas.common import BaseSearchRequest, ApiResponse
from typing import Optional, Any
from app.schemas.order import CreateOrderRequest, UpdateStatusRequest, MarkOrderPaidRequest
from app.services import order_service
from app.services.restaurant_location_service import get_active
from app.utils.response import send_response
from app.utils.geo import get_distance_in_meters
from app.events.order_events import order_event_bus
from typing import Optional

STAFF_ROLES = {"admin", "employee", "chef"}

router = APIRouter()

def _is_staff(user: Optional[UserContext]) -> bool:
    if not user:
        return False
    return any(r.lower() in STAFF_ROLES for r in user.role)

@router.get("/orders", response_model=ApiResponse[Any])
async def get_orders(query: BaseSearchRequest = Depends(), current_user: UserContext = Depends(is_staff), db: AsyncSession = Depends(get_db)):
    data = await order_service.get_all(db, limit=query.limit, cursor=query.cursor, order=query.order, search=query.search)
    return send_response(data=data, message="Lấy danh sách đơn hàng thành công", message_en="Orders retrieved successfully")

@router.post("/orders", response_model=ApiResponse[Any])
async def create_order(body: CreateOrderRequest, request: Request, db: AsyncSession = Depends(get_db), current_user: Optional[UserContext] = Depends(optional_authenticate)):
    is_staff_user = _is_staff(current_user)
    # Geofence validation
    try:
        location = await get_active(db)
        if location.geofence_enabled and not is_staff_user:
            if body.latitude is None or body.longitude is None:
                from fastapi.responses import JSONResponse
                return JSONResponse(status_code=400, content={"success": False, "statusCode": 400, "message": "Vị trí GPS là bắt buộc để đặt hàng", "message_en": "GPS location is required to place an order", "data": None})
            distance = get_distance_in_meters(body.latitude, body.longitude, location.latitude, location.longitude)
            if distance > location.radius_meters:
                from fastapi.responses import JSONResponse
                return JSONResponse(status_code=403, content={"success": False, "statusCode": 403, "message": f"Bạn đang ở cách nhà hàng {round(distance)}m.", "message_en": f"Order rejected. You are {round(distance)}m from the restaurant.", "data": None})
    except Exception as e:
        if "404" not in str(e):
            raise
    # Resolve customer id
    customer_id = None
    if is_staff_user and body.customerId:
        customer_id = body.customerId
    elif not is_staff_user and current_user:
        customer_id = current_user.user_id
    session_id = request.headers.get("x-session-id")
    data = await order_service.create(db, body.model_dump(), customer_id, session_id)
    return send_response(data=data, message="Tạo đơn hàng thành công", message_en="Order created successfully")

@router.get("/orders/events")
async def order_events(current_user: UserContext = Depends(authenticate)):
    queue = order_event_bus.subscribe()
    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            order_event_bus.unsubscribe(queue)
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "Connection": "keep-alive"})

@router.get("/orders/my", response_model=ApiResponse[Any])
async def my_orders(query: BaseSearchRequest = Depends(), current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    data = await order_service.get_by_customer(db, int(current_user.user_id), limit=query.limit, cursor=query.cursor, order=query.order, search=query.search)
    return send_response(data=data, message="Lấy danh sách đơn hàng của bạn thành công", message_en="Your orders retrieved successfully")

@router.get("/orders/{id}", response_model=ApiResponse[Any])
async def get_order(id: str, current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    data = await order_service.get_detail(db, id, current_user.user_id, current_user.role)
    return send_response(data=data, message="Lấy chi tiết đơn hàng thành công", message_en="Order detail retrieved successfully")

@router.put("/orders/{id}/status", response_model=ApiResponse[Any])
async def update_order_status(id: str, body: UpdateStatusRequest, current_user: UserContext = Depends(is_staff), db: AsyncSession = Depends(get_db)):
    data = await order_service.update_status(db, id, body.status)
    return send_response(data=data, message="Cập nhật trạng thái đơn hàng thành công", message_en="Order status updated successfully")

@router.put("/orders/{id}/cancel", response_model=ApiResponse[Any])
async def cancel_order(id: str, current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    data = await order_service.cancel_by_customer(db, id, current_user.user_id)
    return send_response(data=data, message="Hủy đơn hàng thành công", message_en="Order cancelled successfully")

@router.put("/orders/{id}/payment", response_model=ApiResponse[Any])
async def mark_order_paid(id: str, body: MarkOrderPaidRequest, current_user: UserContext = Depends(is_employee), db: AsyncSession = Depends(get_db)):
    data = await order_service.mark_paid(db, id, body.paymentMethod)
    return send_response(data=data, message="Thanh toán đơn hàng thành công", message_en="Order paid successfully")
