from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from typing import Optional
from app.models.user import User
from app.models.user_role import UserRole
from app.models.role import Role

class UserProvider:
    async def find_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(UserRole.role))
            .where(User.email == email, User.deleted == False)
        )
        return result.scalar_one_or_none()

    async def find_by_phone(self, db: AsyncSession, phone: str) -> Optional[User]:
        result = await db.execute(
            select(User).where(User.phone == phone, User.deleted == False)
        )
        return result.scalar_one_or_none()

    async def find_by_id(self, db: AsyncSession, user_id: int) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(UserRole.role))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, **data) -> User:
        user = User(**data)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def create_guest(self, db: AsyncSession, **data) -> User:
        user = User(**data)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def find_all(self, db: AsyncSession, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None):
        from sqlalchemy import asc, desc
        stmt = select(User).options(selectinload(User.roles).selectinload(UserRole.role)).where(User.deleted == False)
        if search:
            stmt = stmt.where(User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
        if cursor:
            if order == "desc":
                stmt = stmt.where(User.id < cursor)
            else:
                stmt = stmt.where(User.id > cursor)
        stmt = stmt.order_by(desc(User.id) if order == "desc" else asc(User.id))
        stmt = stmt.limit(limit + 1)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def update(self, db: AsyncSession, user_id: int, **data) -> Optional[User]:
        await db.execute(update(User).where(User.id == user_id).values(**data))
        await db.commit()
        return await self.find_by_id(db, user_id)

    async def update_avatar(self, db: AsyncSession, user_id: int, img: str) -> Optional[User]:
        await db.execute(update(User).where(User.id == user_id).values(img=img))
        await db.commit()
        return await self.find_by_id(db, user_id)

    async def soft_delete(self, db: AsyncSession, user_id: int) -> Optional[User]:
        await db.execute(update(User).where(User.id == user_id).values(deleted=True))
        await db.commit()
        return await self.find_by_id(db, user_id)

user_provider = UserProvider()
