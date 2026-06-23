from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth import authenticate, UserContext
from app.middleware.rbac import is_chef
from app.schemas.common import MenuItemCategorySearchRequest, ApiResponse, PaginatedResponse
from app.schemas.menu_item import MenuItemCreate, MenuItemUpdate, MenuItemOut
from app.services import menu_item_service, static_file_service
from app.utils.response import send_response
from typing import Optional

router = APIRouter()

@router.get("/menuItems", response_model=ApiResponse[PaginatedResponse[MenuItemOut]])
async def get_menu_items(query: MenuItemCategorySearchRequest = Depends(), db: AsyncSession = Depends(get_db)):
    data = await menu_item_service.get_all(db, limit=query.limit, cursor=query.cursor, order=query.order, search=query.search, category_id=query.categoryId)
    return send_response(data=data, message="Lấy danh sách món ăn thành công", message_en="Menu items retrieved successfully")

@router.get("/menuItems/{id}", response_model=ApiResponse[MenuItemOut])
async def get_menu_item(id: int, db: AsyncSession = Depends(get_db)):
    data = await menu_item_service.find_by_id(db, id)
    return send_response(data=data, message="Lấy món ăn thành công", message_en="Menu item retrieved")

@router.post("/menuItems", response_model=ApiResponse[MenuItemOut])
async def create_menu_item(body: MenuItemCreate, current_user: UserContext = Depends(is_chef), db: AsyncSession = Depends(get_db)):
    data = await menu_item_service.create(db, body.model_dump())
    return send_response(data=data, message="Tạo món ăn thành công", message_en="Menu item created")

@router.put("/menuItems/{id}", response_model=ApiResponse[MenuItemOut])
async def update_menu_item(id: int, body: MenuItemUpdate, current_user: UserContext = Depends(is_chef), db: AsyncSession = Depends(get_db)):
    data = await menu_item_service.update(db, id, body.model_dump(exclude_unset=True))
    return send_response(data=data, message="Cập nhật món ăn thành công", message_en="Menu item updated")

@router.delete("/menuItems/{id}", response_model=ApiResponse[MenuItemOut])
async def delete_menu_item(id: int, current_user: UserContext = Depends(is_chef), db: AsyncSession = Depends(get_db)):
    data = await menu_item_service.delete(db, id)
    return send_response(data=data, message="Xóa món ăn thành công", message_en="Menu item deleted")

@router.post("/menuItems/{id}/images", response_model=ApiResponse[MenuItemOut])
async def add_menu_item_image(id: int, file: UploadFile = File(...), is_primary: bool = False, current_user: UserContext = Depends(is_chef), db: AsyncSession = Depends(get_db)):
    url = await static_file_service.save_upload(file, allowed_types={"image/jpeg", "image/png", "image/webp", "image/gif"})
    data = await menu_item_service.add_image(db, id, url, is_primary)
    return send_response(data=data, message="Thêm ảnh món ăn thành công", message_en="Menu item image added")

@router.delete("/menuItems/images/{imageId}", response_model=ApiResponse[None])
async def delete_menu_item_image(imageId: int, current_user: UserContext = Depends(is_chef), db: AsyncSession = Depends(get_db)):
    await menu_item_service.delete_image(db, imageId)
    return send_response(message="Xóa ảnh món ăn thành công", message_en="Menu item image deleted")

@router.put("/menuItems/{id}/images/{imageId}/primary", response_model=ApiResponse[None])
async def set_primary_image(id: int, imageId: int, current_user: UserContext = Depends(is_chef), db: AsyncSession = Depends(get_db)):
    await menu_item_service.set_primary_image(db, id, imageId)
    return send_response(message="Đặt ảnh chính thành công", message_en="Primary image set")
