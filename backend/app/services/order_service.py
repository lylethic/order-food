import random
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.providers.order_provider import order_provider
from app.providers.menu_item_provider import menu_item_provider
from app.services import cart_service
from app.utils.app_error import AppError
from app.events.order_events import order_event_bus
from typing import Optional

STAFF_ROLES = {"admin", "employee", "chef"}

def is_staff_role(role):
    roles = role if isinstance(role, list) else [role]
    return any(r.lower() in STAFF_ROLES for r in roles)

def format_order_summary(order) -> dict:
    items = order.items or []
    total = order.total if order.total is not None else round(sum(float(i.price_at_order) * i.qty for i in items))
    timestamp = order.created.strftime("%I:%M %p") if order.created else ""
    return {
        "id": str(order.id),
        "ticketNumber": order.ticket_number,
        "table": order.table_number,
        "status": order.status,
        "isPaid": bool(order.is_paid),
        "paymentMethod": order.payment_method,
        "paidAt": order.paid_at.isoformat() if order.paid_at else None,
        "timestamp": timestamp,
        "itemCount": sum(i.qty for i in items),
        "total": total,
    }

def format_order(order) -> dict:
    items = order.items or []
    total = order.total if order.total is not None else round(sum(float(i.price_at_order) * i.qty for i in items))
    timestamp = order.created.strftime("%I:%M %p") if order.created else ""
    return {
        "id": str(order.id),
        "ticketNumber": order.ticket_number,
        "table": order.table_number,
        "status": order.status,
        "total": total,
        "isPaid": bool(order.is_paid),
        "paymentMethod": order.payment_method,
        "paidAt": order.paid_at.isoformat() if order.paid_at else None,
        "timestamp": timestamp,
        "createdAt": order.created.isoformat() if order.created else None,
        "waitLevel": order.wait_level,
        "waitTimeMinutes": order.wait_time_minutes,
        "items": [
            {
                "id": str(i.id),
                "menuItemId": str(i.menu_item_id),
                "name": i.name_at_order,
                "image": next((img.image_url for img in (i.menu_item.menu_item_images if i.menu_item else []) if img.is_primary), None),
                "qty": i.qty,
                "price": float(i.price_at_order),
                "modifications": i.modifications or [],
            }
            for i in items
        ],
    }

async def get_all(db: AsyncSession, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None) -> dict:
    rows = await order_provider.find_all(db, limit=limit, cursor=cursor, order=order, search=search)
    has_next = len(rows) > limit
    items = rows[:limit] if has_next else rows
    next_cursor = items[-1].id if has_next and items else None
    return {"data": [format_order(o) for o in items], "limit": limit, "nextCursor": next_cursor, "hasNextPage": has_next}

async def get_by_customer(db: AsyncSession, customer_id: int, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None) -> dict:
    rows = await order_provider.find_by_customer_id(db, customer_id, limit=limit, cursor=cursor, order=order, search=search)
    has_next = len(rows) > limit
    items = rows[:limit] if has_next else rows
    next_cursor = items[-1].id if has_next and items else None
    return {"data": [format_order_summary(o) for o in items], "limit": limit, "nextCursor": next_cursor, "hasNextPage": has_next}

async def get_detail(db: AsyncSession, order_id: str, requester_id: str, requester_role) -> dict:
    order = await order_provider.find_by_id(db, int(order_id))
    if not order:
        raise AppError(404, "Order not found")
    if not is_staff_role(requester_role) and (order.customer_id is None or str(order.customer_id) != requester_id):
        raise AppError(403, "You can only view your own orders")
    return format_order(order)

async def create(db: AsyncSession, dto: dict, customer_id: Optional[str] = None, session_id: Optional[str] = None) -> dict:
    menu_item_ids = [int(i["menuItemId"]) for i in dto["items"]]
    menu_items = await menu_item_provider.find_by_ids(db, menu_item_ids)
    if not menu_items:
        raise AppError(422, "None of the requested menu items were found")
    item_map = {m.id: m for m in menu_items}
    ticket_number = f"RBK-{random.randint(10000, 99999)}"
    resolved_items = [
        {
            "menuItemId": int(item["menuItemId"]),
            "nameAtOrder": item_map.get(int(item["menuItemId"]), None) and item_map[int(item["menuItemId"])].name or "Unknown Item",
            "qty": item["qty"],
            "priceAtOrder": float(item_map[int(item["menuItemId"])].price) if int(item["menuItemId"]) in item_map else 0,
            "modifications": item.get("modifications", []),
        }
        for item in dto["items"]
    ]
    total = round(sum(i["priceAtOrder"] * i["qty"] for i in resolved_items))
    cid = int(customer_id) if customer_id else None
    order = await order_provider.create(db, dto["tableNumber"], ticket_number, cid, total, resolved_items)
    try:
        await cart_service.clear_cart(db, user_id=cid, session_id=session_id)
    except Exception:
        pass
    return {"id": str(order.id), "ticketNumber": order.ticket_number, "table": order.table_number, "status": order.status, "total": order.total or total}

async def update_status(db: AsyncSession, order_id: str, status: str) -> dict:
    order = await order_provider.update_status(db, int(order_id), status)
    if not order:
        raise AppError(404, "Order not found")
    result = {"id": str(order.id), "status": order.status}
    import asyncio
    asyncio.create_task(order_event_bus.publish({"eventType": "status", "orderId": str(order.id), "status": order.status}))
    return result

async def cancel_by_customer(db: AsyncSession, order_id: str, customer_id: str) -> dict:
    order = await order_provider.find_by_id(db, int(order_id))
    if not order:
        raise AppError(404, "Order not found")
    if order.customer_id is None or str(order.customer_id) != customer_id:
        raise AppError(403, "You can only cancel your own order")
    if order.status != "Received":
        raise AppError(409, "Order can only be cancelled before processing")
    updated = await order_provider.update_status(db, int(order_id), "Cancelled")
    result = {"id": str(updated.id), "status": updated.status}
    import asyncio
    asyncio.create_task(order_event_bus.publish({"eventType": "status", "orderId": str(updated.id), "status": updated.status}))
    return result

async def mark_paid(db: AsyncSession, order_id: str, payment_method: str) -> dict:
    order = await order_provider.find_by_id(db, int(order_id))
    if not order:
        raise AppError(404, "Order not found")
    if order.status != "Delivered":
        raise AppError(409, "Order can only be paid after it is delivered")
    if order.is_paid:
        raise AppError(409, "Order is already paid")
    paid_at = datetime.now(timezone.utc)
    updated = await order_provider.mark_as_paid(db, int(order_id), payment_method, paid_at)
    if not updated:
        raise AppError(404, "Order not found")
    result = {"id": str(updated.id), "isPaid": bool(updated.is_paid), "paymentMethod": updated.payment_method, "paidAt": (updated.paid_at or paid_at).isoformat()}
    import asyncio
    asyncio.create_task(order_event_bus.publish({"eventType": "payment", "orderId": str(updated.id), "status": updated.status, "isPaid": True, "paymentMethod": payment_method, "paidAt": result["paidAt"]}))
    return result
