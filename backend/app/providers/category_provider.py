from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from app.models.category import Category

class CategoryProvider:
    async def find_all(self, db: AsyncSession, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None):
        from sqlalchemy import asc, desc
        stmt = select(Category).where(Category.deleted == False)
        if search:
            stmt = stmt.where(Category.name.ilike(f"%{search}%"))
        if cursor:
            if order == "desc":
                stmt = stmt.where(Category.id < cursor)
            else:
                stmt = stmt.where(Category.id > cursor)
        stmt = stmt.order_by(desc(Category.id) if order == "desc" else asc(Category.id))
        stmt = stmt.limit(limit + 1)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def find_by_id(self, db: AsyncSession, category_id: int) -> Optional[Category]:
        result = await db.execute(
            select(Category).where(Category.id == category_id, Category.deleted == False)
        )
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, name: str) -> Category:
        cat = Category(name=name)
        db.add(cat)
        await db.commit()
        await db.refresh(cat)
        return cat

    async def update(self, db: AsyncSession, category_id: int, **data) -> Optional[Category]:
        await db.execute(update(Category).where(Category.id == category_id).values(**data))
        await db.commit()
        return await self.find_by_id(db, category_id)

    async def soft_delete(self, db: AsyncSession, category_id: int) -> Optional[Category]:
        await db.execute(update(Category).where(Category.id == category_id).values(deleted=True))
        await db.commit()
        result = await db.execute(select(Category).where(Category.id == category_id))
        return result.scalar_one_or_none()

category_provider = CategoryProvider()
