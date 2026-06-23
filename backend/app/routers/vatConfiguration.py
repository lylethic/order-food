from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.middleware.auth import UserContext, authenticate
from app.middleware.rbac import is_admin
from app.schemas.common import BaseSearchRequest, ApiResponse, PaginatedResponse
from app.schemas.vat_configuration import (
    VatConfigurationCreate,
    VatConfigurationUpdate,
    VatConfigurationOut,
)
from app.services import vat_configuration_service
from app.utils.response import send_response

router = APIRouter(prefix="/vatConfig")


@router.get("", response_model=ApiResponse[PaginatedResponse[VatConfigurationOut]])
async def get_all(
    query: BaseSearchRequest = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(authenticate),
):
    data = await vat_configuration_service.get_all(
        db,
        limit=query.limit,
        cursor=query.cursor,
        order=query.order,
        search=query.search,
    )
    return send_response(data=data, message="Thành công", message_en="Successfully")


@router.get("/{id}", response_model=ApiResponse[VatConfigurationOut])
async def get_by_id(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserContext = Depends(authenticate),
):
    data = await vat_configuration_service.find_by_id(db, id)
    return send_response(data=data, message="Thành công", message_en="Successfully")


@router.post("", response_model=ApiResponse[VatConfigurationOut])
async def create(
    body: VatConfigurationCreate,
    current_user: UserContext = Depends(is_admin),
    db: AsyncSession = Depends(get_db),
):
    data = await vat_configuration_service.create(db, body)
    return send_response(
        data=data,
        message="Tạo cấu hình VAT thành công",
        message_en="VAT configuration created",
    )


@router.put("/{id}", response_model=ApiResponse[VatConfigurationOut])
async def update(
    id: int,
    body: VatConfigurationUpdate,
    current_user: UserContext = Depends(is_admin),
    db: AsyncSession = Depends(get_db),
):
    data = await vat_configuration_service.update(db, body, id)
    return send_response(
        data=data,
        message="Cập nhật cấu hình VAT thành công",
        message_en="VAT configuration updated",
    )


@router.delete("/{id}", response_model=ApiResponse[VatConfigurationOut])
async def delete(
    id: int,
    current_user: UserContext = Depends(is_admin),
    db: AsyncSession = Depends(get_db),
):
    data = await vat_configuration_service.delete(db, id)
    return send_response(
        data=data,
        message="Xóa cấu hình VAT thành công",
        message_en="VAT configuration deleted",
    )
