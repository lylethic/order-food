from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from app.models.menu_item import MenuItem
from app.models.menu_item_image import MenuItemImage
from app.models.category import Category

class MenuItemProvider:
    async def find_all(self, db: AsyncSession, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None, category_id: Optional[int] = None):
        from sqlalchemy import asc, desc
        stmt = (
            select(MenuItem)
            .options(
                selectinload(MenuItem.category),
                selectinload(MenuItem.menu_item_images),
            )
            .where(MenuItem.deleted == False)
        )
        if search:
            stmt = stmt.where(MenuItem.name.ilike(f"%{search}%") | MenuItem.description.ilike(f"%{search}%"))
        if category_id:
            stmt = stmt.where(MenuItem.category_id == category_id)
        if cursor:
            if order == "desc":
                stmt = stmt.where(MenuItem.id < cursor)
            else:
                stmt = stmt.where(MenuItem.id > cursor)
        stmt = stmt.order_by(desc(MenuItem.id) if order == "desc" else asc(MenuItem.id))
        stmt = stmt.limit(limit + 1)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def find_by_ids(self, db: AsyncSession, ids: List[int]) -> List[MenuItem]:
        result = await db.execute(
            select(MenuItem).where(MenuItem.id.in_(ids), MenuItem.deleted == False, MenuItem.active == True)
        )
        return list(result.scalars().all())

    async def find_by_id(self, db: AsyncSession, item_id: int) -> Optional[MenuItem]:
        result = await db.execute(
            select(MenuItem)
            .options(selectinload(MenuItem.category), selectinload(MenuItem.menu_item_images))
            .where(MenuItem.id == item_id, MenuItem.deleted == False, MenuItem.active == True)
        )
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, **data) -> MenuItem:
        item = MenuItem(**data)
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item

    async def update(self, db: AsyncSession, item_id: int, **data) -> Optional[MenuItem]:
        await db.execute(update(MenuItem).where(MenuItem.id == item_id).values(**data))
        await db.commit()
        return await self.find_by_id(db, item_id)

    async def soft_delete(self, db: AsyncSession, item_id: int) -> Optional[MenuItem]:
        await db.execute(update(MenuItem).where(MenuItem.id == item_id).values(deleted=True))
        await db.commit()
        result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
        return result.scalar_one_or_none()

    async def update_average_rating(self, db: AsyncSession, menu_item_id: int) -> None:
        from app.models.menu_item_comment import MenuItemComment
        result = await db.execute(
            select(func.avg(MenuItemComment.rating)).where(
                MenuItemComment.menu_item_id == menu_item_id,
                MenuItemComment.deleted == False,
                MenuItemComment.rating.isnot(None),
            )
        )
        avg_rating = result.scalar_one_or_none()
        await db.execute(
            update(MenuItem).where(MenuItem.id == menu_item_id).values(rating=avg_rating)
        )
        await db.commit()

menu_item_provider = MenuItemProvider()
