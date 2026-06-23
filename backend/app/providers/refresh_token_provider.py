from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import Optional
from app.models.refresh_token import RefreshToken

class RefreshTokenProvider:
    async def create(self, db: AsyncSession, **data) -> RefreshToken:
        token = RefreshToken(**data)
        db.add(token)
        await db.commit()
        await db.refresh(token)
        return token

    async def find_by_token(self, db: AsyncSession, hashed: str) -> Optional[RefreshToken]:
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token == hashed)
        )
        return result.scalar_one_or_none()

    async def count_active_sessions(self, db: AsyncSession, user_id: int) -> int:
        from sqlalchemy import func, select as sa_select
        result = await db.execute(
            sa_select(func.count()).select_from(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        return result.scalar_one()

    async def find_oldest_active_session(self, db: AsyncSession, user_id: int) -> Optional[RefreshToken]:
        result = await db.execute(
            select(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
            .order_by(RefreshToken.created.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def revoke_by_id(self, db: AsyncSession, token_id: int, reason: str = "logout") -> None:
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.id == token_id)
            .values(revoked=True, revoked_at=datetime.now(timezone.utc), revoked_reason=reason)
        )
        await db.commit()

    async def revoke_family(self, db: AsyncSession, family: str) -> None:
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.token_family == family, RefreshToken.revoked == False)
            .values(revoked=True, revoked_at=datetime.now(timezone.utc), revoked_reason="reuse_detected")
        )
        await db.commit()

    async def revoke_all_for_user(self, db: AsyncSession, user_id: int) -> None:
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
            .values(revoked=True, revoked_at=datetime.now(timezone.utc), revoked_reason="logout_all")
        )
        await db.commit()

refresh_token_provider = RefreshTokenProvider()
