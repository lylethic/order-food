from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from app.models.vat_configurations import VatConfiguration
from app.schemas.vat_configuration import VatConfigurationCreate, VatConfigurationUpdate


class VatConfigurationProvider:
    async def find_all(
        self,
        db: AsyncSession,
        limit: int = 10,
        cursor: Optional[int] = None,
        order: str = "desc",
        search: Optional[str] = None,
    ):
        from sqlalchemy import asc, desc

        stmt = select(VatConfiguration).where(VatConfiguration.deleted == False)
        if search:
            stmt = stmt.where(VatConfiguration.name.ilike(f"{search}%"))
        if cursor:
            if order == "desc":
                stmt = stmt.where(VatConfiguration.id < cursor)
            else:
                stmt = stmt.where(VatConfiguration.id > cursor)
        stmt = stmt.order_by(
            desc(VatConfiguration.id) if order == "desc" else asc(VatConfiguration.id)
        )
        stmt = stmt.limit(limit + 1)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def find_by_id(self, db: AsyncSession, id: int) -> Optional[VatConfiguration]:
        result = await db.execute(
            select(VatConfiguration).where(
                VatConfiguration.id, VatConfiguration.deleted == False
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self, db: AsyncSession, item: VatConfigurationCreate
    ) -> VatConfiguration:
        result = VatConfiguration(**item.model_dump())
        db.add(result)
        await db.commit()
        await db.refresh(result)
        return result

    async def update(
        self, db: AsyncSession, id: int, item: VatConfigurationUpdate
    ) -> Optional[VatConfiguration]:
        await db.execute(
            update(VatConfiguration)
            .where(VatConfiguration.id == id)
            .values(**item.model_dump(exclude_unset=True))
        )
        await db.commit()
        return await self.find_by_id(db, id)

    async def soft_delete(
        self, db: AsyncSession, id: int
    ) -> Optional[VatConfiguration]:
        await db.execute(
            update(VatConfiguration)
            .where(VatConfiguration.id == id)
            .values(deleted=True)
        )
        await db.commit()
        result = await db.execute(
            select(VatConfiguration).where(VatConfiguration.id == id)
        )
        return result.scalar_one_or_none()


vat_configuration_provider = VatConfigurationProvider()
