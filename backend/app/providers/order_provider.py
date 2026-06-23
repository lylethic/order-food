from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, text
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.menu_item import MenuItem
from app.models.menu_item_image import MenuItemImage

class OrderProvider:
    async def find_by_id(self, db: AsyncSession, order_id: int) -> Optional[Order]:
        result = await db.execute(
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.menu_item).selectinload(MenuItem.menu_item_images)
            )
            .where(Order.id == order_id, Order.deleted == False)
        )
        return result.scalar_one_or_none()

    async def find_all(self, db: AsyncSession, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None):
        from sqlalchemy import asc, desc
        stmt = (
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.menu_item).selectinload(MenuItem.menu_item_images))
            .where(Order.deleted == False)
        )
        if search:
            stmt = stmt.where(Order.status.ilike(f"%{search}%") | Order.ticket_number.ilike(f"%{search}%"))
        if cursor:
            if order == "desc":
                stmt = stmt.where(Order.id < cursor)
            else:
                stmt = stmt.where(Order.id > cursor)
        stmt = stmt.order_by(desc(Order.id) if order == "desc" else asc(Order.id))
        stmt = stmt.limit(limit + 1)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def find_by_customer_id(self, db: AsyncSession, customer_id: int, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None):
        from sqlalchemy import asc, desc
        stmt = (
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.menu_item).selectinload(MenuItem.menu_item_images))
            .where(Order.deleted == False, Order.customer_id == customer_id)
        )
        if search:
            stmt = stmt.where(Order.status.ilike(f"%{search}%"))
        if cursor:
            if order == "desc":
                stmt = stmt.where(Order.id < cursor)
            else:
                stmt = stmt.where(Order.id > cursor)
        stmt = stmt.order_by(desc(Order.id) if order == "desc" else asc(Order.id))
        stmt = stmt.limit(limit + 1)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create(self, db: AsyncSession, table_number: str, ticket_number: str, customer_id: Optional[int], total: int, items_data: list) -> Order:
        order = Order(
            ticket_number=ticket_number,
            table_number=table_number,
            status="Received",
            total=total,
            customer_id=customer_id,
        )
        db.add(order)
        await db.flush()  # get order.id
        for item in items_data:
            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=item["menuItemId"],
                name_at_order=item["nameAtOrder"],
                qty=item["qty"],
                price_at_order=item["priceAtOrder"],
                modifications=item.get("modifications", []),
            )
            db.add(order_item)
        await db.commit()
        await db.refresh(order)
        return order

    async def update_status(self, db: AsyncSession, order_id: int, status: str) -> Optional[Order]:
        await db.execute(update(Order).where(Order.id == order_id).values(status=status))
        await db.commit()
        return await self.find_by_id(db, order_id)

    async def mark_as_paid(self, db: AsyncSession, order_id: int, payment_method: str, paid_at: datetime) -> Optional[Order]:
        await db.execute(
            update(Order).where(Order.id == order_id).values(
                is_paid=True,
                payment_method=payment_method,
                paid_at=paid_at,
            )
        )
        await db.commit()
        return await self.find_by_id(db, order_id)

order_provider = OrderProvider()
