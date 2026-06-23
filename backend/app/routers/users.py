from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth import authenticate, UserContext
from app.middleware.rbac import is_admin
from app.schemas.common import BaseSearchRequest, ApiResponse, PaginatedResponse
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.services import user_service, static_file_service
from app.utils.response import send_response
from app.utils.app_error import AppError

router = APIRouter()

@router.get("/users", response_model=ApiResponse[PaginatedResponse[UserOut]])
async def get_users(query: BaseSearchRequest = Depends(), current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    data = await user_service.find_all(db, limit=query.limit, cursor=query.cursor, order=query.order, search=query.search)
    return send_response(data=data, message="Lấy danh sách người dùng thành công", message_en="Users retrieved successfully")

@router.post("/users", response_model=ApiResponse[UserOut])
async def create_user(body: UserCreate, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    data = await user_service.create(db, body.model_dump())
    return send_response(data=data, message="Tạo người dùng thành công", message_en="User created successfully")

@router.get("/users/getPhone/{phone}", response_model=ApiResponse[UserOut])
async def get_user_by_phone(phone: str, current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    data = await user_service.find_by_phone(db, phone)
    return send_response(data=data, message="Lấy thông tin người dùng thành công", message_en="User retrieved successfully")

@router.get("/users/{id}", response_model=ApiResponse[UserOut])
async def get_user(id: int, current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    if id <= 0:
        raise AppError(400, "Invalid user id")
    data = await user_service.find_by_id(db, id)
    return send_response(data=data, message="Lấy thông tin người dùng thành công", message_en="User retrieved successfully")

@router.put("/users/{id}", response_model=ApiResponse[UserOut])
async def update_user(id: int, body: UserUpdate, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    if id <= 0:
        raise AppError(400, "Invalid user id")
    data = await user_service.update(db, body.model_dump(), id)
    return send_response(data=data, message="Cập nhật người dùng thành công", message_en="User updated successfully")

@router.delete("/users/{id}", response_model=ApiResponse[UserOut])
async def delete_user(id: int, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    if id <= 0:
        raise AppError(400, "Invalid user id")
    data = await user_service.delete(db, id)
    return send_response(data=data, message="Xóa người dùng thành công", message_en="User deleted successfully")

@router.put("/users/{id}/avatar", response_model=ApiResponse[UserOut])
async def update_avatar(id: int, file: UploadFile = File(...), current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    if id <= 0:
        raise AppError(400, "Invalid user id")
    is_admin_role = "admin" in [r.lower() for r in current_user.role]
    is_self = current_user.user_id == str(id)
    if not is_admin_role and not is_self:
        raise AppError(403, "Không thể cập nhật avatar của người dùng khác")
    existing = await user_service.find_by_id(db, id)
    if existing.img:
        static_file_service.delete_file(existing.img)
    url = await static_file_service.save_upload(file, allowed_types={"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/bmp"})
    data = await user_service.update_avatar(db, id, url)
    return send_response(data=data, message="Cập nhật avatar thành công", message_en="Avatar updated successfully")
