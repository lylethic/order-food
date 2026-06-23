from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth import authenticate, UserContext
from app.middleware.rbac import is_chef
from app.schemas.common import BaseSearchRequest, ApiResponse, PaginatedResponse
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from app.services import category_service, static_file_service
from app.utils.response import send_response

router = APIRouter()

@router.get("/categories", response_model=ApiResponse[PaginatedResponse[CategoryOut]])
async def get_categories(query: BaseSearchRequest = Depends(), db: AsyncSession = Depends(get_db)):
    data = await category_service.get_all(db, limit=query.limit, cursor=query.cursor, order=query.order, search=query.search)
    return send_response(data=data, message="Lấy danh sách danh mục thành công", message_en="Categories retrieved successfully")

@router.get("/categories/{id}", response_model=ApiResponse[CategoryOut])
async def get_category(id: int, db: AsyncSession = Depends(get_db)):
    data = await category_service.find_by_id(db, id)
    return send_response(data=data, message="Lấy danh mục thành công", message_en="Category retrieved")

@router.post("/categories", response_model=ApiResponse[CategoryOut])
async def create_category(body: CategoryCreate, current_user: UserContext = Depends(is_chef), db: AsyncSession = Depends(get_db)):
    data = await category_service.create(db, body.name)
    return send_response(data=data, message="Tạo danh mục thành công", message_en="Category created")

@router.put("/categories/{id}", response_model=ApiResponse[CategoryOut])
async def update_category(id: int, body: CategoryUpdate, current_user: UserContext = Depends(is_chef), db: AsyncSession = Depends(get_db)):
    data = await category_service.update(db, body.name or "", id)
    return send_response(data=data, message="Cập nhật danh mục thành công", message_en="Category updated")

@router.delete("/categories/{id}", response_model=ApiResponse[CategoryOut])
async def delete_category(id: int, current_user: UserContext = Depends(is_chef), db: AsyncSession = Depends(get_db)):
    data = await category_service.delete(db, id)
    return send_response(data=data, message="Xóa danh mục thành công", message_en="Category deleted")

@router.put("/categories/{id}/img", response_model=ApiResponse[CategoryOut])
async def update_category_img(id: int, file: UploadFile = File(...), current_user: UserContext = Depends(is_chef), db: AsyncSession = Depends(get_db)):
    existing = await category_service.find_by_id(db, id)
    if existing and existing.img:
        static_file_service.delete_file(existing.img)
    url = await static_file_service.save_upload(file, allowed_types={"image/jpeg", "image/png", "image/webp", "image/gif"})
    data = await category_service.update_img(db, id, url)
    return send_response(data=data, message="Cập nhật ảnh danh mục thành công", message_en="Category image updated successfully")
