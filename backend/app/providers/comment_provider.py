from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from typing import Optional, List
from app.models.menu_item_comment import MenuItemComment
from app.models.menu_item_comment_reply import MenuItemCommentReply
from app.models.user import User

class CommentProvider:
    async def find_by_menu_item(self, db: AsyncSession, menu_item_id: int) -> List[MenuItemComment]:
        result = await db.execute(
            select(MenuItemComment)
            .options(selectinload(MenuItemComment.user), selectinload(MenuItemComment.replies).selectinload(MenuItemCommentReply.user))
            .where(MenuItemComment.menu_item_id == menu_item_id, MenuItemComment.deleted == False, MenuItemComment.status == "Visible")
            .order_by(MenuItemComment.created.desc())
        )
        return list(result.scalars().all())

    async def find_all(self, db: AsyncSession, status: Optional[str] = None, menu_item_id: Optional[int] = None, limit: int = 50) -> List[MenuItemComment]:
        stmt = select(MenuItemComment).options(selectinload(MenuItemComment.user), selectinload(MenuItemComment.replies)).where(MenuItemComment.deleted == False)
        if status:
            stmt = stmt.where(MenuItemComment.status == status)
        if menu_item_id:
            stmt = stmt.where(MenuItemComment.menu_item_id == menu_item_id)
        stmt = stmt.order_by(MenuItemComment.created.desc()).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, menu_item_id: int, customer_id: int, content: str, rating: Optional[float] = None) -> MenuItemComment:
        comment = MenuItemComment(menu_item_id=menu_item_id, customer_id=customer_id, content=content, rating=rating)
        db.add(comment)
        await db.commit()
        await db.refresh(comment)
        return comment

    async def create_reply(self, db: AsyncSession, comment_id: int, staff_id: int, content: str) -> MenuItemCommentReply:
        reply = MenuItemCommentReply(comment_id=comment_id, staff_id=staff_id, content=content)
        db.add(reply)
        await db.commit()
        await db.refresh(reply)
        return reply

    async def update_status(self, db: AsyncSession, comment_id: int, status: str) -> Optional[MenuItemComment]:
        await db.execute(update(MenuItemComment).where(MenuItemComment.id == comment_id).values(status=status))
        await db.commit()
        result = await db.execute(select(MenuItemComment).where(MenuItemComment.id == comment_id))
        return result.scalar_one_or_none()

    async def find_by_id(self, db: AsyncSession, comment_id: int) -> Optional[MenuItemComment]:
        result = await db.execute(select(MenuItemComment).where(MenuItemComment.id == comment_id))
        return result.scalar_one_or_none()

comment_provider = CommentProvider()
