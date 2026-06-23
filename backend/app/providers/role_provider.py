from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from typing import Optional
from app.models.role import Role
from app.models.user_role import UserRole

class RoleProvider:
    async def find_by_name(self, db: AsyncSession, name: str) -> Optional[Role]:
        result = await db.execute(
            select(Role).where(Role.name == name, Role.deleted == False)
        )
        return result.scalar_one_or_none()

    async def find_by_id(self, db: AsyncSession, role_id: int) -> Optional[Role]:
        result = await db.execute(
            select(Role).where(Role.id == role_id, Role.deleted == False)
        )
        return result.scalar_one_or_none()

    async def find_all(self, db: AsyncSession, limit: int = 10, cursor: Optional[int] = None, order: str = "desc", search: Optional[str] = None):
        from sqlalchemy import asc, desc
        stmt = select(Role).where(Role.deleted == False)
        if search:
            stmt = stmt.where(Role.name.ilike(f"%{search}%"))
        if cursor:
            if order == "desc":
                stmt = stmt.where(Role.id < cursor)
            else:
                stmt = stmt.where(Role.id > cursor)
        stmt = stmt.order_by(desc(Role.id) if order == "desc" else asc(Role.id))
        stmt = stmt.limit(limit + 1)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create(self, db: AsyncSession, **data) -> Role:
        role = Role(**data)
        db.add(role)
        await db.commit()
        await db.refresh(role)
        return role

    async def update(self, db: AsyncSession, role_id: int, **data) -> Optional[Role]:
        await db.execute(update(Role).where(Role.id == role_id).values(**data))
        await db.commit()
        return await self.find_by_id(db, role_id)

    async def soft_delete(self, db: AsyncSession, role_id: int) -> Optional[Role]:
        await db.execute(update(Role).where(Role.id == role_id).values(deleted=True))
        await db.commit()
        result = await db.execute(select(Role).where(Role.id == role_id))
        return result.scalar_one_or_none()

    async def assign_role(self, db: AsyncSession, user_id: int, role_id: int) -> bool:
        # Check if already assigned
        result = await db.execute(
            select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id)
        )
        existing = result.scalar_one_or_none()
        if existing:
            await db.execute(
                update(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id).values(deleted=False, active=True)
            )
        else:
            db.add(UserRole(user_id=user_id, role_id=role_id))
        await db.commit()
        return True

    async def remove_role(self, db: AsyncSession, user_id: int, role_id: int) -> bool:
        await db.execute(
            update(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id).values(deleted=True, active=False)
        )
        await db.commit()
        return True

role_provider = RoleProvider()
