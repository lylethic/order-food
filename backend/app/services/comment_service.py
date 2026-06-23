from sqlalchemy.ext.asyncio import AsyncSession
from app.providers.comment_provider import comment_provider
from app.providers.notification_provider import notification_provider
from app.providers.menu_item_provider import menu_item_provider
from app.utils.app_error import AppError
from typing import Optional

async def get_by_menu_item(db: AsyncSession, menu_item_id: str):
    return await comment_provider.find_by_menu_item(db, int(menu_item_id))

async def get_all(db: AsyncSession, status: Optional[str] = None, menu_item_id: Optional[str] = None, limit: int = 50):
    mid = int(menu_item_id) if menu_item_id else None
    return await comment_provider.find_all(db, status=status, menu_item_id=mid, limit=limit)

async def create_comment(db: AsyncSession, menu_item_id: str, user_id: str, dto: dict):
    comment = await comment_provider.create(db, int(menu_item_id), int(user_id), dto["content"], dto.get("rating"))
    if dto.get("rating") is not None:
        await menu_item_provider.update_average_rating(db, int(menu_item_id))
    return comment

async def reply_to_comment(db: AsyncSession, comment_id: str, staff_id: str, dto: dict):
    comment = await comment_provider.find_by_id(db, int(comment_id))
    if not comment:
        raise AppError(404, "Comment not found")
    reply = await comment_provider.create_reply(db, int(comment_id), int(staff_id), dto["content"])
    # Create notification for the comment author
    try:
        await notification_provider.create(db, comment.customer_id, "comment_reply", "Phản hồi mới", "Đánh giá của bạn có phản hồi mới", ref_id=comment.id)
    except Exception:
        pass
    return reply

async def update_status(db: AsyncSession, comment_id: str, status: str):
    comment = await comment_provider.update_status(db, int(comment_id), status)
    if not comment:
        raise AppError(404, "Comment not found")
    return comment

async def get_notifications(db: AsyncSession, user_id: str):
    return await notification_provider.find_by_user(db, int(user_id))

async def mark_notification_read(db: AsyncSession, notif_id: str, user_id: str):
    return await notification_provider.mark_read(db, int(notif_id), int(user_id))
