from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth import authenticate, UserContext
from app.middleware.rbac import is_admin, is_customer, is_staff
from app.schemas.comment import CreateCommentRequest, ReplyCommentRequest, CommentStatusUpdate
from app.services import comment_service
from app.utils.response import send_response
from app.schemas.common import ApiResponse
from typing import Optional, Any

router = APIRouter()

@router.get("/menu-items/{menuItemId}/comments", response_model=ApiResponse[Any])
async def get_comments(menuItemId: str, db: AsyncSession = Depends(get_db)):
    data = await comment_service.get_by_menu_item(db, menuItemId)
    return send_response(data=data, message="Lấy danh sách đánh giá thành công", message_en="Comments retrieved successfully")

@router.post("/menu-items/{menuItemId}/comments", response_model=ApiResponse[Any])
async def create_comment(menuItemId: str, body: CreateCommentRequest, current_user: UserContext = Depends(is_customer), db: AsyncSession = Depends(get_db)):
    data = await comment_service.create_comment(db, menuItemId, current_user.user_id, body.model_dump())
    return send_response(data=data, message="Đánh giá món ăn thành công", message_en="Comment created successfully")

@router.post("/comments/{commentId}/reply", response_model=ApiResponse[Any])
async def reply_to_comment(commentId: str, body: ReplyCommentRequest, current_user: UserContext = Depends(is_staff), db: AsyncSession = Depends(get_db)):
    data = await comment_service.reply_to_comment(db, commentId, current_user.user_id, body.model_dump())
    return send_response(data=data, message="Phản hồi đánh giá thành công", message_en="Reply created successfully")

@router.get("/comments", response_model=ApiResponse[Any])
async def get_all_comments(status: Optional[str] = None, menuItemId: Optional[str] = None, limit: int = 50, current_user: UserContext = Depends(is_staff), db: AsyncSession = Depends(get_db)):
    data = await comment_service.get_all(db, status=status, menu_item_id=menuItemId, limit=limit)
    return send_response(data=data, message="Lấy danh sách đánh giá thành công", message_en="Comments retrieved successfully")

@router.patch("/comments/{id}/status", response_model=ApiResponse[Any])
async def update_comment_status(id: str, body: CommentStatusUpdate, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    data = await comment_service.update_status(db, id, body.status)
    return send_response(data=data, message="Cập nhật trạng thái đánh giá thành công", message_en="Comment status updated")

@router.get("/notifications", response_model=ApiResponse[Any])
async def get_notifications(current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    data = await comment_service.get_notifications(db, current_user.user_id)
    return send_response(data=data, message="Lấy thông báo thành công", message_en="Notifications retrieved successfully")

@router.patch("/notifications/{id}/read", response_model=ApiResponse[Any])
async def mark_notification_read(id: str, current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    data = await comment_service.mark_notification_read(db, id, current_user.user_id)
    return send_response(data=data, message="Đánh dấu đã đọc thành công", message_en="Notification marked as read")
