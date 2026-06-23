from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional, List
from app.models.notification import Notification

class NotificationProvider:
    async def find_by_user(self, db: AsyncSession, user_id: int, limit: int = 50) -> List[Notification]:
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id, Notification.deleted == False)
            .order_by(Notification.created.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, user_id: int, type: str, title: str, body: str, ref_id: Optional[int] = None) -> Notification:
        notif = Notification(user_id=user_id, type=type, title=title, body=body, ref_id=ref_id)
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        return notif

    async def mark_read(self, db: AsyncSession, notif_id: int, user_id: int) -> Optional[Notification]:
        from datetime import datetime, timezone
        await db.execute(
            update(Notification).where(Notification.id == notif_id, Notification.user_id == user_id).values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        await db.commit()
        result = await db.execute(select(Notification).where(Notification.id == notif_id))
        return result.scalar_one_or_none()

notification_provider = NotificationProvider()
