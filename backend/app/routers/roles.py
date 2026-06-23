from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth import authenticate, UserContext
from app.middleware.rbac import is_admin
from app.schemas.common import BaseSearchRequest, ApiResponse, PaginatedResponse
from app.schemas.role import RoleCreate, RoleUpdate, AssignRoleRequest, RoleOut
from app.services import role_service, user_service
from app.utils.response import send_response
from app.utils.app_error import AppError

router = APIRouter()

@router.get("/roles", response_model=ApiResponse[PaginatedResponse[RoleOut]])
async def get_roles(query: BaseSearchRequest = Depends(), current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    data = await role_service.get_all(db, limit=query.limit, cursor=query.cursor, order=query.order, search=query.search)
    return send_response(data=data, message="Lấy danh sách vai trò thành công", message_en="Roles retrieved successfully")

@router.post("/roles", response_model=ApiResponse[RoleOut])
async def create_role(body: RoleCreate, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    data = await role_service.create(db, body.name, body.description)
    return send_response(data=data, message="Tạo vai trò thành công", message_en="Role created successfully")

@router.get("/roles/{id}", response_model=ApiResponse[RoleOut])
async def get_role(id: int, current_user: UserContext = Depends(authenticate), db: AsyncSession = Depends(get_db)):
    if id <= 0:
        raise AppError(400, "Invalid role id")
    data = await role_service.find_by_id(db, id)
    return send_response(data=data, message="Lấy vai trò thành công", message_en="Role retrieved successfully")

@router.put("/roles/{id}", response_model=ApiResponse[RoleOut])
async def update_role(id: int, body: RoleUpdate, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    if id <= 0:
        raise AppError(400, "Invalid role id")
    data = await role_service.update(db, id, **body.model_dump())
    return send_response(data=data, message="Cập nhật vai trò thành công", message_en="Role updated successfully")

@router.delete("/roles/{id}", response_model=ApiResponse[RoleOut])
async def delete_role(id: int, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    if id <= 0:
        raise AppError(400, "Invalid role id")
    data = await role_service.delete(db, id)
    return send_response(data=data, message="Xóa vai trò thành công", message_en="Role deleted successfully")

@router.post("/roles/{id}/assign", response_model=ApiResponse[bool])
async def assign_role(id: int, body: AssignRoleRequest, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    data = await user_service.assign_role(db, id, body.roleId)
    return send_response(data=data, message="Gán vai trò thành công", message_en="Role assigned")

@router.post("/roles/{id}/removeAssign", response_model=ApiResponse[bool])
async def remove_assign_role(id: int, body: AssignRoleRequest, current_user: UserContext = Depends(is_admin), db: AsyncSession = Depends(get_db)):
    data = await user_service.remove_assign_role(db, id, body.roleId)
    return send_response(data=data, message="Xóa gán vai trò thành công", message_en="Role assignment removed")
